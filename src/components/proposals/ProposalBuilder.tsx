'use client';

import React, { useState, useEffect } from 'react';
import { formatProposalAsText } from '@/lib/proposalFormatter';

interface Deliverable {
  id: number;
  name: string;
  category: string;
  primaryCreator: string;
  retailPrice: number;
  active: boolean;
}

interface ProposalItem {
  deliverable: Deliverable;
  quantity: number;
  retailPrice: number;
  chargedPrice: number;
}

interface ProposalBuilderProps {
  dealId?: string;
  onProposalComplete?: (proposal: { items: ProposalItem[]; total: number }) => void;
}

export default function ProposalBuilder({ dealId, onProposalComplete }: ProposalBuilderProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedItems, setSelectedItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);

  // Fetch active deliverables on component mount
  useEffect(() => {
    fetchDeliverables();
  }, []);

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deliverables');
      if (!response.ok) {
        throw new Error('Failed to fetch deliverables');
      }
      const data = await response.json();
      setDeliverables(
        data
          .filter((d: Deliverable) => d.active)
          .map((d: any) => ({
            ...d,
            retailPrice: typeof d.retailPrice === 'string' ? parseFloat(d.retailPrice) : d.retailPrice
          }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  const addDeliverable = (deliverable: Deliverable) => {
    const newItem: ProposalItem = {
      deliverable,
      quantity: 1,
      retailPrice: deliverable.retailPrice,
      chargedPrice: deliverable.retailPrice
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = quantity;
    setSelectedItems(updatedItems);
  };

  const updateItemPrice = (index: number, chargedPrice: number) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].chargedPrice = chargedPrice;
    setSelectedItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.chargedPrice), 0);
  };

  const handleCreateProposal = async () => {
    if (!dealId) {
      setError('Deal ID is required to create a proposal');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please select at least one deliverable');
      return;
    }

    setCreatingProposal(true);
    setProposalStatus('Creating proposal...');
    setError(null);

    try {
      const proposal = {
        items: selectedItems,
        total: calculateTotal()
      };

      // Format proposal as text
      const formattedText = formatProposalAsText(proposal);

      // Create proposal in database
      setProposalStatus('Saving to database...');
      const dbResponse = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: parseInt(dealId),
          items: selectedItems,
          totalAmount: calculateTotal()
        })
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        throw new Error(errorData.error || 'Failed to save proposal to database');
      }

      const savedProposal = await dbResponse.json();

      // Create note in Pipedrive
      setProposalStatus('Creating note in Pipedrive...');
      const noteResponse = await fetch('/api/pipedrive/deals/create-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: parseInt(dealId),
          content: formattedText
        })
      });

      if (!noteResponse.ok) {
        const errorData = await noteResponse.json();
        throw new Error(errorData.error || 'Failed to create note in Pipedrive');
      }

      const noteData = await noteResponse.json();

      // Update proposal with note ID
      setProposalStatus('Updating proposal with note reference...');
      await fetch(`/api/proposals/${savedProposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipedriveNoteId: noteData.data.id.toString()
        })
      });

      setProposalStatus('Proposal created successfully!');
      
      // Call the callback if provided
      if (onProposalComplete) {
        onProposalComplete(proposal);
      }

      // Clear the form after a short delay
      setTimeout(() => {
        setSelectedItems([]);
        setProposalStatus(null);
        setCreatingProposal(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
      setCreatingProposal(false);
      setProposalStatus(null);
    }
  };

  // Filter deliverables by search
  const filteredDeliverables = deliverables.filter((d) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      d.name.toLowerCase().includes(s) ||
      d.category.toLowerCase().includes(s)
    );
  });

  // Only show deliverables not already selected
  const availableDeliverables = filteredDeliverables.filter(
    (d) => !selectedItems.some((item) => item.deliverable.id === d.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading deliverables...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchDeliverables}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposal Builder</h1>
        <p className="text-gray-600">
          Select deliverables and customize pricing for your proposal
          {dealId && <span className="font-medium"> (Deal ID: {dealId})</span>}
        </p>
      </div>

      {/* Status Messages */}
      {proposalStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          proposalStatus.includes('successfully') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            {proposalStatus.includes('successfully') ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {proposalStatus}
          </div>
        </div>
      )}

      {/* Deliverable Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Deliverables</h2>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDeliverables.map((deliverable) => (
            <button
              key={deliverable.id}
              onClick={() => addDeliverable(deliverable)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">{deliverable.name}</div>
              <div className="text-sm text-gray-600">{deliverable.category}</div>
              <div className="text-sm text-gray-500">{deliverable.primaryCreator}</div>
              <div className="text-lg font-semibold text-green-600">
                {typeof deliverable.retailPrice === 'number' ? `$${deliverable.retailPrice.toLocaleString()}` : 'N/A'}
              </div>
            </button>
          ))}
          {availableDeliverables.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No deliverables match your search or all have been added.
            </div>
          )}
        </div>
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Items</h2>
          
          <div className="space-y-4">
            {selectedItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.deliverable.name}</div>
                  <div className="text-sm text-gray-600">{item.deliverable.category}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    disabled={creatingProposal}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Price:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.chargedPrice}
                    onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                    disabled={creatingProposal}
                  />
                </div>
                
                <div className="text-right min-w-[80px]">
                  <div className="font-semibold text-gray-900">
                    {typeof item.chargedPrice === 'number' && typeof item.quantity === 'number' ? `$${(item.quantity * item.chargedPrice).toLocaleString()}` : 'N/A'}
                  </div>
                  {item.chargedPrice !== item.retailPrice && (
                    <div className="text-xs text-gray-500 line-through">
                      {typeof item.retailPrice === 'number' ? `$${item.retailPrice.toLocaleString()}` : 'N/A'}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  disabled={creatingProposal}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-xl font-semibold text-gray-900">Total</div>
              <div className="text-2xl font-bold text-green-600">
                {typeof calculateTotal() === 'number' ? `$${calculateTotal().toLocaleString()}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedItems.length > 0 && (
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setSelectedItems([])}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={creatingProposal}
          >
            Clear All
          </button>
          <button
            onClick={handleCreateProposal}
            disabled={creatingProposal || !dealId}
            className={`px-6 py-2 rounded-lg ${
              creatingProposal || !dealId
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {creatingProposal ? 'Creating...' : 'Create Proposal'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {selectedItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No deliverables selected</p>
          <p className="text-sm">Select deliverables from above to start building your proposal</p>
        </div>
      )}
    </div>
  );
} 
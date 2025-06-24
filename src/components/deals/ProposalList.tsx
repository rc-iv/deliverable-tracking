'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProposalItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Proposal {
  id: string;
  dealId: string;
  title: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: ProposalItem[];
  pipedriveNoteId?: string;
  formattedText?: string;
}

interface ProposalListProps {
  dealId: string;
}

export function ProposalList({ dealId }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, [dealId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/proposals/deal/${dealId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch proposals');
      }
      
      setProposals(data.proposals || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleProposalExpansion = (proposalId: string) => {
    setExpandedProposal(expandedProposal === proposalId ? null : proposalId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading proposals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Proposals</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchProposals}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Yet</h3>
          <p className="text-gray-500 mb-4">No proposals have been created for this deal.</p>
          <Link
            href={`/proposals/new?dealId=${dealId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create First Proposal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900">Proposals ({proposals.length})</h2>
        </div>
        <Link
          href={`/proposals/new?dealId=${dealId}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Proposal
        </Link>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{proposal.title}</h3>
                <p className="text-sm text-gray-500">
                  Created {formatDate(proposal.createdAt)}
                  {proposal.updatedAt !== proposal.createdAt && ` • Updated ${formatDate(proposal.updatedAt)}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(proposal.totalAmount)}
                </div>
                <div className="text-sm text-gray-500">
                  {proposal.items.length} item{proposal.items.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleProposalExpansion(proposal.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${expandedProposal === proposal.id ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {expandedProposal === proposal.id ? 'Hide Details' : 'View Details'}
              </button>

              {proposal.pipedriveNoteId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sent to Pipedrive
                </span>
              )}

              <Link
                href={`/proposals/${proposal.id}`}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Full
              </Link>
            </div>

            {expandedProposal === proposal.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Line Items</h4>
                  <div className="space-y-2">
                    {proposal.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {proposal.formattedText && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Formatted Text (Sent to Pipedrive)</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {proposal.formattedText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
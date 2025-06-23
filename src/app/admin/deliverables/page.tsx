'use client';

import { useState, useEffect } from 'react';
import { createAdminAuthHeaders } from '@/lib/auth';

interface Deliverable {
  id: number;
  name: string;
  category: string;
  primaryCreator: string | null;
  retailPrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    primaryCreator: '',
    retailPrice: '',
    active: true
  });

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deliverables', {
        headers: createAdminAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDeliverables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deliverables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  const handleEdit = (deliverable: Deliverable) => {
    setEditingId(deliverable.id);
    setEditForm({
      name: deliverable.name,
      category: deliverable.category,
      primaryCreator: deliverable.primaryCreator || '',
      retailPrice: deliverable.retailPrice.toString(),
      active: deliverable.active
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/admin/deliverables/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createAdminAuthHeaders()
        },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          primaryCreator: editForm.primaryCreator || null,
          retailPrice: parseFloat(editForm.retailPrice),
          active: editForm.active
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEditingId(null);
      fetchDeliverables(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deliverable');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      const response = await fetch(`/api/admin/deliverables/${id}`, {
        method: 'DELETE',
        headers: createAdminAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchDeliverables(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deliverable');
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/deliverables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createAdminAuthHeaders()
        },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          primaryCreator: editForm.primaryCreator || null,
          retailPrice: parseFloat(editForm.retailPrice),
          active: editForm.active
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEditForm({
        name: '',
        category: '',
        primaryCreator: '',
        retailPrice: '',
        active: true
      });
      fetchDeliverables(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deliverable');
    }
  };

  if (loading) {
    return <div className="p-8">Loading deliverables...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Admin - Deliverables Management</h1>
      
      {/* Create New Deliverable Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Deliverable</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="border rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Category"
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            className="border rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Primary Creator"
            value={editForm.primaryCreator}
            onChange={(e) => setEditForm({ ...editForm, primaryCreator: e.target.value })}
            className="border rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Retail Price"
            value={editForm.retailPrice}
            onChange={(e) => setEditForm({ ...editForm, retailPrice: e.target.value })}
            className="border rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="flex items-center text-gray-900">
            <input
              type="checkbox"
              checked={editForm.active}
              onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              className="mr-2"
            />
            Active
          </label>
          <button
            onClick={handleCreate}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>

      {/* Deliverables Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deliverables.map((deliverable) => (
              <tr key={deliverable.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === deliverable.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="border rounded px-2 py-1 w-full text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{deliverable.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === deliverable.id ? (
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="border rounded px-2 py-1 w-full text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{deliverable.category}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === deliverable.id ? (
                    <input
                      type="text"
                      value={editForm.primaryCreator}
                      onChange={(e) => setEditForm({ ...editForm, primaryCreator: e.target.value })}
                      className="border rounded px-2 py-1 w-full text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{deliverable.primaryCreator || '-'}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === deliverable.id ? (
                    <input
                      type="number"
                      value={editForm.retailPrice}
                      onChange={(e) => setEditForm({ ...editForm, retailPrice: e.target.value })}
                      className="border rounded px-2 py-1 w-full text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">${deliverable.retailPrice}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === deliverable.id ? (
                    <label className="flex items-center text-gray-900">
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                        className="mr-2"
                      />
                      Active
                    </label>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      deliverable.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {deliverable.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === deliverable.id ? (
                    <div className="space-x-2">
                      <button
                        onClick={handleSave}
                        className="text-green-700 hover:text-green-900 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-700 hover:text-gray-900 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(deliverable)}
                        className="text-blue-700 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deliverable.id)}
                        className="text-red-700 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
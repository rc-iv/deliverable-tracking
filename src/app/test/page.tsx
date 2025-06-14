'use client';

import { useEffect, useState } from 'react';

interface Creator {
  id: number;
  name: string;
  email: string;
  _count: {
    deliverables: number;
  };
}

export default function TestPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const response = await fetch('/api/test');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch creators');
        }
        
        setCreators(data.creators);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Test Page - Creators</h1>
      
      <div className="grid gap-4">
        {creators.map((creator) => (
          <div 
            key={creator.id}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold">{creator.name}</h2>
            <p className="text-gray-600">{creator.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              Assigned Deliverables: {creator._count.deliverables}
            </p>
          </div>
        ))}

        {creators.length === 0 && (
          <p className="text-gray-500">No creators found.</p>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useSearchParams } from 'next/navigation';
import ProposalBuilder from '@/components/proposals/ProposalBuilder';
import { useMemo } from 'react';

export default function NewProposalPage() {
  const searchParams = useSearchParams();
  const dealId = useMemo(() => searchParams.get('dealId'), [searchParams]);

  if (!dealId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Missing Deal ID</h2>
          <p className="text-gray-700 mb-4">You must access the proposal builder from a deal page or provide a dealId in the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProposalBuilder dealId={dealId} />
    </div>
  );
} 
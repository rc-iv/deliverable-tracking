'use client';

import ProposalBuilder from '@/components/proposals/ProposalBuilder';

export default function ProposalsPage() {
  const handleProposalComplete = (proposal: { items: any[]; total: number }) => {
    console.log('Proposal created:', proposal);
    // TODO: Implement proposal saving logic
    alert(`Proposal created with total: $${proposal.total.toLocaleString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProposalBuilder onProposalComplete={handleProposalComplete} />
    </div>
  );
} 
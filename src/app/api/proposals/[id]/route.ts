import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH /api/proposals/[id] - Update a specific proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = parseInt(id);
    
    if (isNaN(proposalId)) {
      return NextResponse.json(
        { error: 'Invalid proposal ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { pipedriveNoteId } = body;

    if (!pipedriveNoteId) {
      return NextResponse.json(
        { error: 'pipedriveNoteId is required' },
        { status: 400 }
      );
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        pipedriveNoteId: pipedriveNoteId
      },
      include: {
        items: {
          include: {
            deliverable: true
          }
        }
      }
    });

    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
} 
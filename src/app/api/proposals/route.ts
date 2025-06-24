import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/proposals - Get all proposals
export async function GET() {
  try {
    const proposals = await prisma.proposal.findMany({
      include: {
        items: {
          include: {
            deliverable: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, items, totalAmount, pipedriveNoteId } = body;

    if (!dealId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid proposal data. dealId and items array are required.' },
        { status: 400 }
      );
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        dealId: parseInt(dealId),
        totalAmount: parseFloat(totalAmount),
        pipedriveNoteId: pipedriveNoteId || null,
        createdBy: 'system' // TODO: Add user authentication
      }
    });

    // Create proposal items
    const proposalItems = await Promise.all(
      items.map((item: any) =>
        prisma.proposalItem.create({
          data: {
            proposalId: proposal.id,
            deliverableId: item.deliverable.id,
            quantity: item.quantity,
            retailPrice: parseFloat(item.retailPrice),
            chargedPrice: parseFloat(item.chargedPrice)
          }
        })
      )
    );

    // Return the created proposal with items
    const createdProposal = await prisma.proposal.findUnique({
      where: { id: proposal.id },
      include: {
        items: {
          include: {
            deliverable: true
          }
        }
      }
    });

    return NextResponse.json(createdProposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
} 
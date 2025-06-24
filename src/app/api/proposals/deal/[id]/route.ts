import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/proposals/deal/[id] - Get proposals for a specific deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid deal ID' 
        },
        { status: 400 }
      );
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        dealId: dealId
      },
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

    // Transform the data to match the expected format
    const formattedProposals = proposals.map(proposal => ({
      id: proposal.id,
      dealId: proposal.dealId,
      title: `Proposal for Deal ${proposal.dealId}`,
      totalAmount: Number(proposal.totalAmount),
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.createdAt.toISOString(),
      pipedriveNoteId: proposal.pipedriveNoteId,
      formattedText: null,
      items: proposal.items.map(item => ({
        id: item.id,
        name: item.deliverable.name,
        quantity: item.quantity,
        unitPrice: Number(item.retailPrice),
        totalPrice: Number(item.chargedPrice)
      }))
    }));

    return NextResponse.json({
      success: true,
      proposals: formattedProposals
    });
  } catch (error) {
    console.error('Error fetching proposals for deal:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch proposals for deal' 
      },
      { status: 500 }
    );
  }
} 
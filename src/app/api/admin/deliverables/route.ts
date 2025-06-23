import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET /api/admin/deliverables - Get all deliverables (admin only)
export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const deliverables = await prisma.deliverable.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

// POST /api/admin/deliverables - Create new deliverable (admin only)
export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const { name, category, primaryCreator, retailPrice, active = true } = body;

    // Validate required fields
    if (!name || !category || !retailPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, retailPrice' },
        { status: 400 }
      );
    }

    // Validate price is a positive number
    const price = parseFloat(retailPrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'retailPrice must be a positive number' },
        { status: 400 }
      );
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        name,
        category,
        primaryCreator: primaryCreator || null,
        retailPrice: price,
        active
      }
    });

    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
} 
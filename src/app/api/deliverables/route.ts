import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/deliverables - Get all active deliverables (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const where: any = {};
    
    // Filter by category if provided
    if (category) {
      where.category = category;
    }
    
    // Filter by active status if provided, otherwise only show active
    if (active !== null) {
      where.active = active === 'true';
    } else {
      where.active = true; // Default to only active deliverables
    }

    const deliverables = await prisma.deliverable.findMany({
      where,
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
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// PUT /api/admin/deliverables/[id] - Update deliverable (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const authError = requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid deliverable ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, category, primaryCreator, retailPrice, active } = body;

    // Validate price if provided
    if (retailPrice !== undefined) {
      const price = parseFloat(retailPrice);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: 'retailPrice must be a positive number' },
          { status: 400 }
        );
      }
    }

    const deliverable = await prisma.deliverable.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(primaryCreator !== undefined && { primaryCreator }),
        ...(retailPrice !== undefined && { retailPrice: parseFloat(retailPrice) }),
        ...(active !== undefined && { active })
      }
    });

    return NextResponse.json(deliverable);
  } catch (error: any) {
    console.error('Error updating deliverable:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/deliverables/[id] - Delete deliverable (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const authError = requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid deliverable ID' },
        { status: 400 }
      );
    }

    await prisma.deliverable.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Deliverable deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting deliverable:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete deliverable' },
      { status: 500 }
    );
  }
} 
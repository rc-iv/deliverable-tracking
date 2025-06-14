import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a test creator if none exist
    const testCreator = await prisma.creator.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        name: 'Test Creator',
        email: 'test@example.com',
      },
    });

    // Fetch all creators
    const creators = await prisma.creator.findMany({
      include: {
        _count: {
          select: { deliverables: true }
        }
      }
    });

    return NextResponse.json({ creators });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
} 
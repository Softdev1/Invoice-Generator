import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { createBusinessSchema } from '@/lib/shared';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createBusinessSchema.parse(body);
    const business = await prisma.business.create({ data });
    return NextResponse.json({ success: true, data: business }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}

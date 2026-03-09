import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { createBusinessSchema } from '@/lib/shared';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: business });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = createBusinessSchema.partial().parse(body);
    const business = await prisma.business.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: business });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}

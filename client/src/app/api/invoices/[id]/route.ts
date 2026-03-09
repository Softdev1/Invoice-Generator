import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, customer: true, business: true },
  });
  if (!invoice) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: invoice });
}

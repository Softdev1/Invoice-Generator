import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, { status: 404 });
  }
  if (!invoice.pdf_url) {
    return NextResponse.json({ success: false, error: { code: 'PDF_NOT_READY', message: 'PDF not yet generated' } }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { url: `/api/invoices/${id}/download` } });
}

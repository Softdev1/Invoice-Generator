import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice || !invoice.pdf_url) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'PDF not found' } }, { status: 404 });
  }

  // pdf_url is stored as data:application/pdf;base64,...
  const base64Data = invoice.pdf_url.replace('data:application/pdf;base64,', '');
  const pdfBuffer = Buffer.from(base64Data, 'base64');

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}

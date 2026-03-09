import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { generatePdfBuffer } from '@/lib/server/pdf';

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, customer: true, business: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, { status: 404 });
    }

    await prisma.invoice.update({
      where: { id },
      data: { status: 'processing' },
    });

    // Generate PDF synchronously
    const pdfBuffer = await generatePdfBuffer(invoice);

    // Store PDF as base64 in DB for retrieval
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    await prisma.invoice.update({
      where: { id },
      data: { pdf_url: pdfDataUrl, status: 'ready' },
    });

    return NextResponse.json({ success: true, data: { job_id: id } });
  } catch (err) {
    console.error('PDF generation error:', err);
    const { id } = await params;
    await prisma.invoice.update({
      where: { id },
      data: { status: 'failed' },
    }).catch(() => {});
    return NextResponse.json({ success: false, error: { code: 'PDF_ERROR', message: 'Failed to generate PDF' } }, { status: 500 });
  }
}

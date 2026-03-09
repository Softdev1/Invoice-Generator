import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { createInvoiceSchema } from '@/lib/shared';
import { generateInvoiceNumber } from '@/lib/server/invoiceNumber';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: businessId } = await params;
    const body = await req.json();
    const input = createInvoiceSchema.parse(body);

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } }, { status: 404 });
    }

    const invoiceNumber = await generateInvoiceNumber(businessId);

    const items = input.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - (input.discount || 0) + (input.tax || 0);

    const invoice = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          business_id: businessId,
          name: input.customer.name,
          phone: input.customer.phone,
          address: input.customer.address,
        },
      });

      return tx.invoice.create({
        data: {
          business_id: businessId,
          customer_id: customer.id,
          invoice_number: invoiceNumber,
          issue_date: input.issue_date ? new Date(input.issue_date) : new Date(),
          due_date: input.due_date ? new Date(input.due_date) : null,
          subtotal,
          discount: input.discount || 0,
          tax: input.tax || 0,
          total,
          currency: business.currency,
          note: input.note,
          items: { create: items },
        },
        include: { items: true, customer: true, business: true },
      });
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const invoices = await prisma.invoice.findMany({
    where: { business_id: businessId },
    include: { customer: true },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ success: true, data: invoices });
}

import { prisma } from './db';

export async function generateInvoiceNumber(businessId: string): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `INV-${yearMonth}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      business_id: businessId,
      invoice_number: { startsWith: prefix },
    },
    orderBy: { invoice_number: 'desc' },
    select: { invoice_number: true },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.invoice_number.split('-').pop() || '0', 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

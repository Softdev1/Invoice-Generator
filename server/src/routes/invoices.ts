import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { pdfQueue } from '../config/queue';
import { createInvoiceSchema } from '@invoice-gen/shared';
import { generateInvoiceNumber } from '../services/invoiceNumber';

const router = Router();

// Create invoice
router.post('/:businessId/invoices', async (req, res, next) => {
  try {
    const input = createInvoiceSchema.parse(req.body);
    const businessId = req.params.businessId;

    // Verify business exists
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } });
      return;
    }

    const invoiceNumber = await generateInvoiceNumber(businessId);

    // Calculate totals
    const items = input.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - (input.discount || 0) + (input.tax || 0);

    // Create customer + invoice in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          business_id: businessId,
          name: input.customer.name,
          phone: input.customer.phone,
          address: input.customer.address,
        },
      });

      const inv = await tx.invoice.create({
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
          items: {
            create: items,
          },
        },
        include: { items: true, customer: true, business: true },
      });

      return inv;
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// Get invoice details
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { items: true, customer: true, business: true },
    });
    if (!invoice) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// List invoices for a business
router.get('/:businessId/invoices', async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { business_id: req.params.businessId },
      include: { customer: true },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
});

// Enqueue PDF generation
router.post('/:id/generate-pdf', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return;
    }

    // Update status to processing
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'processing' },
    });

    // Enqueue job
    const job = await pdfQueue.add('generate-pdf', {
      job_type: 'generate_pdf',
      invoice_id: invoice.id,
      business_id: invoice.business_id,
      requested_by: 'guest',
      requested_at: new Date().toISOString(),
    }, {
      jobId: `pdf:invoice:${invoice.id}`,
    });

    res.json({ success: true, data: { job_id: job.id } });
  } catch (err) {
    next(err);
  }
});

// Get PDF status
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return;
    }
    if (!invoice.pdf_url) {
      res.status(404).json({ success: false, error: { code: 'PDF_NOT_READY', message: 'PDF not yet generated' } });
      return;
    }
    res.json({ success: true, data: { url: `/api/invoices/${invoice.id}/download` } });
  } catch (err) {
    next(err);
  }
});

// Download PDF file
router.get('/:id/download', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice || !invoice.pdf_url) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'PDF not found' } });
      return;
    }

    // pdf_url is stored as /output/filename.pdf — resolve to worker/output/
    const filename = path.basename(invoice.pdf_url);
    const filePath = path.join(__dirname, '..', '..', '..', 'worker', 'output', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'PDF file not found on disk' } });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;

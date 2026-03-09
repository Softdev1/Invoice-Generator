import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { PDF_QUEUE_NAME, CURRENCIES } from '@invoice-gen/shared';
import type { PdfJobPayload } from '@invoice-gen/shared';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const prisma = new PrismaClient();

// Register Handlebars helpers
Handlebars.registerHelper('formatMoney', (value: number) => {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

// Load template
const templatePath = path.join(__dirname, 'templates', 'invoice.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf-8');
const template = Handlebars.compile(templateSource);

function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
}

async function handleGeneratePdf(job: Job<PdfJobPayload>) {
  const { invoice_id } = job.data;
  console.log(`Processing PDF for invoice: ${invoice_id}`);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoice_id },
    include: { items: true, customer: true, business: true },
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoice_id} not found`);
  }

  // Render HTML
  const html = template({
    ...invoice,
    issue_date: invoice.issue_date.toLocaleDateString('en-GB'),
    due_date: invoice.due_date?.toLocaleDateString('en-GB'),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    currencySymbol: getCurrencySymbol(invoice.currency),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.total),
    })),
  });

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    // TODO: Upload to S3 instead of local storage
    // For MVP, save locally
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filename = `${invoice.business_id}_${invoice.invoice_number}.pdf`;
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // Update invoice with local PDF path (replace with S3 URL later)
    const pdfUrl = `/output/${filename}`;
    await prisma.invoice.update({
      where: { id: invoice_id },
      data: { pdf_url: pdfUrl, status: 'ready' },
    });

    console.log(`PDF generated: ${filePath}`);
  } finally {
    await browser.close();
  }
}

// Start worker
const worker = new Worker(PDF_QUEUE_NAME, handleGeneratePdf, {
  connection,
  concurrency: 2,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log('PDF Worker started, waiting for jobs...');

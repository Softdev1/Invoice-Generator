import puppeteerCore from 'puppeteer-core';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

const CURRENCIES = [
  { code: 'NGN', symbol: '₦' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'KES', symbol: 'KSh' },
  { code: 'GHS', symbol: 'GH₵' },
  { code: 'ZAR', symbol: 'R' },
];

Handlebars.registerHelper('formatMoney', (value: number) => {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code;
}

function getTemplate(): HandlebarsTemplateDelegate {
  // Try multiple paths for template (works in dev and production)
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'lib', 'server', 'invoice-template.hbs'),
    path.join(process.cwd(), 'lib', 'server', 'invoice-template.hbs'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return Handlebars.compile(fs.readFileSync(p, 'utf-8'));
    }
  }

  // Fallback: inline template
  return Handlebars.compile(getInlineTemplate());
}

export async function generatePdfBuffer(invoice: {
  invoice_number: string;
  issue_date: Date;
  due_date: Date | null;
  subtotal: unknown;
  discount: unknown;
  tax: unknown;
  total: unknown;
  currency: string;
  note: string | null;
  business: { name: string; logo_url: string | null; phone: string | null; email: string | null; address: string | null };
  customer: { name: string; phone: string | null; address: string | null } | null;
  items: Array<{ name: string; quantity: unknown; unit_price: unknown; total: unknown }>;
}): Promise<Buffer> {
  const template = getTemplate();

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

  let browser;
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const chromium = (await import('@sparticuz/chromium')).default;
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Local development: use system Chrome
      const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
      ];
      const executablePath = possiblePaths.find((p) => fs.existsSync(p));
      browser = await puppeteerCore.launch({
        headless: true,
        executablePath: executablePath || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}

function getInlineTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; font-size: 14px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1e293b; }
    .logo-section { display: flex; align-items: center; gap: 16px; }
    .logo { max-height: 70px; max-width: 150px; object-fit: contain; }
    .business-name { font-size: 24px; font-weight: 700; color: #1e293b; }
    .business-details { font-size: 12px; color: #666; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; color: #1e293b; letter-spacing: 2px; }
    .invoice-meta { font-size: 13px; color: #555; margin-top: 8px; }
    .invoice-meta span { display: block; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { flex: 1; }
    .party-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; font-weight: 600; }
    .party-name { font-size: 16px; font-weight: 600; }
    .party-detail { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #1e293b; color: #fff; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }
    tbody td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    tbody td:last-child, tbody td:nth-child(2), tbody td:nth-child(3) { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals-row.total { font-size: 18px; font-weight: 700; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 10px; margin-top: 6px; }
    .note { margin-top: 40px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #555; }
    .note-label { font-weight: 600; color: #333; margin-bottom: 4px; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #aaa; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      {{#if business.logo_url}}<img class="logo" src="{{business.logo_url}}" alt="Logo">{{/if}}
      <div>
        <div class="business-name">{{business.name}}</div>
        <div class="business-details">
          {{#if business.phone}}{{business.phone}}<br>{{/if}}
          {{#if business.email}}{{business.email}}<br>{{/if}}
          {{#if business.address}}{{business.address}}{{/if}}
        </div>
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-meta">
        <span><strong>Invoice #:</strong> {{invoice_number}}</span>
        <span><strong>Date:</strong> {{issue_date}}</span>
        {{#if due_date}}<span><strong>Due:</strong> {{due_date}}</span>{{/if}}
      </div>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <div class="party-label">From</div>
      <div class="party-name">{{business.name}}</div>
      {{#if business.address}}<div class="party-detail">{{business.address}}</div>{{/if}}
      {{#if business.phone}}<div class="party-detail">{{business.phone}}</div>{{/if}}
    </div>
    {{#if customer}}
    <div class="party">
      <div class="party-label">Bill To</div>
      <div class="party-name">{{customer.name}}</div>
      {{#if customer.address}}<div class="party-detail">{{customer.address}}</div>{{/if}}
      {{#if customer.phone}}<div class="party-detail">{{customer.phone}}</div>{{/if}}
    </div>
    {{/if}}
  </div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{this.name}}</td>
        <td>{{this.quantity}}</td>
        <td>{{../currencySymbol}}{{formatMoney this.unit_price}}</td>
        <td>{{../currencySymbol}}{{formatMoney this.total}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Subtotal</span><span>{{currencySymbol}}{{formatMoney subtotal}}</span></div>
      {{#if discount}}<div class="totals-row"><span>Discount</span><span>-{{currencySymbol}}{{formatMoney discount}}</span></div>{{/if}}
      {{#if tax}}<div class="totals-row"><span>Tax</span><span>{{currencySymbol}}{{formatMoney tax}}</span></div>{{/if}}
      <div class="totals-row total"><span>Total</span><span>{{currencySymbol}}{{formatMoney total}}</span></div>
    </div>
  </div>
  {{#if note}}<div class="note"><div class="note-label">Note:</div>{{note}}</div>{{/if}}
  <div class="footer">Generated by Invoice Generator</div>
</body>
</html>`;
}

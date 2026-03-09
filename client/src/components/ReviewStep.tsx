'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { InvoiceFormData } from '@/app/create/page';

interface Props {
  data: InvoiceFormData;
  onBack: () => void;
}

export function ReviewStep({ data, onBack }: Props) {
  const [status, setStatus] = useState<'idle' | 'creating' | 'generating' | 'ready' | 'error'>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = subtotal - (data.discount || 0) + (data.tax || 0);

  const handleGenerate = async () => {
    try {
      setStatus('creating');
      setError(null);

      // Step 1: Create business profile
      const business = await api.createBusiness(data.business) as { id: string };

      // Step 2: Create invoice
      const invoice = await api.createInvoice(business.id, {
        customer: data.customer,
        items: data.items,
        discount: data.discount,
        tax: data.tax,
        note: data.note,
      }) as { id: string };

      // Step 3: Request PDF generation
      setStatus('generating');
      await api.generatePdf(invoice.id);

      // Step 4: Poll for PDF readiness
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const result = await api.getPdfUrl(invoice.id);
          setPdfUrl(result.url);
          setStatus('ready');
          return;
        } catch {
          attempts++;
        }
      }

      throw new Error('PDF generation timed out. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Review Invoice</h2>
      <p className="text-gray-500 text-sm">Check everything looks right before generating.</p>

      {/* Business info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">From</h3>
        {data.business.logo_url && (
          <img src={data.business.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg mb-2" />
        )}
        <p className="font-bold text-lg">{data.business.name}</p>
        {data.business.phone && <p className="text-gray-600 text-sm">{data.business.phone}</p>}
        {data.business.email && <p className="text-gray-600 text-sm">{data.business.email}</p>}
        {data.business.address && <p className="text-gray-600 text-sm">{data.business.address}</p>}
      </div>

      {/* Customer info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Bill To</h3>
        <p className="font-bold text-lg">{data.customer.name}</p>
        {data.customer.phone && <p className="text-gray-600 text-sm">{data.customer.phone}</p>}
        {data.customer.address && <p className="text-gray-600 text-sm">{data.customer.address}</p>}
      </div>

      {/* Items */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Items</h3>
        {data.items.map((item, i) => (
          <div key={i} className="flex justify-between py-2 border-b last:border-0">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.quantity} x {item.unit_price.toLocaleString()}</p>
            </div>
            <p className="font-semibold">{(item.quantity * item.unit_price).toLocaleString()}</p>
          </div>
        ))}
        <div className="mt-3 pt-2 border-t space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{subtotal.toLocaleString()}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Discount</span><span>-{data.discount.toLocaleString()}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax</span><span>+{data.tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span><span>{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {data.note && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Note</h3>
          <p className="text-gray-600 text-sm">{data.note}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Action buttons */}
      {status === 'ready' && pdfUrl ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center">
            Invoice PDF is ready!
          </div>
          <a href={pdfUrl} download className="btn-primary block text-center" target="_blank" rel="noopener noreferrer">
            Download PDF
          </a>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={() => navigator.share({ title: 'Invoice', url: pdfUrl })}
              className="btn-secondary"
            >
              Share Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="btn-secondary" disabled={status !== 'idle' && status !== 'error'}>
            Back
          </button>
          <button
            onClick={handleGenerate}
            className="btn-primary"
            disabled={status === 'creating' || status === 'generating'}
          >
            {status === 'creating' && 'Creating...'}
            {status === 'generating' && 'Generating PDF...'}
            {(status === 'idle' || status === 'error') && 'Generate Invoice PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

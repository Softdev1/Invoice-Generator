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

      const business = await api.createBusiness(data.business) as { id: string };

      const invoice = await api.createInvoice(business.id, {
        customer: data.customer,
        items: data.items,
        discount: data.discount,
        tax: data.tax,
        note: data.note,
      }) as { id: string };

      setStatus('generating');
      await api.generatePdf(invoice.id);

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
    <div className="space-y-5">
      <div className="animate-fade-in-up">
        <h2 className="section-title">Review Invoice</h2>
        <p className="section-subtitle">Make sure everything looks right.</p>
      </div>

      {/* Business info */}
      <div className="card animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">🏪</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">From</span>
        </div>
        <div className="flex items-center gap-3">
          {data.business.logo_url && (
            <img src={data.business.logo_url} alt="Logo" className="w-14 h-14 object-contain rounded-xl border border-slate-100 p-1 bg-white" />
          )}
          <div>
            <p className="font-bold text-lg text-slate-900">{data.business.name}</p>
            {data.business.phone && <p className="text-slate-500 text-sm">{data.business.phone}</p>}
            {data.business.email && <p className="text-slate-500 text-sm">{data.business.email}</p>}
            {data.business.address && <p className="text-slate-500 text-sm">{data.business.address}</p>}
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="card animate-fade-in-up stagger-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">👤</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bill To</span>
        </div>
        <p className="font-bold text-lg text-slate-900">{data.customer.name}</p>
        {data.customer.phone && <p className="text-slate-500 text-sm">{data.customer.phone}</p>}
        {data.customer.address && <p className="text-slate-500 text-sm">{data.customer.address}</p>}
      </div>

      {/* Items */}
      <div className="card animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">📝</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</span>
        </div>

        {data.items.map((item, i) => (
          <div key={i} className="flex justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
              <p className="font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.quantity} x {item.unit_price.toLocaleString()}</p>
            </div>
            <p className="font-bold text-slate-800">{(item.quantity * item.unit_price).toLocaleString()}</p>
          </div>
        ))}

        <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span><span className="font-medium">{subtotal.toLocaleString()}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-sm text-rose-500">
              <span>Discount</span><span className="font-medium">-{data.discount.toLocaleString()}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax</span><span className="font-medium">+{data.tax.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-3 mt-3 border-t-2 border-slate-800">
          <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fraunces, serif' }}>Total</span>
          <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fraunces, serif' }}>{total.toLocaleString()}</span>
        </div>
      </div>

      {data.note && (
        <div className="card animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Note</span>
          </div>
          <p className="text-slate-600 text-sm italic">{data.note}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-medium animate-fade-in-up">
          {error}
        </div>
      )}

      {/* Actions */}
      {status === 'ready' && pdfUrl ? (
        <div className="space-y-4 animate-fade-in-up">
          <div className="card-highlight text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-lg text-slate-900" style={{ fontFamily: 'Fraunces, serif' }}>Invoice Ready!</p>
            <p className="text-slate-500 text-sm mt-1">Your PDF has been generated.</p>
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
        <div className="flex gap-3 pt-2 animate-fade-in-up stagger-5">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            disabled={status !== 'idle' && status !== 'error'}
          >
            Back
          </button>
          <button
            onClick={handleGenerate}
            className="btn-primary"
            disabled={status === 'creating' || status === 'generating'}
          >
            {status === 'creating' && (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            )}
            {status === 'generating' && (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </span>
            )}
            {(status === 'idle' || status === 'error') && 'Generate Invoice PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

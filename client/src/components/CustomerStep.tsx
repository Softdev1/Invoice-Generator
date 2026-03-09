'use client';

import type { InvoiceFormData } from '@/app/create/page';

interface Props {
  data: InvoiceFormData['customer'];
  onChange: (data: InvoiceFormData['customer']) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CustomerStep({ data, onChange, onNext, onBack }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    onNext();
  };

  const update = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in-up">
        <h2 className="section-title">Customer Info</h2>
        <p className="section-subtitle">Who are you sending this invoice to?</p>
      </div>

      <div className="card space-y-5 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
            👤
          </div>
          <span className="font-semibold text-slate-700">Customer Details</span>
        </div>

        <div>
          <label className="label">Customer Name *</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Alhaji Musa"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Customer Phone</label>
          <input
            type="tel"
            className="input-field"
            placeholder="e.g. 09087654321"
            value={data.phone || ''}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Customer Address</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 5 Main Street, Abuja"
            value={data.address || ''}
            onChange={(e) => update('address', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 animate-fade-in-up stagger-2">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" className="btn-primary">
          Next — Add Items
        </button>
      </div>
    </form>
  );
}

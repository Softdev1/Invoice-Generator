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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Customer Details</h2>
      <p className="text-gray-500 text-sm">Who is this invoice for?</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
        <input
          type="tel"
          className="input-field"
          placeholder="e.g. 09087654321"
          value={data.phone || ''}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. 5 Main Street, Abuja"
          value={data.address || ''}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" className="btn-primary">
          Next: Add Items
        </button>
      </div>
    </form>
  );
}

'use client';

import type { InvoiceFormData } from '@/app/create/page';

interface Props {
  data: InvoiceFormData;
  onChange: (updates: Partial<InvoiceFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ItemsStep({ data, onChange, onNext, onBack }: Props) {
  const items = data.items;

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ items: updated });
  };

  const addItem = () => {
    onChange({ items: [...items, { name: '', quantity: 1, unit_price: 0 }] });
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = subtotal - (data.discount || 0) + (data.tax || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasValidItem = items.some((item) => item.name.trim() && item.quantity > 0 && item.unit_price > 0);
    if (!hasValidItem) return;
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in-up">
        <h2 className="section-title">Invoice Items</h2>
        <p className="section-subtitle">What did you sell or provide?</p>
      </div>

      {items.map((item, i) => (
        <div key={i} className="card space-y-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-slate-500">Item</span>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-rose-500 text-sm font-semibold hover:text-rose-600 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <input
            type="text"
            className="input-field"
            placeholder="Item name (e.g. Jollof Rice)"
            value={item.name}
            onChange={(e) => updateItem(i, 'name', e.target.value)}
            required
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                className="input-field"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(e) => updateItem(i, 'quantity', Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Unit Price</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(i, 'unit_price', Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="text-right">
            <span className="badge bg-slate-100 text-slate-700">
              Line total: {(item.quantity * item.unit_price).toLocaleString()}
            </span>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-semibold hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all animate-fade-in-up"
      >
        + Add Another Item
      </button>

      {/* Discount & Tax */}
      <div className="card space-y-4 animate-fade-in-up">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-500">Adjustments</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Discount</label>
            <input
              type="number"
              className="input-field"
              min="0"
              step="0.01"
              value={data.discount}
              onChange={(e) => onChange({ discount: Math.max(0, Number(e.target.value)) })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tax</label>
            <input
              type="number"
              className="input-field"
              min="0"
              step="0.01"
              value={data.tax}
              onChange={(e) => onChange({ tax: Math.max(0, Number(e.target.value)) })}
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="card-highlight animate-fade-in-up">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium">{subtotal.toLocaleString()}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-sm text-rose-500">
              <span>Discount</span>
              <span className="font-medium">-{data.discount.toLocaleString()}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax</span>
              <span className="font-medium">+{data.tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 mt-2 border-t-2 border-amber-200">
            <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Fraunces, serif' }}>Total</span>
            <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Fraunces, serif' }}>{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="animate-fade-in-up">
        <label className="label">Note (optional)</label>
        <textarea
          className="input-field"
          rows={2}
          placeholder="e.g. Thank you for your business!"
          value={data.note || ''}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>

      <div className="flex gap-3 pt-2 animate-fade-in-up">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" className="btn-primary">
          Review Invoice
        </button>
      </div>
    </form>
  );
}

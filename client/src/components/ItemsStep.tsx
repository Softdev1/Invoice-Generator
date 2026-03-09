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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Invoice Items</h2>
      <p className="text-gray-500 text-sm">Add items or services you provided.</p>

      {items.map((item, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-500">Item {i + 1}</span>
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(i)} className="text-red-500 text-sm font-medium">
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
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
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
              <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
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
          <div className="text-right text-sm text-gray-500">
            Line total: <span className="font-semibold text-gray-900">{(item.quantity * item.unit_price).toLocaleString()}</span>
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary-400 hover:text-primary-600 transition-colors">
        + Add Another Item
      </button>

      {/* Discount & Tax */}
      <div className="card space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Discount</label>
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
            <label className="block text-xs text-gray-500 mb-1">Tax</label>
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
      <div className="card">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>{subtotal.toLocaleString()}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Discount</span>
            <span>-{data.discount.toLocaleString()}</span>
          </div>
        )}
        {data.tax > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax</span>
            <span>+{data.tax.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
          <span>Total</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <textarea
          className="input-field"
          rows={2}
          placeholder="e.g. Thank you for your business!"
          value={data.note || ''}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
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

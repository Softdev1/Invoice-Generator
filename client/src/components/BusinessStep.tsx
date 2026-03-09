'use client';

import { useEffect, useRef, useState } from 'react';
import { loadBusiness, saveBusiness } from '@/lib/storage';
import type { InvoiceFormData } from '@/app/create/page';

interface Props {
  data: InvoiceFormData['business'];
  onChange: (data: InvoiceFormData['business']) => void;
  onNext: () => void;
}

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Naira' },
  { code: 'USD', symbol: '$', name: 'Dollar' },
  { code: 'GBP', symbol: '£', name: 'Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'KES', symbol: 'KSh', name: 'Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Cedi' },
];

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function BusinessStep({ data, onChange, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Load saved business profile on mount
  useEffect(() => {
    const saved = loadBusiness();
    if (saved && !data.name) {
      onChange({ ...data, ...saved });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLogoError('Please upload a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...data, logo_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    onChange({ ...data, logo_url: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    saveBusiness(data);
    onNext();
  };

  const update = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Your Business Details</h2>
      <p className="text-gray-500 text-sm">Tell us about your business. This appears on the invoice.</p>

      {/* Logo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Logo</label>
        <div className="flex items-center gap-4">
          {data.logo_url ? (
            <div className="relative">
              <img
                src={data.logo_url}
                alt="Business logo"
                className="w-20 h-20 object-contain rounded-xl border-2 border-gray-200 bg-white p-1"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
              >
                X
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
            >
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px]">Add Logo</span>
            </button>
          )}
          {data.logo_url && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              Change
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleLogoSelect}
          className="hidden"
        />
        {logoError && <p className="text-red-500 text-xs mt-1">{logoError}</p>}
        <p className="text-gray-400 text-xs mt-1">PNG, JPEG, or WebP. Max 2MB.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Mama Joy's Catering"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          className="input-field"
          placeholder="e.g. 08012345678"
          value={data.phone || ''}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          className="input-field"
          placeholder="e.g. mama@example.com"
          value={data.email || ''}
          onChange={(e) => update('email', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. 12 Market Road, Lagos"
          value={data.address || ''}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
        <select
          className="input-field"
          value={data.currency}
          onChange={(e) => update('currency', e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} - {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary">
        Next: Customer Details
      </button>
    </form>
  );
}

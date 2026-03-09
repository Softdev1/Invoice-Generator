'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { clearBusiness, saveBusiness } from '@/lib/storage';
import type { InvoiceFormData } from '@/app/create/page';

interface Props {
  data: InvoiceFormData['business'];
  onChange: (data: InvoiceFormData['business']) => void;
  onNext: () => void;
}

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
];

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function BusinessStep({ data, onChange, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCurrency = useCallback((code: string) => {
    onChange({ ...data, currency: code });
    setCurrencyOpen(false);
  }, [data, onChange]);

  // Clear saved profile on mount so page always starts fresh
  useEffect(() => {
    clearBusiness();
  }, []);

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in-up">
        <h2 className="section-title">Your Business</h2>
        <p className="section-subtitle">This info appears on your invoice.</p>
      </div>

      {/* Logo upload */}
      <div className="animate-fade-in-up stagger-1">
        <label className="label">Business Logo</label>
        <div className="card flex items-center gap-4">
          {data.logo_url ? (
            <div className="relative group">
              <img
                src={data.logo_url}
                alt="Business logo"
                className="w-20 h-20 object-contain rounded-2xl border-2 border-slate-100 bg-white p-2"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-md hover:bg-rose-600 transition-colors"
              >
                X
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
            >
              <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-semibold">Add Logo</span>
            </button>
          )}
          <div className="flex-1">
            {data.logo_url ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-amber-600 font-semibold hover:underline"
              >
                Change logo
              </button>
            ) : (
              <p className="text-slate-400 text-xs">PNG, JPEG, or WebP. Max 2MB.</p>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleLogoSelect}
          className="hidden"
        />
        {logoError && <p className="text-rose-500 text-xs mt-1.5 font-medium">{logoError}</p>}
      </div>

      <div className="animate-fade-in-up stagger-2">
        <label className="label">Business Name *</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Mama Joy's Catering"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </div>

      <div className="animate-fade-in-up stagger-3">
        <label className="label">Phone Number</label>
        <input
          type="tel"
          className="input-field"
          placeholder="e.g. 08012345678"
          value={data.phone || ''}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>

      <div className="animate-fade-in-up stagger-4">
        <label className="label">Email</label>
        <input
          type="email"
          className="input-field"
          placeholder="e.g. mama@example.com"
          value={data.email || ''}
          onChange={(e) => update('email', e.target.value)}
        />
      </div>

      <div className="animate-fade-in-up stagger-5">
        <label className="label">Address</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. 12 Market Road, Lagos"
          value={data.address || ''}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>

      <div className="animate-fade-in-up stagger-6 relative" ref={dropdownRef}>
        <label className="label">Currency</label>
        <button
          type="button"
          onClick={() => setCurrencyOpen(!currencyOpen)}
          className="input-field flex items-center justify-between cursor-pointer"
        >
          {(() => {
            const selected = CURRENCIES.find((c) => c.code === data.currency);
            return selected ? (
              <span className="flex items-center gap-3">
                <span className="text-xl leading-none">{selected.flag}</span>
                <span className="font-semibold text-slate-800">{selected.symbol}</span>
                <span className="text-slate-500">{selected.name}</span>
              </span>
            ) : (
              <span className="text-slate-400">Select currency</span>
            );
          })()}
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {currencyOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in-up"
            style={{ animationDuration: '0.15s' }}
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCurrency(c.code)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                  ${data.currency === c.code
                    ? 'bg-amber-50 border-l-4 border-amber-400'
                    : 'border-l-4 border-transparent hover:bg-slate-50'
                  }`}
              >
                <span className="text-2xl leading-none">{c.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{c.symbol}</span>
                    <span className="text-sm font-medium text-slate-600">{c.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{c.code}</span>
                </div>
                {data.currency === c.code && (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 animate-fade-in-up stagger-6">
        <button type="submit" className="btn-primary">
          Next — Customer Details
        </button>
      </div>
    </form>
  );
}

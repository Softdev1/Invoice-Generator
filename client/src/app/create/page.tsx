'use client';

import { useState, useCallback } from 'react';
import { BusinessStep } from '@/components/BusinessStep';
import { CustomerStep } from '@/components/CustomerStep';
import { ItemsStep } from '@/components/ItemsStep';
import { ReviewStep } from '@/components/ReviewStep';

export interface InvoiceFormData {
  business: {
    name: string;
    logo_url?: string;
    phone?: string;
    email?: string;
    address?: string;
    currency: string;
  };
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  discount: number;
  tax: number;
  note?: string;
}

const STEPS = [
  { label: 'Business', icon: '🏪' },
  { label: 'Customer', icon: '👤' },
  { label: 'Items', icon: '📝' },
  { label: 'Review', icon: '✅' },
] as const;

export default function CreateInvoicePage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<InvoiceFormData>({
    business: { name: '', currency: 'NGN' },
    customer: { name: '' },
    items: [{ name: '', quantity: 1, unit_price: 0 }],
    discount: 0,
    tax: 0,
  });

  const next = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const updateFormData = useCallback((updates: Partial<InvoiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`
                  w-11 h-11 rounded-2xl flex items-center justify-center text-lg
                  transition-all duration-300
                  ${i < step ? 'bg-slate-800 text-white shadow-md' : ''}
                  ${i === step ? 'bg-amber-400 text-slate-900 shadow-lg scale-110' : ''}
                  ${i > step ? 'bg-slate-100 text-slate-400' : ''}
                `}>
                  {i < step ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{s.icon}</span>
                  )}
                </div>
                <span className={`text-[11px] font-semibold tracking-wide ${
                  i <= step ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-1 mt-[-18px] rounded-full transition-colors duration-300 ${
                  i < step ? 'bg-slate-800' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="animate-slide-in" key={step}>
        {step === 0 && (
          <BusinessStep data={formData.business} onChange={(business) => updateFormData({ business })} onNext={next} />
        )}
        {step === 1 && (
          <CustomerStep data={formData.customer} onChange={(customer) => updateFormData({ customer })} onNext={next} onBack={back} />
        )}
        {step === 2 && (
          <ItemsStep data={formData} onChange={updateFormData} onNext={next} onBack={back} />
        )}
        {step === 3 && (
          <ReviewStep data={formData} onBack={back} />
        )}
      </div>
    </div>
  );
}

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

const STEPS = ['Business', 'Customer', 'Items', 'Review'] as const;

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
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`text-xs font-medium ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {step === 0 && (
        <BusinessStep data={formData.business} onChange={(business) => updateFormData({ business })} onNext={next} />
      )}
      {step === 1 && (
        <CustomerStep data={formData.customer} onChange={(customer) => updateFormData({ customer })} onNext={next} onBack={back} />
      )}
      {step === 2 && (
        <ItemsStep
          data={formData}
          onChange={updateFormData}
          onNext={next}
          onBack={back}
        />
      )}
      {step === 3 && (
        <ReviewStep data={formData} onBack={back} />
      )}
    </div>
  );
}

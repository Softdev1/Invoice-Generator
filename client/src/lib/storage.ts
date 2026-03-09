const STORAGE_KEY = 'invoice_gen_business';

export interface StoredBusiness {
  id?: string;
  name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
}

export function saveBusiness(data: StoredBusiness) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadBusiness(): StoredBusiness | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearBusiness() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

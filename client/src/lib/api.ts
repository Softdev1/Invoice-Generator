const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Something went wrong');
  }

  return json.data;
}

export const api = {
  // Business
  createBusiness: (data: Record<string, unknown>) =>
    request('/business', { method: 'POST', body: JSON.stringify(data) }),

  getBusiness: (id: string) => request(`/business/${id}`),

  updateBusiness: (id: string, data: Record<string, unknown>) =>
    request(`/business/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Invoices
  createInvoice: (businessId: string, data: Record<string, unknown>) =>
    request(`/business/${businessId}/invoices`, { method: 'POST', body: JSON.stringify(data) }),

  getInvoice: (id: string) => request(`/invoices/${id}`),

  generatePdf: (invoiceId: string) =>
    request(`/invoices/${invoiceId}/generate-pdf`, { method: 'POST' }),

  getPdfUrl: (invoiceId: string) => request<{ url: string }>(`/invoices/${invoiceId}/pdf`),

  // Uploads
  uploadLogo: async (file: File, businessId?: string) => {
    const formData = new FormData();
    formData.append('logo', file);
    if (businessId) formData.append('business_id', businessId);

    const res = await fetch(`${API_BASE}/uploads/logo`, { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message || 'Upload failed');
    return json.data as { id: string; url: string };
  },
};

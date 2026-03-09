import { z } from 'zod';
import {
  businessSchema,
  customerSchema,
  invoiceItemSchema,
  createInvoiceSchema,
  invoiceSchema,
} from './schemas';

// Inferred types from Zod schemas
export type Business = z.infer<typeof businessSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;

// Invoice statuses
export type InvoiceStatus = 'draft' | 'processing' | 'ready' | 'failed';

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// PDF job payload
export interface PdfJobPayload {
  job_type: 'generate_pdf';
  invoice_id: string;
  business_id: string;
  requested_by: string;
  requested_at: string;
}

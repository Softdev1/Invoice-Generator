import { z } from 'zod';

// Business profile
export const businessSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Business name is required').max(200),
  logo_url: z.string().url().nullable().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  currency: z.string().default('NGN'),
  default_note: z.string().max(1000).optional(),
});

export const createBusinessSchema = businessSchema.omit({ id: true });

// Customer
export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Customer name is required').max(200),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

export const createCustomerSchema = customerSchema.omit({ id: true, business_id: true });

// Invoice item
export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Item name is required').max(200),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().nonnegative('Price cannot be negative'),
  total: z.number().nonnegative().optional(),
});

// Invoice
export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  invoice_number: z.string().optional(),
  issue_date: z.string(),
  due_date: z.string().optional(),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.string().default('NGN'),
  status: z.enum(['draft', 'processing', 'ready', 'failed']).default('draft'),
  pdf_url: z.string().url().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Create invoice input (what the client sends)
export const createInvoiceSchema = z.object({
  customer: createCustomerSchema,
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  note: z.string().max(1000).optional(),
});

import { Router } from 'express';
import { prisma } from '../config/db';
import { createCustomerSchema } from '@invoice-gen/shared';

const router = Router();

// Create customer for a business
router.post('/:businessId/customers', async (req, res, next) => {
  try {
    const data = createCustomerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: { ...data, business_id: req.params.businessId },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// List customers for a business
router.get('/:businessId/customers', async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { business_id: req.params.businessId },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

export default router;

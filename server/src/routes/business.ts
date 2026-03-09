import { Router } from 'express';
import { prisma } from '../config/db';
import { createBusinessSchema } from '@invoice-gen/shared';

const router = Router();

// Create business profile
router.post('/', async (req, res, next) => {
  try {
    const data = createBusinessSchema.parse(req.body);
    const business = await prisma.business.create({ data });
    res.status(201).json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
});

// Get business profile
router.get('/:id', async (req, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
    });
    if (!business) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } });
      return;
    }
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
});

// Update business profile
router.put('/:id', async (req, res, next) => {
  try {
    const data = createBusinessSchema.partial().parse(req.body);
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
});

export default router;

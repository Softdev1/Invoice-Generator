import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../config/db';
import { MAX_LOGO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@invoice-gen/shared';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LOGO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WebP images are allowed'));
    }
  },
});

const router = Router();

// Upload logo
// In MVP, store locally or use a placeholder. S3 integration added later.
router.post('/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }

    const businessId = req.body.business_id;

    // TODO: Upload to S3 and get URL
    // For now, store as base64 data URL (MVP only)
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    const uploadRecord = await prisma.upload.create({
      data: {
        business_id: businessId || null,
        file_type: req.file.mimetype,
        url: dataUrl,
      },
    });

    res.status(201).json({ success: true, data: { id: uploadRecord.id, url: uploadRecord.url } });
  } catch (err) {
    next(err);
  }
});

export default router;

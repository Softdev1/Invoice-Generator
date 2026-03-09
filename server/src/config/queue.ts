import { Queue } from 'bullmq';
import { redis } from './redis';
import { PDF_QUEUE_NAME } from '@invoice-gen/shared';

export const pdfQueue = new Queue(PDF_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

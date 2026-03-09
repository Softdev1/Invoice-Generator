import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import businessRoutes from './routes/business';
import customerRoutes from './routes/customers';
import invoiceRoutes from './routes/invoices';
import uploadRoutes from './routes/uploads';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/business', businessRoutes);
app.use('/api/business', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/uploads', uploadRoutes);

// The create-invoice route is nested under business
// POST /api/business/:businessId/invoices -> handled by invoiceRoutes mounted on /api/invoices
// We need to also mount invoice creation under business
app.use('/api/business', invoiceRoutes);

// Error handler
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});

export default app;

# Invoice Generator

A mobile-first web application that enables small business owners to create professional invoices and export them as PDFs. Built with simplicity in mind for low-literacy SME users — large touch targets, step-by-step wizard, and minimal input required.

## Features

- **Step-by-step invoice wizard** — Business details, Customer info, Items, Review & Download
- **Logo upload** — Add your business logo to invoices (PNG, JPEG, WebP, max 2MB)
- **PDF generation** — Professional invoice PDFs generated via Puppeteer
- **Guest mode** — No sign-up required; business profile saved locally
- **Mobile-first UI** — Designed for phone screens with large, easy-to-tap controls
- **Multi-currency support** — NGN, USD, GBP, EUR, KES, GHS, ZAR

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend API | Express, TypeScript, Zod validation |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ (Redis-backed) |
| PDF Engine | Puppeteer (Headless Chrome) + Handlebars templates |
| Shared | Zod schemas, TypeScript types, constants |

## Project Structure

```
├── client/          # Next.js frontend (mobile-first UI)
│   └── src/
│       ├── app/         # Pages (create wizard)
│       ├── components/  # Step components (Business, Customer, Items, Review)
│       └── lib/         # API client, localStorage helpers
├── server/          # Express API
│   ├── prisma/          # Schema & migrations
│   └── src/
│       ├── config/      # DB, Redis, queue setup
│       ├── middleware/   # Error handling
│       ├── routes/      # Business, customers, invoices, uploads
│       └── services/    # Invoice number generator
├── worker/          # PDF generation worker
│   └── src/
│       ├── templates/   # Handlebars invoice template
│       └── index.ts     # BullMQ worker process
├── shared/          # Shared types, Zod schemas, constants
└── docker-compose.yml   # PostgreSQL + Redis for local dev
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 16
- **Redis** 7+

You can install Postgres and Redis via Homebrew (macOS):

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

Or use Docker:

```bash
docker compose up -d
```

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create the database
createdb invoice_generator

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your database URL if needed

# 4. Run database migrations
npm --workspace=server run db:migrate -- --name init

# 5. Build shared package
npm --workspace=shared run build
```

### Run

```bash
# Start frontend (port 3000) + API (port 4000)
npm run dev

# Start PDF worker (separate terminal)
npm run dev:worker
```

Open http://localhost:3000 to start creating invoices.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user@localhost:5432/invoice_generator` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | API server port | `4000` |
| `NODE_ENV` | Environment | `development` |

## How It Works

1. User fills in business details (name, phone, logo, etc.)
2. User adds customer info and invoice line items
3. User reviews the invoice and clicks "Generate PDF"
4. API creates the invoice record and enqueues a PDF job
5. Worker picks up the job, renders HTML with Handlebars, generates PDF via Puppeteer
6. Client polls until PDF is ready, then shows the download button

## Roadmap

- [ ] **Phase 1 (MVP)** — Guest mode, invoice creation, PDF download *(current)*
- [ ] **Phase 2** — User accounts, invoice history, WhatsApp sharing, payment links
- [ ] **Phase 3** — Offline mode, multi-language, recurring invoices, payment tracking

## License

MIT

# Simple Invoice Generator — Detailed System Architecture

**Version:** 1.0

**Purpose:** This document defines the complete application architecture and system boundaries for the Simple Invoice Generator web app. It is engineering-focused and intended to guide implementation, deployment, testing, and operational runbooks.

---

## Table of Contents
1. Overview
2. High-level architecture (components & responsibilities)
3. Deployment topology
4. Data model (logical)
5. API surface (endpoints + contracts)
6. Core flows (sequence diagrams in prose)
7. PDF generation system (detailed)
8. Storage and file management
9. Scalability & resilience strategies
10. Security & compliance
11. Observability, monitoring & alerting
12. CI/CD & release process
13. Testing strategy
14. Cost considerations & sizing guidance
15. Operational runbooks & backup
16. Roadmap: phase 1 → phase 3

---

## 1. Overview

This architecture supports a mobile-first web application that enables low-literacy SME users to create invoices and export/share them as PDFs. The system must be fast (invoice generation <3s typical), reliable, secure, and easy to operate.

Key non-functional requirements:
- Fast response times for interactive UI (<1s for common ops)
- PDF generation reliability (<5s for typical invoices)
- Support 10k invoices/day in MVP scaling path (see sizing)
- Keep UX simple and minimize user input errors


## 2. High-level architecture (components & responsibilities)

```
Client (Web / Mobile web)
  └─> CDN
       └─> Frontend (Next.js / React, static & SSR)
            └─> API Gateway / Load Balancer
                 ├─> Backend API (Node.js + Express / NestJS)
                 │     ├─ Auth Service (JWT / Supabase / Auth0)
                 │     ├─ Business & Customer CRUD
                 │     ├─ Invoice Service
                 │     ├─ PDF Request enqueuer
                 │     ├─ Upload endpoints
                 │     └─ Webhook + Notification endpoints
                 ├─> Worker Pool / Job Queue (BullMQ or Celery equivalent)
                 │     └─ PDF Generation Workers (Puppeteer / Headless chrome or wkhtmltopdf)
                 ├─> Cache (Redis)
                 ├─> Database (PostgreSQL)
                 └─> File Storage (S3 / Cloudinary)

Observability: Prometheus / Grafana, Sentry
CI/CD: GitHub Actions → Deploy to Vercel (frontend) + Cloud (backend)

```

### Component responsibilities

- **Client (Next.js SPA)**
  - Mobile-first UI, step-by-step wizard
  - Local profile caching (IndexedDB / localStorage) for guest users
  - Minimal onboarding flows and large touch targets
  - Request/validate API calls and show previews (PDF preview via react-pdf)

- **API Gateway / LB**
  - TLS termination, basic WAF rules, rate limiting

- **Backend API (Stateless)**
  - Expose REST (or GraphQL) endpoints for CRUD and operations
  - Validate inputs strictly (Zod) and guard against XSS/Injection
  - Generate invoice numbers, persist invoice records, enqueue PDF jobs

- **Auth Service**
  - Optional for MVP: guest mode + device-bound identifier
  - Recommended for signed-in users: JWT issued by Auth provider (Supabase/Auth0)

- **Worker Queue**
  - Receive PDF generation jobs and process them asynchronously
  - Workers fetch invoice data + assets and render PDF
  - Provide retry and dead-letter handling

- **File Storage**
  - Persist logos, generated PDFs, thumbnails
  - S3 (or Cloudinary for images + transformations)

- **Cache (Redis)**
  - Short-lived caches for invoice preview, rate limiting, session store for guest mode

- **Database (Postgres)**
  - Relational transactional store for business, customer, invoices, items
  - Use UUIDs and indexes for quick lookups

- **Monitoring & Logging**
  - Centralized logs (ELK/Datadog/Cloud provider logs) and error collector (Sentry)


## 3. Deployment topology

### Environments
- **dev** — developer feature work
- **staging** — pre-prod testing + QA
- **prod** — live users

### Hosting recommendations
- Frontend: Vercel (Edge CDN + SSR) or Netlify
- Backend: Node.js container on AWS ECS / Fargate or Railway / DigitalOcean App Platform
- Database: Managed Postgres (Supabase / RDS / Neon)
- Redis: Managed Redis (Upstash / AWS Elasticache)
- Storage: AWS S3 + CloudFront or Cloudinary for image transformations
- Jobs: Container-based worker pool (manageable by ECS Fargate or Kubernetes) or serverless workers (if using Cloud Run / Lambda with container image)

### Network layout
- Public internet → CloudFront/CDN → Frontend
- Frontend ↔ API (HTTPS) → ALB / API Gateway → Backend
- Backend ↔ internal network → DB, Redis, S3
- Workers ↔ internal network → DB, S3

### Security
- Use VPC for backend and DB, keep DB private
- Use TLS everywhere
- Use IAM roles for services (workers) to access S3


## 4. Data model (logical)

High-level tables (normalized):
- `businesses` (id uuid PK, owner_id nullable, name, logo_url, phone, email, address, currency, default_note, created_at)
- `customers` (id uuid PK, business_id FK, name, phone, address, created_at)
- `invoices` (id uuid PK, business_id FK, customer_id FK, invoice_number, issue_date, due_date, subtotal, discount, tax, total, currency, pdf_url nullable, status enum, metadata jsonb, created_at)
- `invoice_items` (id uuid PK, invoice_id FK, name, quantity, unit_price, total)
- `uploads` (id uuid, business_id nullable, file_type, url, created_at)
- `audit_logs` (id, user_id, event, meta jsonb, created_at)

Indexes:
- invoices(business_id, invoice_number)
- invoices(created_at)
- customers(business_id, phone)

Constraints:
- Referential integrity on FKs
- Use check constraints for non-negative prices/quantities


## 5. API surface (endpoints + contracts)

Use RESTful endpoints; accept+return JSON. Authenticate via `Authorization: Bearer <jwt>` when signed-in. Guest mode: provide an ephemeral client-id header.

### Auth
- `POST /api/auth/login` -> { access_token, refresh_token }
- `POST /api/auth/signup` -> { user }

### Business
- `POST /api/business` -> create profile
- `GET /api/business/:id` -> fetch profile
- `PUT /api/business/:id` -> update profile

### Uploads
- `POST /api/uploads/logo` (multipart/form-data) -> { url }
- `GET /api/uploads/:id` -> redirect to S3

### Customers
- `POST /api/business/:id/customers` -> create customer
- `GET /api/business/:id/customers` -> list

### Invoices
- `POST /api/business/:id/invoices` -> create invoice (returns invoice id + preview url)
- `GET /api/invoices/:id` -> invoice details
- `POST /api/invoices/:id/generate-pdf` -> enqueue PDF job -> { job_id }
- `GET /api/invoices/:id/pdf` -> download URL (signed S3 url or CDN)
- `GET /api/business/:id/invoices` -> list invoices

### Webhooks (optional)
- `POST /api/webhooks/pdf_ready` -> used internally/for notifications when PDF ready

Input validation
- Use Zod or Joi schemas for each endpoint
- Reject unknown fields

Error handling
- Standardized error response: `{ code, message, details? }` with HTTP codes

Rate limiting
- Per IP and per API key limits (e.g. 60 req/min for free/guest)


## 6. Core flows (sequence diagrams in prose)

### Flow A: Create + Download Invoice (guest flow)
1. Client loads `/create-invoice`; business profile pre-populated from local storage.
2. User fills customer info and items; UI validates and sends `POST /api/business/:id/invoices`.
3. Backend persists invoice record with `status=draft` and returns invoice id & preview.
4. Client calls `POST /api/invoices/:id/generate-pdf`.
5. Backend enqueues job in Redis queue with invoice id and returns job id.
6. Worker picks job, fetches invoice data + logo from S3, renders HTML template, runs Puppeteer to create PDF, uploads to S3, updates `invoices.pdf_url` and `status=ready`, and emits webhook/notification.
7. Client polls `GET /api/invoices/:id` or listens via WebSocket/Push to get `status=ready` and PDF url.
8. Client opens signed URL or downloads file.

### Flow B: Signed-in recurring user with preview cache
- Same as above except: business profile stored server-side, preview HTML cached in Redis (TTL 60s) for fast preview rendering in client.

### Flow C: Concurrency & retry
- Worker handles job with dedupe key `pdf:invoice:{invoice_id}` to avoid duplicate processing.
- On failure, retry up to N times (ex: 3) with exponential backoff; on permanent failure move to DLQ and notify ops via Sentry/Slack.


## 7. PDF generation system (detailed)

### Options and trade-offs
- **Puppeteer (Headless Chrome)** — Full CSS fidelity, easiest for modern designs, heavier resource use.
- **wkhtmltopdf** — Fast, lighter, but CSS/JS limitations.
- **pdf-lib / jsPDF** — Programmatic PDF construction (best for simple documents, but harder to match HTML preview)

**Recommendation:** Use Puppeteer in workers running in containers. It produces identical output to HTML preview and supports advanced styling and fonts.

### Architecture
- PDF Worker Docker image includes Node.js + Puppeteer + template renderer (Handlebars / EJS / React SSR)
- Worker process:
  1. Fetch invoice data from API/DB
  2. Fetch assets (logo) from S3
  3. Server-side render HTML invoice template
  4. Puppeteer launch (headless), load HTML via `page.setContent`, wait for fonts/images, then `page.pdf()` with configured options
  5. Save PDF to S3 with key `pdfs/{business_id}/{invoice_number}.pdf` and set `ContentType: application/pdf` and proper cache-control
  6. Update DB invoice record and emit event

### Resource tuning
- Puppeteer requires ~200-400MB RAM per concurrent process depending on HTML complexity. Use max concurrency per worker machine to avoid OOM.
- Use a worker autoscaler: scale worker replicas based on queue length.

### Security
- Run headless chrome in sandboxed containers with least privileges.
- Sanitize any user-provided HTML or inputs used in templates.

### Caching & preview
- For preview in UI, render HTML on the server and send HTML to client or render client-side using the same template codebase to ensure parity.
- Cache rendered preview HTML in Redis for short TTL to avoid regenerating on repeated edits.


## 8. Storage and file management

### Upload model
- Use pre-signed S3 upload URLs for logo uploads (`POST /api/uploads/logo` returns `upload_url` and `file_url` after client uploads to S3).
- Validate file type and size via backend metadata checks and S3 lifecycle rules.

### Object naming
- Logos: `uploads/logos/{business_id}/{uuid}.{ext}`
- PDFs: `invoices/pdfs/{business_id}/{YYYY}/{MM}/{invoice_number}.pdf`
- Thumbnails: `invoices/thumbs/{...}`

### Retention
- Keep PDFs for configurable retention (default 2 years). Use S3 lifecycle to move older objects to Glacier or delete.

### CDN
- Serve PDFs through CloudFront to reduce latency.


## 9. Scalability & resilience strategies

### Horizontal scaling
- API: scale stateless backend instances behind LB (auto-scale by CPU or request latency)
- Workers: scale based on queue length
- DB: vertical scale for MVP, move to read-replicas for read-heavy scenarios

### Caching
- Use Redis for session caching, preview cache, and rate-limiting counters

### Queue & throughput
- Use BullMQ (Redis-backed) or RabbitMQ for reliable queueing; tune concurrency to match worker resources.

### Throttling & back-pressure
- Rate-limit PDF generation per business (ex: 5 concurrent requests, 100/day) to prevent abuse
- Use circuit-breaker pattern for downstream services (S3, DB)

### Fault tolerance
- Retries with exponential backoff
- Dead-letter queue for persistent failures
- Health checks and graceful shutdown for workers


## 10. Security & compliance

### Authentication & Authorization
- Signed-in users: JWTs with short expiry + refresh tokens stored securely
- Guest users: ephemeral client-id and local storage; consider linking when user later signs up
- Role-based access control: business owner(s) can access their resources

### Data protection
- TLS in transit
- Encrypt S3 objects at rest (SSE-S3 or SSE-KMS)
- Use DB encryption-at-rest (managed by provider)
- Limit PII storage: only store phone, email, names

### Input validation & sanitization
- Validate all inputs server-side
- Escape template placeholders before injecting into HTML used for PDF

### File uploads
- Enforce strict content-type checks + virus scanning (ClamAV) if high-risk
- Limit file size to 2MB

### Rate limiting & abuse prevention
- IP-based throttling
- Business-level quotas

### Compliance
- GDPR considerations: provide delete/export flows for business owners
- Local tax laws: store minimal tax metadata, but do not attempt to compute legal taxes without region-specific rules in early releases


## 11. Observability, monitoring & alerting

### Metrics to capture
- App: request latency, error rates (4xx/5xx), throughput
- Workers: queue length, job durations, success/failure rates
- PDF: average generation time, failures per invoice
- Storage: S3 errors, egress
- DB: slow queries, connection pool usage

### Tools
- Logs: structured JSON logs -> Log aggregation (Elasticsearch / DataDog / CloudWatch)
- Traces: OpenTelemetry -> Jaeger/Datadog
- Errors: Sentry for exceptions
- Metrics: Prometheus + Grafana

### Alerts
- Pager/Slack on: high error rate (>1% 5xx), queue backlog > threshold, worker OOMs, DB connection exhaustion

### Dashboards
- Real-time queue length dashboard
- PDF generation success/failure trends
- Top 10 error traces


## 12. CI/CD & release process

### Branching & workflows
- `main` -> production, `staging` -> staging environment, feature branches for dev
- PR + automated tests required before merge

### Pipeline
- Lint -> Unit tests -> Build -> Integration tests -> Deploy to staging
- Manual approval for production deploy

### Tooling
- GitHub Actions / GitLab CI
- Docker images stored in container registry
- IaC: Terraform or Pulumi for infra provisioning


## 13. Testing strategy

### Unit tests
- Validation logic, invoice calculations, number generator

### Integration tests
- API endpoints against test DB, uploads using local S3 emulator

### End-to-end tests
- Cypress for user flows (create invoice -> generate PDF -> download)

### Load testing
- Locust / k6: simulate invoice generation peaks and worker throughput

### Security tests
- Static analysis (Snyk), dependency scanning, regular pen tests for production


## 14. Cost considerations & sizing guidance (MVP)

Assumptions: 10k invoices/day, average PDF size 150KB

Components approximate monthly costs (cloud-agnostic rough estimate):
- Frontend hosting (Vercel): $50–200
- Backend (Fargate/ECS or small cluster): $200–800
- Postgres (managed): $200–800
- Redis (managed): $50–250
- S3 storage + egress: $10–100
- Workers compute (depends on concurrency): $200–1000
- Monitoring & logs: $50–300

Optimize costs:
- Use serverless for backend to start (Cloud Run / Lambda) to reduce idle cost
- Use Cloudinary for logo transforms to offload image processing


## 15. Operational runbooks & backup

### Backup
- Automated daily DB snapshots retained 14–30 days
- S3 lifecycle rule to replicate important objects to a secondary region for DR

### Incident playbooks
- PDF generation backlog: scale workers; check Redis memory; inspect failing invoice payloads
- DB connection exhaustion: check pool settings; scale DB or add read-replicas
- High error rate: roll back last deploy; run smoke tests

### Routine maintenance
- Rotate secrets quarterly
- Patch worker base images monthly


## 16. Roadmap & phased roll-out

### Phase 1 (MVP)
- Guest mode + local profile
- Business profile + logo upload
- Invoice creation & PDF generation (queued workers)
- Download + share via OS share sheet (user-driven)
- Minimal analytics + Sentry

### Phase 2
- Auth & user accounts
- Server-side profile storage
- WhatsApp share integration (pre-filled messages + PDF link)
- Invoice history & search
- Payment links (third-party)

### Phase 3
- Offline mode + background sync
- Multi-language support
- Recurring invoices & scheduling
- Invoice status tracking & webhooks for payment events

---

### Appendix A — Example Queue Job JSON (PDF generation)

```json
{
  "job_type": "generate_pdf",
  "invoice_id": "uuid-invoice-123",
  "business_id": "uuid-business-abc",
  "requested_by": "user-uuid-or-client-id",
  "requested_at": "2026-03-09T10:12:00Z"
}
```

---

### Appendix B — Sample worker-side pseudocode

```javascript
// job handler (node)
async function handleGeneratePdf(job) {
  const { invoice_id } = job.data;
  const invoice = await db.getInvoice(invoice_id);
  const logoUrl = invoice.business.logo_url;
  const html = renderInvoiceHtml(invoice, { logoUrl });

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await uploadToS3(`invoices/pdfs/${invoice.business_id}/${invoice.invoice_number}.pdf`, pdfBuffer);

  await db.updateInvoice(invoice_id, { pdf_url: s3Url, status: 'ready' });
  await browser.close();
}
```

---

If you want, next steps I can produce immediately:
- Full Prisma schema and migration files for the DB
- Dockerfile + Kubernetes / ECS task definitions for workers
- A production-ready Puppeteer worker Docker image manifest
- HTML/CSS invoice template with responsive layout

Tell me which one to generate next.


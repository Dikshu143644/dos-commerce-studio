# StockFlow - Enterprise Inventory & CRM Management System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

StockFlow is a production-grade enterprise inventory management and CRM system built for companies managing multi-warehouse operations, supplier relationships, and customer pipelines. It combines inventory tracking, procurement management, sales operations, and AI-powered insights into a unified platform.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3 |
| Build Tool | Vite | 6.3 |
| Language | TypeScript (strict) | 5.8 |
| Styling | Tailwind CSS | 4.1 |
| State Management | TanStack Query | 5.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Charts | Recharts | 2.15 |
| Animations | Motion (Framer Motion) | 12.x |
| Database | Supabase (PostgreSQL) | 2.x |
| Backend | PHP (Slim 4) | 8.2 |
| Excel Processing | SheetJS (xlsx) / PhpSpreadsheet | 0.18 / 2.x |
| Icons | Lucide React | 0.511 |
| Routing | React Router | 7.x |
| Toasts | Sonner | 2.x |
| Date Utilities | date-fns | 4.x |
| Edge Functions | Deno (Supabase) | - |

## Features

### Inventory Management
- Product catalog with categories, SKUs, and pricing
- Multi-warehouse stock tracking with capacity monitoring
- Real-time stock movement history (in, out, transfer, adjustment)
- Low stock alerts and reorder point management
- Category hierarchy with parent-child relationships

### CRM & Sales
- Customer directory with segmentation (regular, wholesale, retail)
- Lead pipeline with Kanban board view
- Deal tracking through sales stages with probability scoring
- Activity logging (calls, emails, meetings, tasks)
- Sales order creation and fulfillment tracking
- Invoice generation and payment tracking

### Procurement
- Supplier directory with performance ratings
- Purchase order creation with multi-step workflow
- Delivery tracking and partial receiving
- Price comparison across suppliers

### AI Assistant
- 6 specialized AI agents (Inventory, Sales, Procurement, Finance, Excel, General)
- Multi-provider support (OpenAI, Gemini, Anthropic) with fallback chain
- Intent-based routing to appropriate agent
- Contextual suggested prompts
- Full chat interface with typing indicators
- Supabase Edge Function proxy for secure API key handling

### Reports & Analytics
- Revenue trend analysis (12-month view)
- Top products by revenue (horizontal bar charts)
- Stock levels by warehouse (grouped/stacked bars)
- Customer acquisition tracking
- Deal pipeline value analysis
- Excel export with predefined templates
- File import with column auto-mapping

### PHP Backend Services
- Invoice PDF generation (DomPDF)
- Purchase order PDF generation
- Large Excel file processing (PhpSpreadsheet)
- Email notifications (PHPMailer via SMTP)
- WhatsApp notifications (MSG91/Twilio)
- Razorpay payment integration
- Scheduled cron jobs for recurring tasks

### Settings & Administration
- User management with role-based access
- Permission matrix editor (CRUD per module)
- Comprehensive audit log with JSON diff view
- Company configuration and preferences

## Architecture

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   React SPA     |---->|   Supabase       |---->|   PostgreSQL     |
|   (Vite + TS)   |     |   (Auth + API)   |     |   (20 tables)   |
|                  |     |                  |     |                  |
+--------+---------+     +------------------+     +------------------+
         |
         |  +------------------+     +------------------+
         +->| Cloudflare       |---->|  KV Storage      |
         |  | Workers (Hono)   |     |  (Rate Limiting) |
         |  +------------------+     +------------------+
         |
         |  +------------------+
         +->|  AI Edge Function|
            |  (Deno/Supabase) |
            +--------+---------+
                     |
         +-----------+-----------+-----------+
         |           |           |           |
    +----+---+  +----+---+  +----+---+  +---+----+
    | OpenAI |  | Gemini |  |Anthropic|  |Fallback|
    +--------+  +--------+  +---------+  +--------+
```

### Request Flow

1. **Frontend** (hosted on Vercel) makes requests to Supabase for CRUD operations (auth, data)
2. **Cloudflare Workers** handle backend operations: invoice PDF generation, Excel processing, email/SMS notifications
3. **Supabase Edge Function** proxies AI requests with secure API key handling
4. **KV Storage** provides rate limiting and response caching at the edge

## Getting Started

### Prerequisites

- Node.js 22.x or later
- pnpm 10.x or later
- PHP 8.2 or later (for backend development)
- Composer 2.x (PHP package manager)
- Docker & Docker Compose (optional, for containerized development)
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/stockflow-inventory-crm.git
cd stockflow-inventory-crm

# Install frontend dependencies
pnpm install

# Install PHP backend dependencies
cd server/php
composer install
cd ../..

# Copy environment variables
cp .env.example .env

# Start frontend development server
pnpm dev
```

### PHP Backend Setup

The PHP backend uses Slim Framework 4 and runs as a separate service:

```bash
# Navigate to PHP backend
cd server/php

# Install dependencies
composer install

# Copy environment config
cp .env.example .env
# Edit .env with your credentials (Supabase, SMTP, Razorpay, etc.)

# Start PHP development server
php -S localhost:8080 -t public/

# Or use Docker
docker build -t stockflow-php .
docker run -p 8080:80 stockflow-php
```

**PHP Backend Structure:**

```
server/php/
├── public/
│   └── index.php          # Entry point (Slim app bootstrap)
├── src/
│   ├── Controllers/       # Route controllers
│   ├── Middleware/         # Auth JWT verification, CORS
│   ├── Services/          # Business logic (PDF, email, Excel)
│   └── Models/            # Data models
├── cron/
│   ├── scheduler.php      # Cron task runner
│   ├── low-stock-alerts.php
│   ├── payment-reminders.php
│   └── report-generation.php
├── storage/
│   ├── pdfs/              # Generated PDF files
│   └── exports/           # Generated Excel exports
├── tests/
├── composer.json
├── Dockerfile
└── .env.example
```

### Docker Development Workflow

The recommended development workflow uses Docker Compose to run all services together:

```bash
# Start all services (frontend, PHP backend, cron)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f php-backend

# Rebuild after code changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**Services and Ports:**

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | Nginx serving built React SPA |
| `php-backend` | 8080 | PHP-FPM + Nginx (Slim 4 API) |
| `cron` | - | PHP CLI running scheduled tasks (no exposed port) |

All services share the `stockflow` Docker network and can communicate internally using service names (e.g., `http://php-backend:80`).

## API Documentation (PHP Backend)

### Authentication

All PHP API endpoints require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/invoices/generate` | Generate invoice PDF for a sales order |
| `POST` | `/api/purchase-orders/pdf` | Generate purchase order PDF |
| `POST` | `/api/reports/stock` | Generate stock report (PDF or Excel) |
| `POST` | `/api/excel/import` | Import Excel file (server-side processing) |
| `POST` | `/api/excel/export/inventory` | Export inventory to Excel |
| `POST` | `/api/email/send` | Send transactional email |
| `POST` | `/api/notifications/whatsapp` | Send WhatsApp message |
| `POST` | `/api/payments/create-order` | Create Razorpay payment order |
| `POST` | `/api/payments/verify` | Verify Razorpay payment signature |
| `POST` | `/api/payments/webhook` | Razorpay webhook handler |
| `GET` | `/api/health` | Health check endpoint |

### Example Requests

**Generate Invoice:**
```bash
curl -X POST http://localhost:8080/api/invoices/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sales_order_id": "uuid-here"}'
```

**Import Excel (large file):**
```bash
curl -X POST http://localhost:8080/api/excel/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@products.xlsx" \
  -F "type=products"
```

**Send Email:**
```bash
curl -X POST http://localhost:8080/api/email/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "template": "invoice",
    "data": {"invoice_number": "INV-001", "amount": 5000}
  }'
```

## Cron Job Configuration

The cron service runs a scheduler every 60 seconds that dispatches tasks based on their configured intervals:

| Task | Schedule | Description |
|------|----------|-------------|
| Low Stock Alerts | Every 6 hours | Check stock levels against reorder points, send notifications |
| Payment Reminders | Daily at 9 AM | Send reminders for overdue invoices |
| Report Generation | Weekly (Monday) | Generate weekly sales and inventory summary reports |

The cron service uses the same Docker image as `php-backend` but overrides the entrypoint to run the scheduler in a loop. It shares the storage volume for generated files.

To add a new cron task:
1. Create a PHP script in `server/php/cron/`
2. Register it in `server/php/cron/scheduler.php` with the desired interval
3. The task will automatically run on the next scheduler cycle

## Environment Variables

### Frontend Variables (Vite)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `VITE_API_URL` | Backend API URL (Cloudflare Workers or PHP) | Yes | `http://localhost:8080` |
| `VITE_PHP_API_URL` | PHP backend URL (legacy, use VITE_API_URL) | No | `http://localhost:8080` |
| `VITE_AI_PROXY_URL` | AI proxy endpoint URL | No | `http://localhost:3001/api/ai/chat` |

### PHP Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL (for server-side auth verification) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | Yes |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification | Yes |
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP authentication username | Yes |
| `SMTP_PASS` | SMTP authentication password | Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret | For payments |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification secret | For payments |
| `MSG91_AUTH_KEY` | MSG91 authentication key | For SMS/WhatsApp |
| `MSG91_SENDER_ID` | MSG91 sender ID | For SMS/WhatsApp |
| `MSG91_TEMPLATE_ID` | MSG91 message template ID | For SMS/WhatsApp |
| `TWILIO_SID` | Twilio account SID | For WhatsApp |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | For WhatsApp |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number | For WhatsApp |

### AI Provider Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | At least one provider |
| `GEMINI_API_KEY` | Google Gemini API key | At least one provider |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | At least one provider |
| `AI_PRIMARY_PROVIDER` | Primary AI provider (`openai`, `gemini`, `anthropic`) | No (defaults to `openai`) |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend development server (port 5173) |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |

## Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/stockflow-inventory-crm)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-org/stockflow-inventory-crm)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stockflow?referralCode=stockflow)

### Quick Start (All Services)

| Service | Platform | Deploy From | URL |
|---------|----------|-------------|-----|
| Frontend (React SPA) | Vercel (recommended) | Root directory | `https://yourdomain.com` |
| Frontend (React SPA) | Netlify (alternative) | Root directory | `https://yourdomain.com` |
| Backend API | Cloudflare Workers (recommended) | `workers/` | `https://api.yourdomain.com` |
| Backend API | Railway/Render (alternative) | `server/php/` | `https://api.yourdomain.com` |
| Database + Auth | Supabase | `supabase/migrations/` | `https://project.supabase.co` |
| AI Edge Functions | Supabase | `supabase/functions/` | `https://project.supabase.co/functions/v1/` |

### Deployment Environment Variables

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `VITE_SUPABASE_URL` | Vercel/Netlify | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel/Netlify | Yes | Supabase public/anon API key |
| `VITE_API_URL` | Vercel/Netlify | Yes | Backend API URL (Cloudflare Workers or PHP) |
| `VITE_AI_PROXY_URL` | Vercel/Netlify | No | AI edge function URL |
| `SUPABASE_URL` | Cloudflare/Railway/Render | Yes | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare/Railway/Render | Yes | Service role key for admin access |
| `SUPABASE_JWT_SECRET` | Cloudflare/Railway/Render | Yes | JWT secret for token verification |
| `SMTP_HOST` | Railway/Render | Yes | SMTP server hostname |
| `SMTP_PORT` | Railway/Render | Yes | SMTP server port |
| `SMTP_USER` | Railway/Render | Yes | SMTP auth username |
| `SMTP_PASS` | Railway/Render | Yes | SMTP auth password |

> For the complete variable reference and step-by-step deployment instructions, see [docs/deployment.md](docs/deployment.md).

### Architecture Overview

```
+------------------+     +------------------+     +------------------+
|   Vercel CDN     |     |    Supabase      |     | Cloudflare       |
|   (React SPA)    |     | (DB + Auth + Fn) |     | Workers (API)    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                          +-------v-------+
                          |  PostgreSQL   |
                          |  (20 tables   |
                          |   with RLS)   |
                          +---------------+
```

> For detailed architecture diagrams, data flow, and scaling considerations, see [docs/architecture.md](docs/architecture.md).

### Docker (Local/Self-Hosted)

Deploy all services with Docker Compose:

```bash
# Production build and deploy
docker-compose up -d --build

# The frontend is available at http://localhost:3000
# The PHP backend is available at http://localhost:8080
```

### Netlify (Frontend Only)

The project includes a `netlify.toml` configuration:

```bash
# Build command
pnpm build

# Publish directory
dist/
```

SPA redirects are configured automatically.

### Manual Docker Build

```bash
# Build frontend image
docker build -t stockflow-frontend .

# Build PHP backend image
docker build -t stockflow-php ./server/php

# Run frontend
docker run -p 3000:80 stockflow-frontend

# Run PHP backend
docker run -p 8080:80 \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  stockflow-php
```

## Project Structure

```
stockflow-inventory-crm/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/           # AuthGuard
│   │   ├── layout/         # AppShell, Sidebar, TopNav, Breadcrumbs
│   │   ├── shared/         # DataTable, PageHeader, KPICard, etc.
│   │   └── ui/             # Base UI components (button, card, dialog, etc.)
│   ├── contexts/           # AuthContext, SidebarContext
│   ├── hooks/              # useAuth, useDebounce, useMediaQuery, TanStack Query hooks
│   ├── lib/                # Utils (cn helper), Supabase client
│   ├── pages/
│   │   ├── ai/             # AI Assistant page
│   │   ├── auth/           # Login, Register, ForgotPassword
│   │   ├── crm/            # Customers, Leads, Deals, Activities
│   │   ├── inventory/      # Products, Warehouses, Movements, Categories
│   │   ├── procurement/    # Suppliers, Purchase Orders
│   │   ├── reports/        # Analytics, Excel Export
│   │   ├── sales/          # Sales Orders, Invoices
│   │   ├── settings/       # Settings, Users, Roles, Audit Log
│   │   ├── Dashboard.tsx   # Main dashboard with KPIs
│   │   └── NotFound.tsx    # 404 page
│   ├── services/
│   │   ├── ai/             # AI provider abstraction, agents, router
│   │   ├── excel/          # Parser, generator, templates, large-file routing
│   │   └── api.ts          # Backend API client with JWT forwarding
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component with routing
│   ├── index.css           # Tailwind + design system variables
│   └── main.tsx            # Entry point
├── workers/                # Cloudflare Workers backend (Hono)
│   ├── src/
│   │   ├── index.ts        # Worker entry point and route registration
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Auth, CORS, rate limiting
│   │   └── services/       # Business logic (PDF, Excel, email)
│   ├── wrangler.toml       # Cloudflare Workers configuration
│   ├── tsconfig.json
│   └── package.json
├── server/
│   └── php/                # PHP Slim 4 backend (alternative)
│       ├── public/         # Entry point
│       ├── src/            # Controllers, Middleware, Services
│       ├── cron/           # Scheduled task scripts
│       ├── storage/        # Generated files (PDFs, exports)
│       ├── tests/          # PHPUnit tests
│       ├── Dockerfile
│       └── composer.json
├── supabase/
│   ├── migrations/         # SQL migration files
│   └── functions/          # Edge functions (AI proxy)
├── .github/
│   └── workflows/          # CI/CD pipeline (frontend + workers + PHP)
├── Dockerfile              # Frontend Docker build
├── docker-compose.yml      # Multi-service orchestration
├── vercel.json             # Vercel deployment config
├── netlify.toml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Design System

StockFlow uses a dark spatial glassmorphism design language:

- **Background:** `#0a0a0a` (near-black)
- **Primary:** `#10b981` (emerald green)
- **Cards:** `rgba(255, 255, 255, 0.03)` with backdrop blur
- **Border radius:** 24px (cards), 16px (buttons), 12px (inputs)
- **Glass effect:** `backdrop-filter: blur(12px)` with subtle borders
- **Gradient orbs:** Radial emerald/teal gradients with blur

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript strict mode is enforced
- Use path aliases (`@/`) for imports
- Follow existing component patterns in `src/components/ui/`
- Use `cn()` utility for conditional class merging
- All pages should include motion animations on mount
- PHP code uses strict types and PSR-4 autoloading

## License

This project is proprietary software. All rights reserved.

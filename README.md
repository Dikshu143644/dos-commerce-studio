# StockFlow - Enterprise Inventory & CRM Management System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
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
| Excel Processing | SheetJS (xlsx) | 0.18 |
| Icons | Lucide React | 0.511 |
| Routing | React Router | 7.x |
| Toasts | Sonner | 2.x |
| Date Utilities | date-fns | 4.x |

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

### Reports & Analytics
- Revenue trend analysis (12-month view)
- Top products by revenue (horizontal bar charts)
- Stock levels by warehouse (grouped/stacked bars)
- Customer acquisition tracking
- Deal pipeline value analysis
- Excel export with predefined templates
- File import with column auto-mapping

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
         |  +------------------+
         +->|  AI Service      |
            |  Router          |
            +--------+---------+
                     |
         +-----------+-----------+-----------+
         |           |           |           |
    +----+---+  +----+---+  +----+---+  +---+----+
    | OpenAI |  | Gemini |  |Anthropic|  |Fallback|
    +--------+  +--------+  +---------+  +--------+
```

## Getting Started

### Prerequisites

- Node.js 22.x or later
- pnpm 10.x or later
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/stockflow-inventory-crm.git
cd stockflow-inventory-crm

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development server
pnpm dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_AI_PROVIDER` | Preferred AI provider (openai/gemini/anthropic) | No |
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI features | No |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | No |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key | No |

### Database Setup

1. Create a new Supabase project
2. Run the migration files in order:

```bash
# Apply migrations to your Supabase database
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/002_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/003_functions.sql
```

Or via the Supabase dashboard SQL editor, paste and run each file sequentially.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 5173) |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |

## Deployment

### Netlify

The project includes a `netlify.toml` configuration:

```bash
# Build command
pnpm build

# Publish directory
dist/
```

SPA redirects are configured automatically.

### Docker

```bash
# Build the image
docker build -t stockflow .

# Run the container
docker run -p 80:80 stockflow
```

Or with Docker Compose:

```bash
docker-compose up -d
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
│   ├── hooks/              # useAuth, useDebounce, useMediaQuery
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
│   │   └── excel/          # Parser, generator, templates
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component with routing
│   ├── index.css           # Tailwind + design system variables
│   └── main.tsx            # Entry point
├── supabase/
│   └── migrations/         # SQL migration files
├── .github/
│   └── workflows/          # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
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

## License

This project is proprietary software. All rights reserved.

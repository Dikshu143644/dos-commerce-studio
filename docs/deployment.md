# StockFlow Deployment Guide

This guide covers deploying StockFlow to production. The recommended setup uses Vercel (frontend) + Cloudflare Workers (backend API) + Supabase (database + auth + edge functions). Alternative options include Netlify (frontend) and Railway/Render (PHP backend).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Vercel Setup (Frontend)](#vercel-setup-frontend)
- [Cloudflare Workers Setup (Backend API)](#cloudflare-workers-setup-backend-api)
- [Netlify Setup (Frontend - Alternative)](#netlify-setup-frontend---alternative)
- [Supabase Setup (Database & Auth)](#supabase-setup-database--auth)
- [Railway/Render Setup (PHP Backend - Alternative)](#railwayrender-setup-php-backend---alternative)
- [DNS Configuration](#dns-configuration)
- [SSL/TLS](#ssltls)
- [Environment Variable Reference](#environment-variable-reference)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Alerting](#monitoring-and-alerting)

---

## Architecture Overview

```
                    +-----------+
                    |   Users   |
                    +-----+-----+
                          |
              +-----------+-----------+
              |                       |
        +-----v-----+         +------v------+
        |  Vercel    |         | Cloudflare  |
        |  (React)   |         |  Workers    |
        |  CDN       |         | (Hono API)  |
        +-----+------+         +------+------+
              |                       |
              +----------+------------+
                         |
                  +------v------+
                  |  Supabase   |
                  | (PostgreSQL)|
                  | (Auth)      |
                  | (Edge Fns)  |
                  +-------------+
```

> **Note:** Netlify (frontend) + Railway/Render (PHP backend) is also supported as an alternative deployment. See the respective sections below.

---

## Prerequisites

Before deploying, ensure you have:

- A GitHub account with the StockFlow repository
- A [Vercel](https://vercel.com) account (recommended for frontend)
- A [Cloudflare](https://cloudflare.com) account (recommended for backend API)
- A [Supabase](https://supabase.com) account
- A [Netlify](https://netlify.com) account (alternative frontend)
- A [Railway](https://railway.app) or [Render](https://render.com) account (alternative backend)
- A custom domain (optional but recommended)
- Supabase CLI installed locally (`npm install -g supabase`)
- Wrangler CLI installed locally (`npm install -g wrangler`) for Cloudflare Workers

---

## Vercel Setup (Frontend)

### Step 1: Connect GitHub Repository

1. Log in to [Vercel](https://vercel.com)
2. Click **"Add New..."** > **"Project"**
3. Import the `stockflow-inventory-crm` repository from GitHub
4. Configure build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`
   - **Node.js Version:** 22.x

### Step 2: Set Environment Variables

In the Vercel project dashboard: **Settings** > **Environment Variables**

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_API_URL` | `https://your-worker.your-subdomain.workers.dev` (Cloudflare Workers URL) |
| `VITE_AI_PROXY_URL` | `https://your-project.supabase.co/functions/v1/ai-chat` |

### Step 3: Deploy

1. Click **"Deploy"** - Vercel will build and deploy automatically
2. Subsequent pushes to `main` trigger automatic production deploys
3. Pull requests get preview deployments automatically

### Step 4: SPA Routing

The `vercel.json` in the repository handles SPA rewrites:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

No additional configuration needed.

### Step 5: CI/CD Integration

For automated deployments via GitHub Actions, set up these repository secrets:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Personal access token from Vercel account settings |
| `VERCEL_ORG_ID` | Organization ID (found in Vercel project settings) |
| `VERCEL_PROJECT_ID` | Project ID (found in Vercel project settings) |

The CI pipeline includes a `deploy-vercel` job that runs on every push to `main`.

---

## Cloudflare Workers Setup (Backend API)

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login
```

### Step 2: Create KV Namespaces

The Workers backend uses KV for rate limiting and caching:

```bash
# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMIT_KV"

# Create KV namespace for caching
wrangler kv:namespace create "CACHE_KV"
```

Note the namespace IDs returned and update `workers/wrangler.toml` with them.

### Step 3: Set Worker Secrets

```bash
cd workers/

# Supabase credentials
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_JWT_SECRET

# AI provider keys (at least one required)
wrangler secret put OPENAI_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

### Step 4: Deploy

```bash
cd workers/

# Install dependencies
npm install

# Type-check
npx tsc --noEmit

# Deploy to Cloudflare
wrangler deploy
```

### Step 5: Configure Custom Domain (Optional)

1. In the Cloudflare dashboard, go to **Workers & Pages** > your worker
2. Click **Settings** > **Triggers** > **Custom Domains**
3. Add `api.yourdomain.com`
4. Cloudflare automatically provisions SSL and routes traffic

### Step 6: CI/CD Integration

For automated deployments via GitHub Actions, add this repository secret:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with "Edit Cloudflare Workers" permissions |

The CI pipeline includes a `deploy-cloudflare` job that runs on every push to `main`.

### Step 7: Verify Deployment

```bash
# Test the health endpoint
curl https://your-worker.your-subdomain.workers.dev/api/health

# Test with authentication
curl https://your-worker.your-subdomain.workers.dev/api/invoices/generate \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sales_order_id": "uuid-here"}'
```

---

## Netlify Setup (Frontend - Alternative)

> **Note:** Netlify is an alternative to Vercel for hosting the frontend. Choose one or the other.

### Step 1: Connect GitHub Repository

1. Log in to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** > **"Import an existing project"**
3. Select **GitHub** and authorize Netlify
4. Choose the `stockflow-inventory-crm` repository
5. Configure build settings:
   - **Branch to deploy:** `main`
   - **Build command:** `pnpm build`
   - **Publish directory:** `dist`
   - **Node version:** Set `NODE_VERSION` to `22` in environment variables

### Step 2: Set Environment Variables

In Netlify dashboard: **Site settings** > **Environment variables**

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_PHP_API_URL` | `https://api.yourdomain.com` (Railway/Render URL) |
| `VITE_AI_PROXY_URL` | `https://your-project.supabase.co/functions/v1/ai-chat` |
| `NODE_VERSION` | `22` |

### Step 3: Deploy

1. Click **"Deploy site"** - Netlify will build and deploy automatically
2. Subsequent pushes to `main` trigger automatic deploys
3. Pull requests get deploy previews automatically

### Step 4: Configure SPA Routing

The `netlify.toml` in the repository already handles SPA redirects:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

No additional configuration needed.

---

## Supabase Setup (Database & Auth)

### Step 1: Create Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Organization:** Select or create
   - **Project name:** `stockflow-production`
   - **Database password:** Generate a strong password (save it securely)
   - **Region:** Choose closest to your users
   - **Pricing plan:** Pro recommended for production

### Step 2: Run Migrations

Using the Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

This applies all migration files from `supabase/migrations/` (001 through 007).

### Step 3: Deploy Edge Functions

```bash
# Deploy the AI chat proxy function
supabase functions deploy ai-chat --project-ref your-project-ref
```

### Step 4: Set Edge Function Secrets

```bash
# Set API keys for AI providers
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
supabase secrets set GEMINI_API_KEY=your-gemini-key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set AI_PRIMARY_PROVIDER=openai
```

### Step 5: Configure Auth

In Supabase Dashboard > **Authentication** > **Providers**:

1. Enable **Email/Password** sign-in
2. Configure email templates (optional)
3. Set **Site URL** to your Netlify production URL
4. Add redirect URLs:
   - `https://yourdomain.com/**`
   - `http://localhost:5173/**` (for local dev)

### Step 6: Enable Row Level Security

All tables should have RLS enabled. The migrations handle this, but verify in Dashboard > **Table Editor** that each table shows "RLS enabled".

### Step 7: Get Connection Details

From **Project Settings** > **API**, note:
- **Project URL** (for `VITE_SUPABASE_URL`)
- **anon/public key** (for `VITE_SUPABASE_ANON_KEY`)
- **service_role key** (for PHP backend `SUPABASE_SERVICE_ROLE_KEY`)

From **Project Settings** > **API** > **JWT Settings**:
- **JWT Secret** (for PHP backend `SUPABASE_JWT_SECRET`)

---

## Railway/Render Setup (PHP Backend - Alternative)

> **Note:** Railway/Render with the PHP backend is an alternative to Cloudflare Workers. The Workers backend provides the same API endpoints with lower latency and no cold starts. Use the PHP backend if you need DomPDF rendering or PhpSpreadsheet processing that cannot run in a Worker environment.

### Option A: Railway

#### Step 1: Create Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"** > **"Deploy from GitHub repo"**
3. Select the repository
4. Set the **root directory** to `server/php`

#### Step 2: Configure Build

Railway auto-detects the Dockerfile. Ensure these settings:

- **Root Directory:** `server/php`
- **Builder:** Dockerfile
- **Port:** `80` (exposed by the Nginx container)

#### Step 3: Set Environment Variables

In Railway project > **Variables**:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `SUPABASE_JWT_SECRET` | Your JWT secret |
| `SMTP_HOST` | Your SMTP host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your SMTP username |
| `SMTP_PASS` | Your SMTP password |
| `RAZORPAY_KEY_ID` | Your Razorpay key (if using payments) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Your webhook secret |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |

#### Step 4: Deploy

Railway deploys automatically on push. Monitor the build logs to ensure success.

### Option B: Render

#### Step 1: Create Web Service

1. Log in to [Render](https://render.com)
2. Click **"New"** > **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `stockflow-api`
   - **Root Directory:** `server/php`
   - **Environment:** Docker
   - **Plan:** Starter or higher

#### Step 2: Set Environment Variables

Same variables as Railway (see table above).

#### Step 3: Deploy

Render deploys automatically from the `main` branch.

### Custom Domain (Railway/Render)

1. In your service dashboard, go to **Settings** > **Domains**
2. Add custom domain: `api.yourdomain.com`
3. Add the provided CNAME record to your DNS

---

## DNS Configuration

### Frontend (Netlify)

1. In Netlify: **Domain management** > **Add custom domain**
2. Add `yourdomain.com` and `www.yourdomain.com`
3. Configure DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | Netlify load balancer IP |
| CNAME | www | `your-site.netlify.app` |

Or use Netlify DNS (recommended):
- Point your domain's nameservers to Netlify's nameservers

### PHP API (Railway/Render)

| Type | Name | Value |
|------|------|-------|
| CNAME | api | Railway/Render provided value |

### Supabase (Edge Functions)

Edge Functions are accessed at `https://your-project.supabase.co/functions/v1/`, no custom DNS needed.

---

## SSL/TLS

### Automatic SSL

All three services provide automatic SSL certificate provisioning:

- **Netlify:** Automatic Let's Encrypt certificates for all custom domains
- **Railway:** Automatic SSL for custom domains
- **Render:** Automatic managed TLS certificates
- **Supabase:** SSL included on all project URLs

No manual certificate configuration is required. SSL is provisioned automatically once DNS propagation completes (usually within minutes, up to 48 hours).

### Forcing HTTPS

- **Netlify:** Enable "Force HTTPS" in Domain management settings
- **Railway/Render:** HTTPS is enforced by default
- **Frontend:** The app uses relative/configured URLs, so no hard-coded HTTP references exist

---

## Environment Variable Reference

### All Variables by Service

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `VITE_SUPABASE_URL` | Vercel/Netlify | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel/Netlify | Yes | Supabase public/anon API key |
| `VITE_API_URL` | Vercel/Netlify | Yes | Backend API URL (Cloudflare Workers or PHP) |
| `VITE_PHP_API_URL` | Netlify | No | PHP backend URL (legacy, use VITE_API_URL instead) |
| `VITE_AI_PROXY_URL` | Vercel/Netlify | No | AI edge function URL |
| `NODE_VERSION` | Netlify | Yes | Node.js version (set to `22`) |
| `SUPABASE_URL` | Cloudflare/Railway/Render | Yes | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare/Railway/Render | Yes | Service role key for admin access |
| `SUPABASE_JWT_SECRET` | Cloudflare/Railway/Render | Yes | JWT secret for token verification |
| `SMTP_HOST` | Railway/Render | Yes | SMTP server hostname |
| `SMTP_PORT` | Railway/Render | Yes | SMTP server port |
| `SMTP_USER` | Railway/Render | Yes | SMTP auth username |
| `SMTP_PASS` | Railway/Render | Yes | SMTP auth password |
| `RAZORPAY_KEY_ID` | Railway/Render | No* | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Railway/Render | No* | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Railway/Render | No* | Webhook verification secret |
| `MSG91_AUTH_KEY` | Railway/Render | No* | MSG91 auth key for SMS |
| `TWILIO_SID` | Railway/Render | No* | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Railway/Render | No* | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Railway/Render | No* | WhatsApp sender number |
| `OPENAI_API_KEY` | Supabase Secrets | No** | OpenAI API key |
| `GEMINI_API_KEY` | Supabase Secrets | No** | Google Gemini API key |
| `ANTHROPIC_API_KEY` | Supabase Secrets | No** | Anthropic Claude API key |
| `AI_PRIMARY_PROVIDER` | Supabase Secrets | No | Primary AI provider |
| `APP_ENV` | Railway/Render | No | Application environment |
| `APP_DEBUG` | Railway/Render | No | Debug mode (set `false` in prod) |

*Required if using that feature (payments, notifications)
**At least one AI provider key required if using AI features

---

## Post-Deployment Verification

Run through this checklist after deploying:

### Frontend (Netlify)

- [ ] Site loads at production URL
- [ ] Login/register pages render correctly
- [ ] Supabase connection works (attempt login)
- [ ] SPA routing works (navigate between pages, refresh)
- [ ] Static assets load (images, fonts, CSS)
- [ ] No console errors related to missing env vars
- [ ] Deploy previews work for pull requests

### Frontend (Vercel)

- [ ] Site loads at production URL
- [ ] Login/register pages render correctly
- [ ] Supabase connection works (attempt login)
- [ ] SPA routing works (navigate between pages, refresh)
- [ ] Static assets load (images, fonts, CSS)
- [ ] No console errors related to missing env vars
- [ ] Preview deployments work for pull requests

### Cloudflare Workers (Backend API)

- [ ] Health endpoint responds: `curl https://your-worker.workers.dev/api/health`
- [ ] JWT verification works (test with valid Supabase token)
- [ ] Invoice generation endpoint responds
- [ ] Excel export endpoint responds
- [ ] CORS headers are correct for your frontend domain
- [ ] KV namespaces are bound (rate limiting works)
- [ ] Worker logs show no errors in Cloudflare dashboard

### Supabase

- [ ] Database tables exist (check Table Editor)
- [ ] RLS policies are active on all tables
- [ ] Authentication works (sign up new user)
- [ ] Edge functions respond: `curl https://your-project.supabase.co/functions/v1/ai-chat`
- [ ] Migrations applied correctly (check migration history)

### PHP Backend (Railway/Render)

- [ ] Health endpoint responds: `curl https://api.yourdomain.com/api/health`
- [ ] JWT verification works (test with valid Supabase token)
- [ ] PDF generation endpoint works
- [ ] Email sending works (test with a real address)
- [ ] Storage directories are writable
- [ ] Cron service is running (check logs)

### Integration

- [ ] Frontend can reach PHP backend (check CORS)
- [ ] Frontend can reach Supabase API
- [ ] AI chat function works end-to-end
- [ ] File upload/download works
- [ ] Real-time subscriptions work (if applicable)

---

## Rollback Procedures

### Frontend (Netlify)

1. Go to **Deploys** in Netlify dashboard
2. Find the last working deploy
3. Click **"Publish deploy"** on that version
4. The site reverts immediately (cached at CDN edge)

Alternatively, revert the git commit and push to trigger a new build.

### Supabase (Database)

For migration rollbacks:

```bash
# View migration history
supabase migration list

# Create a rollback migration
supabase migration new rollback_description

# Write the inverse SQL in the new migration file
# Then push the migration
supabase db push
```

**Important:** Always back up data before rolling back destructive migrations:
```bash
# Export data before rollback
supabase db dump -f backup.sql
```

### Edge Functions

```bash
# Deploy a previous version by checking out the old code
git checkout <previous-commit> -- supabase/functions/ai-chat/
supabase functions deploy ai-chat
```

### PHP Backend (Railway)

1. In Railway dashboard, go to **Deployments**
2. Click on the last working deployment
3. Click **"Rollback"**
4. The service reverts to that version

### PHP Backend (Render)

1. In Render dashboard, go to **Events**
2. Find the last successful deploy
3. Click **"Rollback to this deploy"**

### Emergency Procedure

If all services are affected:

1. Roll back frontend on Netlify (instant)
2. Roll back PHP backend on Railway/Render
3. If database migration caused issues, restore from Supabase point-in-time backup (Pro plan)
4. Notify users if downtime exceeds 5 minutes

---

## Monitoring and Alerting

### Frontend Monitoring

**Error Tracking (Sentry):**

1. Create a Sentry project at [sentry.io](https://sentry.io)
2. Add the Sentry SDK:
   ```bash
   pnpm add @sentry/react
   ```
3. Initialize in `src/main.tsx`:
   ```typescript
   import * as Sentry from '@sentry/react';
   Sentry.init({ dsn: 'your-dsn-here' });
   ```
4. The `src/lib/monitoring.ts` module will automatically use Sentry when available

**Performance Monitoring:**

- Netlify Analytics (built-in, paid feature)
- Google Analytics / Plausible for user behavior
- Web Vitals tracking (CLS, LCP, FID)

### Backend Monitoring

**Railway/Render Logs:**

- Both platforms provide built-in log streaming
- Set up log drain to external service (Datadog, Papertrail) for retention

**Health Checks:**

- Configure health check endpoint: `/api/health`
- Railway: Automatic health checks on the configured port
- Render: Set health check path in service settings

**Uptime Monitoring:**

- Use [UptimeRobot](https://uptimerobot.com) or [Better Uptime](https://betteruptime.com)
- Monitor:
  - `https://yourdomain.com` (frontend)
  - `https://api.yourdomain.com/api/health` (PHP backend)
  - `https://your-project.supabase.co/rest/v1/` (Supabase API)

### Supabase Monitoring

- **Dashboard:** Built-in usage metrics, API requests, database size
- **Log Explorer:** Query logs for Edge Functions, Auth, and API
- **Alerts:** Configure alerts for high error rates or usage limits

### Alerting Setup

Recommended alerts:

| Alert | Threshold | Service |
|-------|-----------|---------|
| Frontend errors spike | > 10 errors/minute | Sentry |
| API response time | > 2000ms p95 | Railway/Render |
| Health check failure | 2 consecutive failures | UptimeRobot |
| Database connections | > 80% of pool | Supabase |
| Storage usage | > 80% of limit | Supabase |
| Edge function errors | > 5% error rate | Supabase Logs |
| SSL certificate expiry | < 14 days | UptimeRobot |

### Incident Response

1. **Detect:** Automated alerts trigger via monitoring
2. **Assess:** Check dashboards for scope of impact
3. **Communicate:** Update status page if user-facing
4. **Resolve:** Apply fix or rollback
5. **Post-mortem:** Document root cause and preventive measures

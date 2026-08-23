# StockFlow System Architecture

## Table of Contents

- [System Architecture Diagram](#system-architecture-diagram)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Service Communication Patterns](#service-communication-patterns)
- [Security Model](#security-model)
- [Scaling Considerations](#scaling-considerations)

---

## System Architecture Diagram

```
+-----------------------------------------------------------------------+
|                            CLIENT LAYER                                 |
+-----------------------------------------------------------------------+
|                                                                         |
|    +-------------------------------------------------------------+     |
|    |                    React SPA (Vite + TS)                     |     |
|    |                                                             |     |
|    |  +----------+  +-----------+  +----------+  +----------+   |     |
|    |  |Dashboard |  |Inventory  |  |   CRM    |  | Reports  |   |     |
|    |  |  Module  |  |  Module   |  |  Module  |  |  Module  |   |     |
|    |  +----------+  +-----------+  +----------+  +----------+   |     |
|    |  +----------+  +-----------+  +----------+  +----------+   |     |
|    |  |   Sales  |  |Procurement|  |    AI    |  | Settings |   |     |
|    |  |  Module  |  |  Module   |  | Assistant|  |  Module  |   |     |
|    |  +----------+  +-----------+  +----------+  +----------+   |     |
|    |                                                             |     |
|    |  +-------------------+  +----------------+  +-----------+  |     |
|    |  | TanStack Query    |  | React Router   |  | Zustand/  |  |     |
|    |  | (Server State)    |  | (Navigation)   |  | Context   |  |     |
|    |  +-------------------+  +----------------+  +-----------+  |     |
|    +-------------------------------------------------------------+     |
|                                                                         |
+-----------------------------------------------------------------------+
           |                    |                    |
           | HTTPS              | HTTPS              | HTTPS
           v                    v                    v
+-------------------+  +------------------+  +------------------+
|   SERVICE LAYER   |  |  DATABASE LAYER  |  |   FUNCTION LAYER |
+-------------------+  +------------------+  +------------------+
|                   |  |                  |  |                  |
|  +-------------+  |  |  +-----------+   |  |  +------------+ |
|  |   PHP API   |  |  |  | Supabase  |   |  |  | Edge       | |
|  |  (Slim 4)   |  |  |  | PostgREST |   |  |  | Functions  | |
|  |             |  |  |  |           |   |  |  | (Deno)     | |
|  | Controllers:|  |  |  | Auto-gen  |   |  |  |            | |
|  | - Invoice   |  |  |  | REST API  |   |  |  | - ai-chat  | |
|  | - PO PDF    |  |  |  | from      |   |  |  |            | |
|  | - Excel     |  |  |  | schema    |   |  |  +-----+------+ |
|  | - Email     |  |  |  +-----------+   |  |        |        |
|  | - WhatsApp  |  |  |                  |  |        v        |
|  | - Payments  |  |  |  +-----------+   |  |  +----------+  |
|  +------+------+  |  |  | PostgreSQL|   |  |  | OpenAI   |  |
|         |         |  |  | (20 tables)|  |  |  | Gemini   |  |
|  +------+------+  |  |  |           |   |  |  | Claude   |  |
|  | Cron Service|  |  |  | + RLS     |   |  |  +----------+  |
|  | - Alerts   |  |  |  | + Triggers|   |  |                  |
|  | - Reports  |  |  |  | + Indexes |   |  +------------------+
|  | - Reminders|  |  |  +-----------+   |
|  +-------------+  |  |                  |
|                   |  |  +-----------+   |
+-------------------+  |  | Supabase  |   |
                       |  |   Auth    |   |
                       |  | (GoTrue)  |   |
                       |  +-----------+   |
                       |                  |
                       |  +-----------+   |
                       |  | Storage   |   |
                       |  | (S3)      |   |
                       |  +-----------+   |
                       +------------------+
```

---

## Data Flow Diagrams

### Authentication Flow

```
+--------+        +--------+        +-----------+        +----------+
| Client |        |Supabase|        | GoTrue    |        |PostgreSQL|
| (React)|        | Auth   |        | (Auth Svc)|        |          |
+---+----+        +---+----+        +-----+-----+        +-----+----+
    |                 |                    |                    |
    | 1. Login        |                    |                    |
    | (email/pass)    |                    |                    |
    +---------------->|                    |                    |
    |                 | 2. Verify          |                    |
    |                 +-------------------->|                    |
    |                 |                    | 3. Check user      |
    |                 |                    +------------------->|
    |                 |                    |<-------------------+
    |                 |                    | 4. User found      |
    |                 | 5. Issue JWT       |                    |
    |                 |<-------------------+                    |
    | 6. JWT + Refresh|                    |                    |
    |<----------------+                    |                    |
    |                 |                    |                    |
    | 7. API Request  |                    |                    |
    | (Bearer token)  |                    |                    |
    +---------------->|                    |                    |
    |                 | 8. Verify JWT,     |                    |
    |                 |    apply RLS       |                    |
    |                 +------------------------------------------->
    |                 |                    |                    |
    |                 |<------------------------------------------+
    | 9. Filtered     |                    |                    |
    |    Response     |                    |                    |
    |<----------------+                    |                    |
```

### CRUD Operations (via Supabase)

```
+--------+         +-----------+         +----------+
| Client |         | Supabase  |         |PostgreSQL|
| (React)|         | PostgREST |         |          |
+---+----+         +-----+-----+         +-----+----+
    |                    |                      |
    | 1. GET /products   |                      |
    | (+ JWT header)     |                      |
    +------------------->|                      |
    |                    | 2. Parse JWT,        |
    |                    |    set role          |
    |                    +--------------------->|
    |                    |                      | 3. Execute query
    |                    |                      |    with RLS filters
    |                    |                      |
    |                    |<---------------------+
    |                    | 4. Filtered results  |
    | 5. JSON response   |                      |
    |<-------------------+                      |
```

### PHP Backend Heavy Operations

```
+--------+         +-----------+         +----------+         +---------+
| Client |         |  PHP API  |         |PostgreSQL|         | Storage |
| (React)|         | (Slim 4)  |         |(Supabase)|         |  (Disk) |
+---+----+         +-----+-----+         +-----+----+         +----+----+
    |                    |                      |                    |
    | 1. POST /api/      |                      |                    |
    | invoices/generate  |                      |                    |
    | (+ JWT)            |                      |                    |
    +------------------->|                      |                    |
    |                    | 2. Verify JWT        |                    |
    |                    | (middleware)         |                    |
    |                    |                      |                    |
    |                    | 3. Fetch order data  |                    |
    |                    +--------------------->|                    |
    |                    |<---------------------+                    |
    |                    | 4. Order + items     |                    |
    |                    |                      |                    |
    |                    | 5. Generate PDF      |                    |
    |                    | (DomPDF)             |                    |
    |                    +------------------------------------->|
    |                    |                      |                    |
    |                    |<-------------------------------------+
    |                    | 6. File path         |                    |
    |                    |                      |                    |
    | 7. PDF URL/binary  |                      |                    |
    |<-------------------+                      |                    |
```

### AI Chat Flow

```
+--------+         +-----------+         +----------+         +---------+
| Client |         | Supabase  |         | Edge Fn  |         |   AI    |
| (React)|         |  Gateway  |         | (ai-chat)|         |Provider |
+---+----+         +-----+-----+         +-----+----+         +----+----+
    |                    |                      |                    |
    | 1. POST /functions |                      |                    |
    | /v1/ai-chat        |                      |                    |
    | {message, agent}   |                      |                    |
    +------------------->|                      |                    |
    |                    | 2. Route to function |                    |
    |                    +--------------------->|                    |
    |                    |                      | 3. Select provider |
    |                    |                      |    (primary/fallback)
    |                    |                      |                    |
    |                    |                      | 4. Forward prompt  |
    |                    |                      +------------------->|
    |                    |                      |<-------------------+
    |                    |                      | 5. AI response     |
    |                    |                      |                    |
    |                    | 6. Return response   |                    |
    |                    |<---------------------+                    |
    | 7. Chat response   |                      |                    |
    |<-------------------+                      |                    |
```

### Cron Job Execution

```
+----------+         +-----------+         +----------+         +---------+
|  Cron    |         |  Task     |         |PostgreSQL|         |  Email  |
| Scheduler|         |  Scripts  |         |(Supabase)|         |  (SMTP) |
+----+-----+         +-----+-----+         +-----+----+         +----+----+
     |                      |                     |                    |
     | 1. Every 60s tick    |                     |                    |
     | Check scheduled tasks|                     |                    |
     +--------------------->|                     |                    |
     |                      | 2. Low stock check  |                    |
     |                      +-------------------->|                    |
     |                      |<--------------------+                    |
     |                      | 3. Items below      |                    |
     |                      |    reorder point    |                    |
     |                      |                     |                    |
     |                      | 4. Send alert email |                    |
     |                      +------------------------------------->|
     |                      |                     |                    |
     |                      |<-------------------------------------+
     |                      | 5. Email sent       |                    |
     |                      |                     |                    |
     | 6. Task complete     |                     |                    |
     |<---------------------+                     |                    |
```

---

## Service Communication Patterns

### Frontend to Supabase (Direct)

- **Protocol:** HTTPS with JWT Bearer tokens
- **Client:** `@supabase/supabase-js` SDK
- **Operations:** CRUD, authentication, real-time subscriptions
- **Rate limiting:** Managed by Supabase (configurable per project)

### Frontend to PHP Backend (REST API)

- **Protocol:** HTTPS with JWT Bearer tokens (same Supabase JWT)
- **Client:** Custom fetch wrapper (`src/services/php.ts`)
- **Operations:** PDF generation, large file processing, email, payments
- **Authentication:** PHP middleware verifies JWT using `SUPABASE_JWT_SECRET`
- **CORS:** Configured in PHP middleware to allow frontend origin

### Frontend to Edge Functions (Serverless)

- **Protocol:** HTTPS via Supabase gateway
- **Client:** `supabase.functions.invoke()`
- **Operations:** AI chat proxy
- **Authentication:** Automatic JWT forwarding via Supabase client

### PHP Backend to Supabase (Server-side)

- **Protocol:** HTTPS with service_role key
- **Client:** Direct HTTP to PostgREST API
- **Operations:** Admin-level data access (bypass RLS)
- **Key:** `SUPABASE_SERVICE_ROLE_KEY` (never exposed to client)

### Inter-Service Communication Summary

```
+------------------+     +------------------+     +------------------+
|    Frontend      |     |   PHP Backend    |     |  Edge Functions  |
|                  |     |                  |     |                  |
| supabase-js SDK -+---->| PostgREST HTTP --+---->| Supabase DB      |
| fetch() ---------+---->| (service_role)   |     |                  |
| supabase.functions+---->|                  |     | AI Provider APIs |
+------------------+     +------------------+     +------------------+
```

---

## Security Model

### Authentication and Authorization

```
+------------------------------------------------------------------+
|                       SECURITY LAYERS                              |
+------------------------------------------------------------------+
|                                                                    |
|  1. AUTHENTICATION (Supabase Auth / GoTrue)                       |
|     +----------------------------------------------------------+ |
|     | - Email/password sign-in                                  | |
|     | - JWT tokens (access + refresh)                           | |
|     | - Session management                                      | |
|     | - Password hashing (bcrypt)                               | |
|     +----------------------------------------------------------+ |
|                                                                    |
|  2. AUTHORIZATION (Row Level Security)                            |
|     +----------------------------------------------------------+ |
|     | - Per-table RLS policies                                  | |
|     | - User can only access own organization's data            | |
|     | - Role-based permissions (admin, manager, user)           | |
|     | - Service role bypasses RLS (server-side only)            | |
|     +----------------------------------------------------------+ |
|                                                                    |
|  3. TRANSPORT SECURITY                                            |
|     +----------------------------------------------------------+ |
|     | - TLS 1.3 for all connections                             | |
|     | - HTTPS enforced (no HTTP fallback)                        | |
|     | - Certificate pinning (mobile, if applicable)             | |
|     +----------------------------------------------------------+ |
|                                                                    |
|  4. API SECURITY                                                  |
|     +----------------------------------------------------------+ |
|     | - JWT verification on every PHP request                   | |
|     | - CORS restricted to known origins                        | |
|     | - Rate limiting (Supabase built-in + PHP middleware)      | |
|     | - Input validation (Zod on frontend, PHP validation)      | |
|     | - SQL injection prevention (parameterized queries)        | |
|     +----------------------------------------------------------+ |
|                                                                    |
|  5. SECRET MANAGEMENT                                             |
|     +----------------------------------------------------------+ |
|     | - Environment variables (never in code)                   | |
|     | - Supabase secrets for Edge Functions                     | |
|     | - Service role key only on server-side                    | |
|     | - Anon key is safe for client (RLS enforced)              | |
|     +----------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### JWT Token Flow

```
Client               Supabase Auth         Database           PHP Backend
  |                      |                    |                    |
  |-- Login ------------>|                    |                    |
  |<-- JWT (anon role) --+                    |                    |
  |                      |                    |                    |
  |-- Query (JWT) ------>|-- SET ROLE ------->|                    |
  |                      |   (authenticated)  |                    |
  |                      |<-- RLS filtered ---+                    |
  |<-- Data -------------+                    |                    |
  |                      |                    |                    |
  |-- API Call (JWT) ----|--------------------|------------------->|
  |                      |                    |    Verify JWT      |
  |                      |                    |    Extract user_id |
  |                      |                    |<-- Service role -->|
  |<--------------------- Response -------------------------------|
```

### Key Security Principles

1. **Principle of Least Privilege:** Frontend only has anon key; RLS restricts access
2. **Defense in Depth:** Multiple validation layers (client, API gateway, database)
3. **Zero Trust:** Every request is authenticated, even between internal services
4. **Secrets Isolation:** API keys stored in environment variables, never in source code
5. **Audit Trail:** All mutations logged in audit_log table with before/after JSON diff

---

## Scaling Considerations

### Frontend (Netlify CDN)

| Aspect | Strategy |
|--------|----------|
| Static assets | Globally distributed CDN, automatic cache invalidation |
| Bundle size | Code splitting (vendor, ui, charts, query chunks) |
| Load time | Lazy-loaded routes, prefetching on hover |
| Caching | Hashed filenames for long-term caching |
| Availability | Multi-region CDN, automatic failover |

### Database (Supabase/PostgreSQL)

| Aspect | Strategy |
|--------|----------|
| Read scaling | Connection pooling (PgBouncer), read replicas (Pro plan) |
| Write scaling | Optimized indexes, batch operations |
| Storage | Automatic storage scaling on Supabase |
| Connections | Pool size managed by Supabase (configurable) |
| Queries | Indexed columns on foreign keys and frequently filtered fields |

### PHP Backend (Railway/Render)

| Aspect | Strategy |
|--------|----------|
| Horizontal | Multiple instances behind load balancer |
| Vertical | Scale container resources as needed |
| Stateless | No server-side sessions; JWT auth enables any-instance routing |
| File storage | Ephemeral storage; move to S3/Supabase Storage for persistence |
| Queue | For long operations, add Redis queue (future enhancement) |

### Edge Functions (Supabase)

| Aspect | Strategy |
|--------|----------|
| Cold starts | Minimal dependencies, pre-warmed instances |
| Concurrency | Automatic scaling by Supabase |
| Timeout | 60s max execution time per invocation |
| Rate limiting | Configure per-function limits in Supabase dashboard |

### Scaling Thresholds and Actions

```
Users        Action Needed
---------    --------------------------------------------------
< 1,000      Default Supabase Free/Pro tier, single PHP instance
1,000-10K    Upgrade Supabase to Pro, add PHP replica
10K-50K      Add read replica, Redis cache, CDN for API responses
50K-100K     Dedicated database, multiple PHP instances, queue system
100K+        Microservices split, dedicated infrastructure, custom caching
```

### Performance Optimization Checklist

- [ ] Database indexes on all foreign keys and filter columns
- [ ] TanStack Query caching (5-minute stale time for most queries)
- [ ] Image optimization (WebP, lazy loading)
- [ ] Code splitting with manual chunks (vendor, ui, charts, query)
- [ ] Gzip/Brotli compression (automatic on Netlify and Railway)
- [ ] CDN caching headers for static assets
- [ ] Database query optimization (EXPLAIN ANALYZE for slow queries)
- [ ] Connection pooling enabled in Supabase
- [ ] Rate limiting on public endpoints
- [ ] Background job processing for heavy operations

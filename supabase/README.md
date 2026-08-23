# Supabase Edge Functions - Deployment Guide

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Access to the StockFlow Supabase project

## Setup

1. **Login to Supabase:**

```bash
supabase login
```

2. **Link to the project:**

```bash
supabase link --project-ref <your-project-ref>
```

## Deploying Edge Functions

### Deploy the AI Chat function

```bash
supabase functions deploy ai-chat
```

### Deploy all functions at once

```bash
supabase functions deploy
```

## Managing Secrets

Edge Functions require API keys for AI providers. Set them using:

```bash
supabase secrets set OPENAI_API_KEY=xxx GEMINI_API_KEY=xxx ANTHROPIC_API_KEY=xxx
```

### List current secrets

```bash
supabase secrets list
```

### Unset a secret

```bash
supabase secrets unset SECRET_NAME
```

## Local Development

To run Edge Functions locally:

```bash
supabase start
supabase functions serve ai-chat --env-file .env.local
```

Create a `.env.local` file with your development keys:

```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

## Database Migrations

Migrations are located in `supabase/migrations/`. To apply:

```bash
supabase db push
```

To create a new migration:

```bash
supabase migration new <migration-name>
```

## Configuration

The `supabase/config.toml` file contains project settings for local development, including:

- API port and schema configuration
- Auth settings (JWT expiry, signup, OAuth providers)
- Edge Function configuration

Update `project_id` in `config.toml` after linking your project.

## Troubleshooting

- **Function not deploying:** Ensure the function has an `index.ts` entry point in its directory.
- **JWT verification failing:** Check that `verify_jwt = true` is set in `config.toml` and that requests include a valid Supabase auth token.
- **Secrets not available:** After setting secrets, redeploy the function for changes to take effect.

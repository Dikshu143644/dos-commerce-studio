# DOS Commerce

Premium e-commerce storefront and CRM/ERP dashboard built with React, TypeScript, and Vite.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Run locally

```bash
npm install
npm start
```

Open <http://localhost:3000>.

You can also use the development alias:

```bash
npm run dev
```

## Main routes

- `/` — storefront home
- `/shop` — product catalog
- `/cart` — shopping cart
- `/checkout` — checkout flow
- `/login` — customer login/register
- `/account` — customer account
- `/admin` — CRM/ERP dashboard
- `/admin/inventory` — inventory management
- `/admin/crm` — CRM lead pipeline
- `/admin/ai` — AI assistant

## Production build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Deploy to Render

This repository includes a `render.yaml` Blueprint for a Render static site.
It builds with `npm ci && npm run build`, publishes `dist/`, and rewrites all
application routes to `index.html` so React Router links work on refresh.

1. Push this project to a GitHub or GitLab repository.
2. In Render, choose **New → Blueprint**.
3. Connect the repository and approve the `render.yaml` Blueprint.
4. Render will build and publish the site at an `onrender.com` URL.

Subsequent commits to the linked branch deploy automatically.

## Notes

This is a frontend prototype. Catalog, account, cart, CRM, and ERP data are demo data stored in the browser or application state; external MongoDB, Razorpay, and backend API integrations are not required to run it locally.

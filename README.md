# JAI CHAMMUNDA FABRICATION — Invoice Generator

GST tax-invoice workspace for Jai Chammunda Fabrication. The live app runs on **Cloudflare Pages**: static files in `frontend/`, a Pages Function at `/api/customers`, and customer records in **D1** (`jcf-invoices`, binding name `DB`).

## What it does

- Create a tax invoice with chaplet line items, freight, and CGST/SGST 9% + 9%
- Select a saved customer or add a new one (name, address, GSTIN, state code, optional phone/email)
- Preview the invoice, then **Print / Save PDF** through the browser so text stays selectable

## Repository layout

```
invoice-generator/
├── frontend/                 # Pages static output directory
│   ├── index.html
│   ├── app.css
│   ├── app.js
│   ├── _headers              # Security headers for static responses
│   └── _routes.json          # Invoke Functions only for /api/*
├── functions/
│   └── api/
│       └── customers.js      # GET/POST customers against D1
├── .gitignore
├── README.md
└── DEPLOYMENT.md
```

`functions/` stays at the Pages **project root**. `frontend/` is the **build output directory**. Do not move Functions into `frontend/`.

## Local development

From the repo root:

```bash
npx wrangler pages dev frontend --d1 DB=jcf-invoices
```

Wrangler serves `frontend/` as static assets and loads `functions/` from the project root. Open the printed local URL (typically `http://localhost:8788`).

The UI calls same-origin `/api/customers`. The D1 binding **must** be named `DB`.

Local D1 starts empty. After the first `pages dev` start, create the table once:

```bash
npx wrangler d1 execute jcf-invoices --local --file=./migrations/0001_create_customers.sql
```

If that command says it cannot find the database, add the real D1 UUID from the Cloudflare dashboard to `wrangler.toml` under `[[d1_databases]]` (binding `DB`, name `jcf-invoices`), then rerun the migrate command. Never commit a fake/placeholder UUID — Pages deploy will fail.

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md). After a deploy, hard-refresh the site (`Ctrl+F5`). For PDFs, choose **Save as PDF** in Chrome and turn off Headers and footers.

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/customers` | List active customers |
| `POST` | `/api/customers` | Create a customer |

There is no Flask, Render, Vercel, or Google Drive backend in this repository.

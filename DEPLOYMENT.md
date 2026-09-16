# Cloudflare Pages deployment

This project is a single **Cloudflare Pages** site. There is no Render backend, no Vercel frontend, and no Google Drive upload service.

## Cloudflare settings

Connect the GitHub repo `krishdod/invoice-generator` to Pages with:

| Setting | Value |
|---------|--------|
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `frontend` |
| Root directory | `/` (repository root) |

Pages picks up `functions/` from the **project root** automatically. Keep that folder at the repo root even though static files live in `frontend/`.

## D1 binding

Deployed Wrangler config **must** include this binding in `wrangler.toml` (real UUID, never a placeholder):

```toml
[[d1_databases]]
binding = "DB"
database_name = "jcf-invoices"
database_id = "c908b5ba-dfee-4d71-a104-fed61f658376"
```

| Binding | Database | UUID |
|---------|----------|------|
| `DB` | `jcf-invoices` | `c908b5ba-dfee-4d71-a104-fed61f658376` |

`functions/api/customers.js` reads `context.env.DB`. If the binding name is not `DB`, or `database_id` is missing/invalid, customer load/save fails (HTTP 500 / error 8000022).

Do **not** create a second D1 database for this app. Keep using the existing `jcf-invoices` database that already holds saved customers.

## Static Cloudflare files

These belong in `frontend/` (the output directory), not in `functions/`:

- `_headers` — security headers (CSP, frame denial, nosniff, and related)
- `_routes.json` — `include: ["/api/*"]` so only API paths invoke Pages Functions

## Deploy

1. Push to `main`.
2. Wait for the Pages deployment to succeed.
3. Hard-refresh the live site with `Ctrl+F5`.

## Local check before pushing

```bash
npx wrangler pages dev frontend --d1 DB=jcf-invoices
```

Confirm:

- The invoice UI loads from the Wrangler URL
- Saved customers load from D1
- **Print / Save PDF** opens the browser print dialog (selectable text, not a screenshot)

## PDF

Use Chrome **Save as PDF**. For a clean A4 page, disable Headers and footers in the print dialog.

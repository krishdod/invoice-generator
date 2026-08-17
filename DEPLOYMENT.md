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

Do not change this:

| Binding | Database |
|---------|----------|
| `DB` | `jcf-invoices` |

`functions/api/customers.js` reads `context.env.DB`. If the binding name is not `DB`, customer load/save will fail.

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

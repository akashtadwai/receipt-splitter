# bill-iant 🧾

[![codecov](https://codecov.io/github/akashtadwai/receipt-splitter/graph/badge.svg?token=AWH1ZB213P)](https://codecov.io/github/akashtadwai/receipt-splitter)

**[Try it live →](https://akashtadwai.github.io/receipt-splitter)**

Split bills with friends without the awkward math. Snap a receipt, assign items, done.

## How It Works

1. **Upload** a receipt photo (or multiple!)
2. **Review** the auto-extracted items and prices
3. **Add** who's splitting the bill
4. **Assign** items to people
5. **Get** a clear breakdown of who owes what

Handles taxes, tips, and discounts automatically based on inputs.

## Architecture

```
GitHub Pages (React) → Cloudflare Worker (proxy) → Mistral AI (OCR)
```

- Frontend on GitHub Pages = instant loading
- Worker at the edge = no cold starts, API key secured
- Mistral Pixtral-12B = accurate receipt parsing

## Run Locally

**Prerequisites:** Node.js v18+, [Mistral API key](https://console.mistral.ai/)

### Frontend

```bash
cd receipt-splitter-frontend
npm install && npm start
```
Opens at [localhost:3000](http://localhost:3000)

### Worker (OCR API)

```bash
cd worker
npm install
npx wrangler secret put MISTRAL_API_KEY
npm run dev
```
Runs at [localhost:8787](http://localhost:8787)

## Deploy

Set these GitHub secrets:
- `CLOUDFLARE_API_TOKEN` (with Workers edit permission)
- `CLOUDFLARE_ACCOUNT_ID`
- `MISTRAL_API_KEY`

Push to `main` → auto-deploys frontend to GitHub Pages, worker to Cloudflare.

## Test

```bash
cd receipt-splitter-frontend && npm test
```

## Tech Stack

React • Cloudflare Workers • Mistral AI • GitHub Pages

---

MIT License • Built with AI assistance ✨

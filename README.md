# bill-iant🧾💰 [![codecov](https://codecov.io/github/akashtadwai/receipt-splitter/graph/badge.svg?token=AWH1ZB213P)](https://codecov.io/github/akashtadwai/receipt-splitter)

**Live Demo:** [https://akashtadwai.github.io/receipt-splitter](https://akashtadwai.github.io/receipt-splitter)

🧾 Making split bills magical with Claude & Mistral AI ✨

## Architecture

```
┌──────────────────┐      ┌─────────────────────┐      ┌──────────────┐
│  GitHub Pages    │ ───▶ │  Cloudflare Worker  │ ───▶ │  Mistral AI  │
│  (React App)     │      │  (API Proxy)        │      │  API         │
└──────────────────┘      └─────────────────────┘      └──────────────┘
```

- **Frontend**: Static React app hosted on GitHub Pages (instant loading)
- **API Proxy**: Cloudflare Worker at the edge (no cold starts, API key secured)
- **OCR**: Mistral AI Pixtral-12B vision model

## What It Does 🤔

Ever been stuck at dinner trying to figure out who owes what? Receipt Splitter makes splitting bills with friends hassle-free! This app:

- 📸 **Snaps a pic** of your receipt and magically extracts all the items and prices
- 🔍 **Recognizes** what you ordered and how much it cost
- ✏️ **Lets you fix** anything the AI might have missed
- 👨‍👩‍👧‍👦 **Divides expenses fairly** by letting you assign specific items to specific people
- 💸 **Handles discounts** whether it's a percentage off or a fixed amount
- 🧮 **Adds taxes and tips** evenly across everyone
- 📊 **Shows exactly** what each person owes

## How to Run Locally 🏠

### Prerequisites

- Node.js (v18+)
- A Mistral AI API key - [Get one here](https://console.mistral.ai/)

### Frontend Setup 🖥️

```bash
# Clone the repository
git clone https://github.com/akashtadwai/receipt-splitter.git
cd receipt-splitter/receipt-splitter-frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```

The frontend will be running at [http://localhost:3000](http://localhost:3000).

### Worker Setup (for OCR) 🔧

```bash
# Navigate to the worker directory
cd receipt-splitter/worker

# Install dependencies
npm install

# Add your Mistral API key
npx wrangler secret put MISTRAL_API_KEY

# Start the worker dev server
npm run dev
```

The API will be available at [http://localhost:8787](http://localhost:8787).

## Deployment 🚀

### Prerequisites

1. **Cloudflare Account** (free) - [Sign up](https://cloudflare.com)
2. **GitHub Secrets** configured:
   - `CLOUDFLARE_API_TOKEN` - Create with "Edit Workers" template
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
   - `MISTRAL_API_KEY` - Your Mistral AI API key

### Automatic Deployment

Push to `main` branch triggers:
- Frontend → GitHub Pages
- Worker → Cloudflare Workers

## Testing 🧪

```bash
cd receipt-splitter-frontend
npm test -- --watchAll=false
```

## Technologies Used 💻

- **Frontend**: React with Tailwind CSS
- **API Proxy**: Cloudflare Workers
- **OCR**: Mistral AI Pixtral-12B
- **Hosting**: GitHub Pages (frontend) + Cloudflare (worker)

## License 📜

This project is open source under the MIT license.

## Note

Claude AI also generated this README.md. The entire project, including documentation, is co-created with AI!

<div style="text-align: center">⁂</div>

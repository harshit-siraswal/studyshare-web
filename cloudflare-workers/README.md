# Cloudflare Workers - StudySpace Edge Functions

## Quick Start

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. Create KV Namespace for Rate Limiting
```bash
cd cloudflare-workers
wrangler kv:namespace create "RATE_LIMIT_KV"
```
Copy the ID and paste it in `wrangler.toml`.

### 3. Deploy
```bash
wrangler deploy
```

Your worker will be available at: `https://studyspace-edge.<your-subdomain>.workers.dev`

## After Getting Custom Domain

1. Update `wrangler.toml`:
   - Uncomment the `[[routes]]` section
   - Replace `yourdomain.me` with your actual domain

2. In Cloudflare Dashboard:
   - Add your domain
   - Point DNS to your origins
   - Enable "Proxied" (orange cloud)

## Features

- **Rate Limiting**: 100 requests/minute per IP
- **Security Headers**: XSS, Clickjacking, MIME sniffing protection
- **Bot Protection**: Blocks low-score bot traffic (paid plans)
- **CORS**: Configured for cross-origin requests

## Free Tier Limits

- 100,000 requests/day
- 10ms CPU time per request
- 1GB KV storage

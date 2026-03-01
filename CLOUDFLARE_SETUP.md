# Cloudflare Setup for StudySpace Backend

## Overview

We'll use **Cloudflare Tunnel** to protect your Render backend without needing a custom domain. This gives you:
- ✅ DDoS protection
- ✅ Bot Fight Mode
- ✅ Rate limiting rules
- ✅ WAF rules
- ✅ Analytics

---

## Option A: Cloudflare with Custom Domain (Recommended)

If you have a domain (e.g., `api.studyspace.com`):

### Step 1: Sign Up for Cloudflare
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up (free)
3. Click **"Add a Site"**
4. Enter your domain

### Step 2: Update DNS
1. Cloudflare will scan your DNS
2. Change your domain's nameservers to Cloudflare's (instructions provided)
3. Add an API DNS record:
   - **Name:** `api` (or your subdomain)
   - **Target:** your backend origin (EC2 public IP / load balancer hostname)
   - **Proxy status:** Proxied (orange cloud ON)

### Step 3: Enable Security Features
1. Go to **Security** → **Bots**
2. Enable **Bot Fight Mode** ✅
3. Go to **Security** → **WAF**
4. Enable **Managed Rules** (free tier has some)

### Step 4: Add Rate Limiting
1. Go to **Security** → **WAF** → **Rate limiting rules**
2. Create rule:
   - **Name:** API Rate Limit
   - **If URI Path contains:** `/api/`
   - **Rate:** 100 requests per minute
   - **Action:** Block

---

## Option B: Without Custom Domain (Cloudflare Workers)

If you don't have a domain, use Cloudflare Workers as a proxy:

### Step 1: Sign Up
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up (free)
3. Go to **Workers & Pages**

### Step 2: Create Worker
1. Click **"Create Worker"**
2. Name it: `studyspace-api`
3. Replace the code with:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Forward to backend origin (set in Worker env var)
    const targetBase = (env.ORIGIN_API_BASE_URL || '').replace(/\/+$/, '');
    const targetUrl = targetBase + url.pathname + url.search;
    
    // Clone request with new URL
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Add security headers
    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    
    // Security headers
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    
    return newResponse;
  },
};
```

4. Click **"Save and Deploy"**

### Step 3: Get Worker URL
Your worker URL will be: `https://studyspace-api.<your-subdomain>.workers.dev`

### Step 4: Update Frontend
Change `VITE_API_URL` to your Worker URL:
```env
VITE_API_URL=https://studyspace-api.<your-subdomain>.workers.dev
```

### Step 5: Enable Security
1. Go to your Worker → **Settings** → **Triggers**
2. Add rate limiting via **Workers Routes** settings

---

## Quick Alternative: Render's Built-in Protection

Render (even free tier) already provides:
- ✅ Automatic HTTPS
- ✅ Basic DDoS mitigation
- ✅ Geographic load balancing

For a small app, this + your in-app rate limiting may be sufficient!

---

## Recommendation

| Your Situation | Best Option |
|----------------|-------------|
| Have a domain | Option A (DNS proxy) |
| No domain, want more protection | Option B (Workers) |
| Small user base, MVP stage | Keep current setup |

For now, your current setup is **good enough for MVP/beta**. Add Cloudflare when you scale up or see abuse.

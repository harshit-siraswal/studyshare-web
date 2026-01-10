# StudySpace Performance Deployment Guide

This guide walks you through deploying the performance optimizations, including Cloudflare Workers for edge security.

---

## Prerequisites Checklist

- [ ] GitHub Student Developer Pack (for free `.me` domain)
- [ ] Cloudflare account (free tier)
- [ ] Node.js installed
- [ ] Project deployed on Vercel (already done: `new-exex.vercel.app`)

---

## Phase 1: Get Your Free Domain (10 minutes)

### Step 1.1: Claim Free Domain from GitHub Student Pack
1. Go to [education.github.com/pack](https://education.github.com/pack)
2. Sign in with your GitHub account
3. Find **Namecheap** in the offers
4. Claim the free `.me` domain for 1 year
5. Choose a domain name like `mystudyspace.me` or `studyspace.me`

### Step 1.2: Note Down Your Domain
```
Your domain: _________________.me
```

---

## Phase 2: Set Up Cloudflare (15 minutes)

### Step 2.1: Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Click **Sign Up** (it's free)
3. Verify your email

### Step 2.2: Add Your Domain to Cloudflare
1. In Cloudflare Dashboard, click **"Add a Site"**
2. Enter your domain (e.g., `mystudyspace.me`)
3. Select **Free Plan** → Click Continue
4. Cloudflare will scan your DNS records

### Step 2.3: Update Nameservers at Namecheap
1. Cloudflare will show you 2 nameservers like:
   ```
   ada.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
2. Go to [Namecheap](https://namecheap.com) → Sign in
3. Go to **Domain List** → Click **Manage** on your domain
4. Find **NAMESERVERS** section
5. Change from "Namecheap BasicDNS" to **"Custom DNS"**
6. Enter the 2 Cloudflare nameservers
7. Click the green checkmark to save

### Step 2.4: Wait for Propagation
- Can take 1-24 hours (usually ~30 minutes)
- Cloudflare will email you when active

---

## Phase 3: Configure DNS Records (10 minutes)

Once Cloudflare shows your domain is active:

### Step 3.1: Add DNS Records
In Cloudflare Dashboard → **DNS** → **Records** → **Add Record**:

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | `@` | `new-exex.vercel.app` | ✅ Proxied (Orange) |
| CNAME | `www` | `new-exex.vercel.app` | ✅ Proxied (Orange) |
| CNAME | `api` | `new-jncb.onrender.com` | ✅ Proxied (Orange) |

### Step 3.2: Enable SSL/TLS
1. Go to **SSL/TLS** in sidebar
2. Set encryption mode to **Full (strict)**

---

## Phase 4: Deploy Cloudflare Worker (20 minutes)

### Step 4.1: Install Wrangler CLI
Open PowerShell/Terminal:
```powershell
npm install -g wrangler
```

### Step 4.2: Login to Cloudflare
```powershell
wrangler login
```
This opens a browser - authorize the connection.

### Step 4.3: Navigate to Worker Directory
```powershell
cd c:\Users\ASUS\Studyspace\cloudflare-workers
```

### Step 4.4: Create KV Namespace for Rate Limiting
```powershell
wrangler kv:namespace create "RATE_LIMIT_KV"
```

**Copy the output** - you'll get something like:
```
id = "abc123xyz..."
```

### Step 4.5: Update wrangler.toml
Open `c:\Users\ASUS\Studyspace\cloudflare-workers\wrangler.toml` and:

1. Replace `<your-kv-namespace-id>` with the ID from Step 4.4
2. Update the domain in routes section to your domain

Example:
```toml
name = "studyspace-edge"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123xyz..."  # <-- Your actual ID here

[[routes]]
pattern = "api.mystudyspace.me/*"  # <-- Your domain here
zone_name = "mystudyspace.me"      # <-- Your domain here
```

### Step 4.6: Deploy the Worker
```powershell
wrangler deploy
```

### Step 4.7: Verify Deployment
1. Go to Cloudflare Dashboard → **Workers & Pages**
2. You should see `studyspace-edge` listed
3. Click it to see analytics

---

## Phase 5: Connect Vercel to Custom Domain (10 minutes)

### Step 5.1: Add Domain to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`new-exex`)
3. Go to **Settings** → **Domains**
4. Add your domain: `mystudyspace.me`
5. Also add: `www.mystudyspace.me`

### Step 5.2: Verify Domain
Vercel may ask you to add a TXT record for verification:
1. Copy the TXT record value from Vercel
2. Go to Cloudflare → DNS → Add Record
3. Add TXT record with the verification value

---

## Phase 6: Update Environment Variables (5 minutes)

### Step 6.1: Update Frontend Environment
Create/update `.env.production` in your project root:
```env
VITE_API_URL=https://api.mystudyspace.me
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 6.2: Update Backend CORS
Your backend already supports `www.mystudyspace.me` from previous work.

### Step 6.3: Redeploy
```powershell
git add .
git commit -m "Update production URLs"
git push
```
Vercel will auto-deploy.

---

## Phase 7: Enable Cloudflare Security Features (5 minutes)

### Step 7.1: Bot Fight Mode
1. Cloudflare Dashboard → **Security** → **Bots**
2. Toggle ON: **Bot Fight Mode**

### Step 7.2: Enable HTTPS Always
1. Go to **SSL/TLS** → **Edge Certificates**
2. Toggle ON: **Always Use HTTPS**

### Step 7.3: Enable HSTS (Optional)
1. Same page, find **HTTP Strict Transport Security (HSTS)**
2. Click Enable

---

## Phase 8: Verification (10 minutes)

### Step 8.1: Test Your Site
1. Open `https://mystudyspace.me` in browser
2. Verify site loads correctly
3. Test login/signup flow

### Step 8.2: Test Rate Limiting
In PowerShell, run 110 requests rapidly:
```powershell
for ($i=1; $i -le 110; $i++) { 
    $response = Invoke-WebRequest -Uri "https://api.mystudyspace.me/health" -UseBasicParsing
    Write-Host "Request $i : $($response.StatusCode)"
}
```
After ~100 requests, you should see `429 Too Many Requests`.

### Step 8.3: Check Security Headers
```powershell
Invoke-WebRequest -Uri "https://mystudyspace.me" -UseBasicParsing | Select-Object -ExpandProperty Headers
```
Look for:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### Step 8.4: Run Lighthouse Audit
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Run audit for Performance, SEO, Best Practices

---

## Troubleshooting

### Domain Not Working
- Wait 24 hours for DNS propagation
- Check Cloudflare shows "Active" status
- Verify nameservers at Namecheap match Cloudflare's

### Worker Not Triggering
- Ensure route pattern matches your domain
- Check Worker analytics in Cloudflare dashboard
- Verify KV namespace ID is correct

### CORS Errors
- Update backend CORS to include your new domain
- Check browser console for specific error messages

### SSL/Certificate Errors
- Ensure SSL mode is "Full (strict)"
- Wait for Cloudflare to issue certificate (can take 15 minutes)

---

## Quick Reference

| Service | URL |
|---------|-----|
| Your Site | `https://mystudyspace.me` |
| API | `https://api.mystudyspace.me` |
| Cloudflare Dashboard | [dash.cloudflare.com](https://dash.cloudflare.com) |
| Vercel Dashboard | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Namecheap | [namecheap.com](https://namecheap.com) |

---

## Time Estimate

| Phase | Time |
|-------|------|
| Get Domain | 10 min |
| Set Up Cloudflare | 15 min |
| Configure DNS | 10 min |
| Deploy Worker | 20 min |
| Connect Vercel | 10 min |
| Update Env Vars | 5 min |
| Enable Security | 5 min |
| Verification | 10 min |
| **Total** | **~85 minutes** |

*Note: DNS propagation may take 1-24 hours before everything works.*

---

## Support

If you run into issues:
1. Check Cloudflare's [documentation](https://developers.cloudflare.com/workers/)
2. Vercel's [custom domain guide](https://vercel.com/docs/projects/domains)
3. Or ask me for help! 🚀

# Deploy StudySpace Backend to Render

## Step 1: Push to GitHub

First, commit and push all the new backend code:

```bash
cd c:\Users\ASUS\Studyspace
git add .
git commit -m "Add secure backend with auth, RBAC, rate limiting"
git push origin main
```

---

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easy repo access)

---

## Step 3: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `Studyspace`
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `studyspace-backend` |
| **Region** | Choose nearest (e.g., Singapore) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

---

## Step 4: Add Environment Variables

In Render dashboard → Your Service → **Environment**

Add these variables (click "Add Environment Variable" for each):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `studyspace-kiet` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@studyspace-kiet.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | *(paste the entire private key including -----BEGIN/END-----)* |
| `SUPABASE_URL` | `https://iayuwsvguwfqjgjsvjiy.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key)* |
| `RECAPTCHA_SECRET_KEY` | `6Ld7RUAsAAAAAH78xQGrBIodjtGBwLq1HfjYpJYo` |

> ⚠️ For `FIREBASE_PRIVATE_KEY`, paste the key exactly as-is with `\n` characters.

---

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (~2-3 minutes)
3. Once deployed, you'll get a URL like: `https://studyspace-backend.onrender.com`

---

## Step 6: Test the Deployment

Open in browser or curl:
```
https://studyspace-backend.onrender.com/health
```

Should return:
```json
{"status":"ok","uptime":123,"uptimeFormatted":"2m 3s"}
```

---

## Step 7: Update Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Your Project
2. Go to **Settings** → **Environment Variables**
3. Add:
   - `VITE_API_URL` = `https://studyspace-backend.onrender.com`
4. **Redeploy** the frontend for changes to take effect

---

## Step 8: Update CORS (if needed)

The backend already allows your Vercel domain. If you have a different domain, update `server/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://new-exex.vercel.app',
    'https://your-new-domain.vercel.app'  // Add here
  ],
  // ...
}));
```

---

## Troubleshooting

### Cold Starts
Free tier has ~30s cold start after 15 min idle. First request may be slow.

### Build Errors
Check Render logs: Dashboard → Your Service → **Logs**

### CORS Errors
Make sure your frontend domain is in the CORS origin list.

---

## Done! 🎉

Your secure backend is now live at:
```
https://studyspace-backend.onrender.com
```

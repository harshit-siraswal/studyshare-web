# StudySpace Backend

Secure backend proxy server for StudySpace that enforces authentication, authorization, and rate limiting.

## Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the environment variables in `.env`:
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` - Get from Firebase Console > Project Settings > Service Accounts
   - `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard > Project Settings > API (use the service_role key, NOT anon)
   - `RECAPTCHA_SECRET_KEY` - Get from Google reCAPTCHA Console

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run in development:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health
- `GET /health` - Health check with uptime

### Auth (requires Firebase token)
- `POST /api/auth/verify` - Verify token and get user info
- `GET /api/auth/me` - Get current user info

### Follow (requires COLLEGE_USER role)
- `POST /api/follow/request` - Send follow request (requires reCAPTCHA)
- `POST /api/follow/approve/:id` - Approve request
- `POST /api/follow/reject/:id` - Reject request
- `DELETE /api/follow/request/:id` - Cancel pending request
- `DELETE /api/follow/:targetEmail` - Unfollow user
- `GET /api/follow/pending` - Get pending requests

### Bookmarks (requires COLLEGE_USER role)
- `GET /api/bookmarks` - Get all bookmarks
- `POST /api/bookmarks` - Add bookmark
- `DELETE /api/bookmarks/:id` - Remove bookmark
- `DELETE /api/bookmarks/resource/:resourceId` - Remove by resource
- `GET /api/bookmarks/check/:resourceId` - Check if bookmarked

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables in Render dashboard

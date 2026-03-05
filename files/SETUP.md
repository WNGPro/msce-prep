# MSCE Prep — Complete Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase account (free at supabase.com)
- A PayChangu account (paychagnu.com) — optional for payments

---

## Step 1: Clone & Install

```bash
cd msce-prep
npm install
```

---

## Step 2: Set Up Supabase

1. Go to https://supabase.com → create a new project
2. Open the SQL Editor
3. Paste the entire contents of `supabase_schema.sql` and run it
4. Go to **Authentication → Providers** and enable:
   - Email (already on by default)
   - Google OAuth (add Client ID + Secret from Google Cloud Console)
   - Apple OAuth (optional)
5. Go to **Storage** → create a bucket called `paper-uploads` (set to Public)
6. Get your project URL and anon key from **Settings → API**

---

## Step 3: Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PAYCHANGU_SECRET_KEY=sec-test-xxxxxxxxxxxxxxxxxxxx
VITE_PAYCHANGU_PUBLIC_KEY=pub-test-xxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: Set Up Admin Access

In Supabase SQL Editor, run:

```sql
-- Replace with your actual email
INSERT INTO admin_allowed_emails (email)
VALUES ('wngplays@gmail.com');

-- After you sign up, find your user_id in auth.users then:
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'admin');
```

---

## Step 5: Deploy

### Local development:
```bash
npm run dev
```

### Deploy to Vercel (recommended — free):
```bash
npm install -g vercel
vercel
```
Set environment variables in the Vercel dashboard under your project settings.

### Deploy to Netlify:
```bash
npm run build
# Upload the `dist/` folder to Netlify drag-and-drop
```

---

## Step 6: Add Your First Paper

1. Sign in as admin
2. Go to `/admin/papers`
3. Click "Add Paper"
4. Paste a Google Drive share link as the File URL
   - Open paper in Google Drive → Share → "Anyone with link" → Copy link
   - Change `/view` to `/preview` in the URL (the app handles this automatically)

---

## Feature Map

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (email/Google/Apple) | ✅ Ready | Configure OAuth in Supabase |
| Onboarding (6 steps) | ✅ Ready | |
| Dashboard + MSCE grades | ✅ Ready | |
| Past Papers Library | ✅ Ready | Add papers via Admin panel |
| In-app PDF Viewer | ✅ Ready | Uses Google Drive preview |
| Flashcard Builder | ✅ Ready | Manual creation |
| Quiz/Exercise Builder | ✅ Ready | Manual creation |
| Timed Tests | ✅ Ready | Uses real DB questions |
| Progress + Grade Predictions | ✅ Ready | |
| Leaderboard (individual + school) | ✅ Ready | |
| Community Forum | ✅ Ready | |
| Help Bubble | ✅ Ready | Floating, draggable |
| Offline Support | ✅ Ready | IndexedDB + Service Worker |
| PWA Install | ✅ Ready | |
| Admin Panel | ✅ Ready | Papers, Users, Content, Schools |
| Premium / PayChangu | ✅ Ready | Configure PayChangu keys |
| AI Features | 🔒 Premium | Coming once content grows |

---

## PayChangu Setup

1. Sign up at https://paychangu.com
2. Get your test keys from the dashboard
3. Add to `.env` (shown above)
4. For live payments, replace test keys with live keys

---

## Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI:
   `https://your-project-id.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret → paste into Supabase Auth settings

---

## Contact
Built by Wongani Mbamba · wngplays@gmail.com

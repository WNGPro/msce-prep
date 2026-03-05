# MSCE Prep 🎓

**The Easiest Way to Get 6 Pts.**

A free, mobile-first web app for Malawian Form 4 students preparing for the MSCE examinations.

Live: [msce.lovable.app](https://msce.lovable.app) | Contact: wngplays@gmail.com

---

## Features

- 📄 **Past Papers Library** — Browse, filter, view and save papers offline
- 🃏 **Create Section** — Build your own flashcards and exercises
- ⏱️ **Timed Tests** — 30-minute MSCE-style exams with grade predictions (1–9)
- 📊 **Progress Tracking** — Best Six total, Division prediction, weak topic analysis
- 🏆 **Leaderboard** — Compete with students from your school and across Malawi
- 💬 **Community Forum** — Ask questions, share tips, get admin responses
- ⭐ **Premium** — AI-powered features (coming soon) via Airtel Money/PayChangu
- 📱 **PWA** — Install as an app, works offline
- 🌙 **Dark Mode** — Full dark mode + data saver mode

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/msce-prep
cd msce-prep
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase_schema.sql` (in this repo root)
3. Enable **Google OAuth** and **Apple OAuth** in Auth → Providers
4. Set your Site URL in Auth → URL Configuration

### 3. Environment Variables

```bash
cp .env.example .env
# Fill in your Supabase URL, anon key, and PayChangu keys
```

### 4. Run

```bash
npm run dev       # Development
npm run build     # Production build
npm run preview   # Preview production build
```

### 5. Make Yourself Admin

After signing up with your email:
1. Go to Supabase → Table Editor → `user_roles`
2. Insert a row: `{ user_id: "your-uuid", role: "admin" }`
3. Refresh the app — you'll see Admin Panel in the sidebar

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript |
| Build | Vite + PWA |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Offline | IndexedDB (idb) + Service Worker |
| Payments | PayChangu (Airtel Money) |
| Charts | Recharts |

---

## MSCE Grading System

| Score | Grade | Division |
|-------|-------|----------|
| 85-100% | 1 | |
| 75-84% | 2 | |
| 65-74% | 3 | Division 1 if total ≤6 |
| 55-64% | 4 | Division 2 if total ≤12 |
| 45-54% | 5 | Division 3 if total ≤24 |
| 35-44% | 6 | Division 4 if total ≤36 |
| 0-34% | 7-9 | Fail |

Best Six subjects form the total points score.

---

## Adding Content

1. Sign in as admin → navigate to `/admin`
2. Add past papers via **Admin → Papers**
3. Add MCQ questions via **Admin → Content**
4. Approve student-uploaded papers via the dashboard pending queue

---

## Deployment

Recommended: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

```bash
npm run build
# Deploy the /dist folder
```

Set environment variables in your hosting dashboard.

---

Built by Wongani Mbamba · Malawi 🇲🇼

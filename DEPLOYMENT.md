# Deployment Guide

The app is now multi-tenant: every user signs in with email/password or
Google, and their data lives in their own row in Supabase Postgres. RLS
policies enforce isolation — one user can never read another user's
tasks/tenders/savings.

This guide walks through the one-time setup. Plan ~20 minutes.

---

## 1. Create the Supabase project

1. Go to https://supabase.com and sign in (or sign up).
2. Click **New project**. Pick a region close to your users.
3. Set a strong database password (saved by Supabase; you won't need it for the app).
4. Wait for provisioning (~2 minutes).

Once ready, grab two values from **Project Settings → API**:

- **Project URL** → goes into `VITE_SUPABASE_URL`
- **`anon` public key** → goes into `VITE_SUPABASE_ANON_KEY`

> **Never** put the `service_role` key into the client. It bypasses RLS.

## 2. Apply the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Copy-paste the entire contents of [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
3. Click **Run**. You should see "Success. No rows returned."

This creates:

- `profiles`, `user_settings`, `tasks`, `tenders`, `savings`, `activity` tables
- Row-Level Security policies (`user_id = auth.uid()`) on every table
- A trigger that auto-creates a `profile` and `user_settings` row when a user signs up
- A trigger that trims the activity log to the last 200 entries per user

## 3. Configure Google OAuth (optional but recommended)

If you want the **Continue with Google** button to work:

1. Open https://console.cloud.google.com → create a new project (or use existing).
2. Navigate to **APIs & Services → OAuth consent screen** and configure (External, your app name, your email).
3. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Type: **Web application**
   - Authorized JavaScript origins: your app URL (e.g. `https://yourapp.vercel.app`) and `http://localhost:5173` for dev
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (find this in your Supabase project URL)
4. Copy the **Client ID** and **Client secret**.
5. In Supabase, go to **Authentication → Providers → Google**, toggle it on, paste both values, and **Save**.

If you skip this step, email/password sign-up still works; the Google button is just hidden behind a config error.

## 4. Configure email auth

In Supabase: **Authentication → Providers → Email** is on by default. By default, new sign-ups must confirm their email before they can sign in. To change this:

- **Authentication → Sign In / Up** → toggle **Enable email confirmations** off if you want instant sign-in (less secure but smoother for small teams).
- **Authentication → Email Templates** → customize the confirmation/reset email copy.

For password reset emails to work, your domain has to be in Supabase's site URL setting:

- **Authentication → URL Configuration → Site URL** = `https://yourapp.vercel.app`
- **Redirect URLs** → add both `http://localhost:5173/**` and `https://yourapp.vercel.app/**`

## 5. Local development

```bash
cp .env.example .env
# Edit .env and paste your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Visit http://localhost:5173. You'll see the sign-in screen. Create an
account; the dashboard appears after sign-in.

## 6. Deploy the static site

The build output is plain static files (`dist/`), so any host works.
Recommended: **Vercel** or **Netlify** (both free for low traffic, with
environment variable support and HTTPS out of the box).

### Vercel

1. Push the repo to GitHub.
2. Go to https://vercel.com → **New Project** → import the repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Environment variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy.

### Netlify

1. Push the repo to GitHub.
2. Netlify → **Add new site → Import an existing project**.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Environment variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy.

After the site goes live, **return to step 4** and update your Supabase
**Site URL** and **Redirect URLs** to the production URL, plus repeat
step 3 to add the production origin to Google's allowed origins.

## 7. Post-deployment checks

- [ ] Visit the live site, sign up with email — confirmation email arrives.
- [ ] Click the confirmation link → land on the app, see your empty workspace.
- [ ] Create a task. Reload the page. Task is still there.
- [ ] Sign out, sign in from a different browser — same task is there.
- [ ] Sign up with a second account from a private window — that account sees an empty workspace, not the first user's data.
- [ ] Try Google sign-in (if configured) → land on the app.

If any of these fail, check the browser console and the Supabase logs
(**Logs → Auth** and **Logs → Postgres**).

---

## What lives where

| Where | What |
|---|---|
| **Supabase Postgres** | Tasks, tenders, savings, activity, profile, settings, theme, active timer (per user) |
| **Browser localStorage** | Sidebar collapsed state (UI pref, per device) — that's it |
| **Old localStorage `procurementDashboard.data`** | Migrated into the user's account on first sign-in, then deleted from localStorage |

## Cost notes

Supabase free tier covers up to **50,000 monthly active users** and
**500 MB** of database storage. A typical procurement workspace is
~50–500 KB per user, so you can comfortably support hundreds of users
on the free plan. Egress is the more likely bottleneck if you ever add
heavy realtime sync — the current app loads each table once on sign-in
and writes incrementally, so egress is minimal.

## Things this setup does NOT do

- **No team/workspace sharing.** Each account is a single-user silo.
- **No admin panel.** Manage users via the Supabase dashboard.
- **No realtime sync between devices.** The active timer syncs on sign-in / page reload, not live.
- **No MFA.** Use Supabase's built-in MFA setting if you need it.
- **No rate-limiting beyond Supabase defaults.**

If any of those become important, ask and we'll layer them on.

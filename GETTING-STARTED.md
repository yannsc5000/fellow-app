# Fellow — Getting started (for first-timers)

A click-by-click guide to putting Fellow live. **No coding or terminal required.**
Set aside ~45 minutes. Take it one part at a time — you can stop and come back.

**What you'll end up with:** a live website (on Vercel) that searches real recovery
meetings (stored in Typesense) with a map (from MapTiler), refreshing itself daily.

**Accounts you need (all have free options):** GitHub, Typesense Cloud, Vercel, MapTiler.
Create those four logins first if you haven't.

A few words you'll see (plain English):
- **Repository ("repo")** = a folder of your project's files, stored on GitHub.
- **API key** = a long password that lets two services talk to each other.
- **Environment variable / secret** = a setting (often a key) you paste into a website's
  settings instead of putting it in the code. "Secret" = the private kind.

---

## Part 1 — Put the code on GitHub (using the GitHub Desktop app)
1. Double-click `fellow-app.zip` (in Downloads) to unzip it → you get a **fellow-app** folder.
2. Go to **desktop.github.com**, download **GitHub Desktop**, install and open it, sign in.
3. Menu **File → Add Local Repository** → choose the **fellow-app** folder.
4. It asks to "Create a Repository here?" → click **Create a Repository** → **Create Repository**.
5. Click the blue **Publish repository** button → name it `fellow` → **Publish**.
✅ Your code is now on GitHub.

## Part 2 — Create the search backend (Typesense Cloud)
1. Go to **cloud.typesense.org**, sign in, click **New Cluster** (smallest option is fine;
   pick a region near you). Wait a few minutes for it to say "Running".
2. On the cluster page, find and copy these (keep them in a note for a minute):
   - **Host** (looks like `abc123.a1.typesense.net`)
   - **Admin API key** (the private one)
   - **Search-only API key** (create/copy the search-only one — safe for the website)
   - Port is **443**, Protocol is **https**.

## Part 3 — Load the meeting data (from GitHub, no terminal)
1. In your browser, open your new repo on **github.com** (GitHub Desktop → **View on GitHub**).
2. Click **Settings** (top) → left menu **Secrets and variables → Actions** →
   **New repository secret**. Add these five, one at a time (Name, then Secret value):
   - `TYPESENSE_HOST` → your host
   - `TYPESENSE_PORT` → `443`
   - `TYPESENSE_PROTOCOL` → `https`
   - `TYPESENSE_ADMIN_API_KEY` → your **admin** key
   - `TYPESENSE_COLLECTION` → `meetings`
3. Click the **Actions** tab (top). If it asks to enable workflows, click to enable.
4. Choose **"Ingest & index meetings"** on the left → **Run workflow** button → **Run workflow**.
5. Wait ~1–3 minutes for the green ✔. That just pulled the national meeting data into Typesense.
   (From now on it re-runs automatically twice a day.)

## Part 4 — Get a map key (MapTiler)
1. Go to **maptiler.com**, sign in → **Account → API keys** → copy your **default key**.

## Part 5 — Put the website online (Vercel)
1. Go to **vercel.com** → **Add New… → Project** → **Import** your `fellow` repo
   (connect GitHub if asked). It auto-detects Next.js — don't change build settings.
2. Expand **Environment Variables** and add these (Name → Value):
   - `NEXT_PUBLIC_TYPESENSE_HOST` → your host
   - `NEXT_PUBLIC_TYPESENSE_PORT` → `443`
   - `NEXT_PUBLIC_TYPESENSE_PROTOCOL` → `https`
   - `NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY` → your **search-only** key
   - `NEXT_PUBLIC_TYPESENSE_COLLECTION` → `meetings`
   - `NEXT_PUBLIC_MAPTILER_KEY` → your MapTiler key
3. Click **Deploy**. After a minute you'll get a live URL (like `fellow.vercel.app`).

## Part 6 — Check it works
Open your Vercel URL and:
- Type a city in search — meetings should appear.
- Tap **Map** — you should see the MapTiler map with pins.
- Tap a meeting — details, transit/parking, directions.
If meetings show up, you're live. 🎉

---

## If something looks off
- **No meetings appear:** re-check Part 3 (did the Action finish green?) and that the
  Vercel `NEXT_PUBLIC_TYPESENSE_*` values exactly match your cluster.
- **Map is blank:** the MapTiler key is missing/typo'd in Vercel (Part 4/5).
- **Action failed (red X):** open it and read the last red line — usually a wrong host or key
  in the GitHub secrets (Part 3).
- Two keys, don't mix them up: the **admin** key goes only in **GitHub secrets**; the
  **search-only** key goes in **Vercel**. Never put the admin key in Vercel.

## Custom domain (optional, later)
In Vercel → your project → **Settings → Domains**, add a domain you bought
(e.g. from Namecheap) and follow the on-screen DNS steps.

You never have to touch the code to keep this running — the data refreshes itself,
and Vercel re-deploys automatically whenever the repo changes.

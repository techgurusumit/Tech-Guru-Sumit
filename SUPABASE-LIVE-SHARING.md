# TGS Live Fixtures & Scorecard Sharing

The app now supports two public, live-updating share links for each tournament:

- **Fixtures link:** shows only the live fixture/bracket area.
- **Scorecard link:** shows only the live standings/scorecard area.

Both links work as normal browser links and as OBS Browser Source URLs.

## 1. Create the Supabase project

Create a Supabase project and open **SQL Editor**.

Run the complete SQL from:

`supabase/live-share.sql`

The SQL creates the protected share storage and three RPC functions used by the app. The browser does not directly read the share table.

## 2. Add environment variables

Copy `.env.example` to `.env` for local development, or add the same variables to the hosting provider's environment settings:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxx
```

Use the project's **publishable key**, not a secret/service-role key. The publishable key is intended for browser applications; the share data is protected by the database functions.

## 3. Deploy / rebuild

After adding the variables, rebuild and redeploy the Vite app.

## 4. Create a live link

1. Open **Matches**.
2. Select the tournament.
3. In the fixture toolbar use **Share Fixtures** or **Share Scorecard**.
4. Copy the generated link.

The share link does not open the dashboard, sidebar, login page, or tournament editor. It opens the dedicated public view.

## 5. OBS

In OBS:

1. Add **Browser Source**.
2. Turn off **Local File**.
3. Paste the Fixtures or Scorecard share URL.
4. Set the Browser Source width/height to match your overlay, for example 1920×1080.

Scores saved in TGS Tournament Manager are published to the share snapshot. Connected viewers receive the refresh immediately through Supabase Broadcast when public channels are enabled, with a 3-second polling fallback.

## Important

The public URL contains a random share token. Treat the URL as the access key for that public view. Do not publish the link if you want the tournament view kept private.

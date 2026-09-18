# Tech Guru Sumit Website

Gaming website for Tech Guru Sumit with an integrated Tournament Manager at `/tournaments`.

## Website
- Gaming-focused landing page
- YouTube channel CTA
- Games showcase
- Community section
- Tournament Manager menu in the main navigation

## Tournament Manager
The manager is integrated into the same website and is designed around the original TGS Tournament Manager logic:
- Round Robin
- Single Elimination
- Double Elimination
- 3 Game Guarantee
- Swiss System
- League / Season Format
- Tournament and player records
- Fixture generation
- Match result tracking
- Reports
- Password protection for sensitive tournament actions
- Responsive dashboard

## Live sharing
The original TGS manager uses Supabase for public live fixture and scorecard links. Copy the SQL in `supabase/live-share.sql` to your Supabase SQL editor and set the Vite Supabase environment variables before enabling live sharing.

> The current integrated website stores its tournament working data locally in the browser. Supabase live sharing is scaffolded from the original manager's protected RPC design and should be wired into the final deployment environment with the project's publishable key.

# Razed by Ahmad — razedbyahmad.com

Perfume shop for Razed by Ahmad. There is no cart: every **Buy now** opens WhatsApp with the order already written. Deliveries are free on one day a week, and on another day each order gets a spin of a gift wheel.

Built with Next.js 15 (App Router), Tailwind CSS v4 and Supabase (Postgres, Storage, Auth). It deploys to Vercel.

---

## Run it locally

Requires Node 20 or newer.

```bash
npm install
cp .env.example .env.local      # then fill in the values (see comments inside)
npm run dev                     # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run icons` | Regenerate the PWA icons + favicon into `public/` |
| `npm run create-admin` | Create or reset the admin login (needs `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env.local`) |
| `npm run smoke` | Playwright end-to-end check of the six core behaviours against a running server (`SMOKE_BASE_URL`, default `http://localhost:3000`) |

## Database

The schema lives in `supabase/migrations/` and the starter data in `supabase/seed.sql`.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push                               # applies migrations
psql "$DATABASE_URL" -f supabase/seed.sql          # or paste seed.sql into the SQL editor
npm run db:types                                   # regenerate src/lib/database.types.ts
```

- **`20260930000001_schema.sql`**: tables, row-level security, and the `admin_users` allow-list. Signing in isn't enough to edit anything; the account must also be listed in `admin_users`.
- **`20260930000002_order_functions.sql`**: `create_order_intent`, `spin_order` and `get_order_intent`. These hold all the rules: the Karachi weekday from the database clock, free delivery, spin eligibility, the weighted prize draw, and one spin per order. They are `SECURITY DEFINER`, so the public key can call them but can never write to `order_intents` directly.
- **`20260930000003_storage.sql`**: the `product-images` bucket. Anyone can read it; only admins can upload.

The running website only needs the **anon** key. The service role key is used only by `scripts/create-admin.ts` on your own machine.

## Deploy (Vercel)

1. Push this repo to GitHub, then **Vercel → Add New → Project → Import** it.
2. Add these environment variables for Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://razedbyahmad.com`
   - Do **not** add the service role key. The site doesn't need it.
3. Deploy. Or, with the CLI: `vercel link && vercel env add … && vercel --prod`.

### Point the domain

In Vercel, go to **Project → Settings → Domains** and add `razedbyahmad.com` and `www.razedbyahmad.com`. Vercel shows the records to create at your domain registrar. They are usually:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Use the values Vercel actually shows if they differ. The SSL certificate is issued automatically once DNS has propagated, which takes minutes to a few hours.

Then, in Supabase, go to **Authentication → URL Configuration** and set the Site URL to `https://razedbyahmad.com`.

## Install as an app (PWA), and a real `.apk` later

The site is a Progressive Web App (`src/app/manifest.ts`, `public/sw.js`, `src/components/InstallPrompt.tsx`):

- On Android Chrome, customers see "Install Razed". It installs with an icon and no browser bar.
- On iPhone, they're told to use **Share → Add to Home Screen**.

For a Play Store `.apk` / `.aab` later, wrap the same site as a Trusted Web Activity (TWA) with Bubblewrap:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://razedbyahmad.com/manifest.webmanifest
bubblewrap build                 # produces app-release-signed.apk / .aab
```

Bubblewrap prints a `assetlinks.json`. Put it at `public/.well-known/assetlinks.json` and redeploy, so Android trusts the app and hides the URL bar. Publishing needs a Google Play developer account (a one-time US$25 fee) and passing Google's review. The app updates itself whenever the website changes.

## Where things live

| Concern | File |
|---|---|
| WhatsApp message builder (pure functions) | `src/lib/whatsapp.ts` |
| Karachi-time schedule helpers | `src/lib/schedule.ts` |
| Buy-now + spin Server Actions | `src/app/actions/order.ts` |
| Authoritative order / spin rules | `supabase/migrations/20260930000002_order_functions.sql` |
| Wheel geometry | `src/components/Wheel.tsx` |
| Olfactory ladder | `src/components/NoteLadder.tsx` |
| Bottle illustrations | `src/components/SvgSprite.tsx`, `BottleArt.tsx` |
| Delivery / returns / ingredients copy | `src/content/policies.ts` |
| Admin actions (all check `requireAdmin()`) | `src/app/admin/actions.ts` |
| Approved visual design | `design-reference/` |

---

## How to add a product (for Ahmad)

You can do all of this from your phone.

1. Go to **razedbyahmad.com/admin** and sign in.
2. Tap **Products**, then **+ Add a product**.
3. Type the **name**. The web address fills itself in.
4. Write a **short description** (one or two lines). The long description is optional.
5. Choose the **family** (Oud, Amber, Floral, Musk or Smoke). If you like, add a **badge** such as "New".
6. Under **Sizes & prices**, fill in the price and how many bottles you have for each size. Pick which size is shown first with **Default**. Tap **+ Add a size** for another size, or ✕ to remove one.
7. Under **The notes**, type each note and press Enter, for top, heart and base.
8. Under **Photos**, tap **+ Add photos**. The first photo is the main one; use ← → to change the order. If you have no photo yet, the drawn bottle is shown instead.
9. Tap **Create product**. It is on the website straight away.

**To change a price:** Products → tap the name → change the price → **Save changes**.
**To hide a product:** untick **Live** in the product list. It comes back when you tick it again.
**Change the WhatsApp number or the free-delivery / spin days:** **Settings**. Use **Test this number** to check the number before saving.
**Change the gift wheel:** **Prizes**. A higher weight means the prize comes up more often.
**See who tapped Buy now:** **Orders**. Match the RZ- code with the WhatsApp chat. **Export CSV** downloads the list.

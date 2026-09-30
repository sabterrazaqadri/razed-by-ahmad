# HANDOVER — razedbyahmad.com

_Built 30 Sep 2026. Code: `razedbyahmad/` (git, one commit on `main`). Not deployed yet (see §3)._

## 1. What is done

**Features**
- Storefront ported from `design-reference/` (the approved prototype): home, `/collection`, `/product/[slug]`, `/spin/[code]`, `/delivery`, and branded 404/error/loading pages. Checked at 390 px and 1440 px with no horizontal scroll.
- `<NoteLadder>` in three sizes (hero, card `<MiniLadder>`, product page with times), plus `<BottleArt a|b|c>` as the automatic fallback when a product has no photo.
- WhatsApp Buy Now with no cart: a server action creates an `RZ-XXXX` order intent and opens `wa.me` with the pre-filled message. Lines that don't apply are omitted.
- Free delivery on `free_delivery_day`, in Karachi time on the server: live announcement bar, highlighted day in the 7-day strip, badge on the product page, and a line in the WhatsApp message.
- Gift spin on `spinner_day`: the wheel is built from `spin_prizes` with flipped lower labels; the server makes a weighted pick; the animation is 5 turns over 4.5 s with a reduced-motion fallback; one spin per order; a refresh returns to `/spin/[code]`.
- PWA: manifest, generated gold-R icons (192, 512, maskable 512, apple-touch, favicon.ico), a network-first service worker (prices are never served stale while online), an Android install sheet and iOS Share instructions. Dismissal is remembered for 14 days.
- Admin at `/admin`, usable on a phone:
  - Login, and middleware that protects every admin route (`noindex`).
  - Dashboard with a status line saying whether today's rules are live.
  - Products: list with search, live toggle and sort order.
  - Full product form: tags, variants, multi-image upload/reorder/delete, Zod errors, toasts, revalidation. Products can be hidden or permanently deleted.
  - Settings, including "Test this number".
  - Prizes, with a live wheel preview and per-prize chance %.
  - Orders, with a date filter and CSV export.
- SEO: per-page metadata, canonical URLs, OG images (site and per product), `Organization` and `Product` JSON-LD, `sitemap.xml`, `robots.txt`.

**Setup**
- ✅ Created Supabase project **`razedbyahmad`** (ref `kqziysvumhtdugcdamju`, Singapore) through the Supabase MCP connection. It's in your existing org.
- ✅ Applied the migrations through MCP. The CLI isn't linked, so `supabase db push` was not used. The same SQL is in `supabase/migrations/`.
- ✅ Seeded 6 products × 3 sizes, 8 prizes, and settings with WhatsApp **923323426801**.
- ✅ Created the `product-images` bucket (public read, admin write) in SQL.
- ✅ Generated TypeScript types from the live schema.
- ✅ Generated the icons (`npm run icons`) and committed them.
- ✅ `npm run build` passes: 0 TypeScript errors, 0 ESLint errors.
- ✅ Checked the service role key: it appears only in `scripts/create-admin.ts`, never in `src/` or `.next/static`.
- ✅ Git: `.env.local` is ignored and `git ls-files` shows no secrets.
- ❌ Real admin user: **not created.** You asked me to leave the admin email blank. See §3.
- ⏭ GitHub: skipped. The `gh` token on this machine is invalid.
- ⏭ Vercel: skipped. The `vercel` CLI isn't installed.

## 2. Smoke test results

`scripts/smoke.ts` ran against a production build (`next start`) using a **temporary** admin account. I created it in SQL, ran the tests, then deleted it along with the 3 test orders. The settings and the Oud Noir price were restored afterwards (Mon / Sat / Rs 11,500).

| Test | Result | Note |
|---|---|---|
| `/admin` redirects to `/admin/login` when signed out | PASS | |
| Admin login works with the created credentials | PASS | dashboard loaded |
| Buy Now opens `wa.me` with code, product, size and price | PASS | `RZ-FTMH`; offer lines correctly omitted |
| Changing a variant price updates the public product page | PASS | changed in the admin form → page showed Rs 11,600 → restored |
| Free-delivery day on: bar and badge show; off: both gone | PASS | the WhatsApp message also gained "Free Monday delivery: applied" |
| Spin day: wheel opens, prize returned, second spin gives the same prize | PASS | a reload landed on `/spin/RZ-YJWV` with the same prize; the RPC returned `repeat: true` |

**6/6 passed.** Rerun it with `SMOKE_BASE_URL=… npm run smoke` once a real admin exists.

## 3. What is left for Sabter

| # | What | Where | Time |
|---|---|---|---|
| 1 | **Create the admin login.** Put `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API), `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`, then run `npm run create-admin`. It creates the user, adds it to `admin_users` and checks the sign-in works. Or send me the email and password and I'll do it through MCP. | terminal | 2 min |
| 2 | **Turn off public sign-ups** in Supabase → Authentication → Sign In / Providers → Email → "Allow new users to sign up". The `admin_users` allow-list already blocks strangers from editing; this is an extra layer. | Supabase dashboard | 1 min |
| 3 | **GitHub:** `gh auth login`, then `gh repo create razedbyahmad --private --source . --push`. | terminal | 3 min |
| 4 | **Vercel:** `npm i -g vercel`, `vercel login`, `vercel link`. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL=https://razedbyahmad.com` for production, then `vercel --prod`. Don't add the service role key. | terminal | 10 min |
| 5 | **DNS:** add the A and CNAME records Vercel shows at your registrar (README → "Point the domain"). Set Supabase → Auth → URL Configuration → Site URL to the domain. | registrar + Supabase | 10 min + propagation |
| 6 | **Plan and backups:** Supabase's free plan pauses inactive projects and has no daily backups. Move to Pro before launch, or at least export a backup weekly. | Supabase billing | 5 min |
| 7 | Optional: analytics (Vercel Analytics is one click). | Vercel | 2 min |
| 8 | Consider moving the project **out of OneDrive**. Syncing `node_modules` and `.next` is slow and can lock files during builds. | file system | 2 min |

## 4. What is left for the client (Ahmad)

- **WhatsApp number:** 923323426801 is live. Confirm it's the business number with Admin → Settings → **Test this number**.
- **Product photos:** Admin → Products → each product → Photos. Square, 1200 × 1200 or larger, on black or transparent. Until then, the drawn bottles show.
- **Final prices and stock:** Admin → Products. Only the 50 ml prices came from the prototype. The **30 ml and 100 ml prices are my extrapolation**, and the stock numbers are placeholders.
- **Product copy:** the long descriptions and full note lists for all six, especially Musk Blanc and Zaffran, are my drafts. Edit them in Admin → Products.
- **Delivery / returns (RTO) policy and ingredients text:** these are placeholders in `src/content/policies.ts`. That file is code, so a developer edits it; they appear in the product-page accordions and on `/delivery`.
- **Hero stats** (28% · 9 hrs · 50 bottles) come from the prototype and are fixed in `src/app/(store)/page.tsx`. Confirm they're true.
- **Prizes and weights:** Admin → Prizes. The 8 seeded prizes follow the prototype wheel. Keep the costly ones on low weight.

## 5. Where the risky logic lives

1. **WhatsApp message builder:** `src/lib/whatsapp.ts` (pure functions), called from `src/app/actions/order.ts`.
2. **Karachi schedule:** `src/lib/schedule.ts` (display), plus `public.karachi_dow()` in `supabase/migrations/20260930000002_order_functions.sql`, which the order and spin rules actually use.
3. **Spin logic:** `spin_order()` in the same migration (weighted pick, row lock, one spin per order), plus `src/components/spin/SpinStage.tsx` and `SpinProvider.tsx` (animation, focus trap, localStorage resume).

## 6. Known limitations

- **No service role key in the app, by design and by necessity.** The MCP connection can't read the service role key, so the order and spin writes run as `SECURITY DEFINER` Postgres functions that the anon key may call, instead of service-role server actions. This is arguably safer: the database clock decides the weekday and nothing can write `order_intents` except these functions. The Supabase security advisor shows 8 "SECURITY DEFINER executable" warnings; they are expected.
- **No rate limit on Buy Now.** Anyone could spam `create_order_intent` and fill the orders log with junk rows. There's no money or data at risk. Fixing it properly means a per-IP limit, e.g. Upstash or Vercel KV in the server action, with the RPC revoked from anon and called with a server secret.
- **Order codes are 4 characters** (about 1M combinations). A guessed `/spin/RZ-XXXX` shows only the product, price and prize, never personal data. Customer details live only in WhatsApp.
- **Fonts use `next/font/local`, not `next/font/google`.** The Google loader in Next 15.5.26 crashes on the current Google Fonts CSS. I used the prototype's own woff2 files: same typefaces, still self-hosted.
- **Schedule display can be up to an hour stale** right after midnight (hourly ISR). The order rules themselves are exact, because they're checked in the database per order.
- **Photos uploaded but never saved** stay in Storage as orphans. Photos removed and then saved are deleted properly.
- **Policy copy isn't editable in the admin.** It would need a `site_settings` column and a textarea.
- **Prototype deviations:** there's no cart, so "Bag (0)" became "Shop". The footer email box links to WhatsApp, since no mailing-list tool was in scope.
- **Lighthouse was not measured.** It's built for it (server components, `next/image` with `sizes`, self-hosted fonts, 103–118 kB first-load JS on public pages), but run Lighthouse on the Vercel URL to confirm 90+.
- **OG images** use the default font (satori can't load woff2).

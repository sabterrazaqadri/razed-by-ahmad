// End-to-end smoke test for the six behaviours that matter most.
//
//   npm run build && npm start          (in one terminal, default port 3000)
//   SMOKE_BASE_URL=http://localhost:3000 npm run smoke
//
// Needs an admin login: SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD, falling back
// to ADMIN_EMAIL / ADMIN_PASSWORD from .env.local. The test temporarily flips
// the free-delivery and spin days through the real admin Settings screen and
// restores the original values at the end, even if a test fails.

import { createClient } from "@supabase/supabase-js";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { Database } from "../src/lib/database.types";
import { karachiWeekday } from "../src/lib/schedule";

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "";
const PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
const SLUG = "oud-noir";

type Row = { test: string; pass: boolean; note: string };
const results: Row[] = [];

async function record(test: string, fn: () => Promise<string>) {
  try {
    const note = await fn();
    results.push({ test, pass: true, note });
  } catch (e) {
    results.push({ test, pass: false, note: e instanceof Error ? e.message.split("\n")[0] : String(e) });
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function eventually<T>(fn: () => Promise<T | null | false>, tries = 8, waitMs = 1200): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, waitMs));
  }
  throw new Error("condition not met after retries");
}

async function setDays(admin: Page, freeDay: number, spinDay: number, spinEnabled = true) {
  await admin.goto(`${BASE}/admin/settings`);
  await admin.selectOption('select[name="free_delivery_day"]', String(freeDay));
  await admin.selectOption('select[name="spinner_day"]', String(spinDay));
  const box = admin.locator('input[name="spinner_enabled"]');
  if ((await box.isChecked()) !== spinEnabled) await box.click();
  await admin.getByRole("button", { name: /save settings/i }).click();
  await admin.getByTestId("toast").filter({ hasText: /settings saved/i }).waitFor({ timeout: 15000 });
}

async function main() {
  assert(EMAIL && PASSWORD, "Set SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD (or ADMIN_EMAIL / ADMIN_PASSWORD)");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const db = createClient<Database>(url, anon, { auth: { persistSession: false } });
  const signIn = await db.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  assert(!signIn.error, `admin sign-in via API failed: ${signIn.error?.message}`);

  const { data: original } = await db.from("site_settings").select("*").eq("id", 1).single();
  assert(original, "could not read site_settings");
  const { data: product } = await db.from("products").select("id, name, product_variants(*)").eq("slug", SLUG).single();
  assert(product, `product ${SLUG} missing`);
  const v50 = product.product_variants.find((v) => v.size_ml === 50);
  assert(v50, "50 ml variant missing");
  const originalPrice = Number(v50.price);

  const today = karachiWeekday();
  const other = (today + 3) % 7;
  const other2 = (today + 4) % 7;

  let browser: Browser | null = null;
  let adminCtx: BrowserContext | null = null;
  let admin: Page | null = null;
  let settingsTouched = false;
  let priceTouched = false;

  try {
    browser = await chromium.launch();
    const newPublic = async () => {
      const ctx = await browser!.newContext({ viewport: { width: 1280, height: 900 } });
      const waUrls: string[] = [];
      await ctx.route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, (route) => {
        waUrls.push(route.request().url());
        return route.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>ok" });
      });
      return { ctx, waUrls };
    };

    // 2 ── /admin redirects when signed out
    await record("/admin redirects to /admin/login when signed out", async () => {
      const { ctx } = await newPublic();
      const p = await ctx.newPage();
      await p.goto(`${BASE}/admin`);
      assert(new URL(p.url()).pathname === "/admin/login", `landed on ${p.url()}`);
      await ctx.close();
      return "302 → /admin/login";
    });

    // 3 ── admin login
    adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    admin = await adminCtx.newPage();
    await record("Admin login works with the created credentials", async () => {
      await admin!.goto(`${BASE}/admin/login`);
      await admin!.fill('input[name="email"]', EMAIL);
      await admin!.fill('input[name="password"]', PASSWORD);
      await admin!.getByRole("button", { name: /sign in/i }).click();
      await admin!.waitForURL(`${BASE}/admin`, { timeout: 15000 });
      await admin!.getByTestId("rules-status").waitFor();
      return "dashboard loaded";
    });
    assert(new URL(admin.url()).pathname === "/admin", "cannot continue without an admin session");

    // Start from a known state: neither offer is today.
    settingsTouched = true;
    await setDays(admin, other, other2, true);

    // 1 ── Buy Now → wa.me with code, name, size, price
    await record("Buy Now opens wa.me with code, product, size and price", async () => {
      const { ctx, waUrls } = await newPublic();
      const p = await ctx.newPage();
      await p.goto(`${BASE}/product/${SLUG}`);
      await p.getByTestId("size-50").click();
      const popup = ctx.waitForEvent("page");
      await p.getByTestId("pdp-buy").click();
      await popup;
      const wa = await eventually(async () => waUrls[0] ?? null);
      const text = new URL(wa).searchParams.get("text") ?? "";
      const code = /Order: (RZ-[A-Z0-9]{4,8})/.exec(text)?.[1];
      assert(code, "no order code in message");
      assert(text.includes(`Item: ${product.name} — 50 ml`), "product/size line missing");
      assert(text.includes(`Price: Rs ${originalPrice.toLocaleString("en-US")}`), "price line missing");
      assert(!text.includes("Free Monday") && !/gift spin/i.test(text), "offer lines should be omitted");
      await ctx.close();
      return `${code}, ${new URL(wa).hostname}`;
    });

    // 4 ── price change reaches the public page after revalidation
    await record("Changing a variant price updates the public product page", async () => {
      const newPrice = originalPrice + 100;
      priceTouched = true;
      await admin!.goto(`${BASE}/admin/products/${product.id}`);
      await admin!.fill('input[name="variants.1.price"]', String(newPrice));
      await admin!.getByTestId("save-product").click();
      await admin!.getByTestId("toast").filter({ hasText: /saved/i }).waitFor({ timeout: 15000 });
      const { ctx } = await newPublic();
      const p = await ctx.newPage();
      const shown = await eventually(async () => {
        await p.goto(`${BASE}/product/${SLUG}`);
        await p.getByTestId("size-50").click();
        const t = await p.getByTestId("pdp-price").innerText();
        return t.includes(newPrice.toLocaleString("en-US")) ? t : null;
      });
      await ctx.close();
      return `now shows ${shown}`;
    });
    if (priceTouched) {
      await admin.goto(`${BASE}/admin/products/${product.id}`);
      await admin.fill('input[name="variants.1.price"]', String(originalPrice));
      await admin.getByTestId("save-product").click();
      await admin.getByTestId("toast").filter({ hasText: /saved/i }).waitFor({ timeout: 15000 });
      priceTouched = false;
    }

    // 5 ── free delivery day on / off
    await record("Free-delivery day: announcement + badge on today, gone otherwise", async () => {
      await setDays(admin!, today, other2, true);
      const { ctx, waUrls } = await newPublic();
      const p = await ctx.newPage();
      await eventually(async () => {
        await p.goto(`${BASE}/product/${SLUG}`);
        return (await p.getByTestId("announce").getAttribute("data-live")) === "true";
      });
      assert(await p.getByTestId("free-delivery-badge").isVisible(), "badge missing when active");
      // and the WhatsApp message gains its line
      const popup = ctx.waitForEvent("page");
      await p.getByTestId("pdp-buy").click();
      await popup;
      const wa = await eventually(async () => waUrls[0] ?? null);
      assert(/delivery: applied/.test(new URL(wa).searchParams.get("text") ?? ""), "free delivery line missing from message");

      await setDays(admin!, other, other2, true);
      await eventually(async () => {
        await p.goto(`${BASE}/product/${SLUG}`);
        return (await p.getByTestId("announce").getAttribute("data-live")) === "false";
      });
      assert((await p.getByTestId("free-delivery-badge").count()) === 0, "badge still shown when inactive");
      await ctx.close();
      return "on → bar+badge+message line; off → both gone";
    });

    // 6 ── spinner day: wheel opens, spin returns a prize, repeat returns the same
    await record("Spin day: wheel opens, prize returned, second spin = same prize", async () => {
      await setDays(admin!, other, today, true);
      const { ctx } = await newPublic();
      const p = await ctx.newPage();
      await eventually(async () => {
        await p.goto(`${BASE}/product/${SLUG}`);
        return (await p.getByText(/gift spin with every order/i).count()) > 0;
      });
      await p.getByTestId("pdp-buy").click();
      const modal = p.getByTestId("spin-modal");
      await modal.waitFor({ timeout: 15000 });
      await modal.getByTestId("spin-button").click();
      const prize = (await modal.locator(".prize b").innerText({ timeout: 15000 })).trim();
      const code = (await modal.locator(".code").innerText()).trim();
      assert(/^RZ-/.test(code), "no code shown");

      // A reload must land on /spin/[code] with the same result, not a new spin.
      await p.reload();
      await p.waitForURL(new RegExp(`/spin/${code}$`), { timeout: 15000 });
      const again = (await p.locator(".prize b").innerText({ timeout: 15000 })).trim();
      assert(again === prize, `reload showed "${again}" instead of "${prize}"`);

      // And the server refuses to re-roll the same code.
      const { data, error } = await createClient<Database>(url, anon).rpc("spin_order", { p_code: code });
      assert(!error, `rpc error ${error?.message}`);
      const repeat = data as { label: string; repeat: boolean };
      assert(repeat.repeat && repeat.label === prize, `server re-rolled: ${JSON.stringify(repeat)}`);
      await ctx.close();
      return `${code} → "${prize}" (repeat: same)`;
    });
  } finally {
    if (admin && priceTouched) {
      await db.from("product_variants").update({ price: originalPrice }).eq("id", v50.id);
    }
    if (admin && settingsTouched) {
      try {
        await setDays(admin, original.free_delivery_day, original.spinner_day, original.spinner_enabled);
      } catch {
        await db
          .from("site_settings")
          .update({
            free_delivery_day: original.free_delivery_day,
            spinner_day: original.spinner_day,
            spinner_enabled: original.spinner_enabled,
          })
          .eq("id", 1);
      }
    }
    await browser?.close();
    await db.auth.signOut();
  }

  const w = Math.max(...results.map((r) => r.test.length));
  console.log(`\n${"Test".padEnd(w)} | Result | Note`);
  console.log(`${"-".repeat(w)}-|--------|${"-".repeat(40)}`);
  for (const r of results) console.log(`${r.test.padEnd(w)} | ${r.pass ? "PASS  " : "FAIL  "} | ${r.note}`);
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

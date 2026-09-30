const { chromium } = require('playwright');
const path = require('path');

const PAGES = [
  ['home', 'home.html'],
  ['shop', 'shop.html'],
  ['product', 'product.html'],
  ['spinner', 'spinner.html'],
  ['spinner-win', 'spinner-win.html'],
];

const VIEWS = [
  ['desktop', 1440, 900, 2, false],
  ['mobile', 390, 844, 3, true],
];

const hideSticky = () =>
  document.querySelectorAll('.install,.mobar').forEach(n => (n.style.display = 'none'));

(async () => {
  const browser = await chromium.launch();
  for (const [vname, w, h, dpr, mobile] of VIEWS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: dpr,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await ctx.newPage();
    for (const [name, file] of PAGES) {
      await page.goto('file://' + path.join(__dirname, file), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const isModal = name.startsWith('spinner');

      if (mobile && !isModal) {
        // 1. the live first screen, with the install prompt and WhatsApp bar in place
        await page.waitForTimeout(250);
        await page.screenshot({ path: `out/${name}-mobile-screen.png` });
        // 2. the whole page, without the fixed bars stitched through the middle
        await page.evaluate(hideSticky);
      }
      if (mobile && isModal) await page.evaluate(hideSticky);

      await page.waitForTimeout(300);
      await page.screenshot({ path: `out/${name}-${vname}.png`, fullPage: !isModal });
      console.log('shot', name, vname);
    }
    await ctx.close();
  }
  await browser.close();
})();

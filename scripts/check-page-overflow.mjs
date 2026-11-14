import { chromium } from 'playwright';

const pages = [
  '/',
  '/shop',
  '/courses',
  '/courses/artisanal-sourdough-masterclass',
  '/gift-hampers',
  '/signin',
  '/signup',
  '/about'
];

const widths = [320, 375, 414, 768, 1024, 1280];

async function checkOverflow() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('--- CHECKING HORIZONTAL OVERFLOW ACROSS PAGES ---');

  for (const urlPath of pages) {
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 750 });
      try {
        await page.goto(`http://127.0.0.1:5173${urlPath}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const winW = window.innerWidth;
          const docW = docEl.scrollWidth;
          const bodyW = body.scrollWidth;
          const maxW = Math.max(docW, bodyW);
          const hasScroll = maxW > winW;

          // Find offending elements if any
          let offenders = [];
          if (hasScroll) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const r = el.getBoundingClientRect();
              if (r.right > winW + 1) {
                offenders.push({
                  tag: el.tagName,
                  className: el.className?.toString?.() || '',
                  id: el.id,
                  right: Math.round(r.right),
                  diff: Math.round(r.right - winW)
                });
              }
            }
          }

          return {
            winW,
            maxW,
            hasScroll,
            offenders: offenders.slice(0, 5) // top 5
          };
        });

        if (overflow.hasScroll) {
          console.log(`[OVERFLOW] ${urlPath} at ${w}px: content is ${overflow.maxW}px (overflows by ${overflow.maxW - w}px)`);
          if (overflow.offenders.length > 0) {
            console.log('   Offenders:', JSON.stringify(overflow.offenders));
          }
        }
      } catch (e) {
        console.error(`Error on ${urlPath} at ${w}px:`, e.message);
      }
    }
  }

  await browser.close();
}

checkOverflow().catch(console.error);


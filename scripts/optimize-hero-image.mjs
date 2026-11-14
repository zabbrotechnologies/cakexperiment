import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function convertImage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const pngPath = path.resolve('public/images/hero-cake.png');
  const buffer = fs.readFileSync(pngPath);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  const webpData = await page.evaluate(async (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Desktop WebP
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const webpDesktop = canvas.toDataURL('image/webp', 0.85);

        // Mobile WebP (scaled to max 1080px wide)
        const scale = Math.min(1, 1080 / img.width);
        const mCanvas = document.createElement('canvas');
        mCanvas.width = Math.round(img.width * scale);
        mCanvas.height = Math.round(img.height * scale);
        const mCtx = mCanvas.getContext('2d');
        mCtx.drawImage(img, 0, 0, mCanvas.width, mCanvas.height);
        const webpMobile = mCanvas.toDataURL('image/webp', 0.8);

        resolve({ webpDesktop, webpMobile, origW: img.width, origH: img.height, mobileW: mCanvas.width, mobileH: mCanvas.height });
      };
      img.onerror = reject;
      img.src = src;
    });
  }, dataUrl);

  await browser.close();

  // Save desktop webp
  const desktopData = webpData.webpDesktop.replace(/^data:image\/webp;base64,/, '');
  fs.writeFileSync('public/images/hero-cake.webp', Buffer.from(desktopData, 'base64'));

  // Save mobile webp
  const mobileData = webpData.webpMobile.replace(/^data:image\/webp;base64,/, '');
  fs.writeFileSync('public/images/hero-cake-mobile.webp', Buffer.from(mobileData, 'base64'));

  const origSize = fs.statSync('public/images/hero-cake.png').size;
  const webpSize = fs.statSync('public/images/hero-cake.webp').size;
  const mobileSize = fs.statSync('public/images/hero-cake-mobile.webp').size;

  console.log(`Original PNG: ${(origSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Desktop WebP: ${(webpSize / 1024).toFixed(1)} KB (${((1 - webpSize / origSize) * 100).toFixed(1)}% reduction)`);
  console.log(`Mobile WebP:  ${(mobileSize / 1024).toFixed(1)} KB (${((1 - mobileSize / origSize) * 100).toFixed(1)}% reduction)`);
}

convertImage().catch(console.error);


import { chromium } from './node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto('http://localhost:5173/login');
await page.waitForLoadState('networkidle');
await page.locator('input[name="login"]').fill('admin');
await page.locator('input[name="password"]').fill('admin');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(2000);

await page.goto('http://localhost:5173/orders/04e2841f-9dcd-4870-aa3a-c0bae5cdbdfb');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

const bodyText = await page.locator('body').innerText();
console.log('Page text:', bodyText.substring(0, 600));

if (errors.length) {
  console.log('\n=== Console errors ===');
  errors.forEach(e => console.log(e));
} else {
  console.log('\nNo console errors.');
}

await browser.close();

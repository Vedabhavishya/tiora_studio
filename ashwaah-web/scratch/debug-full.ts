import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 1. Visit Homepage
  console.log('1. Navigating to http://localhost:3000/');
  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: 'scratch/step-1-home.png' });
  
  // 2. Click Login
  console.log('2. Clicking Login...');
  await page.click('button:has-text("Login"), a:has-text("Login")');
  await page.screenshot({ path: 'scratch/step-2-login-loaded.png' });
  
  // Print inputs found on page
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} inputs on page:`);
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    const value = await inputs[i].inputValue();
    console.log(`  Input #${i}: type="${type}", placeholder="${placeholder}", value="${value}"`);
  }
  
  // 3. Type Phone
  console.log('3. Typing phone number...');
  await page.locator('input[placeholder*="digits"]').pressSequentially('8888888888', { delay: 100 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/step-3-typed.png' });
  
  // Log inputs again
  console.log('Inputs after typing:');
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    const value = await inputs[i].inputValue();
    console.log(`  Input #${i}: type="${type}", placeholder="${placeholder}", value="${value}"`);
  }
  
  // Check Continue button
  const continueBtn = page.locator('button:has-text("Continue")');
  console.log('Continue button disabled state:', await continueBtn.getAttribute('disabled'));
  
  // Click Continue
  console.log('4. Clicking Continue...');
  try {
    await continueBtn.click({ timeout: 5000 });
    console.log('Continue button clicked successfully!');
  } catch (err: any) {
    console.error('Failed to click Continue:', err.message);
  }
  await page.screenshot({ path: 'scratch/step-4-after-continue.png' });
  
  await browser.close();
}

run().catch(console.error);

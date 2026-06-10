import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to home
  console.log('Navigating to http://localhost:3000/');
  await page.goto('http://localhost:3000/');
  
  // Click login
  console.log('Clicking Login button...');
  await page.click('button:has-text("Login"), a:has-text("Login")');
  
  // Print page title
  console.log('Title:', await page.title());
  
  // Locate phone input and button
  const phoneInput = page.locator('input[placeholder*="digits"]');
  const continueBtn = page.locator('button:has-text("Continue")');
  
  console.log('Initial input value:', await phoneInput.inputValue());
  console.log('Initial button disabled attribute:', await continueBtn.getAttribute('disabled'));
  
  // Type phone number
  console.log('Typing phone number...');
  await phoneInput.pressSequentially('8888888888', { delay: 100 });
  
  // Wait a moment for any react state updates
  await page.waitForTimeout(1000);
  
  console.log('Final input value:', await phoneInput.inputValue());
  console.log('Final button disabled attribute:', await continueBtn.getAttribute('disabled'));
  
  await browser.close();
}

run().catch(console.error);

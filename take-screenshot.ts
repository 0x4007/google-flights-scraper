import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

// Ensure the screenshot directory exists
const screenshotDir = path.join(__dirname, 'screenshot');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot(): Promise<void> {
  console.log('Launching browser...');

  // Launch the browser with additional args to help in CI environment
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  try {
    console.log('Opening new page...');
    const page = await browser.newPage();

    // Set viewport size for consistent screenshots
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to flights.google.com...');
    await page.goto('https://flights.google.com', {
      waitUntil: 'networkidle2',
      timeout: 60000  // Increase timeout for slower CI environments
    });

    // Take and save the screenshot
    const screenshotPath = path.join(screenshotDir, 'flights-google.png');
    console.log(`Taking screenshot and saving to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('Screenshot taken successfully!');
  } catch (error) {
    console.error('Error during screenshot process:', error);
    process.exit(1);
  } finally {
    // Always close the browser
    await browser.close();
    console.log('Browser closed.');
  }
}

takeScreenshot();

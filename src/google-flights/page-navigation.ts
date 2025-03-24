import { Page } from 'puppeteer';

export async function navigateToFlights(page: Page): Promise<void> {
  console.log('Setting up viewport...');
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to flights.google.com...');
  await page.goto('https://www.google.com/travel/flights?curr=USD', {
    waitUntil: 'networkidle2',
    timeout: 60000  // Increase timeout for slower CI environments
  });
}

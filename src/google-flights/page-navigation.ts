import { Page } from 'puppeteer';
import { FlightSearchParameters } from '../types';
import { whereFrom } from './select-locations/where-from';

export async function navigateToFlights(page: Page, parameters: FlightSearchParameters): Promise<void> {
  console.log('Setting up viewport...');
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to flights.google.com...');
  await page.goto('https://flights.google.com', {
    waitUntil: 'networkidle2',
    timeout: 60000  // Increase timeout for slower CI environments
  });

  // Wait for the page to be fully loaded
  await page.waitForSelector('[aria-label="Where from? "]', { timeout: 10000 });

  console.log(`Setting origin location to: ${parameters.from}`);
  await whereFrom(page, parameters.from);

  // Add a delay to ensure the screenshot captures the entered location
  await new Promise(resolve => setTimeout(resolve, 1000));
}

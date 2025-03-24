import { Page } from 'puppeteer';
import { clearInputField } from '../clear-input-field';

export async function whereFrom(page: Page, from: string): Promise<void> {
    if (!page) throw new Error("Page not initialized");


    // Try multiple possible selectors for the origin field
    const possibleOriginSelectors = [ `[aria-label="Where from? "]` ];

    // Try to find the origin field
    let originField = null;
    for (const selector of possibleOriginSelectors) {
      try {
        const field = await page.$(selector);
        if (field) {
          originField = field;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!originField) {
      throw new Error("Could not find origin input field");
    }

    // Click on the origin field
    await originField.click();

    // Clear the origin field using our robust clearing function
    await clearInputField(page, originField);

    // Type the origin with a slower delay to ensure Google Flights can process it
    // Remove commas from the input to avoid issues with Google Flights
    const sanitizedFrom = from.replace(/,/g, "");
    await page.keyboard.type(sanitizedFrom, { delay: 200 });

    // Wait longer for suggestions to appear and stabilize

    // Wait for suggestions dropdown
    try {
      await page.waitForSelector('[role="listbox"], [role="option"], .suggestions-list', { timeout: 5000 });
    } catch {
    }

    await page.keyboard.press("Enter");

  }

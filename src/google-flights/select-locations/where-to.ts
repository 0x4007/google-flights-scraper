import { Page } from 'puppeteer';
import { clearInputField } from '../clear-input-field';
import { delay } from '../../utils/delay';

export async function whereTo(page: Page, to: string): Promise<void > {
  if (!page) throw new Error("Page not initialized");

  // Try multiple possible selectors for the destination field
  const possibleDestinationSelectors = [`[placeholder="Where to?"]` ,`[aria-label="Where to? "]`];

  // Take a screenshot before finding destination field

  // Try to find the destination field
  let destinationField = null;
  for (const selector of possibleDestinationSelectors) {
    try {
      const field = await page.$(selector);
      if (field) {
        destinationField = field;
        break;
      }
    } catch {
    }
  }

  if (!destinationField) {
    throw new Error("Could not find origin input field");
  }


  // Click on the destination field
  await destinationField.click();

  // Clear the destination field using our robust clearing function
  await clearInputField(page, destinationField);

  await page.keyboard.type(to, { delay: 200 });


  // Wait for suggestions dropdown
  try {
    await page.waitForSelector('[role="listbox"], [role="option"], .suggestions-list', { timeout: 5000 });
  } catch {
  }

  // Press Enter to select the first suggestion
  await page.keyboard.press("Enter");

}
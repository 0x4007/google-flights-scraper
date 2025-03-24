import { ElementHandle, Page } from "puppeteer";
const SEARCH_BUTTON_SELECTORS = [
  // Specific Google Flights selectors
  'button[jsname="vLv7Lb"]',
  'button[jsname="c6xFrd"]',
  'button[jscontroller="soHxf"]',
  "button.gws-flights__search-button",
  "button.gws-flights-form__search-button",
  'div[role="button"][jsname="vLv7Lb"]',
  'div[role="button"][jsname="c6xFrd"]',
  'div[role="button"][jscontroller="soHxf"]',
  'div[jsname="vLv7Lb"]',
  'div[jsname="c6xFrd"]',
  // Generic search button selectors
  'button[aria-label*="Search"]',
  'button[aria-label*="search"]',
  'button:has-text("Search")',
  "button.search-button",
  // Material design button selectors
  "button.VfPpkd-LgbsSe",
  // Role-based selectors
  '[role="button"][aria-label*="Search"]',
  '[role="button"][aria-label*="search"]',
  '[role="button"]:has-text("Search")',
  // Any element with search-related attributes
  '[jsaction*="search"]',
  '[data-flt-ve="search_button"]',
];
export async function findButtonBySelectors(
  page: Page,
): Promise<ElementHandle<Element> | null> {
  for (const selector of SEARCH_BUTTON_SELECTORS) {
    try {
      console.debug(`Trying search button selector: ${selector}`);
      const button = await page.$(selector);
      if (button) {
        console.info(`Found search button with selector: ${selector}`);
        return button;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.debug(
          `Selector ${selector} not found or error: ${error.message}`,
        );
      }
    }
  }
  return null;
}

import { ElementHandle, Page } from "puppeteer";

export async function findElementBySelectors(
  page: Page,
  selectors: string[],
): Promise<ElementHandle<Element> | null> {
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

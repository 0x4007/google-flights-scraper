import { ElementHandle, Page } from "puppeteer";

export async function getMonthNavigationButtons(page: Page): Promise<{
  prevButton: ElementHandle<Element>;
  nextButton: ElementHandle<Element>;
} | null> {
  const prevButton = await page.$('div[aria-label="Previous month"]');
  const nextButton = await page.$('div[aria-label="Next month"]');

  if (!prevButton || !nextButton) {
    console.error("Could not find month navigation buttons");
    return null;
  }

  return { prevButton, nextButton };
}

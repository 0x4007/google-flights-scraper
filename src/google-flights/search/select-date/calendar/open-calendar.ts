import { Page } from "puppeteer";
import { delay } from "../../../../utils/delay";
import { findElementBySelectors } from "../../../../utils/find-element-by-selectors";

const DATE_SELECTORS = [
  '[aria-label*="Departure"]',
  '[placeholder*="Departure"]',
];

export async function openCalendar(page: Page): Promise<void> {
  let dateInput = await findElementBySelectors(page, DATE_SELECTORS);

  if (!dateInput) {
    throw new Error("Could not find date input field");
  }

  await dateInput.click();
  await delay(2000);
}

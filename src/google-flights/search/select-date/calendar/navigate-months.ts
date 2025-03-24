import { ElementHandle, Page } from "puppeteer";
import { getCurrentMonthYear, MonthYear } from "./get-current-month-to-year";
import { delay } from "../../../../utils/delay";

export async function navigateMonths(
  page: Page,
  button: ElementHandle<Element>,
  targetMonth: string,
  targetYear: number,
  maxAttempts = 24,
): Promise<void> {
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const current = await getCurrentMonthYear(page);
    if (!current) break;

    if (isTargetMonthReached(current, targetMonth, targetYear)) {
      break;
    }

    await clickMonthNavigationButton(button);
  }
}

function isTargetMonthReached(
  current: MonthYear,
  targetMonth: string,
  targetYear: number,
): boolean {
  return current.month.includes(targetMonth) && current.year === targetYear;
}
async function clickMonthNavigationButton(
  button: ElementHandle<Element>,
): Promise<void> {
  await button.click();
  await delay(500);
}

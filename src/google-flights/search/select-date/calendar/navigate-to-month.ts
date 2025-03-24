import { Page } from "puppeteer";
import { getCurrentMonthYear } from "./get-current-month-to-year";
import { getMonthNavigationButtons } from "./get-month-navigation-buttons";
import { navigateMonths } from "./navigate-months";

export async function navigateToMonth(
  page: Page,
  targetMonth: string,
  targetYear: number,
): Promise<void> {
  try {
    const current = await getCurrentMonthYear(page);
    if (!current) return;

    const buttons = await getMonthNavigationButtons(page);
    if (!buttons) return;

    const currentDate = new Date(`${current.month} 1, ${current.year}`);
    const targetDate = new Date(`${targetMonth} 1, ${targetYear}`);

    if (targetDate > currentDate) {
      await navigateMonths(page, buttons.nextButton, targetMonth, targetYear);
    } else if (targetDate < currentDate) {
      await navigateMonths(page, buttons.prevButton, targetMonth, targetYear);
    } else {
      console.error(`Already on target month: ${targetMonth} ${targetYear}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error navigating to month: ${error.message}`);
    }
  }
}

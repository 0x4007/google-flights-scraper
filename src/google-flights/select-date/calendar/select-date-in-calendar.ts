import { Page } from "puppeteer";
import { findAndClickDayButton } from "./find-and-click-day-button";
import { findMonthSection } from "./find-month-selection";

export async function selectDateInCalendar(
  page: Page,
  day: number,
  month: string,
): Promise<boolean> {
  try {
    const monthSections = await page.$$('div[role="rowgroup"]');

    for (const section of monthSections) {
      if (await findMonthSection(section, month)) {
        if (await findAndClickDayButton(section, day)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error selecting date in calendar: ${error.message}`);
    }
    return false;
  }
}

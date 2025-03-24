import { Page } from "puppeteer";

export interface MonthYear {
  month: string;
  year: number;
}
export async function getCurrentMonthYear(
  page: Page,
): Promise<MonthYear | null> {
  try {
    const monthYearText = await page.$eval(
      'div[role="heading"]',
      (el) => el.textContent?.trim() ?? "",
    );
    const monthYearMatch = /([A-Za-z]{3,9})\s+(\d{4})/.exec(monthYearText);
    if (!monthYearMatch) {
      console.error(`Could not parse month/year from text: ${monthYearText}`);
      return null;
    }
    return {
      month: monthYearMatch[1],
      year: parseInt(monthYearMatch[2], 10),
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error getting current month/year: ${error.message}`);
    }
    return null;
  }
}

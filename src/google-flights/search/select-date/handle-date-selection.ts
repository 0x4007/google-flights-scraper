import { Page } from "puppeteer";
import { navigateToMonth } from "./calendar/navigate-to-month";
import { selectDateInCalendar } from "./calendar/select-date-in-calendar";
import { DateInfo } from "../../../utils/parse-date";

export async function handleDateSelection(
  page: Page,
  dateInfo: DateInfo,
): Promise<boolean> {
  const isDateSelected = await selectDateInCalendar(
    page,
    dateInfo.day,
    dateInfo.month,
  );

  if (!isDateSelected) {
    await navigateToMonth(page, dateInfo.month, dateInfo.year);
    return await selectDateInCalendar(page, dateInfo.day, dateInfo.month);
  }

  return true;
}

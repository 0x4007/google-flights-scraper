import { Page } from "puppeteer";
import { parseDateString } from "../../../utils/parse-date";
import { openCalendar } from "./calendar/open-calendar";
import { handleDateSelection } from "./handle-date-selection";

export async function selectDepartureDate(
  page: Page,
  departureDate: string,
): Promise<void> {
  if (!page) throw new Error("Page not initialized");

  const departureDateInfo = parseDateString(departureDate);

  await openCalendar(page);
  await handleDateSelection(page, departureDateInfo);
}

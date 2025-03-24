import { Page } from "puppeteer";
import { delay } from "../../../utils/delay";
import { parseDateString } from "../../../utils/parse-date";
import { handleDateSelection } from "./handle-date-selection";
import { clickDoneButton } from "../click-done-button";

export async function selectReturnDate(
  page: Page,
  returnDate: string,
): Promise<void> {
  if (!page) throw new Error("Page not initialized");

  const returnDateInfo = parseDateString(returnDate);

  // Add delay before selecting return date to ensure calendar is ready
  await delay(1000);
  await handleDateSelection(page, returnDateInfo);
  await clickDoneButton(page);
}

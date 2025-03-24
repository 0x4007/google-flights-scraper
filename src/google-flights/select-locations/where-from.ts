import { Page } from "puppeteer";
import { selectLocation } from "./select-location";

export async function whereFrom(page: Page, from: string): Promise<void> {
  await selectLocation(page, from, [`[aria-label^="Where from?"]`], "from");
}

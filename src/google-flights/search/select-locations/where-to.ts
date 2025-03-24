import { Page } from "puppeteer";
import { selectLocation } from "./select-location";

export async function whereTo(page: Page, to: string): Promise<void> {
  await selectLocation(
    page,
    to,
    [`[placeholder="Where to?"]`, `[aria-label="Where to? "]`],
    "to",
  );
}

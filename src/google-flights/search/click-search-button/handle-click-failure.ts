import { Page } from "puppeteer";

export async function handleClickFailure(page: Page): Promise<void> {
  console.warn("Click failed, trying to press Enter as fallback");
  await page.keyboard.press("Enter");
  console.info("Pressed Enter key");
}

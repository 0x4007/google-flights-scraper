import { Page } from "puppeteer";

export async function checkForSubmitButtons(page: Page): Promise<void> {
  const submitButtons = await page.$$(
    'button[type="submit"], input[type="submit"]',
  );
  if (submitButtons.length > 0) {
    console.info(
      `Found ${submitButtons.length} potential submit buttons, trying to click the first one`,
    );
    try {
      await submitButtons[0].click();
      console.info("Clicked additional submit button");
    } catch (error) {
      if (error instanceof Error) {
        console.warn(
          `Error clicking additional submit button: ${error.message}`,
        );
      }
    }
  }
}

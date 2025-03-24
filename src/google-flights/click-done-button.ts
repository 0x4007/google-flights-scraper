import { Page } from "puppeteer";

export async function clickDoneButton(page: Page): Promise<void> {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const doneButton = buttons.find((button) =>
      button.textContent?.toLowerCase().includes("done"),
    );
    if (doneButton) {
      (doneButton as HTMLButtonElement).click();
    }
  });
}

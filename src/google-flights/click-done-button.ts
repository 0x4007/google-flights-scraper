import { Page } from "puppeteer";
import { delay } from "../utils/delay";

export async function clickDoneButton(page: Page): Promise<void> {
  //     const doneButton = await findElementBySelectors(page, DONE_BUTTON_SELECTORS);

  //     if (doneButton) {
  //       try {
  //         await page.evaluate((el: Element) => {
  //           if (el instanceof HTMLElement) {
  //             el.click();
  //           }
  //         }, doneButton);

  //       } catch (error) {
  //         if (error instanceof Error) {
  // console.error(`Error clicking Done button: ${error.message}`);
  //         }
  //       }
  //     }

  //     // Alternative approach: Press Enter key
  await page.keyboard.press("Enter");
  await delay(2000);
}

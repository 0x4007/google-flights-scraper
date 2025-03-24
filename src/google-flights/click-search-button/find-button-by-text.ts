import { ElementHandle, Page } from "puppeteer";

export async function findButtonByText(
  page: Page,
): Promise<ElementHandle<Element> | null> {
  try {
    const buttons = await page.$$('button, [role="button"]');

    for (const button of buttons) {
      try {
        const textContent = await button.evaluate(
          (el) => el.textContent?.toLowerCase() ?? "",
        );
        const ariaLabel = await button.evaluate(
          (el) => el.getAttribute("aria-label")?.toLowerCase() ?? "",
        );

        if (textContent.includes("search") || ariaLabel.includes("search")) {
          console.info(`Found search button by text content: ${textContent}`);
          return button;
        }
      } catch (error) {
        if (error instanceof Error) {
          console.debug(`Error getting button text: ${error.message}`);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error finding button by text content:", error.message);
    }
  }
  return null;
}

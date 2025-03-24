import { ElementHandle } from "puppeteer";

export async function tryStandardClick(
  button: ElementHandle<Element>,
): Promise<boolean> {
  try {
    await button.click({ delay: 100 });
    console.info("Clicked search button with standard click");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Standard click failed: ${error.message}`);
    }
    return false;
  }
}

import { ElementHandle, Page } from "puppeteer";

// Helper function to clear an input field using multiple methods
export async function clearInputField(
  page: Page,
  field: ElementHandle<Element>,
): Promise<void> {
  try {
    // Method 1: Try using Puppeteer's built-in clear method
    await field.evaluate((el) => {
      if (el instanceof HTMLInputElement) {
        el.value = "";
      } else if (el.hasAttribute("contenteditable")) {
        el.textContent = "";
      }
    });

    // Method 2: Click three times to select all text (works for many inputs)
    await field.click({ clickCount: 3 });
    await page.keyboard.press("Backspace");

    // Method 3: Use keyboard shortcuts
    await field.click(); // Ensure field is focused
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");

    // Method 4: Try to clear by sending multiple backspace keys
    await field.click();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Backspace");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error clearing WHERE FROM input field: ${error.message}`);
    } else {
      console.error(
        "Unknown error occurred while clearing input field:",
        error,
      );
    }
  }
}

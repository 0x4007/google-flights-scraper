import { Page } from "puppeteer";
import { clearInputField } from "../clear-input-field";

export async function selectLocation(
  page: Page,
  value: string,
  selectors: string[],
  fieldType: "from" | "to",
): Promise<void> {
  if (!page) throw new Error("Page not initialized");

  // Find field
  let field = null;
  for (const selector of selectors) {
    try {
      field = await page.$(selector);
      if (field) break;
    } catch {
      continue;
    }
  }

  if (!field) {
    throw new Error(`Could not find ${fieldType} input field`);
  }

  // Handle input
  await field.click();
  await clearInputField(page, field);

  // Sanitize value by removing commas for both from and to fields
  const sanitizedValue = value.replace(/,/g, "");
  await page.keyboard.type(sanitizedValue, { delay: 200 });

  // Handle suggestions
  try {
    await page.waitForSelector(
      '[role="listbox"], [role="option"], .suggestions-list',
      { timeout: 5000 },
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `${fieldType.toUpperCase()} suggestions element not found: ${error.message}`,
      );
    } else {
      console.error(error);
    }
  }

  await page.keyboard.press("Enter");
}

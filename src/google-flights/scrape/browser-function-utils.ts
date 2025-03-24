import { Page } from "puppeteer";

/**
 * Registers all page functions by combining them and injecting them into the page context.
 * This avoids having to redefine all functions within page.evaluate().
 */
export async function registerPageFunctions(page: Page): Promise<void> {
  // Import all function strings
  const functionStrings: string[] = [
    // We'll import and concatenate all function strings here
  ];

  // Inject these functions into the page context
  await page.evaluateOnNewDocument(`
    ${functionStrings.join("\n\n")}
  `);
}

/**
 * Helper to execute a function in the page context
 * This allows us to keep the main scraping code clean
 */
export async function evaluatePageFunction<T>(
  page: Page,
  functionName: string,
  ...args: unknown[]
): Promise<T> {
  return page.evaluate(
    (fnName, ...fnArgs) => {
      // Execute the named function with the provided arguments
      // @ts-expect-error - We're calling functions that are defined in the page context
      return window[fnName](...fnArgs);
    },
    functionName,
    ...args
  );
}

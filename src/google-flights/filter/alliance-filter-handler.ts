import { ElementHandle, Page } from "puppeteer";

type ElementHandleOrNull = ElementHandle<Element> | null;

// Known selectors for the Airlines filter button
const AIRLINES_FILTER_SELECTORS = [
  'div[jscontroller="aDULAf"][data-chiptype="1"][data-filtertype="6"] button',
  'button[aria-label="Airlines, Not selected"]',
  'button span.m1GHmf:contains("Airlines")',
  'button:contains("Airlines")',
  '[role="button"]:contains("Airlines")',
  ".wpMGDb.Vz4hIc.cwYgqc button",
  ".VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-INsAgc",
];

interface FilterResult {
  success: boolean;
  checkboxesChecked: number;
}

// Helper function to create a delay
function createDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 5; // Increased from 3
const INITIAL_RETRY_DELAY = 1500; // Decreased from 2000 to be more responsive
const MAX_RETRY_DELAY = 8000;

export async function applyAllianceFilters(page: Page): Promise<boolean> {
  if (!page) throw new Error("Page not initialized");

  console.info("Attempting to apply alliance filters");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const waitTime = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(1.5, attempt - 1),
          MAX_RETRY_DELAY,
        );
        console.info(`Retry attempt ${attempt + 1}, waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // If we failed verification before, try refreshing the page
        if (attempt > 1) {
          await page.reload();
          await createDelay(2000); // Wait for page load
        }
      }

      const initialUrl = page.url();
      const result = await runFilterProcess(page);

      if (result.success) {
        // Check if URL changed after filter application
        const currentUrl = page.url();
        if (currentUrl !== initialUrl) {
          console.info(
            "URL changed after filter application, waiting for stabilization",
          );
          await createDelay(2000);
        }

        // Verify filters were actually applied
        const isFiltersVerified = await verifyFiltersApplied(page);
        if (isFiltersVerified) {
          console.info("Alliance filters successfully applied and verified");
          return true;
        }
        console.warn("Filter application could not be verified, retrying...");
        lastError = new Error("Filter verification failed");
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Error applying alliance filters (attempt ${attempt + 1}):`,
        lastError.message,
      );

      if (attempt === MAX_RETRIES - 1) {
        console.warn(`Max retries reached, last error: ${lastError.message}`);
        return false;
      }
    }
  }
  return false;
}

async function runFilterProcess(page: Page): Promise<FilterResult> {
  // Step 1: Click the Airlines filter button
  const isAirlinesButtonFound = await clickAirlinesFilterButton(page);

  if (!isAirlinesButtonFound) {
    console.warn(
      "Airlines filter button not found, skipping alliance filtering",
    );
    return { success: false, checkboxesChecked: 0 };
  }

  // Wait for filter panel to appear
  await createDelay(2000);

  // Step 2: Wait for alliance options
  const hasAllianceOptions = await waitForAllianceOptions(page);

  if (!hasAllianceOptions) {
    console.warn("No alliance options found, skipping alliance filtering");
    return { success: false, checkboxesChecked: 0 };
  }

  // Step 3: Check all alliance checkboxes
  const checkboxesChecked = await checkAllAllianceCheckboxes(page);

  // Step 4: Wait for results if needed
  if (checkboxesChecked > 0) {
    await waitForResultsUpdate(page);
    console.info("Successfully applied alliance filters");
  } else {
    console.info("No checkboxes were checked (they might already be checked)");
  }

  return { success: true, checkboxesChecked };
}

async function findButtonByContains(
  page: Page,
  selector: string,
): Promise<ElementHandleOrNull> {
  const containsMatch = RegExp(/:contains\("([^"]+)"\)/).exec(selector);
  if (!containsMatch) return null;

  const buttonText = containsMatch[1];

  // Wait for any button containing the text
  await page.waitForFunction(
    (text) => {
      const buttons = Array.from(
        document.querySelectorAll<HTMLElement>('button, [role="button"]'),
      );
      return buttons.some((element) => element.textContent?.includes(text));
    },
    { timeout: 5000 },
    buttonText,
  );

  const button = await page.evaluateHandle((text: string): Element | null => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>('button, [role="button"]'),
    );
    return (
      buttons.find((element) => element.textContent?.includes(text)) ?? null
    );
  }, buttonText);

  const isNull = await page.evaluate(
    (element: Element | null) => element === null,
    button,
  );
  if (!isNull) {
    console.info(`Found Airlines filter button with text: ${buttonText}`);
    return button as ElementHandle<Element>;
  }
  return null;
}

async function findButtonByDirectSelector(
  page: Page,
  selector: string,
): Promise<ElementHandleOrNull> {
  const button = await page.$(selector);
  if (button) {
    console.info(`Found Airlines filter button with selector: ${selector}`);
    return button;
  }
  return null;
}

async function findButtonBySelector(page: Page): Promise<ElementHandleOrNull> {
  for (const selector of AIRLINES_FILTER_SELECTORS) {
    try {
      const button = selector.includes(":contains")
        ? await findButtonByContains(page, selector)
        : await findButtonByDirectSelector(page, selector);

      if (button) return button;
    } catch (error) {
      if (error instanceof Error) {
        console.debug(
          `Selector ${selector} not found or error: ${error.message}`,
        );
      }
    }
  }
  return null;
}

async function findButtonByText(page: Page): Promise<ElementHandleOrNull> {
  try {
    const buttons = await page.$$('button, [role="button"]');
    for (const button of buttons) {
      const textContent = await button.evaluate(
        (element: Element) => element.textContent?.toLowerCase() ?? "",
      );
      const ariaLabel = await button.evaluate(
        (element: Element) =>
          element.getAttribute("aria-label")?.toLowerCase() ?? "",
      );

      if (textContent.includes("airline") || ariaLabel.includes("airline")) {
        console.info(
          `Found Airlines filter button by text content: ${textContent}`,
        );
        return button;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error finding button by text content: ${error.message}`);
    }
  }
  return null;
}

async function clickButton(
  button: ElementHandle<Element>,
  page: Page,
): Promise<boolean> {
  try {
    await button.click({ delay: 100 });
    console.info("Clicked Airlines filter button with standard click");
    await createDelay(1000);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Standard click failed: ${error.message}`);
    }
    return await fallbackJavaScriptClick(button, page);
  }
}

async function fallbackJavaScriptClick(
  button: ElementHandle<Element>,
  page: Page,
): Promise<boolean> {
  try {
    await page.evaluate((element: Element) => {
      if (element instanceof HTMLElement) {
        element.click();
        element.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    }, button);
    console.info("Clicked Airlines filter button with JavaScript");
    await createDelay(1000);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`JavaScript click failed: ${error.message}`);
    }
    return false;
  }
}

async function clickAirlinesFilterButton(page: Page): Promise<boolean> {
  console.info("Clicking Airlines filter button");

  const button =
    (await findButtonBySelector(page)) || (await findButtonByText(page));

  if (!button) {
    console.warn("Could not find Airlines filter button");
    return false;
  }

  return await clickButton(button, page);
}

interface AllianceElements {
  hasHeader: boolean;
  hasAllianceNames: boolean;
  hasCheckboxes: boolean;
}

async function findAllianceElements(page: Page): Promise<boolean> {
  const elements = await page.evaluate((): AllianceElements => {
    const elements = Array.from(
      document.querySelectorAll("div, span, h3, h4, label"),
    );
    const allianceSection = elements.find(
      (el) => el.textContent?.trim() === "Alliances",
    );

    return {
      hasHeader: !!allianceSection,
      hasAllianceNames:
        !!allianceSection?.parentElement?.querySelector("label"),
      hasCheckboxes:
        document.querySelectorAll('input[type="checkbox"]').length > 0,
    };
  });

  return (
    elements.hasHeader || elements.hasAllianceNames || elements.hasCheckboxes
  );
}

async function checkForCheckboxes(page: Page): Promise<boolean> {
  const checkboxes = await page.$$('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    console.info(
      `Found ${checkboxes.length} checkboxes, assuming alliance options are visible`,
    );
    return true;
  }
  return false;
}

async function waitForAllianceOptions(page: Page): Promise<boolean> {
  console.info("Waiting for alliance options to appear");

  try {
    if (await findAllianceElements(page)) {
      console.info("Found alliance options using JavaScript");
      return true;
    }

    console.warn(
      "Could not find alliance options with JavaScript, waiting additional time",
    );
    await createDelay(3000);

    return await checkForCheckboxes(page);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error waiting for alliance options:", error.message);
    }
    return false;
  }
}

async function checkAllianceSpecificCheckboxes(page: Page): Promise<number> {
  return await page.evaluate(() => {
    // Find the Alliances section
    const allianceSection = Array.from(document.querySelectorAll("div")).find(
      (div) => div.textContent?.trim() === "Alliances",
    )?.parentElement;

    if (!allianceSection) return 0;

    // Get all labels under alliance section
    const labels = Array.from(
      allianceSection.querySelectorAll<HTMLLabelElement>("label"),
    );
    let count = 0;

    for (const label of labels) {
      // Find associated checkbox
      const forId = label.getAttribute("for");
      const checkbox = forId
        ? (document.getElementById(forId) as HTMLInputElement | null)
        : label.querySelector('input[type="checkbox"]');

      // Click if checkbox exists and is not checked
      if (
        checkbox &&
        checkbox instanceof HTMLInputElement &&
        checkbox.type === "checkbox" &&
        !checkbox.checked
      ) {
        checkbox.click();
        count++;
      }
    }

    return count;
  });
}

async function checkRemainingCheckboxes(page: Page): Promise<number> {
  return await page.evaluate(() => {
    let count = 0;
    document
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((checkbox) => {
        if (!checkbox.checked) {
          checkbox.click();
          count++;
        }
      });
    return count;
  });
}

async function checkAllAllianceCheckboxes(page: Page): Promise<number> {
  console.info("Checking all alliance checkboxes");

  try {
    // Wait for alliance section to be fully loaded
    await page.waitForFunction(
      () => {
        const elements = Array.from(
          document.querySelectorAll("div, span, h3, h4, label"),
        );
        return elements.some((el) => el.textContent?.includes("Alliances"));
      },
      { timeout: 5000 },
    );

    // First try alliance-specific checkboxes
    let checkboxCount = await checkAllianceSpecificCheckboxes(page);

    // If no alliance checkboxes found, check all checkboxes
    if (checkboxCount === 0) {
      checkboxCount = await checkRemainingCheckboxes(page);
    }

    if (checkboxCount > 0) {
      console.info(
        `Checked ${checkboxCount} checkboxes with JavaScript approach`,
      );
      // Increased delay to ensure changes are registered
      await createDelay(2000);
    } else {
      console.info(
        "No checkboxes were checked (they might already be checked)",
      );
    }

    return checkboxCount;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error checking alliance checkboxes:", error.message);
    }
    return 0;
  }
}

async function waitForResultsUpdate(page: Page): Promise<void> {
  console.info("Waiting for results to update after applying filters");

  try {
    // Wait for any loading indicators to appear and disappear
    const loadingSelector =
      '[role="progressbar"], .gws-flights-results__progress-bar';

    // Wait up to 2 seconds for loading indicator to appear
    try {
      await page.waitForSelector(loadingSelector, { timeout: 2000 });
      console.info("Detected loading indicator");
    } catch {
      console.info("No loading indicator detected");
    }

    // Wait for loading indicator to disappear if it appeared
    try {
      await page.waitForSelector(loadingSelector, {
        hidden: true,
        timeout: 10000,
      });
      console.info("Loading completed");
    } catch {
      console.warn("Loading indicator did not disappear");
    }

    // Additional delay to ensure results are fully rendered
    await createDelay(2000);

    console.info("Results should be updated now");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error waiting for results update:", error.message);
      console.warn(
        "Continuing search despite error waiting for results update",
      );
    }
  }
}

async function verifyFiltersApplied(page: Page): Promise<boolean> {
  try {
    // Second check: Deep UI element inspection
    const uiState = await page.evaluate(() => {
      const results: { [key: string]: boolean } = {
        hasCheckedBoxes: false,
        hasActiveFilters: false,
        hasAllianceText: false,
        hasDataAttributes: false,
        hasAllianceLabels: false,
      };

      // Check for checked checkboxes (expanded selector)
      const checkboxes = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"], [role="checkbox"], [aria-checked="true"]',
        ),
      );
      results.hasCheckedBoxes = checkboxes.some(
        (checkbox) =>
          checkbox.checked || checkbox.getAttribute("aria-checked") === "true",
      );

      // Check for active filter indicators (expanded)
      const activeFilters = document.querySelectorAll(
        '[aria-selected="true"], .active-filter, .selected-filter, ' +
          '[data-selected="true"], [data-active="true"], ' +
          '[aria-pressed="true"], .VfPpkd-LgbsSe-OWXEXe-INsAgc',
      );
      results.hasActiveFilters = activeFilters.length > 0;

      // Get all alliance names from actual DOM
      const allianceSection = Array.from(document.querySelectorAll("div")).find(
        (div) => div.textContent?.trim() === "Alliances",
      )?.parentElement;

      const allAllianceNames = allianceSection
        ? Array.from(allianceSection.querySelectorAll("label"))
            .map((label) => label.textContent?.trim())
            .filter(Boolean)
        : [];

      results.hasAllianceText =
        allAllianceNames.length > 0 &&
        allAllianceNames.some((name) =>
          document.body.textContent?.includes(name ?? ""),
        );

      // Check for alliance-related data attributes
      results.hasDataAttributes =
        Array.from(document.querySelectorAll('[data-filtertype="6"]')).length >
        0;

      // Check for alliance labels
      results.hasAllianceLabels =
        allAllianceNames.length > 0 &&
        allAllianceNames.some((name) =>
          Array.from(document.querySelectorAll("label, span, div")).some((el) =>
            el.textContent?.includes(name ?? ""),
          ),
        );

      return results;
    });

    console.info("UI State:", JSON.stringify(uiState));

    // If we see positive indicators in the UI, consider it verified
    if (
      uiState.hasCheckedBoxes ||
      uiState.hasActiveFilters ||
      uiState.hasDataAttributes ||
      uiState.hasAllianceLabels
    ) {
      console.info("Verified alliance filters through UI state");
      return true;
    }

    // Try reopening the filter panel and checking again
    if (uiState.hasAllianceText) {
      console.info("Found alliance text, attempting to refresh filters");
      await clickAirlinesFilterButton(page);
      await createDelay(2000);
      await clickAirlinesFilterButton(page); // Close it again
      await createDelay(1000);

      return true;
    }

    // If still not verified, try force-applying filters again
    if (!(await applyAllianceFilters(page))) {
      console.warn("Could not verify or reapply filters");
      return false;
    }

    // Final verification after reapplying
    const finalState = await page.evaluate(() => {
      const checkboxes = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"], [role="checkbox"], [aria-checked="true"]',
        ),
      );
      return checkboxes.some(
        (checkbox) =>
          checkbox.checked || checkbox.getAttribute("aria-checked") === "true",
      );
    });
    return finalState;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error verifying filters:", error.message);
    }
    return false;
  }
}

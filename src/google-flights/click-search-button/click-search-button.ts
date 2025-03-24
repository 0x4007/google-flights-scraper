import { Page } from "puppeteer";
import { checkForSubmitButtons } from "./check-for-submit-buttons";
import { findButtonByPosition } from "./find-button-by-position";
import { findButtonBySelectors } from "./find-button-by-selectors";
import { findButtonByText } from "./find-button-by-text";
import { handleClickFailure } from "./handle-click-failure";
import { tryJavaScriptClick } from "./try-java-script-click";
import { tryStandardClick } from "./try-standard-click";
import { waitForSearchResults } from "./wait-for-search-results";

export async function clickSearchButton(page: Page): Promise<void> {
  if (!page) throw new Error("Page not initialized");

  console.info("STEP 4: Finding and clicking search button");

  // Try different methods to find the search button
  const searchButton =
    (await findButtonBySelectors(page)) ||
    (await findButtonByText(page)) ||
    (await findButtonByPosition(page));

  if (searchButton) {
    // Log button details
    const buttonInfo = await searchButton.evaluate((el) => ({
      text: el.textContent?.trim() ?? "",
      className: el.className ?? "",
      type: el.tagName ?? "",
    }));
    console.info(
      `Button details - Text: "${buttonInfo.text}", Class: "${buttonInfo.className}", Type: ${buttonInfo.type}`,
    );

    // Try clicking methods
    const didStandardClick = await tryStandardClick(searchButton);
    if (!didStandardClick) {
      const didJsClick = await tryJavaScriptClick(page, searchButton);
      if (!didJsClick) {
        await handleClickFailure(page);
      }
    }
  } else {
    console.warn("Could not find search button, trying fallback approaches");
    await handleClickFailure(page);
  }

  // Wait for initial click processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check for additional submit buttons
  await checkForSubmitButtons(page);

  // Wait for results
  await waitForSearchResults(page).catch((error) => {
    if (error instanceof Error) {
      console.error(`Error in waitForSearchResults: ${error.message}`);
    }
  });

  // Final wait for animations
  // Explicitly mark this Promise as intentionally not awaited
  void new Promise((resolve) => setTimeout(resolve, 3000));
}

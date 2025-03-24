import { Page } from "puppeteer";
import { waitForSearchResults } from "./wait-for-search-results";

export async function clickSearchButton(page: Page): Promise<void> {
  if (!page) throw new Error("Page not initialized");


  // // Try different methods to find the search button
  // const searchButton = (await findButtonBySelectors(page)) || (await findButtonByText(page)) || (await findButtonByPosition(page));

  // if (searchButton) {
  //   // Log button details
  //   const buttonInfo = await searchButton.evaluate((el) => ({
  //     text: el.textContent?.trim() ?? "",
  //     className: el.className ?? "",
  //     type: el.tagName ?? "",
  //   }));

  //   // Try clicking methods
  //   const didStandardClick = await tryStandardClick(searchButton);
  //   if (!didStandardClick) {
  //     const didJsClick = await tryJavaScriptClick(page, searchButton);
  //     if (!didJsClick) {
  //       await handleClickFailure(page);
  //     }
  //   }
  // } else {
  //   console.error("Could not find search button, trying fallback approaches");
    await handleClickFailure(page);
  // }

  // Wait for initial click processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check for additional submit buttons
  // await checkForSubmitButtons(page);

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

async function handleClickFailure(page: Page): Promise<void> {
  // console.warn( "Click failed, trying to press Enter as fallback");
  await page.keyboard.press("Enter");
  // console.warn("Pressed Enter key");
}
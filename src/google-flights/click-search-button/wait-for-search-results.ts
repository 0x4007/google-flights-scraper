import { Page } from "puppeteer";

export async function waitForSearchResults(page: Page): Promise<void> {
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
        page.waitForSelector('[role="main"]', { timeout: 30000 }),
        page.waitForSelector(".gws-flights-results__results-container", { timeout: 30000 }),
        page.waitForSelector('[data-test-id="price-column"]', { timeout: 30000 }),
        page.waitForFunction(
          () => {
            const regex = /search|flights\/search|results/;
            return regex.test(window.location.href);
          },
          { timeout: 30000 }
        ),
        new Promise((resolve) => setTimeout(resolve, 30000)),
      ]);

    } catch (error) {
      if (error instanceof Error) {
        console.error( `Error waiting for search results: ${error.message}`);
      }
    }
  }
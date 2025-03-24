import { Page } from "puppeteer";

export async function clickSearchButton(page: Page): Promise<void> {
    if (!page) throw new Error("Page not initialized");
    await page.keyboard.press("Enter");

    // Final wait for animations
    // Explicitly mark this Promise as intentionally not awaited
    void new Promise((resolve) => setTimeout(resolve, 3000));
  }

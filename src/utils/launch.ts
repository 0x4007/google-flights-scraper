import type { LaunchOptions } from "puppeteer";
import puppeteer, { Browser } from "puppeteer";

export async function launchBrowser(options?: LaunchOptions): Promise<Browser> {
  console.log("Launching browser...");

  const defaultOptions: LaunchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  };

  // Merge provided options with defaults
  const launchOptions = {
    ...defaultOptions,
    ...options,
    args: [...(defaultOptions.args || []), ...(options?.args || [])],
  };

  return await puppeteer.launch(launchOptions);
}

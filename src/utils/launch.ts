import puppeteer, { Browser } from "puppeteer";

export async function launchBrowser(): Promise<Browser> {
  console.log("Launching browser...");

  return await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });
}

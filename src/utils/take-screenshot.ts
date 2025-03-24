import * as fs from "fs";
import * as path from "path";
import { Page } from "puppeteer";
import { FlightSearchParameters } from "../types";

export async function captureAndSaveScreenshot(
  page: Page,
  parameters: FlightSearchParameters,
  screenshotDir: string = path.join(process.cwd(), "screenshot"),
): Promise<void> {
  // Ensure the screenshot directory exists
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Generate screenshot filename based on search parameters
  const screenshotName = `flights-${parameters.from}-to-${parameters.to}-${parameters.departure}${
    parameters.return ? `-return-${parameters.return}` : ""
  }.png`;
  const screenshotPath = path.join(screenshotDir, screenshotName);

  console.log(`Taking screenshot and saving to ${screenshotPath}...`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Screenshot taken successfully!");
}

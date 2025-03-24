import { navigateToFlights } from "./google-flights/page-navigation";
import { launchBrowser } from "./utils/launch";
import { parseArgs } from "./utils/parse-args";
import { captureAndSaveScreenshot } from "./utils/take-screenshot";

async function main() {
  try {
    // Parse command line arguments
    const parameters = parseArgs(process.argv.slice(2));

    // Log the parameters that will be used for the search
    console.log("Flight Search Parameters:");
    console.log("------------------------");
    console.log(`From: ${parameters.from}`);
    console.log(`To: ${parameters.to}`);
    console.log(`Departure Date: ${parameters.departureDate}`);
    console.log(`Return Date: ${parameters.returnDate || "One-way trip"}`);
    console.log(`Include Budget Carriers: ${parameters.includeBudget}`);
    console.log("------------------------");

    // Launch browser and set up page
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await navigateToFlights(page, parameters);
      await captureAndSaveScreenshot(page, parameters);
    } finally {
      await browser.close();
      console.log("Browser closed.");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

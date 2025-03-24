import { applyAllianceFilters } from "./google-flights/filter/alliance-filter-handler";
import { scrapeFlightPrices } from "./google-flights/scrape/scrape-flight-prices";
import { launchBrowser } from "./utils/launch";

/**
 * Test script to verify the improved flight scraper
 */
async function testScraper() {
  console.log("Testing improved flight scraper...");
  console.log("Flight Search Parameters:");
  console.log("------------------------");
  console.log("From: Seoul");
  console.log("To: Tokyo");
  console.log("Departure Date: 2024-04-01");
  console.log("Return Date: 2024-04-15");
  console.log("Include Budget Carriers: false");
  console.log("------------------------");

  // Launch browser and set up page
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate directly to a search URL for Seoul to Tokyo
    console.log("Navigating to pre-configured search results...");
    await page.goto("https://www.google.com/travel/flights/search?tfs=CBwQAhooEgoyMDI1LTA0LTAxagwIAhIIL20vMGhzcWZyDAgDEggvbS8wN2RmaxooEgoyMDI1LTA0LTE1agwIAxIIL20vMDdkZmtyDAgCEggvbS8waHNxZkABSAFwAYIBCwj___________8BmAEB&curr=USD", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Apply alliance filters
    console.log("Applying alliance filters...");
    await applyAllianceFilters(page);

    // Wait for results to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scrape and process flight data
    console.log("Scraping flight prices and details...");
    const flightData = await scrapeFlightPrices(page);

    // Log the results
    console.log(`Found ${flightData.length} flights after processing`);

    // Show the first 5 flights with improved formatting
    console.log("\nSample of processed flights:");
    console.log("---------------------------");

    flightData.slice(0, 5).forEach((flight, index) => {
      console.log(`\nFlight #${index + 1}:`);
      console.log(`Price: ${flight.formattedPrice}`);
      console.log(`Route: ${flight.formattedRoute}`);
      console.log(`Timing: ${flight.formattedTimings}`);
      console.log(`Airlines: ${flight.airlines.join(", ")}`);
      console.log(`Stops: ${flight.stops}`);
      console.log(`Top Flight: ${flight.isTopFlight ? "Yes" : "No"}`);
    });

    // Take a screenshot
    await page.screenshot({
      path: "./screenshot/test-improved-scraper.png",
      fullPage: false
    });
    console.log("\nScreenshot saved to ./screenshot/test-improved-scraper.png");

  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

// Run the test
testScraper().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});

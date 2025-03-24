import { applyAllianceFilters } from "./google-flights/filter/alliance-filter-handler";
import { scrapeFlightPrices } from "./google-flights/scrape/scrape-flight-prices";
import { captureDOMStructure } from "./utils/capture-dom";
import { launchBrowser } from "./utils/launch";

/**
 * Test script to verify the improved airline extraction for Italian routes
 */
async function testItalianRoutes() {
  console.log("Testing airline extraction for Italian routes...");
  console.log("Flight Search Parameters:");
  console.log("------------------------");
  console.log("From: Rome");
  console.log("To: Milan");
  console.log("Departure Date: 2025-08-18");
  console.log("Return Date: 2025-09-04");
  console.log("------------------------");

  // Launch browser and set up page
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate directly to a search URL for Rome to Milan (FCO to LIN or MXP)
    console.log("Navigating to pre-configured search results for Italian route...");
    await page.goto("https://www.google.com/travel/flights/search?tfs=CBwQAhooEgoyMDI1LTA4LTE4agwIAxIIL20vMDZjMHJyDAgDEggvbS8wMnAzemcaCjIwMjUtMDktMDRqDAgDEggvbS8wMnAzemt%3D&curr=USD", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for results to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Apply alliance filters if needed
    console.log("Applying alliance filters...");
    await applyAllianceFilters(page);

    // Wait for results to stabilize again
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Capture DOM for debugging
    await captureDOMStructure(page, "italian-route");

    // Scrape and process flight data
    console.log("Scraping flight prices and details...");
    const flightData = await scrapeFlightPrices(page);

    // Find unique airlines for analysis
    const uniqueAirlines = new Set<string>();
    flightData.forEach(flight => {
      flight.airlines.forEach(airline => uniqueAirlines.add(airline));
    });

    // Log the results
    console.log(`Found ${flightData.length} flights after processing`);
    console.log(`Unique airlines found: ${Array.from(uniqueAirlines).join(", ")}`);

    // Check if we have ITA and AEROITALIA in the results
    const hasITA = Array.from(uniqueAirlines).some(airline => airline.includes("ITA"));
    const hasAeroitalia = Array.from(uniqueAirlines).some(airline => airline.includes("AEROITALIA"));

    console.log(`ITA found: ${hasITA ? "✅ YES" : "❌ NO"}`);
    console.log(`AEROITALIA found: ${hasAeroitalia ? "✅ YES" : "❌ NO"}`);
    console.log(`Fixed carrier information: ${(hasITA || hasAeroitalia) ? "✅ YES" : "❌ NO"}`);

    // Show all flights with their airline information
    console.log("\nDetailed flight information:");
    console.log("---------------------------");

    flightData.forEach((flight, index) => {
      console.log(`\nFlight #${index + 1}:`);
      console.log(`Price: ${flight.formattedPrice}`);
      console.log(`Route: ${flight.formattedRoute}`);
      console.log(`Timing: ${flight.formattedTimings}`);
      console.log(`Airlines: ${flight.airlines.join(", ")}`);
      console.log(`Origin: ${flight.origin}, Destination: ${flight.destination}`);
      console.log(`Stops: ${flight.stops}`);
    });

    // Take a screenshot
    await page.screenshot({
      path: "./screenshot/italian-routes-test.png",
      fullPage: false
    });
    console.log("\nScreenshot saved to ./screenshot/italian-routes-test.png");

  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

// Run the test
testItalianRoutes().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});

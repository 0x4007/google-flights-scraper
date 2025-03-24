import { Page } from "puppeteer";
import { gaManager } from "../genetic-algorithm/ga-manager";
import { FlightSearchParameters } from "../types";
import { captureDOMStructure } from "../utils/capture-dom";
import { applyAllianceFilters } from "./filter/alliance-filter-handler";
import { scrapeFlightPrices } from "./scrape/scrape-flight-prices";
import { clickSearchButton } from "./search/click-search-button/click-search-button";
import { selectDepartureDate } from "./search/select-date/departure-date";
import { selectReturnDate } from "./search/select-date/return-date";
import { whereFrom } from "./search/select-locations/where-from";
import { whereTo } from "./search/select-locations/where-to";

export async function navigateToFlights(
  page: Page,
  parameters: FlightSearchParameters,
): Promise<void> {
  console.log("Setting up viewport...");
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to flights.google.com...");
  await page.goto("https://flights.google.com?curr=USD", {
    waitUntil: "networkidle2",
    timeout: 60000, // Increase timeout for slower CI environments
  });

  // Wait for the page to be fully loaded
  await page.waitForSelector('[aria-label^="Where from?"]', { timeout: 10000 });

  console.log(`Setting origin location to: ${parameters.from}`);
  await whereFrom(page, parameters.from);
  await whereTo(page, parameters.to);

  // Handle dates
  await selectDepartureDate(page, parameters.departureDate);
  if (parameters.returnDate) {
    await selectReturnDate(page, parameters.returnDate);
  }

  await clickSearchButton(page);

  await applyAllianceFilters(page);

  // Capture DOM structure for analysis before scraping
  console.log("Capturing DOM structure before scraping...");
  const preScrapeStructureFile = await captureDOMStructure(page, "pre-scrape");
  console.log(`Pre-scrape DOM structure saved to: ${preScrapeStructureFile}`);

  // Scrape flight data
  const flightData = await scrapeFlightPrices(page);
  console.dir({ flightData }, { depth: null, colors: true });

  // Capture DOM structure again after scraping
  console.log("Capturing DOM structure after scraping...");
  const postScrapeStructureFile = await captureDOMStructure(page, "post-scrape");
  console.log(`Post-scrape DOM structure saved to: ${postScrapeStructureFile}`);

  // Record result in the genetic algorithm manager
  const result = await gaManager.recordResult(parameters, flightData);

  if (!result.results.length) {
    console.error("No results found for this iteration");
    return;
  }

  console.log(
    `Iteration ${result.metadata.iteration} completed: ${JSON.stringify(result.metadata)}`,
  );
  console.log(`Results saved with git commit: ${result.metadata.gitCommit}`);

  // Add a delay to ensure the screenshot captures the entered location
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

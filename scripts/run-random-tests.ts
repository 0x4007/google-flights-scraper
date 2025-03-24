#!/usr/bin/env bun
/**
 * Script to run multiple flight scraper tests with randomized parameters
 * Used both locally and in GitHub Actions
 */

import fs from "fs";
import path from "path";
import { applyAllianceFilters } from "../src/google-flights/filter/alliance-filter-handler";
import { navigateToFlights } from "../src/google-flights/page-navigation";
import { scrapeFlightPrices } from "../src/google-flights/scrape/scrape-flight-prices";
import { FlightSearchParameters } from "../src/types";
import { generateMultipleRandomParameters, logGeneratedParameters } from "../src/utils/generate-random-parameters";
import { launchBrowser } from "../src/utils/launch";
import { parseArgs } from "../src/utils/parse-args";
import { captureAndSaveScreenshot } from "../src/utils/take-screenshot";

// Default test count
const DEFAULT_TEST_COUNT = 3;

// Command line argument parsing
async function parseRunOptions(): Promise<{ testCount: number; useExactParams?: FlightSearchParameters }> {
  const args = process.argv.slice(2);
  let testCount = DEFAULT_TEST_COUNT;

  // Extract test count from command line args if present
  const testCountIndex = args.indexOf("--count");
  if (testCountIndex !== -1 && testCountIndex + 1 < args.length) {
    const count = parseInt(args[testCountIndex + 1], 10);
    if (!isNaN(count) && count > 0) {
      testCount = count;
    }
  }

  // If any standard flight search parameters are provided, try to use them
  try {
    // Only attempt to parse if we find at least one key parameter
    if (args.some(arg => ["--from", "--to", "--departure", "--return"].includes(arg))) {
      const params = parseArgs(args);
      return { testCount: 1, useExactParams: params };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.log(`No valid flight parameters found: ${errorMessage}, using random parameters instead.`);
  }

  return { testCount };
}

/**
 * Runs a flight search test with provided parameters
 * @param parameters Flight search parameters
 * @param testIndex Index of this test in the batch
 */
async function runFlightTest(parameters: FlightSearchParameters, testIndex: number): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const testId = `test-${testIndex + 1}-${timestamp}`;

  console.log(`\n🔄 Running Test #${testIndex + 1} (ID: ${testId})`);
  logGeneratedParameters(parameters);

  // Launch browser and set up page
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Create directory for this test run
    const testDir = path.join("screenshot", testId);
    fs.mkdirSync(testDir, { recursive: true });

    // Save test parameters to JSON file
    fs.writeFileSync(
      path.join(testDir, "parameters.json"),
      JSON.stringify(parameters, null, 2)
    );

    try {
      // Navigate to search results
      console.log("Navigating to flights...");
      await navigateToFlights(page, parameters);

      // Take a screenshot after initial navigation
      await page.screenshot({
        path: path.join(testDir, "initial-results.png"),
        fullPage: false
      });

      // Apply alliance filters
      console.log("Applying alliance filters...");
      await applyAllianceFilters(page);

      // Wait for results to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take a screenshot after filters
      await page.screenshot({
        path: path.join(testDir, "filtered-results.png"),
        fullPage: false
      });

      // Scrape flight data
      console.log("Scraping flight prices and details...");
      const flightData = await scrapeFlightPrices(page);

      // Save flight data to JSON file
      fs.writeFileSync(
        path.join(testDir, "flight-data.json"),
        JSON.stringify(flightData, null, 2)
      );

      // Log results summary
      console.log(`Found ${flightData.length} flights after processing`);
      if (flightData.length > 0) {
        console.log(`Lowest price: ${flightData.reduce((min, flight) =>
          flight.price < min ? flight.price : min, flightData[0].price)}`);
      }

      // Take final screenshot
      await captureAndSaveScreenshot(page, parameters, path.join(testDir, "final-results.png"));
      console.log(`✅ Test #${testIndex + 1} completed successfully`);

      return Promise.resolve();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error in test #${testIndex + 1}:`, errorMessage);

      // Take error screenshot if possible
      try {
        await page.screenshot({
          path: path.join(testDir, "error-state.png"),
          fullPage: false
        });
        console.log(`📸 Error screenshot saved to ${path.join(testDir, "error-state.png")}`);
      } catch (screenshotError) {
        console.error("Could not take error screenshot:", screenshotError);
      }

      // Write error to file
      fs.writeFileSync(
        path.join(testDir, "error.txt"),
        String(error)
      );

      return Promise.reject(error);
    }
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

/**
 * Main function to run tests
 */
async function main() {
  console.log("🚀 Flight Scraper Random Test Runner");

  try {
    // Parse command line options
    const { testCount, useExactParams } = await parseRunOptions();

    // Generate parameters for each test
    let testParameters: FlightSearchParameters[];

    if (useExactParams) {
      console.log("Using exact parameters provided via command line");
      testParameters = [useExactParams];
    } else {
      console.log(`Generating ${testCount} random test parameter sets...`);
      testParameters = generateMultipleRandomParameters(testCount);
    }

    // Print test plan
    console.log("\n📋 Test Plan:");
    testParameters.forEach((params, index) => {
      console.log(`\nTest #${index + 1}:`);
      console.log(`From: ${params.from} to ${params.to}`);
      console.log(`Dates: ${params.departureDate} to ${params.returnDate}`);
    });

    // Track results
    let passed = 0;
    let failed = 0;

    // Run tests sequentially
    for (let i = 0; i < testParameters.length; i++) {
      try {
        await runFlightTest(testParameters[i], i);
        passed++;
      } catch (error: unknown) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Test #${i + 1} failed:`, errorMessage);
      }
    }

    // Print summary
    console.log("\n📊 Test Summary:");
    console.log(`Total tests: ${testParameters.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    // Exit with error code if any tests failed
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in test runner:", errorMessage);
    process.exit(1);
  }
}

// Run the tests
main();

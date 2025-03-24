import { Page } from "puppeteer";
import { addAirlineNameFunction } from "./page-functions/add-airline-name";
import { extractAirlineNamesFunction } from "./page-functions/extract-airline-names";
import { extractAirportsFunction } from "./page-functions/extract-airports";
import { extractBookingCautionFunction } from "./page-functions/extract-booking-caution";
import { extractDurationFunction } from "./page-functions/extract-duration";
import { extractFlightDetailsFunction } from "./page-functions/extract-flight-details";
import { extractStopsFunction } from "./page-functions/extract-stops";
import { extractTimesFunction } from "./page-functions/extract-times";
import { findFlightContainersFunction } from "./page-functions/find-flight-containers";
import { findFlightElementsFunction } from "./page-functions/find-flight-elements";
import { getTextFunction } from "./page-functions/get-text";
import { isNonAirlineTextFunction } from "./page-functions/is-non-airline-text";

/**
 * Registers all page functions by combining them and injecting them into the page context.
 * This avoids having to redefine all functions within page.evaluate().
 */
export async function registerPageFunctions(page: Page): Promise<void> {
  // Import all function strings - order matters for dependencies
  const functionStrings: string[] = [
    // Utility functions first
    getTextFunction(),
    isNonAirlineTextFunction(),
    findFlightElementsFunction(),
    addAirlineNameFunction(),

    // Extraction functions
    extractAirlineNamesFunction(),
    extractBookingCautionFunction(),
    extractTimesFunction(),
    extractDurationFunction(),
    extractStopsFunction(),
    extractAirportsFunction(),
    extractFlightDetailsFunction(),

    // Main processing function
    findFlightContainersFunction()
  ];

  // Inject these functions into the page context
  await page.evaluateOnNewDocument(`
    ${functionStrings.join("\n\n")}
  `);
}

/**
 * Helper to execute a function in the page context
 * This allows us to keep the main scraping code clean
 */
export async function evaluatePageFunction<T>(
  page: Page,
  functionName: string,
  ...args: unknown[]
): Promise<T> {
  return page.evaluate(
    (fnName, ...fnArgs) => {
      // Execute the named function with the provided arguments
      // @ts-expect-error - We're calling functions that are defined in the page context
      return window[fnName](...fnArgs);
    },
    functionName,
    ...args
  );
}

#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "fs";
import type { Page } from "puppeteer";
import { scrapeFlightPrices } from "../src/google-flights/scrape/scrape-flight-prices";
import { FlightData as ScrapeData } from "../src/types";
import { launchBrowser } from "../src/utils/launch";

type DaysAheadBracket = "1-7" | "8-14" | "15-30" | "31-60" | "61-90";

interface FlightData {
  route: {
    from: string;
    to: string;
  };
  price: number;
  searchDate: string;
  departureDate: string;
  returnDate: string;
  daysUntilDeparture: number;
  departureDay: string;
  returnDay: string;
}

interface DailyData {
  date: string;
  flights: FlightData[];
  metadata: {
    totalRoutes: number;
    successCount: number;
    successRate: number;
    routeStats: {
      dayOfWeekAnalysis: {
        departures: Record<string, number>;
        averagePrices: Record<string, number>;
      };
      daysAheadAnalysis: {
        [key in DaysAheadBracket]: { count: number; avgPrice: number };
      };
    };
  };
}

// Read routes and dates from files
const routes = readFileSync("data/routes.txt", "utf-8").trim().split("\n");
const trips = readFileSync("data/dates.txt", "utf-8")
  .trim()
  .split("\n")
  .map(line => {
    const [departure, returnDate] = line.split("|");
    return { departure, returnDate };
  });

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Read existing data file
const dataFile = "data/flights.json";
const data: DailyData = JSON.parse(readFileSync(dataFile, "utf-8"));
const today = new Date().toISOString().split("T")[0];

async function processRoute(route: string, trip: { departure: string; returnDate: string }): Promise<FlightData | null> {
  try {
    const [from, to] = route.split("-");
    const searchDate = today;
    const departureDate = trip.departure;
    const returnDate = trip.returnDate;

    // Calculate days until departure
    const daysUntilDeparture = Math.floor(
      (new Date(departureDate).getTime() - new Date(searchDate).getTime())
      / (1000 * 60 * 60 * 24)
    );

    // Use the existing flight scraper
    const result = await scrapeFlightPrice({ from, to, departureDate, returnDate });

    return {
      route: { from, to },
      price: result.price,
      searchDate,
      departureDate: trip.departure,
      returnDate: trip.returnDate,
      daysUntilDeparture,
      departureDay: weekDays[new Date(trip.departure).getDay()],
      returnDay: weekDays[new Date(trip.returnDate).getDay()]
    };
  } catch (error) {
    console.error(`Error processing route ${route} for dates ${trip.departure} - ${trip.returnDate}:`, error);
    return null;
  }
}

async function scrapeFlightPrice({ from, to, departureDate, returnDate }: {
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
}): Promise<{ price: number }> {
  const browser = await launchBrowser();
  let page: Page | undefined;

  try {
    page = await browser.newPage();
    // Navigate to Google Flights with currency set to USD
    await page.goto(`https://www.google.com/travel/flights?q=Flights%20from%20${from}%20to%20${to}%20on%20${departureDate}%20returning%20${returnDate}&curr=USD`);

    // Wait for the results to load with a longer timeout
    await page.waitForSelector('li', { timeout: 60000 });

    // Wait additional time for dynamic content
    await page.waitForFunction(() => {
      const priceElements = document.querySelectorAll('[aria-label*="dollars"], [aria-label*="won"]');
      return priceElements.length > 0;
    }, { timeout: 60000 });

    // Scrape flight prices
    const results = await scrapeFlightPrices(page);

    if (results.length === 0) {
      throw new Error("No flights found");
    }

    // Get the lowest price from results, converting from KRW if needed
    const lowestPrice = Math.min(...results.map((r: ScrapeData) => {
      if (r.price > 1000) {
        // Assume KRW if price is large, convert to roughly USD
        return Math.round(r.price / 1300);
      }
      return r.price;
    }));
    return { price: lowestPrice };
  } catch (error) {
    console.error(`Failed to scrape flight price for ${from}-${to} on ${departureDate} returning ${returnDate}:`, error);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
    await browser.close();
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let successCount = 0;
  const totalRoutes = routes.length * trips.length;

  for (const route of routes) {
    for (const trip of trips) {
      // Add random delay between requests
      await sleep(Math.random() * 2000 + 1000);
      const result = await processRoute(route, trip);
      if (result) {
        data.flights.push(result);
        successCount++;
      }
    }
  }

  // Calculate statistics
  const dayStats = {
    departures: {} as Record<string, number>,
    averagePrices: {} as Record<string, number>,
    counts: {} as Record<string, number>
  };

  const daysAheadStats: Record<DaysAheadBracket, { sum: number; count: number }> = {
    "1-7": { sum: 0, count: 0 },
    "8-14": { sum: 0, count: 0 },
    "15-30": { sum: 0, count: 0 },
    "31-60": { sum: 0, count: 0 },
    "61-90": { sum: 0, count: 0 }
  };

  // Process each flight for statistics
  for (const flight of data.flights) {
    // Day of week analysis
    const day = flight.departureDay;
    if (!dayStats.departures[day]) {
      dayStats.departures[day] = 0;
      dayStats.averagePrices[day] = 0;
      dayStats.counts[day] = 0;
    }
    dayStats.departures[day]++;
    dayStats.averagePrices[day] += flight.price;
    dayStats.counts[day]++;

    // Days ahead analysis
    const daysAhead = flight.daysUntilDeparture;
    let bracket: DaysAheadBracket;
    if (daysAhead <= 7) bracket = "1-7";
    else if (daysAhead <= 14) bracket = "8-14";
    else if (daysAhead <= 30) bracket = "15-30";
    else if (daysAhead <= 60) bracket = "31-60";
    else bracket = "61-90";

    daysAheadStats[bracket].sum += flight.price;
    daysAheadStats[bracket].count++;
  }

  // Calculate averages for day of week
  for (const day of Object.keys(dayStats.departures)) {
    dayStats.averagePrices[day] = Math.round(dayStats.averagePrices[day] / dayStats.counts[day]);
  }

  // Calculate averages for days ahead brackets
  const daysAheadAnalysis = Object.entries(daysAheadStats).reduce((acc, [bracket, stats]) => {
    acc[bracket as DaysAheadBracket] = {
      count: stats.count,
      avgPrice: stats.count > 0 ? Math.round(stats.sum / stats.count) : 0
    };
    return acc;
  }, {} as { [key in DaysAheadBracket]: { count: number; avgPrice: number } });

  // Update metadata with statistics
  data.metadata = {
    totalRoutes,
    successCount,
    successRate: (successCount / totalRoutes) * 100,
    routeStats: {
      dayOfWeekAnalysis: {
        departures: dayStats.departures,
        averagePrices: dayStats.averagePrices
      },
      daysAheadAnalysis
    }
  };

  // Save updated data
  writeFileSync(dataFile, JSON.stringify(data, null, 2));

  // Set outputs for GitHub Actions
  console.log(`::set-output name=status::completed`);
  console.log(`::set-output name=total_routes::${totalRoutes}`);
  console.log(`::set-output name=success_rate::${data.metadata.successRate.toFixed(2)}`);
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

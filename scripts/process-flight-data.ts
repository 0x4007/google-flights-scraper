#!/usr/bin/env bun

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface FlightData {
  route: {
    from: string;
    to: string;
  };
  price: number;
  departureDay: string;
  searchDay: string;
  daysAhead: number;
}

interface ProcessedData {
  flights: FlightData[];
  metadata: {
    routeStats: {
      dayOfWeekAnalysis: {
        departures: { [key: string]: number };
        averagePrices: { [key: string]: number };
      };
      daysAheadAnalysis: {
        [key: string]: {
          avgPrice: number;
          count: number;
        };
      };
    };
  };
}

interface AggregatedStats {
  totalPrice: number;
  count: number;
}

// Process command line arguments
const args = process.argv.slice(2);
const fromIndex = args.indexOf("--from") + 1;
const toIndex = args.indexOf("--to") + 1;

if (fromIndex <= 0 || toIndex <= 0) {
  console.error("Missing required arguments: --from and --to");
  process.exit(1);
}

const from = args[fromIndex];
const to = args[toIndex];
const routePath = join("data", "routes", `${from}-${to}`);
const artifactsPath = join("artifacts");

// Initialize processed data structure
const processedData: ProcessedData = {
  flights: [],
  metadata: {
    routeStats: {
      dayOfWeekAnalysis: {
        departures: {},
        averagePrices: {}
      },
      daysAheadAnalysis: {}
    }
  }
};

// Process flight data and calculate statistics
function processFlightData(data: FlightData[]): void {
  const dayStats: { [key: string]: AggregatedStats } = {};
  const aheadStats: { [key: string]: AggregatedStats } = {};

  data.forEach(flight => {
    // Get day of week
    const day = new Date(flight.departureDay).toLocaleDateString('en-US', { weekday: 'long' });

    // Initialize day stats if needed
    if (!dayStats[day]) {
      dayStats[day] = { totalPrice: 0, count: 0 };
    }

    // Update day stats
    dayStats[day].totalPrice += flight.price;
    dayStats[day].count++;

    // Get days ahead bracket (0-5, 6-10, 11-15, 16-20)
    const bracket = Math.floor(flight.daysAhead / 5) * 5;
    const bracketKey = `${bracket}-${bracket + 4}`;

    // Initialize bracket stats if needed
    if (!aheadStats[bracketKey]) {
      aheadStats[bracketKey] = { totalPrice: 0, count: 0 };
    }

    // Update bracket stats
    aheadStats[bracketKey].totalPrice += flight.price;
    aheadStats[bracketKey].count++;
  });

  // Calculate final statistics
  Object.entries(dayStats).forEach(([day, stats]) => {
    processedData.metadata.routeStats.dayOfWeekAnalysis.departures[day] = stats.count;
    processedData.metadata.routeStats.dayOfWeekAnalysis.averagePrices[day] =
      Math.round(stats.totalPrice / stats.count);
  });

  Object.entries(aheadStats).forEach(([bracket, stats]) => {
    processedData.metadata.routeStats.daysAheadAnalysis[bracket] = {
      avgPrice: Math.round(stats.totalPrice / stats.count),
      count: stats.count
    };
  });

  // Store raw flight data
  processedData.flights = data;
}

try {
  // Read and combine all artifact data
  const allFlightData: FlightData[] = [];

  readdirSync(artifactsPath).forEach(file => {
    if (file.startsWith("flight-data-")) {
      const dataPath = join(artifactsPath, file);
      const content = readFileSync(join(dataPath, "urgency-premium", "data.json"), "utf-8");
      const data: FlightData[] = JSON.parse(content);
      allFlightData.push(...data);
    }
  });

  // Process combined data
  processFlightData(allFlightData);

  // Save processed data
  writeFileSync(
    join(routePath, "processed-data.json"),
    JSON.stringify(processedData, null, 2)
  );

  // Update dashboard data
  const dashboardPath = join("data", "flights.json");
  writeFileSync(dashboardPath, JSON.stringify(processedData, null, 2));

  console.log("Data processing completed successfully");
} catch (error) {
  console.error("Error processing flight data:", error);
  process.exit(1);
}

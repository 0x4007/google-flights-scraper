#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const dirs = [
  "data",
  "data/routes",
  "data/routes/ICN-NRT",
  "data/routes/ICN-HND",
  "data/routes/ICN-KIX",
  "data/routes/ICN-CTS",
  "data/routes/ICN-FUK",
  "data/routes/ICN-PVG",
  "data/routes/ICN-PEK",
  "data/routes/ICN-HKG",
  "data/routes/ICN-TPE",
  "data/routes/ICN-MNL",
  "data/routes/ICN-BKK",
  "data/routes/ICN-SGN",
  "data/routes/ICN-SIN",
  "data/routes/ICN-KUL",
  "data/routes/ICN-CGK"
];

// Create directory structure
dirs.forEach(dir => {
  const path = join(process.cwd(), dir);
  if (!existsSync(path)) {
    console.log(`Creating directory: ${dir}`);
    mkdirSync(path, { recursive: true });
  }
});

// Initialize any empty data files needed
const dataFiles = [
  {
    path: join(process.cwd(), "data", "flights.json"),
    content: {
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
    }
  },
  {
    path: join(process.cwd(), "data", "current-route.json"),
    content: {
      lastRoute: "ICN-NRT",
      lastUpdated: new Date().toISOString()
    }
  }
];

dataFiles.forEach(file => {
  if (!existsSync(file.path)) {
    console.log(`Creating file: ${file.path}`);
    writeFileSync(file.path, JSON.stringify(file.content, null, 2));
  }
});

console.log("System initialization completed successfully");

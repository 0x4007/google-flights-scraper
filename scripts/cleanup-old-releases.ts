#!/usr/bin/env bun

import { execSync } from "child_process";

// Calculate date 90 days ago
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

// Format date for comparison
const cutoffDate = ninetyDaysAgo.toISOString().split("T")[0];

try {
  // Get list of all data releases
  const releases = execSync("gh release list", { encoding: "utf-8" })
    .split("\n")
    .filter(line => line.startsWith("data-"))
    .map(line => {
      const releaseDate = line.split("\t")[0].replace("data-", "");
      return { date: releaseDate, name: `data-${releaseDate}` };
    });

  // Filter releases older than 90 days
  const oldReleases = releases.filter(release => release.date < cutoffDate);

  // Delete old releases
  for (const release of oldReleases) {
    console.log(`Deleting old release: ${release.name}`);
    execSync(`gh release delete "${release.name}" --yes`);
  }

  console.log(`Cleanup complete. Deleted ${oldReleases.length} old releases.`);
} catch (error) {
  console.error("Error during cleanup:", error);
  process.exit(1);
}

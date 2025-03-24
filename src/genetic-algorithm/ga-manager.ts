import * as fs from "fs";
import * as path from "path";
import {
  FlightSearchParameters,
  FlightSearchResult,
  GeneticAlgorithmMetadata,
} from "../types";
import { commitChanges, getCurrentGitCommit } from "../utils/git-operations";

/**
 * Class to manage genetic algorithm iterations
 */
export class GeneticAlgorithmManager {
  private currentIteration: number = 0;
  private logsPath: string;
  private bestScore: number = Infinity;

  constructor() {
    // Create logs directory if it doesn't exist
    this.logsPath = path.join(process.cwd(), "logs");
    fs.mkdirSync(this.logsPath, { recursive: true });

    // Try to load the current iteration from existing logs
    this.loadCurrentIteration();
  }

  /**
   * Load the current iteration from existing logs
   */
  private loadCurrentIteration(): void {
    try {
      const files = fs.readdirSync(this.logsPath);

      // Filter for flight result json files and extract iteration numbers
      const iterations = files
        .filter(
          (file) =>
            file.startsWith("flight-iteration-") && file.endsWith(".json"),
        )
        .map((file) => {
          const match = file.match(/flight-iteration-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        });

      // Set current iteration to highest found + 1
      if (iterations.length > 0) {
        this.currentIteration = Math.max(...iterations) + 1;
      }

      console.log(`Starting with iteration ${this.currentIteration}`);
    } catch (error) {
      console.warn("Could not load iteration data:", error);
    }
  }

  /**
   * Calculate a score for the flight results - lower is better
   * @param flightData Array of flight data objects
   * @returns Score (lower is better)
   */
  private calculateScore(flightData: FlightSearchResult["results"]): number {
    if (!flightData.length) return Infinity;

    // For now, just use the lowest price as the score
    // This can be expanded with more complex fitness functions
    const lowestPrice = Math.min(...flightData.map((flight) => flight.price));
    return lowestPrice;
  }

  /**
   * Record a flight search result with genetic algorithm metadata
   * @param parameters The flight search parameters
   * @param flightData The flight data results
   * @returns The full flight search result with metadata
   */
  public async recordResult(
    parameters: FlightSearchParameters,
    flightData: FlightSearchResult["results"],
  ): Promise<FlightSearchResult> {
    // Get current git commit
    const gitCommit = await getCurrentGitCommit();

    // Calculate score
    // const score = this.calculateScore(flightData);
    const success = flightData.length > 0;

    // Create metadata
    const metadata: GeneticAlgorithmMetadata = {
      iteration: this.currentIteration,
      gitCommit,
      timestamp: Date.now(),
      success,
      // score
    };

    console.log({ metadata });

    // Create full result
    const result: FlightSearchResult = {
      parameters,
      metadata,
      results: flightData,
    };

    // Save to file
    const filename = `flight-iteration-${this.currentIteration}-${metadata.timestamp}.json`;
    fs.writeFileSync(
      path.join(this.logsPath, filename),
      JSON.stringify(result, null, 2),
      "utf-8",
    );

    console.log(`Saved flight data for iteration ${this.currentIteration}`);

    // Only perform git commit if we're in development mode (not on GitHub Actions)
    const isDev =
      process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
    if (success && isDev) {
      try {
        const commitResult = await commitChanges(
          `[Iteration ${this.currentIteration}] Successful scrape`,
          this.currentIteration,
        );
        // Don't log success if no changes were committed (already handled in git-operations.ts)
        if (commitResult) {
          console.log(
            `Git operation completed for iteration ${this.currentIteration}`,
          );
        }
      } catch (error) {
        console.warn(`Warning: Could not commit changes: ${error}`);
      }
    } else if (!isDev) {
      console.log(
        `Skipping Git commit as NODE_ENV is not 'development' or 'dev'`,
      );
    }

    // Increment iteration for next run
    this.currentIteration++;

    return result;
  }

  /**
   * Get the current iteration number
   */
  public getIteration(): number {
    return this.currentIteration;
  }
}

// Export a singleton instance
export const gaManager = new GeneticAlgorithmManager();

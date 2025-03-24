# Randomized Flight Search Testing

This document explains the randomized testing system implemented for the flight search scraper, including how to use it, how it works, and its benefits for testing.

## Overview

The randomized testing system allows you to test the flight search functionality across a wide variety of city pairs and date combinations automatically. Rather than manually configuring each test, the system generates random parameters and runs multiple tests in parallel, providing broader test coverage with minimal setup.

## System Components

### 1. Random Parameter Generator

The core of the randomized testing is in `src/utils/generate-random-parameters.ts`, which provides functions to:

- Generate random city pairs from a predefined list of popular origins and destinations
- Create random future departure dates (30-180 days from now)
- Calculate random stay durations (3-21 days)
- Randomize settings like budget carrier inclusion

```typescript
// Example of generating random parameters
import { generateRandomParameters } from "./src/utils/generate-random-parameters";

const params = generateRandomParameters();
console.log(params);
// Output: { from: "Seoul", to: "Tokyo", departureDate: "2025-08-15", returnDate: "2025-08-25", includeBudget: true }
```

### 2. Test Runner Script

The test runner script at `scripts/run-random-tests.ts` orchestrates the execution of multiple randomized tests:

- Accepts command line arguments for controlling the number of tests
- Generates random parameters for each test
- Creates unique test directories with timestamps
- Saves detailed information about each test run
- Captures screenshots at key points during the test
- Handles errors gracefully with detailed logging

### 3. GitHub Actions Matrix Workflow

The GitHub Actions workflow in `.github/workflows/flight-scraper-tests.yml` implements a matrix strategy with 10 parallel jobs, each testing different random parameters:

- Each job uses a unique random seed derived from its matrix index
- Tests run in parallel for faster feedback
- Results are collected as artifacts for each job
- The workflow can be manually triggered with a configurable number of tests per job

## How to Use

### Local Testing

For local testing, several npm scripts are provided:

```bash
# Run 3 random tests
bun run test

# Run a single random test
bun run test:single

# Run 10 random tests
bun run test:many

# Run with specific count
bun scripts/run-random-tests.ts --count 5
```

You can also provide specific parameters while using the random test infrastructure:

```bash
# Run the random test script with specific parameters
bun scripts/run-random-tests.ts --from "New York" --to "Los Angeles" --departure "2025-05-01" --return "2025-05-10"
```

### GitHub Actions

The matrix-based workflow runs automatically on push and pull requests. You can also trigger it manually from the GitHub Actions UI, with the option to specify how many tests should run per job.

## Test Output

Each test run produces:

1. **Screenshots**: Multiple screenshots are taken during the test:
   - Initial results page
   - Results after applying filters
   - Final state of the page

2. **Flight Data**: The extracted flight information is saved as JSON for analysis

3. **Parameters**: The exact parameters used for each test are saved

4. **Error Logs**: If a test fails, detailed error information is captured

All outputs are organized in timestamped directories under the `screenshot` folder.

## Predefined City Pairs

The following city pairs are included in the randomization pool:

- Seoul to Tokyo
- New York to London
- San Francisco to Tokyo
- London to Paris
- Singapore to Bangkok
- Los Angeles to New York
- Beijing to Shanghai
- Sydney to Melbourne
- Dubai to Istanbul
- Toronto to Vancouver
- Berlin to Munich
- Madrid to Barcelona
- Rome to Milan
- Amsterdam to Paris
- Bangkok to Hong Kong

## Benefits

The randomized testing approach provides several advantages:

1. **Increased Coverage**: Tests a wide variety of inputs automatically
2. **Edge Case Discovery**: Random combinations may uncover issues not found in standard testing
3. **Resilience Testing**: Verifies the scraper works across different city pairs and dates
4. **Time Efficiency**: Parallel testing in GitHub Actions provides faster feedback
5. **Maintenance Reduction**: No need to manually update test parameters as dates age

## Extending the System

To extend the randomized testing:

1. **Add More City Pairs**: Update the `POPULAR_CITY_PAIRS` array in `generate-random-parameters.ts`
2. **Adjust Date Ranges**: Modify the min/max values in the date generation functions
3. **Add Parameters**: Extend the parameter generation to include additional options
4. **Increase Matrix Size**: Update the matrix configuration in the GitHub workflow

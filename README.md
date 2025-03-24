# Puppeteer on GitHub Actions with Bun & TypeScript

A proof-of-concept repository demonstrating Puppeteer screen capture on GitHub Actions for flight search scraping, built with Bun and TypeScript.

## Purpose

This repository serves as a demonstration of using Puppeteer within GitHub Actions to take screenshots of web pages and scrape flight information. Specifically, it navigates to flights.google.com, performs searches, and captures screenshots and data to illustrate how web scraping can be implemented in GitHub Actions.

## Features

- Flight search using Puppeteer automation
- Screenshot capture of search results
- Flight data extraction and processing
- Randomized testing with varied city pairs and dates
- Matrix-based GitHub Actions workflow for parallel testing
- Result artifacts collection

## How It Works

The repository contains:

1. TypeScript scripts for flight search automation and data scraping
2. Utilities for randomized parameter generation and testing
3. GitHub Actions workflows:
   - `.github/workflows/puppeteer-screenshot.yml` - Basic flight search with configurable parameters
   - `.github/workflows/flight-scraper-tests.yml` - Matrix-based randomized testing across multiple city/date combinations

## Running Locally

To test this repository locally:

```bash
# Install dependencies
bun install

# Run a standard flight search test
bun run start

# Run with random parameters
bun run test                # 3 random tests
bun run test:single         # 1 random test
bun run test:many           # 10 random tests
```

The screenshots and results will be saved to the `screenshot` directory.

## Randomized Testing

The repository includes a powerful randomized testing system that:

1. Generates random combinations of city pairs and dates
2. Runs tests with these varied parameters
3. Captures screenshots, flight data, and error logs
4. Saves all test artifacts for later analysis

This allows for comprehensive testing across many different search scenarios without manual configuration.

## GitHub Actions Matrix Testing

The `.github/workflows/flight-scraper-tests.yml` workflow uses a matrix strategy with 10 parallel jobs to test multiple city and date combinations simultaneously. Each job:

1. Uses a unique random seed based on matrix index and timestamp
2. Runs flight search tests with randomized parameters
3. Uploads per-job artifacts with screenshots, flight data, and test parameters

This provides excellent test coverage across many different possible search combinations.

## Viewing the Results

After the GitHub Action completes:

1. Go to the Actions tab in the repository
2. Click on the completed workflow run
3. Scroll to the bottom to find the "Artifacts" section
4. Download the artifacts to view the captured images and data

## Common Issues with Puppeteer on GitHub Actions

1. **Resource limitations**: GitHub-hosted runners have CPU and memory constraints that may affect Puppeteer performance
2. **Network access**: Some websites may block requests from GitHub Actions IP ranges
3. **Rendering differences**: Headless browsers on CI systems may render differently than on local machines
4. **CAPTCHA/bot detection**: Many sites (especially flight/travel sites) have sophisticated bot detection that may block automated access

If the tests are not completing as expected, examine the workflow logs and error artifacts for diagnostic information.

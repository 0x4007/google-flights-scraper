# Puppeteer on GitHub Actions

A minimal proof-of-concept repository demonstrating issues with Puppeteer screen capture on GitHub Actions.

## Purpose

This repository serves as a minimal demonstration of using Puppeteer within GitHub Actions to take screenshots of web pages. Specifically, it attempts to capture a screenshot of flights.google.com to illustrate potential challenges with web scraping on GitHub Actions.

## How It Works

The repository contains:

1. A simple Node.js script (`take-screenshot.js`) that uses Puppeteer to navigate to flights.google.com and capture a screenshot
2. A GitHub Actions workflow (`.github/workflows/puppeteer-screenshot.yml`) that runs this script on push, pull request, or manual trigger
3. Configuration to upload the resulting screenshots as GitHub artifacts

## Running Locally

To test this repository locally:

```bash
# Install dependencies
npm ci

# Take screenshot
node take-screenshot.js
```

The screenshot will be saved to the `screenshot` directory.

## GitHub Action Details

The GitHub Action workflow:

1. Runs on Ubuntu latest
2. Sets up Node.js 20
3. Installs dependencies
4. Runs the screenshot script
5. Uploads any PNG files in the screenshot directory as artifacts

## Viewing the Screenshots

After the GitHub Action completes:

1. Go to the Actions tab in the repository
2. Click on the completed workflow run
3. Scroll to the bottom to find the "Artifacts" section
4. Download the "flight-screenshots" artifact to view the captured images

## Common Issues with Puppeteer on GitHub Actions

1. **Resource limitations**: GitHub-hosted runners have CPU and memory constraints that may affect Puppeteer performance
2. **Network access**: Some websites may block requests from GitHub Actions IP ranges
3. **Rendering differences**: Headless browsers on CI systems may render differently than on local machines
4. **CAPTCHA/bot detection**: Many sites (especially flight/travel sites) have sophisticated bot detection that may block automated access

If the screenshots are not being captured as expected, examine the workflow logs for error messages that might indicate which of these issues you're encountering.

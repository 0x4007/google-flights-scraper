import * as fs from "fs";
import * as path from "path";
import { Page } from "puppeteer";

/**
 * Captures the DOM structure in a concise text format for LLM analysis
 * @param page The Puppeteer page object
 * @param prefix Optional prefix for the output filename
 * @returns Path to the saved file
 */
export async function captureDOMStructure(
  page: Page,
  prefix: string = "flight-search"
): Promise<string> {
  console.log("Capturing DOM structure for analysis...");

  const domData = await page.evaluate(() => {
    // Create a concise tree representation of the DOM
    function createConciseTree() {
      // Helper to get a short selector path for an element
      function getElementPath(element: Element, maxDepth = 3): string {
        const parts = [];
        let current: Element | null = element;
        let depth = 0;

        while (current && depth < maxDepth) {
          let descriptor = current.tagName.toLowerCase();

          // Add important attributes to help identify the element
          if (current.id) {
            descriptor += `#${current.id}`;
          } else if (current.className && typeof current.className === 'string') {
            const classes = current.className.split(/\s+/).filter(Boolean).slice(0, 2);
            if (classes.length) {
              descriptor += `.${classes.join('.')}`;
            }
          }

          // Add role attribute if present (important for accessibility)
          const role = current.getAttribute('role');
          if (role) {
            descriptor += `[role="${role}"]`;
          }

          // Add aria-label if present (often contains semantic information)
          const ariaLabel = current.getAttribute('aria-label');
          if (ariaLabel && ariaLabel.length < 30) {
            descriptor += `[aria-label="${ariaLabel}"]`;
          }

          parts.unshift(descriptor);
          current = current.parentElement;
          depth++;
        }

        return parts.join(' > ');
      }

      // Find flight elements - focus on what's important
      function findFlightElements() {
        // Look for li elements with price indicators
        return Array.from(document.querySelectorAll("li")).filter(li => {
          return (
            li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
            li.querySelector('span[aria-label*="US dollars"]') !== null ||
            (li.textContent?.includes("$") &&
             Array.from(li.querySelectorAll("div")).some(
               div => /^\d+\s*hr/.test(div.textContent?.trim() || "")
             ))
          ) && !li.textContent?.includes("View more flights");
        });
      }

      // Find all important elements
      const flightElements = findFlightElements();
      const priceElements = Array.from(document.querySelectorAll('span[aria-label*="US dollars"], [data-gs]'));
      const airlineElements = Array.from(document.querySelectorAll('div[aria-label*="Airlines"], img[alt*="Airlines"]'));
      const airportElements = Array.from(document.querySelectorAll('span[aria-label*="Airport"]'));
      const timeElements = Array.from(document.querySelectorAll('div')).filter(el =>
        /^\d{1,2}:\d{2}\s*(?:AM|PM)$/.test(el.textContent?.trim() || "")
      );
      const durationElements = Array.from(document.querySelectorAll('div')).filter(el =>
        /^\d+\s*hr\s*(?:\d+\s*min)?$/.test(el.textContent?.trim() || "")
      );

      // Build a concise text representation
      let output = "";

      // Add page info
      output += `PAGE: ${document.title}\n`;
      output += `URL: ${window.location.href}\n`;
      output += `TIMESTAMP: ${new Date().toISOString()}\n\n`;

      // Add statistics
      output += `STATISTICS:\n`;
      output += `- Flight elements: ${flightElements.length}\n`;
      output += `- Price elements: ${priceElements.length}\n`;
      output += `- Airline elements: ${airlineElements.length}\n`;
      output += `- Airport elements: ${airportElements.length}\n`;
      output += `- Time elements: ${timeElements.length}\n`;
      output += `- Duration elements: ${durationElements.length}\n\n`;

      // Add flight element details
      output += `FLIGHT ELEMENTS:\n`;
      flightElements.slice(0, 5).forEach((el, i) => {
        output += `[${i + 1}] Path: ${getElementPath(el)}\n`;
        output += `    Price: ${el.querySelector('span[aria-label*="US dollars"]')?.getAttribute('aria-label') || 'N/A'}\n`;
        output += `    Text: ${el.textContent?.trim().substring(0, 100).replace(/\s+/g, ' ')}...\n`;

        // Get all important aria labels
        const ariaElements = Array.from(el.querySelectorAll('[aria-label]'));
        const ariaLabels = ariaElements.map(ae => ae.getAttribute('aria-label')).filter(Boolean);
        if (ariaLabels.length > 0) {
          output += `    Aria labels: ${ariaLabels.slice(0, 3).join(' | ')}\n`;
        }

        output += '\n';
      });

      if (flightElements.length > 5) {
        output += `... and ${flightElements.length - 5} more flight elements\n\n`;
      }

      // Add price element details
      output += `PRICE ELEMENTS:\n`;
      priceElements.slice(0, 5).forEach((el, i) => {
        output += `[${i + 1}] Path: ${getElementPath(el)}\n`;
        output += `    Value: ${el.getAttribute('aria-label') || el.textContent?.trim()}\n`;
      });
      output += '\n';

      // Add airline element details
      output += `AIRLINE ELEMENTS:\n`;
      airlineElements.slice(0, 5).forEach((el, i) => {
        output += `[${i + 1}] Path: ${getElementPath(el)}\n`;
        output += `    Text: ${el.textContent?.trim() || el.getAttribute('alt') || 'N/A'}\n`;
      });
      output += '\n';

      // Add airport element details
      output += `AIRPORT ELEMENTS:\n`;
      airportElements.slice(0, 5).forEach((el, i) => {
        output += `[${i + 1}] Path: ${getElementPath(el)}\n`;
        output += `    Text: ${el.textContent?.trim() || el.getAttribute('aria-label') || 'N/A'}\n`;
      });
      output += '\n';

      // Add example of a complete flight element with key data points
      if (flightElements.length > 0) {
        const sampleFlight = flightElements[0];
        output += `SAMPLE FLIGHT STRUCTURE:\n`;

        // Function to print element and its children in a tree format
        function printElementTree(element: Element, indent = 0): string {
          const indentStr = '  '.repeat(indent);
          let result = `${indentStr}${element.tagName.toLowerCase()}`;

          // Add important attributes
          const id = element.id;
          const className = element.className;
          const role = element.getAttribute('role');
          const ariaLabel = element.getAttribute('aria-label');

          if (id) result += `#${id}`;
          if (className && typeof className === 'string') {
            const classes = className.split(/\s+/).filter(Boolean).slice(0, 2);
            if (classes.length) result += `.${classes.join('.')}`;
          }
          if (role) result += `[role="${role}"]`;

          // Add text content if it's a leaf node or has important text
          const text = element.textContent?.trim();
          if (text && element.children.length === 0) {
            result += `: "${text.substring(0, 40)}"`;
            if (text.length > 40) result += '...';
          } else if (ariaLabel && ariaLabel.length < 30) {
            result += `: aria-label="${ariaLabel}"`;
          }

          result += '\n';

          // Process children (limit depth to avoid too much output)
          if (indent < 3) {
            const children = Array.from(element.children);
            children.slice(0, 5).forEach(child => {
              result += printElementTree(child, indent + 1);
            });

            if (children.length > 5) {
              result += `${indentStr}  ... and ${children.length - 5} more elements\n`;
            }
          } else if (element.children.length > 0) {
            result += `${indentStr}  ... (truncated ${element.children.length} children)\n`;
          }

          return result;
        }

        output += printElementTree(sampleFlight);
      }

      return output;
    }

    return createConciseTree();
  });

  // Create directory if it doesn't exist
  const outputDir = path.join(process.cwd(), "dom-captures");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const outputFilePath = path.join(outputDir, `${prefix}-dom-structure-${timestamp}.txt`);

  // Write the DOM data to file as plain text
  fs.writeFileSync(outputFilePath, domData);

  console.log(`DOM structure saved to: ${outputFilePath}`);
  return outputFilePath;
}

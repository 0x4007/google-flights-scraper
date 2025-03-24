import * as fs from "fs";
import * as path from "path";
import { Page } from "puppeteer";

/**
 * Captures the DOM structure with a focus on flight elements and exports it to a file
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
    /**
     * Recursively captures element structure with attributes and text
     * @param element The DOM element to capture
     * @param maxDepth Maximum depth to traverse
     * @param currentDepth Current depth in the traversal
     * @returns Structured representation of the element and its children
     */
    // Define types for the captured element structure
    interface CapturedElement {
      tagName: string;
      attributes?: Record<string, string>;
      textContent?: string;
      children?: CapturedElement[];
      hidden?: boolean;
      truncated?: boolean;
    }

    function captureElement(
      element: Element,
      maxDepth: number = 10,
      currentDepth: number = 0
    ): CapturedElement {
      if (currentDepth > maxDepth) return {
        tagName: "truncated",
        truncated: true
      };

      // Basic element info
      const tagName = element.tagName.toLowerCase();

      // Capture attributes
      const attributes: Record<string, string> = {};
      for (const attr of Array.from(element.attributes)) {
        attributes[attr.name] = attr.value;
      }

      // Capture text content (trimmed)
      const textContent = element.textContent?.trim() || "";

      // Create element representation
      const result: CapturedElement = {
        tagName,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        textContent: textContent.length > 0 ? textContent : undefined,
      };

      // Filter out invisible elements
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") {
        result.hidden = true;
        return result;
      }

      // Recursively capture children
      const children = Array.from(element.children).filter(child =>
        child.nodeType === Node.ELEMENT_NODE
      );

      if (children.length > 0) {
        result.children = children.map(child =>
          captureElement(child, maxDepth, currentDepth + 1)
        );
      }

      return result;
    }

    /**
     * Finds flight elements in the DOM
     */
    function findFlightElements() {
      // First method: look for li elements with price indicators
      let elements = Array.from(document.querySelectorAll("li")).filter(
        (li) => {
          return (
            li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
            li.querySelector('span[aria-label*="US dollars"]') !== null ||
            (li.textContent?.includes("$") &&
             Array.from(li.querySelectorAll("div")).some(
               div => /^\d+\s*hr/.test(div.textContent?.trim() || "")
             ))
          );
        }
      );

      // Filter out "View more flights" buttons
      elements = elements.filter(
        (el) => !el.querySelector('button[aria-label="View more flights"]') &&
          !el.textContent?.includes("View more flights")
      );

      return elements;
    }

    // Capture key page sections
    const flightElements = findFlightElements();
    const containerElements = flightElements
      .map(el => el.closest('[role="region"]') || el.closest('div[role="list"]'))
      .filter((el, i, arr) => el && arr.indexOf(el) === i); // Unique containers only

    // Structure the DOM capture
    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      documentTitle: document.title,
      pageStructure: {
        // Overall page structure (limited depth)
        body: captureElement(document.body, 3),

        // Full details for flight-related containers
        flightContainers: containerElements.map(el =>
          el ? captureElement(el, 5) : null
        ).filter(Boolean),

        // Detailed structure of each flight element
        flightElements: flightElements.map(el => captureElement(el, 6)),

        // Special elements of interest
        priceElements: Array.from(document.querySelectorAll('span[aria-label*="US dollars"], [data-gs]'))
          .map(el => captureElement(el, 2)),

        airlineElements: Array.from(document.querySelectorAll('div[aria-label*="Airlines"], img[alt*="Airlines"]'))
          .map(el => captureElement(el, 2)),

        airportElements: Array.from(document.querySelectorAll('span[aria-label*="Airport"]'))
          .map(el => captureElement(el, 2))
      },
      statistics: {
        totalFlightElements: flightElements.length,
        totalContainers: containerElements.length,
        priceElementsCount: document.querySelectorAll('span[aria-label*="US dollars"], [data-gs]').length,
        airlineElementsCount: document.querySelectorAll('div[aria-label*="Airlines"], img[alt*="Airlines"]').length,
        airportElementsCount: document.querySelectorAll('span[aria-label*="Airport"]').length
      }
    };
  });

  // Create directory if it doesn't exist
  const outputDir = path.join(process.cwd(), "dom-captures");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const outputFilePath = path.join(outputDir, `${prefix}-dom-structure-${timestamp}.json`);

  // Write the DOM data to file
  fs.writeFileSync(outputFilePath, JSON.stringify(domData, null, 2));

  console.log(`DOM structure saved to ${outputFilePath}`);
  return outputFilePath;
}

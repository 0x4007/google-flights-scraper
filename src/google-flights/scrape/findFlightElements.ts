// Helper function to identify flight list items

export function findFlightElements(container: Element | Document): Element[] {
  // First use standard selectors and then filter
  let elements = Array.from(container.querySelectorAll("li")).filter(
    (li) => {
      return (
        li.querySelector('span[data-gs][aria-label*="US dollars"]') !==
        null ||
        li.querySelector('span[aria-label*="US dollars"]') !== null
      );
    }
  );

  // If nothing found, try broader approach
  if (elements.length === 0) {
    // Find li elements with price tags inside
    elements = Array.from(container.querySelectorAll("li")).filter(
      (li) => {
        // Look for price patterns
        const hasPrice = li.textContent?.includes("$") ||
          !!li.querySelector('span[aria-label*="dollars"]');

        // Verify it's a flight by checking for flight-related content
        const hasDuration = Array.from(li.querySelectorAll("div")).some(
          (div) => /^\d+\s*hr/.test(div.textContent?.trim() || "")
        );

        return hasPrice && hasDuration;
      }
    );
  }

  // Filter out any "View more flights" buttons or other non-flight items
  return elements.filter(
    (el) => !el.querySelector('button[aria-label="View more flights"]') &&
      !el.textContent?.includes("View more flights")
  );
}

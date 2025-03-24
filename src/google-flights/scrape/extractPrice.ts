// Helper function to extract price from aria-label

export function extractPrice(element: Element | null): number {
  if (!element) return -1;

  // First try using aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    // Extract price from aria-label containing "US dollars"
    // This matches formats like "386 US dollars" or "From 386 US dollars round trip total"
    const match = ariaLabel.match(/(\d+)\s+US dollars/);
    if (match && match[1]) {
      const price = parseInt(match[1], 10);
      if (!isNaN(price)) {
        return price;
      }
    }
  }

  // Fallback: try to extract from text content if aria-label doesn't work
  const text = element.textContent?.trim();
  if (text) {
    // Match "$XXX" format
    const dollarMatch = text.match(/\$(\d+)/);
    if (dollarMatch && dollarMatch[1]) {
      const price = parseInt(dollarMatch[1], 10);
      if (!isNaN(price)) {
        return price;
      }
    }

    // If no dollar sign, try just matching digits
    const digitMatch = text.match(/^(\d+)$/);
    if (digitMatch && digitMatch[1]) {
      const price = parseInt(digitMatch[1], 10);
      if (!isNaN(price)) {
        return price;
      }
    }
  }

  return -1;
}

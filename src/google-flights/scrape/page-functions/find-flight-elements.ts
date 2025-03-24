/**
 * Returns a string function for finding flight elements within a container
 */
export function findFlightElementsFunction(): string {
  return `
    function findFlightElements(container) {
      // Find li elements that are likely flight cards
      return Array.from(container.querySelectorAll("li")).filter(li => {
        // Must have price information
        const hasPriceElement =
          li.querySelector('span[data-gs][aria-label*="US dollars"]') !== null ||
          li.querySelector('span[aria-label*="US dollars"]') !== null ||
          li.textContent?.includes("$");

        // Should have duration information
        const hasDuration = Array.from(li.querySelectorAll("div")).some(
          div => /^\\d+\\s*hr/.test(div.textContent?.trim() || "")
        );

        // Exclude "View more flights" buttons
        const isNotButton =
          !li.querySelector('button[aria-label*="more flights"]') &&
          !li.textContent?.includes("View more flights");

        // Must have all the characteristics to be considered a flight card
        return hasPriceElement && hasDuration && isNotButton;
      });
    }
  `;
}

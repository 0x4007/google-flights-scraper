/**
 * Returns a string function for finding flight containers and extracting flight data
 */
export function findFlightContainersFunction(): string {
  return `
    function findFlightContainers() {
      const flightData = [];
      const flightSections = new Map();
      let foundAnyFlights = false;

      // Try to find flights by section headers first (Best flights, Cheapest, etc.)
      const headers = Array.from(document.querySelectorAll("h3"));

      for (const header of headers) {
        const headerText = header.textContent || "";
        const isTopSection = headerText.includes("Top departing flights") ||
                             headerText.includes("Best departing flights");

        const region = header.closest('[role="region"]') || header.parentElement;

        if (!region) continue;

        const container = isTopSection
          ? region.querySelector('[role="tabpanel"]') || region
          : region;

        // Find all flight list items in this container
        const flightElements = findFlightElements(container);

        if (flightElements.length > 0) {
          flightSections.set(container, {
            isTopSection,
            elements: flightElements,
          });
          foundAnyFlights = true;
          console.debug(
            \`Found \${flightElements.length} flights near header "\${headerText}" (isTop: \${isTopSection})\`
          );
        }
      }

      // If no flights found by headers, try a more general approach
      if (!foundAnyFlights) {
        console.debug("No flights found by headers, trying direct search");
        const flightElements = findFlightElements(document.body);

        if (flightElements.length > 0) {
          flightSections.set(document.body, {
            isTopSection: false, // Can't determine if they're top flights
            elements: flightElements,
          });
          console.debug(
            \`Found \${flightElements.length} flights using direct page search\`
          );
        }
      }

      // Extra debug info
      console.debug(
        \`Total flight sections found: \${flightSections.size}\`,
        Array.from(flightSections.entries()).map(
          ([el, { isTopSection, elements }]) => ({
            role: el.getAttribute("role"),
            isTop: isTopSection,
            count: elements.length,
          })
        )
      );

      // Process each flight using the modular extraction functions
      for (const [_, { isTopSection, elements }] of flightSections.entries()) {
        for (const flightElement of elements) {
          try {
            // Extract all details from the flight element using our modular approach
            const flightDetails = extractFlightDetails(flightElement);

            if (flightDetails) {
              // Mark whether this is a top flight or not
              flightDetails.isTopFlight = isTopSection;
              flightData.push(flightDetails);
            }
          } catch (error) {
            console.warn("Error extracting flight details:", error);
          }
        }
      }

      return flightData;
    }
  `;
}

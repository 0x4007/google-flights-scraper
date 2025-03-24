import { extractAirlineNames } from "./google-flights/scrape/extract-airline-names";

// Create a mock DOM structure similar to what we see in the flight results
// This will mimic the Italian route with ITA airlines
function createMockFlightElement(): HTMLElement {
  const flightElement = document.createElement('div');

  // Create the structure with airline info (similar to what we see in the DOM)
  flightElement.innerHTML = `
    <div>
      <div>
        <span aria-label="Leaves Leonardo da Vinci International Airport at 7:00 AM on Monday, August 18 and arrives at Milan Linate Airport at 8:10 AM on Monday, August 18.">
          <span>
            <span aria-label="Departure time: 7:00 AM.">
              <span aria-label="Departure time: 7:00 AM.">7:00 AM</span>
            </span>
          </span>
          &nbsp;–&nbsp;
          <span>
            <span>
              <span aria-label="Arrival time: 8:10 AM.">
                <span aria-label="Arrival time: 8:10 AM.">8:10 AM</span>
              </span>
            </span>
          </span>
        </span>
        <div><span>ITA</span></div>
      </div>
      <div aria-label="Total duration 1 hr 10 min.">1 hr 10 min</div>
      <div>
        <div><span aria-label="Nonstop flight.">Nonstop</span></div>
      </div>
    </div>
  `;

  return flightElement;
}

// Create another test case for AEROITALIA
function createAeroitaliaFlightElement(): HTMLElement {
  const flightElement = document.createElement('div');

  flightElement.innerHTML = `
    <div>
      <div>
        <span aria-label="Leaves Leonardo da Vinci International Airport at 9:30 AM on Monday, August 18 and arrives at Milano Malpensa Airport at 10:55 AM on Monday, August 18.">
          <span>
            <span aria-label="Departure time: 9:30 AM.">
              <span aria-label="Departure time: 9:30 AM.">9:30 AM</span>
            </span>
          </span>
          &nbsp;–&nbsp;
          <span>
            <span>
              <span aria-label="Arrival time: 10:55 AM.">
                <span aria-label="Arrival time: 10:55 AM.">10:55 AM</span>
              </span>
            </span>
          </span>
        </span>
        <div><span>AEROITALIA SRL</span></div>
      </div>
      <div aria-label="Total duration 1 hr 25 min.">1 hr 25 min</div>
      <div>
        <div><span aria-label="Nonstop flight.">Nonstop</span></div>
      </div>
    </div>
  `;

  return flightElement;
}

// Test the airline extraction
console.log("======= TESTING AIRLINE EXTRACTION =======");

// Test ITA extraction
const itaElement = createMockFlightElement();
const itaAirlines = extractAirlineNames(itaElement);
console.log("ITA Airlines extraction:", itaAirlines);

// Test AEROITALIA extraction
const aeroitaliaElement = createAeroitaliaFlightElement();
const aeroitaliaAirlines = extractAirlineNames(aeroitaliaElement);
console.log("AEROITALIA extraction:", aeroitaliaAirlines);

// Check if both extractions worked as expected
const testPassed =
  itaAirlines.includes("ITA") &&
  aeroitaliaAirlines.includes("AEROITALIA SRL");

console.log("\nTest result:", testPassed ? "✅ PASSED" : "❌ FAILED");
console.log("======= END OF TEST =======");

// Exit with appropriate code
process.exit(testPassed ? 0 : 1);

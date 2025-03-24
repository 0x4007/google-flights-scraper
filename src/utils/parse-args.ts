import { FlightSearchParameters } from "../types";

const DEFAULT_FROM = "Seoul";
const DEFAULT_TO = "Tokyo";

export function parseArgs(args: string[]): FlightSearchParameters {
  const params = new Map<string, string>();
  let isBudgetIncluded = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      if (arg === "--include-budget") {
        isBudgetIncluded = true;
        continue;
      }

      const value = args[i + 1];
      // Skip args starting with --
      if (!value || value.startsWith("--")) {
        continue;
      }

      // Remove the '--' prefix and store the key-value pair if value is not empty
      const trimmedValue = value.trim();
      if (trimmedValue && trimmedValue !== '""') {
        // Map old parameter names to new ones
        const key =
          arg.slice(2) === "departure"
            ? "departureDate"
            : arg.slice(2) === "return"
              ? "returnDate"
              : arg.slice(2);
        params.set(key, trimmedValue);
      }
      i++; // Skip the next argument since we used it as a value
    }
  }

  // Apply defaults for required parameters if missing
  if (!params.has("from")) {
    params.set("from", DEFAULT_FROM);
  }
  if (!params.has("to")) {
    params.set("to", DEFAULT_TO);
  }

  // Map old parameter name to new one if necessary
  if (params.has("departure")) {
    params.set("departureDate", params.get("departure")!);
    params.delete("departure");
  }
  if (params.has("return")) {
    params.set("returnDate", params.get("return")!);
    params.delete("return");
  }

  // Validate required dates
  if (!params.has("departureDate")) {
    throw new Error("Missing required parameter: --departure");
  }
  if (!params.has("returnDate")) {
    throw new Error("Missing required parameter: --return");
  }

  // Build and validate dates
  const departureDate = new Date(params.get("departureDate")!);
  if (isNaN(departureDate.getTime())) {
    throw new Error("Invalid departure date format. Use YYYY-MM-DD");
  }

  const returnDate = new Date(params.get("returnDate")!);
  if (isNaN(returnDate.getTime())) {
    throw new Error("Invalid return date format. Use YYYY-MM-DD");
  }
  if (returnDate < departureDate) {
    throw new Error("Return date cannot be earlier than departure date");
  }

  return {
    from: params.get("from")!,
    to: params.get("to")!,
    departureDate: params.get("departureDate")!,
    returnDate: params.get("returnDate")!,
    includeBudget: isBudgetIncluded,
  };
}

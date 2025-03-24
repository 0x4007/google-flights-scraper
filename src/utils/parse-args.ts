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
        params.set(arg.slice(2), trimmedValue);
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

  // Validate departure date (always required)
  if (!params.has("departure")) {
    throw new Error("Missing required parameter: departure");
  }

  // Build and validate dates
  const departure = new Date(params.get("departure")!);
  if (isNaN(departure.getTime())) {
    throw new Error("Invalid departure date format. Use YYYY-MM-DD");
  }

  let returnDate: Date | undefined;
  if (params.has("return")) {
    returnDate = new Date(params.get("return")!);
    if (isNaN(returnDate.getTime())) {
      throw new Error("Invalid return date format. Use YYYY-MM-DD");
    }
    if (returnDate < departure) {
      throw new Error("Return date cannot be earlier than departure date");
    }
  }

  return {
    from: params.get("from")!,
    to: params.get("to")!,
    departure: params.get("departure")!,
    return: params.get("return"),
    includeBudget: isBudgetIncluded,
  };
}

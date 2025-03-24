import { FlightSearchParameters } from '../types';

export function parseArgs(args: string[]): FlightSearchParameters {
  const params = new Map<string, string>();
  let includeBudget = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      if (arg === '--include-budget') {
        includeBudget = true;
        continue;
      }

      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for argument: ${arg}`);
      }

      // Remove the '--' prefix and store the key-value pair
      params.set(arg.slice(2), value);
      i++; // Skip the next argument since we used it as a value
    }
  }

  // Validate required parameters
  const requiredParams = ['from', 'to', 'departure'];
  for (const param of requiredParams) {
    if (!params.has(param)) {
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // Build and validate dates
  const departure = new Date(params.get('departure')!);
  if (isNaN(departure.getTime())) {
    throw new Error('Invalid departure date format. Use YYYY-MM-DD');
  }

  let returnDate: Date | undefined;
  if (params.has('return')) {
    returnDate = new Date(params.get('return')!);
    if (isNaN(returnDate.getTime())) {
      throw new Error('Invalid return date format. Use YYYY-MM-DD');
    }
    if (returnDate < departure) {
      throw new Error('Return date cannot be earlier than departure date');
    }
  }

  return {
    from: params.get('from')!,
    to: params.get('to')!,
    departure: params.get('departure')!,
    return: params.get('return'),
    includeBudget
  };
}

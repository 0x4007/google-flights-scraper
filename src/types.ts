export interface FlightSearchParameters {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  includeBudget: boolean;
}

export interface GeneticAlgorithmMetadata {
  iteration: number;
  gitCommit: string;
  timestamp: number;
  success: boolean;
  // score: number;
}

export interface FlightData {
  price: number;
  airlines: string[];
  bookingCaution: null | string;
  departureTime: null | string;
  arrivalTime: null | string;
  duration: null | string;
  stops: number;
  origin: null | string;
  destination: null | string;
  isTopFlight: boolean;

  // Formatted display fields for output
  formattedPrice?: string;
  formattedRoute?: string;
  formattedTimings?: string;

  // Enhanced metadata fields
  departureTimeDetails?: {
    time: string; // e.g., "6:30 PM"
    date: string; // e.g., "Mon, Mar 31"
    fullTimestamp: string; // e.g., "6:30 PM on Mon, Mar 31"
  };
  arrivalTimeDetails?: {
    time: string;
    date: string;
    fullTimestamp: string;
    nextDay?: boolean; // Indicates "+1" for next-day arrival
  };
  originDetails?: {
    code: string; // e.g., "ICN"
    fullName: string; // e.g., "Incheon International Airport"
  };
  destinationDetails?: {
    code: string; // e.g., "NRT"
    fullName: string; // e.g., "Narita International Airport"
  };
  durationMinutes?: number; // Duration converted to minutes for easier comparison
  emissions?: {
    value: number; // e.g., 118
    unit: string; // e.g., "kg CO2e"
    comparison?: string; // e.g., "-6% emissions"
    comparisonValue?: number; // e.g., -6
  };
  flightNumbers?: string[];
  operatingCarriers?: string[];
  layovers?: {
    airport: string;
    airportFullName?: string;
    duration: string;
    durationMinutes?: number;
    overnight?: boolean;
    airportChange?: boolean;
  }[];
}

export interface FlightSearchResult {
  parameters: FlightSearchParameters;
  metadata: GeneticAlgorithmMetadata;
  results: FlightData[];
}

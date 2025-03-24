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
  score: number;
}

export interface FlightSearchResult {
  parameters: FlightSearchParameters;
  metadata: GeneticAlgorithmMetadata;
  results: {
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
  }[];
}

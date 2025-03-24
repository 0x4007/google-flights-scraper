export interface FlightSearchParameters {
  from: string;
  to: string;
  departure: string;
  return?: string;
  includeBudget: boolean;
}

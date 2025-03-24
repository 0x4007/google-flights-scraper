export interface FlightSearchParameters {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  includeBudget: boolean;
}

export function parseDateString(dateString: string): DateInfo {
  const dateObj = new Date(dateString);
  // Always use current year
  const currentYear = new Date().getFullYear();
  dateObj.setFullYear(currentYear);

  return {
    day: dateObj.getDate(),
    month: dateObj.toLocaleString("en-US", { month: "long" }),
    year: currentYear,
  };
}

export interface DateInfo {
  day: number;
  month: string;
  year: number;
}

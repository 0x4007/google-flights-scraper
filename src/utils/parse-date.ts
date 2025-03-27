export function parseDateString(dateString: string): DateInfo {
  const dateObj = new Date(dateString);
  const currentDate = new Date();

  // If year is specified in the date string, use that year
  const hasExplicitYear = /\d{4}/.test(dateString);
  if (hasExplicitYear) {
    return {
      day: dateObj.getDate(),
      month: dateObj.toLocaleString("en-US", { month: "long" }),
      year: dateObj.getFullYear(),
    };
  }

  // Set to current year initially
  const currentYear = currentDate.getFullYear();
  dateObj.setFullYear(currentYear);

  // If date with current year is in the past, use next year
  if (dateObj < currentDate) {
    dateObj.setFullYear(currentYear + 1);
    console.log(`Date ${dateString} is in the past. Using next year (${currentYear + 1}) instead.`);
    return {
      day: dateObj.getDate(),
      month: dateObj.toLocaleString("en-US", { month: "long" }),
      year: currentYear + 1,
    };
  }

  // Otherwise, use current year
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

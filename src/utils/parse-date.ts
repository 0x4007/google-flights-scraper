export function parseDateString(dateString: string): DateInfo {
  const dateObj = new Date(dateString);
  return {
    day: dateObj.getDate(),
    month: dateObj.toLocaleString("en-US", { month: "long" }),
    year: dateObj.getFullYear(),
  };
}

export interface DateInfo {
  day: number;
  month: string;
  year: number;
}

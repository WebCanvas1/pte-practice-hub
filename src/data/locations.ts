/** Country and timezone options used by registration and profile forms. */

export const countries: { code: string; name: string }[] = [
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "IN", name: "India" },
  { code: "NP", name: "Nepal" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "LK", name: "Sri Lanka" },
  { code: "BD", name: "Bangladesh" },
  { code: "CN", name: "China" },
  { code: "VN", name: "Vietnam" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "US", name: "United States" },
  { code: "OTHER", name: "Other" },
];

export const timezones: string[] = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Pacific/Auckland",
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Karachi",
  "Asia/Manila",
  "Asia/Colombo",
  "Asia/Dhaka",
  "Asia/Shanghai",
  "Asia/Ho_Chi_Minh",
  "Asia/Dubai",
  "Europe/London",
  "America/Toronto",
  "America/New_York",
  "UTC",
];

export function guessTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezones.includes(tz) ? tz : "Australia/Sydney";
  } catch {
    return "Australia/Sydney";
  }
}

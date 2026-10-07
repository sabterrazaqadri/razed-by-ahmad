// Karachi-time schedule helpers. Server-side source of truth for display.
// (The database functions in supabase/migrations/…_order_functions.sql apply
// the same rule independently when an order is actually created.)

export const TIME_ZONE = "Asia/Karachi";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// The home panel's week strip starts on Monday, as in the prototype.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

/** 0 = Sunday … 6 = Saturday, in Asia/Karachi. */
export function karachiWeekday(now: Date = new Date()): number {
  const short = weekdayFormatter.format(now);
  const idx = DAY_SHORT.indexOf(short as (typeof DAY_SHORT)[number]);
  if (idx === -1) throw new Error(`Unexpected weekday "${short}"`);
  return idx;
}

export function dayName(day: number): string {
  return DAY_NAMES[((day % 7) + 7) % 7];
}

export type ScheduleSettings = {
  free_delivery_day: number;
  spinner_day: number;
  spinner_enabled: boolean;
};

export type Schedule = {
  today: number;
  freeDeliveryDay: number;
  spinnerDay: number;
  freeDeliveryToday: boolean;
  spinnerToday: boolean;
  spinnerEnabled: boolean;
};

export function getSchedule(settings: ScheduleSettings, now: Date = new Date()): Schedule {
  const today = karachiWeekday(now);
  return {
    today,
    freeDeliveryDay: settings.free_delivery_day,
    spinnerDay: settings.spinner_day,
    spinnerEnabled: settings.spinner_enabled,
    // Free delivery now runs every day of the week.
    freeDeliveryToday: true,
    spinnerToday: settings.spinner_enabled && settings.spinner_day === today,
  };
}

/** Start of "today" in Karachi, as a UTC Date (Karachi is UTC+5, no DST). */
export function karachiStartOfDay(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  return new Date(`${parts}T00:00:00+05:00`);
}

export function karachiDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

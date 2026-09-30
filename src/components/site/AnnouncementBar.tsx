import type { Settings } from "@/lib/data";
import { dayName, type Schedule } from "@/lib/schedule";

/** Server component: swaps to the live message on free-delivery day. */
export function AnnouncementBar({ settings, schedule }: { settings: Settings; schedule: Schedule }) {
  const live = schedule.freeDeliveryToday;
  const message = live
    ? "Free delivery today — order now, the courier is on us"
    : settings.announcement_text?.trim() || `${dayName(schedule.freeDeliveryDay)}s ship free — the courier is on us`;

  return (
    <div className={`announce${live ? " is-live" : ""}`} data-testid="announce" data-live={live ? "true" : "false"}>
      <div className="wrap">
        <span className="hide-m">Hand-decanted in Karachi</span>
        <span>
          <i className="dot" aria-hidden="true" />
          {message}
        </span>
        <span className="hide-m">
          {schedule.spinnerToday ? "Gift spin open today" : "Cash on delivery · Nationwide"}
        </span>
      </div>
    </div>
  );
}

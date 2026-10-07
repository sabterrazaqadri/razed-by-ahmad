import type { Settings } from "@/lib/data";
import type { Schedule } from "@/lib/schedule";

/** Server component: free delivery runs every day, so the bar is always live. */
export function AnnouncementBar({ settings, schedule }: { settings: Settings; schedule: Schedule }) {
  const live = schedule.freeDeliveryToday;
  const message = settings.announcement_text?.trim() || "Free delivery every day — the courier is on us";

  return (
    <div className={`announce${live ? " is-live" : ""}`} data-testid="announce" data-live={live ? "true" : "false"}>
      <div className="wrap">
        <span className="hide-m">Hand-decanted in Pakistan</span>
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

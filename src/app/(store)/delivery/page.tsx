import type { Metadata } from "next";
import Link from "next/link";
import { Paragraphs } from "@/components/RichText";
import { DELIVERY_AND_RETURNS } from "@/content/policies";
import { getSettings } from "@/lib/data";
import { dayName, getSchedule } from "@/lib/schedule";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Delivery & returns",
  description: "How Razed by Ahmad delivers across Pakistan, payment options, and what to do if a bottle arrives damaged.",
  alternates: { canonical: "/delivery" },
};

export default async function DeliveryPage() {
  const { data: settings } = await getSettings();
  const schedule = getSchedule(settings);
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> / Delivery &amp; returns
          </nav>
          <h1 className="display h2">Delivery &amp; returns</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            {schedule.freeDeliveryToday
              ? "Delivery is free today, nationwide."
              : `Delivery is free every ${dayName(schedule.freeDeliveryDay)}, nationwide.`}
          </p>
        </div>
      </div>
      <div className="wrap" style={{ paddingBlock: 48 }}>
        <div className="lede" style={{ maxWidth: "62ch", color: "var(--color-bone)" }}>
          <Paragraphs text={DELIVERY_AND_RETURNS} />
        </div>
      </div>
    </>
  );
}

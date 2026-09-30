import { InstallPrompt } from "@/components/InstallPrompt";
import { JsonLd } from "@/components/JsonLd";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SpinProvider } from "@/components/spin/SpinProvider";
import { getActivePrizes, getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { dayName, getSchedule } from "@/lib/schedule";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// Schedule-dependent (announcement bar, badges) — never more than an hour stale.
export const revalidate = 3600;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ data: settings, error }, { data: prizes }] = await Promise.all([getSettings(), getActivePrizes()]);
  const schedule = getSchedule(settings);
  const contactUrl = buildWhatsAppUrl(settings.whatsapp_number, "Assalam o Alaikum — Razed by Ahmad");

  return (
    <SpinProvider
      prizes={prizes.map((p) => ({ id: p.id, short_label: p.short_label }))}
      spinnerDayName={dayName(settings.spinner_day)}
    >
      <a href="#main" className="skip">
        Skip to content
      </a>
      <AnnouncementBar settings={settings} schedule={schedule} />
      <SiteHeader whatsappUrl={contactUrl} />
      {error && (
        <div className="wrap" style={{ paddingTop: 16 }}>
          <p className="notice" role="status">
            {error}
          </p>
        </div>
      )}
      <main id="main">{children}</main>
      <SiteFooter whatsappUrl={contactUrl} schedule={schedule} />
      <InstallPrompt />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Razed by Ahmad",
          url: SITE_URL,
          logo: `${SITE_URL}/icons/icon-512.png`,
          address: { "@type": "PostalAddress", addressLocality: "Karachi", addressCountry: "PK" },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: `+${settings.whatsapp_number}`,
            availableLanguage: ["English", "Urdu"],
          },
        }}
      />
    </SpinProvider>
  );
}

import Link from "next/link";
import { dayName, type Schedule } from "@/lib/schedule";

export function SiteFooter({ whatsappUrl, schedule }: { whatsappUrl: string; schedule: Schedule }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="wordmark" style={{ textAlign: "left", fontSize: 22, textIndent: 0 }}>
              RAZED<span className="wordmark-sub" style={{ textIndent: 0 }}>by Ahmad</span>
            </div>
            <p className="small" style={{ marginTop: 18, maxWidth: "30ch", lineHeight: 1.8 }}>
              Extraits built on smoke, resin and oud. Blended in small batches and bottled by hand.
            </p>
            <a className="subscribe" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <span>New batches, on WhatsApp</span>
              <b aria-hidden="true">&rarr;</b>
            </a>
          </div>
          <div>
            <h2>Shop</h2>
            <ul>
              <li><Link href="/collection">All fragrances</Link></li>
              <li><Link href="/collection?family=oud">Oud</Link></li>
              <li><Link href="/collection?family=amber">Amber</Link></li>
              <li><Link href="/collection?size=30">30 ml sizes</Link></li>
            </ul>
          </div>
          <div>
            <h2>Help</h2>
            <ul>
              <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a></li>
              <li><Link href="/delivery">Delivery &amp; returns</Link></li>
              <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Track my order</a></li>
              <li><Link href="/#gifting">Gift spin</Link></li>
            </ul>
          </div>
          <div>
            <h2>House</h2>
            <ul>
              <li><Link href="/#about">The perfumer</Link></li>
              <li><Link href="/#notes">The notes</Link></li>
              <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {year} Razed by Ahmad · Pakistan</span>
          <span>
            Free delivery every day
            {schedule.spinnerEnabled ? ` · Gift spin every ${dayName(schedule.spinnerDay)}` : ""}
          </span>
        </div>
      </div>
    </footer>
  );
}

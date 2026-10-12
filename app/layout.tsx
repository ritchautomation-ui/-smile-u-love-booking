import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Book a visit · Smile U Love Dental Clinic", template: "%s · Smile U Love" }, description: "Request a dental appointment with Smile U Love Dental Clinic in Porac, Pampanga." };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}


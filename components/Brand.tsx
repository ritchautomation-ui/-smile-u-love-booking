import Link from "next/link";
import { CLINIC } from "@/lib/config";
export function Brand() {
  return <Link href="/" className="brand" aria-label="Smile U Love home"><img src="/images/smile-icon.png" width="36" height="42" alt="" /><span>{CLINIC.name}<small>DENTAL CLINIC · PORAC</small></span></Link>;
}
export function Header() {
  return <header className="site-header"><div className="header-inner"><Brand /><nav aria-label="Main navigation"><Link href="/#services">Our services</Link><Link href="/#book" className="nav-book">Book a visit</Link><Link href="/admin" className="admin-link">Admin login <span aria-hidden="true">↗</span></Link></nav></div></header>;
}
export function Footer() {
  return <footer className="site-footer"><div><Brand /><p>Love yourself first. Start with your smile.</p></div><div><Link href="/privacy">Privacy</Link><Link href="/admin">Admin login</Link><p>Powered by TapSpot</p></div></footer>;
}

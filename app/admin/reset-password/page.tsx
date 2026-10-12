import type { Metadata } from "next";
import { PasswordRecovery } from "@/components/PasswordRecovery";
export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <PasswordRecovery />; }

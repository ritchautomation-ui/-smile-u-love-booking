"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Brand } from "./Brand";
import { authClient, authConfigured } from "@/lib/browser";

export function PasswordRecovery() {
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        if (!authConfigured()) throw new Error("configuration");
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        if (fragment.has("error")) {
          window.history.replaceState(null, "", window.location.pathname);
          if (active) setError("This recovery link has expired or is invalid. Request a new email below.");
          return;
        }
        // Initialization consumes the recovery fragment before checking the user with Supabase.
        await authClient().auth.getSession();
        const { data, error } = await authClient().auth.getUser();
        if (active) setVerified(!error && Boolean(data.user));
      } catch { if (active) setError("Unable to connect to sign-in. Check the site configuration or try again."); }
      finally { if (active) setChecking(false); }
    }
    void check();
    return () => { active = false; };
  }, []);

  async function requestEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim();
    setBusy(true); setError(""); setNotice("");
    try {
      const { error } = await authClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) { setError("Could not send the recovery email. Please wait a minute and retry, or contact the project owner."); return; }
      setNotice("If this email belongs to an account, a recovery link will arrive shortly. Check your inbox and spam folder, then open the newest link.");
    } catch { setError("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get("password") || "");
    if (password.length < 12) { setError("Use at least 12 characters for your new password."); return; }
    if (password !== values.get("confirm")) { setError("The passwords do not match."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { error } = await authClient().auth.updateUser({ password });
      if (error) { setError("Could not change the password. Try a different strong password, or request a fresh recovery link if this one expired."); return; }
      form.reset(); setDone(true); setVerified(false);
      setNotice("Your password has been updated. Return to admin to continue.");
      await authClient().auth.signOut({ scope: "local" });
    } catch { setError("Connection interrupted. If you already submitted, try signing in with your new password before requesting another link."); }
    finally { setBusy(false); }
  }
  return <div className="admin-login">
    <header className="header-inner"><Brand /><Link className="text-link" href="/admin">← Admin login</Link></header>
    <main id="main" className="login-layout">
      <div className="login-photo"><img src="/images/smile-treatment-room.jpg" width="720" height="960" alt="Treatment room at Smile U Love" /><div><p className="eyebrow">SMILE U LOVE · CLINIC TEAM</p><h1>A little help.<br />A fresh start.</h1></div></div>
      <div className="login-panel"><p className="eyebrow">ACCOUNT RECOVERY</p><h2>{done ? "Password updated." : verified ? "Choose a new password." : "Forgot your password?"}</h2>
        {error && <div className="alert error" role="alert">{error}</div>}
        {notice && <div className="alert" role="status">{notice}</div>}
        {checking ? <p role="status">Checking your recovery link…</p> : done ? <Link className="button" href="/admin">Return to admin login →</Link> : verified ?
          <form onSubmit={updatePassword}><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} required /><p className="field-help">Use at least 12 characters. Choose a password you do not use elsewhere.</p><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={12} required /><button className="button submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button></form> :
          <form onSubmit={requestEmail}><p className="muted">Enter your clinic admin email to request a recovery link.</p><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" required /><button className="button submit" disabled={busy || !authConfigured()}>{busy ? "Sending…" : "Send recovery email"}</button></form>}
      </div>
    </main>
  </div>;
}

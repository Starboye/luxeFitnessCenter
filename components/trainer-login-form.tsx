"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { StatusPopup } from "@/components/status-popup";

export function TrainerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [popup, setPopup] = useState<{ title: string; message: string; tone: "success" | "warning" | "danger" } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    if (!isSupabaseConfigured()) {
      setPopup({ title: "Demo mode", message: "Supabase auth is not configured, so the trainer dashboard is opening in demo mode.", tone: "warning" });
      router.push("/trainer?demo=1&status=demo");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setPopup({ title: "Login failed", message: error.message, tone: "danger" });
      } else {
        setPopup({ title: "Signed in", message: "Trainer access granted. Opening your workspace now.", tone: "success" });
        router.push("/trainer?status=signed-in");
      }
    } catch (error) {
      setPopup({ title: "Login failed", message: error instanceof Error ? error.message : "Unable to sign in.", tone: "danger" });
    }

    setPending(false);
  }

  return (
    <>
      <StatusPopup open={Boolean(popup)} title={popup?.title ?? ""} message={popup?.message ?? ""} tone={popup?.tone ?? "success"} onClose={() => setPopup(null)} />
      <div className="form-card">
        <form onSubmit={handleSubmit} className="stack">
          <div>
            <div className="eyebrow">Trainer Sign In</div>
            <h2>Access the trainer workspace</h2>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="trainer@luxefitness.in" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
          </div>
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Continue"}
          </button>
          <small className="muted">Status popups now appear immediately after sign-in attempts so failed login states are visible.</small>
        </form>
      </div>
    </>
  );
}

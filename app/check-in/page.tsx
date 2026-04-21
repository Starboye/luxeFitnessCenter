"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { KioskCheckInResponse, Member } from "@/lib/types";

const SESSION_KEY = "luxe-member-device";

interface RememberedSession {
  memberCode: string;
  phone: string;
  fullName?: string;
}

function toE164IndianPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return value.trim();
}

function saveSession(session: RememberedSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readSession(): RememberedSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RememberedSession;
  } catch {
    return null;
  }
}

export default function CheckInPage() {
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [state, setState] = useState<KioskCheckInResponse | null>(null);
  const [memberCode, setMemberCode] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [remembered, setRemembered] = useState<RememberedSession | null>(null);
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    const stored = readSession();
    if (stored) {
      setRemembered(stored);
      setMemberCode(stored.memberCode);
      setPhone(stored.phone);
    }
  }, []);

  const verifyMember = async () => {
    setStatus("verifying");
    const response = await fetch("/api/member-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCode, phone })
    });
    const payload = (await response.json()) as { ok: boolean; message: string; member?: Member };

    if (!payload.ok || !payload.member) {
      setStatus("error");
      setState({ ok: false, message: payload.message });
      return;
    }

    setVerifiedMember(payload.member);

    if (!supabaseReady) {
      const session = { memberCode, phone, fullName: payload.member.fullName };
      saveSession(session);
      setRemembered(session);
      setStatus("idle");
      setState({ ok: true, message: "Device saved. You can now check in with one tap." });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const formattedPhone = toE164IndianPhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: { shouldCreateUser: true }
    });

    if (error) {
      setStatus("error");
      setState({ ok: false, message: error.message });
      return;
    }

    setOtpSent(true);
    setStatus("idle");
    setState({ ok: true, message: `Verified member: ${payload.member.fullName}. OTP sent to ${formattedPhone}. Enter it once to link this device.` });
  };

  const verifyOtp = async () => {
    if (!supabaseReady) {
      return;
    }

    setStatus("verifying");
    const supabase = createSupabaseBrowserClient();
    const formattedPhone = toE164IndianPhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms"
    });

    if (error) {
      setStatus("error");
      setState({ ok: false, message: error.message });
      return;
    }

    const session = { memberCode, phone, fullName: verifiedMember?.fullName };
    saveSession(session);
    setRemembered(session);
    setOtpSent(false);
    setStatus("idle");
    setState({ ok: true, message: "Device linked successfully. Future check-ins are one tap." });
  };

  const handleReturningCheckIn = async () => {
    const activeSession = remembered ?? readSession();
    if (!activeSession) {
      setState({ ok: false, message: "Verify this device first." });
      return;
    }

    setStatus("verifying");
    const response = await fetch("/api/qr-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCode: activeSession.memberCode })
    });
    const payload = (await response.json()) as KioskCheckInResponse;
    setState(payload);
    setStatus(payload.ok ? "success" : "error");
  };

  const resetDevice = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setRemembered(null);
    setVerifiedMember(null);
    setOtpSent(false);
    setOtp("");
    setPhone("");
    setMemberCode("");
    setState(null);
    setStatus("idle");
  };

  return (
    <div className="checkin-root">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #050505;
          --surface: #111111;
          --accent: #ff3e3e;
          --text: #ffffff;
          --text-dim: #888888;
          --border: rgba(255, 255, 255, 0.1);
          --success: #10b981;
        }
        .checkin-root {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
        }
        .header {
          padding: 1.5rem 5%;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo { font-weight: 900; text-decoration: none; color: white; letter-spacing: -0.5px; }
        .logo span { color: var(--accent); }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }
        .checkin-card {
          width: 100%;
          max-width: 460px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 3rem 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .icon-box {
          width: 80px;
          height: 80px;
          background: rgba(255, 62, 62, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 2rem;
        }
        .status-idle .icon-box { color: var(--accent); border: 1px solid rgba(255, 62, 62, 0.2); }
        .status-success .icon-box { color: var(--success); background: rgba(16, 185, 129, 0.1); border-color: var(--success); }
        h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
        p { color: var(--text-dim); line-height: 1.5; margin-bottom: 1.2rem; font-size: 0.95rem; }
        .btn-checkin {
          width: 100%;
          padding: 1.2rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 0.75rem;
        }
        .member-info {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
          text-align: left;
        }
        .loader {
          border: 3px solid rgba(255,255,255,0.1);
          border-top: 3px solid var(--accent);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        .field {
          width: 100%;
          margin-bottom: 0.9rem;
          text-align: left;
        }
        .field input {
          width: 100%;
          min-height: 52px;
          padding: 0.95rem 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text);
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--border);
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1rem;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />

      <header className="header">
        <Link href="/" className="logo">LUXE <span>FITNESS</span></Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/trainer-access" style={{ fontSize: "0.8rem", color: "white", textDecoration: "none", fontWeight: 700 }}>
            TRAINER LOGIN
          </Link>
          <Link href="/admin" style={{ fontSize: "0.8rem", color: "var(--text-dim)", textDecoration: "none" }}>ADMIN LOGIN</Link>
        </div>
      </header>

      <main className="main-content">
        <div className={`checkin-card status-${status}`}>
          {remembered ? (
            <>
              <div className="icon-box">📱</div>
              <div className="badge">Returning Device</div>
              <h1>Welcome Back</h1>
              <p>{remembered.fullName ?? remembered.memberCode} can check in instantly from this phone.</p>
              <button className="btn-checkin" onClick={() => void handleReturningCheckIn()}>
                CONFIRM CHECK-IN
              </button>
              <button className="btn-checkin" style={{ background: "transparent", border: "1px solid var(--border)" }} onClick={resetDevice}>
                USE ANOTHER MEMBER
              </button>
            </>
          ) : status === "verifying" ? (
            <>
              <div className="loader" style={{ marginBottom: "2rem" }}></div>
              <h1>Verifying...</h1>
              <p>Syncing your session with the Luxe Command Center.</p>
            </>
          ) : (
            <>
              <div className="icon-box">📱</div>
              <div className="badge">Perungudi Branch</div>
              <h1>Link This Device</h1>
              <p>Verify your Luxe ID and phone once. After that, this same QR becomes one-tap check-in.</p>

              <div className="field">
                <input value={memberCode} onChange={(e) => setMemberCode(e.target.value.toUpperCase())} placeholder="Luxe ID" />
              </div>
              <div className="field">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (9876543210)" />
              </div>
              {!otpSent ? (
                <>
                  <button className="btn-checkin" onClick={() => void verifyMember()}>
                    VERIFY MEMBER
                  </button>
                  <Link
                    href="/trainer-access"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "1.2rem",
                      background: "transparent",
                      color: "white",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "1rem",
                      textDecoration: "none",
                      marginTop: "0.75rem"
                    }}
                  >
                    TRAINER LOGIN
                  </Link>
                </>
              ) : (
                <>
                  <div className="field">
                    <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
                  </div>
                  <button className="btn-checkin" onClick={() => void verifyOtp()}>
                    CONFIRM DEVICE
                  </button>
                </>
              )}
            </>
          )}

          {state?.message ? (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.9rem 1rem",
                borderRadius: 14,
                background: state.ok ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 62, 62, 0.12)",
                border: `1px solid ${state.ok ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 62, 62, 0.2)"}`,
                color: state.ok ? "var(--success)" : "var(--accent)",
                fontWeight: 700
              }}
            >
              {state.message}
            </div>
          ) : null}

          {state?.member ? (
            <div className="member-info">
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>ATHLETE</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{state.member.fullName}</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "var(--accent)" }}>
                PLAN: {state.member.currentPlan}
              </div>
            </div>
          ) : verifiedMember ? (
            <div className="member-info">
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>VERIFIED MEMBER</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{verifiedMember.fullName}</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "var(--accent)" }}>
                PLAN: {verifiedMember.currentPlan}
              </div>
            </div>
          ) : null}
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.8rem" }}>
          Having trouble? <Link href="/kiosk" style={{ color: "white" }}>Use the front-desk kiosk</Link>
        </p>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { KioskCheckInResponse, Member } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { StatusPopup } from "@/components/status-popup";

const SESSION_KEY = "luxe-member-device";

interface RememberedSession {
  memberCode: string;
  phone: string;
  fullName?: string;
}

const initialState: KioskCheckInResponse = {
  ok: false,
  message: "Scan the same static QR every day. First time on a device requires verification; after that it's just one tap.",
  member: undefined,
  latestEvent: undefined
};

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

export function QrCheckInPanel() {
  const [state, setState] = useState(initialState);
  const [memberCode, setMemberCode] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [remembered, setRemembered] = useState<RememberedSession | null>(null);
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string; tone: "success" | "warning" | "danger" } | null>(null);
  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    const stored = readSession();
    if (stored) {
      setRemembered(stored);
      setMemberCode(stored.memberCode);
      setPhone(stored.phone);
    }
  }, []);

  async function verifyMemberAndSendOtp() {
    setPending(true);

    const response = await fetch("/api/member-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCode, phone })
    });

    const payload = (await response.json()) as { ok: boolean; message: string; member?: Member };

    if (!payload.ok || !payload.member) {
      setPopup({ title: "Verification failed", message: payload.message, tone: "danger" });
      setPending(false);
      return;
    }

    setVerifiedMember(payload.member);

    if (!supabaseReady) {
      const demoSession = { memberCode, phone, fullName: payload.member.fullName };
      saveSession(demoSession);
      setRemembered(demoSession);
      setPopup({ title: "Device saved", message: "Demo mode is active, so this device is now remembered for quick check-ins.", tone: "success" });
      setPending(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true }
      });

      if (error) {
        setPopup({ title: "OTP send failed", message: error.message, tone: "danger" });
      } else {
        setOtpSent(true);
        setPopup({ title: "OTP sent", message: "Enter the OTP once. Future scans on this phone will not ask again.", tone: "success" });
      }
    } catch (error) {
      setPopup({ title: "OTP send failed", message: error instanceof Error ? error.message : "Unable to send OTP.", tone: "danger" });
    }

    setPending(false);
  }

  async function verifyOtpAndRemember() {
    if (!supabaseReady) {
      return;
    }

    setPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms"
      });

      if (error) {
        setPopup({ title: "OTP invalid", message: error.message, tone: "danger" });
      } else {
        const session = { memberCode, phone, fullName: verifiedMember?.fullName };
        saveSession(session);
        setRemembered(session);
        setOtpSent(false);
        setPopup({ title: "Device linked", message: "Future scans on this phone now go straight to the check-in button.", tone: "success" });
      }
    } catch (error) {
      setPopup({ title: "OTP invalid", message: error instanceof Error ? error.message : "Unable to verify OTP.", tone: "danger" });
    }

    setPending(false);
  }

  async function handleReturningCheckIn() {
    const activeSession = remembered ?? readSession();
    if (!activeSession) {
      setPopup({ title: "No device session", message: "Verify once on this phone before using one-tap check-in.", tone: "warning" });
      return;
    }

    setPending(true);
    const response = await fetch("/api/qr-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCode: activeSession.memberCode })
    });

    const payload = (await response.json()) as KioskCheckInResponse;
    setState(payload);
    setPending(false);
    setPopup({
      title: payload.ok ? "Check-in captured" : "Check-in issue",
      message: payload.message,
      tone: payload.ok ? "success" : "danger"
    });
  }

  function resetDevice() {
    window.localStorage.removeItem(SESSION_KEY);
    setRemembered(null);
    setVerifiedMember(null);
    setOtpSent(false);
    setOtp("");
    setPhone("");
    setMemberCode("");
    setState(initialState);
  }

  return (
    <>
      <StatusPopup open={Boolean(popup)} title={popup?.title ?? ""} message={popup?.message ?? ""} tone={popup?.tone ?? "success"} onClose={() => setPopup(null)} />
      <div className="grid-2">
        <article className="form-card">
          <div className="stack">
            <div>
              <div className="eyebrow">Static Wall QR</div>
              <h2>{remembered ? "Returning device quick check-in" : "First-time mobile verification"}</h2>
            </div>

            {remembered ? (
              <>
                <div className="notice">
                  This phone is remembered for <strong>{remembered.fullName ?? remembered.memberCode}</strong>. The same static QR can now go straight to check-in.
                </div>
                <button className="button" type="button" onClick={handleReturningCheckIn} disabled={pending}>
                  {pending ? "Checking in..." : "Check in now"}
                </button>
                <button className="button-ghost" type="button" onClick={resetDevice}>
                  Use another member on this device
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="memberCode">Member ID</label>
                  <input id="memberCode" value={memberCode} onChange={(event) => setMemberCode(event.target.value)} placeholder="LUXE-1001" />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone number</label>
                  <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" />
                  <small>First visit on a device asks for phone + member ID. After that, the same static QR becomes one tap.</small>
                </div>
                <button className="button-secondary" type="button" onClick={verifyMemberAndSendOtp} disabled={pending}>
                  {pending ? "Verifying..." : "Verify and continue"}
                </button>
                {otpSent ? (
                  <>
                    <div className="field">
                      <label htmlFor="otp">OTP</label>
                      <input id="otp" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter SMS OTP" />
                    </div>
                    <button className="button" type="button" onClick={verifyOtpAndRemember} disabled={pending}>
                      {pending ? "Confirming..." : "Confirm device"}
                    </button>
                  </>
                ) : null}
              </>
            )}
          </div>
        </article>

        <article className="form-card">
          <div className="stack">
            <div>
              <div className="eyebrow">Member Snapshot</div>
              <h2>What members see after check-in</h2>
            </div>
            <div className="notice">{state.message}</div>
            {state.member ? (
              <article className="panel">
                <h3>{state.member.fullName}</h3>
                <p className="muted">{state.member.currentPlan}</p>
                <div className="grid-2">
                  <div>
                    <strong>{state.member.daysLeft} days</strong>
                    <div className="muted">Plan days left</div>
                  </div>
                  <div>
                    <strong>{formatCurrency(state.member.dueAmount)}</strong>
                    <div className="muted">Pending due</div>
                  </div>
                  <div>
                    <strong>{state.member.streak} days</strong>
                    <div className="muted">Streak</div>
                  </div>
                  <div>
                    <strong>
                      {state.member.attendanceProgress.attended}/{state.member.attendanceProgress.target}
                    </strong>
                    <div className="muted">Attendance cycle</div>
                  </div>
                </div>
              </article>
            ) : (
              <div className="panel">
                <strong>{verifiedMember?.fullName ?? "No attendance captured yet"}</strong>
                <div className="muted">
                  Once verification is completed, future scans from the same phone will go straight to the button above and save attendance instantly.
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </>
  );
}

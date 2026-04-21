"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KioskCheckInResponse } from "@/lib/types";

const heroVideos = [
  "/media/carrosal_1.mp4",
  "/media/carrosal_2.mp4",
  "/media/carrosal_3.mp4"
];

export default function KioskPage() {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KioskCheckInResponse | null>(null);

  const handleKioskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      return;
    }

    setLoading(true);
    const response = await fetch("/api/kiosk-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCode: memberId })
    });
    const payload = (await response.json()) as KioskCheckInResponse;
    setResult(payload);
    setLoading(false);
  };

  const resetKiosk = () => {
    setResult(null);
    setMemberId("");
  };

  return (
    <div className="kiosk-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --bg: #050505;
              --surface: #111111;
              --accent: #ff3e3e;
              --gold: #d4af37;
              --success: #10b981;
              --text: #ffffff;
              --text-dim: #888888;
              --border: rgba(255, 255, 255, 0.1);
            }
            .kiosk-root {
              background: var(--bg);
              color: var(--text);
              min-height: 100vh;
              font-family: 'Inter', system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              position: relative;
              overflow: hidden;
            }
            .kiosk-root::after {
              content: "";
              position: absolute;
              inset: 0;
              background:
                linear-gradient(90deg, rgba(5, 5, 5, 0.88) 0%, rgba(5, 5, 5, 0.7) 45%, rgba(5, 5, 5, 0.82) 100%),
                linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.55));
              z-index: 0;
              pointer-events: none;
            }
            .background-carousel {
              position: absolute;
              inset: 0;
              z-index: 0;
            }
            .background-video {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: 0;
              animation: backgroundCarousel 18s infinite;
            }
            .kiosk-header {
              padding: 1.5rem 5%;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid var(--border);
              position: relative;
              z-index: 1;
              gap: 1rem;
              flex-wrap: wrap;
            }
            .logo { font-weight: 900; text-decoration: none; color: white; letter-spacing: -0.5px; }
            .logo span { color: var(--accent); }
            .header-links {
              display: flex;
              align-items: center;
              gap: 1rem;
              flex-wrap: wrap;
            }
            .main-content {
              flex: 1;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              padding: 4rem 5%;
              align-items: center;
              position: relative;
              z-index: 1;
            }
            .kiosk-form-panel {
              background: var(--surface);
              padding: 3rem;
              border-radius: 24px;
              border: 1px solid var(--border);
              box-shadow: 0 20px 50px rgba(0,0,0,0.5);
              min-height: 450px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .eyebrow { font-size: 0.7rem; color: var(--accent); font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1rem; }
            h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1.5rem; line-height: 1; }
            .input-group { margin-bottom: 2rem; position: relative; }
            .kiosk-input {
              width: 100%;
              background: #000;
              border: 2px solid var(--border);
              padding: 1.5rem;
              border-radius: 12px;
              color: white;
              font-size: 2rem;
              font-weight: 800;
              text-align: center;
              letter-spacing: 4px;
              outline: none;
              transition: 0.3s;
            }
            .kiosk-input:focus { border-color: var(--accent); box-shadow: 0 0 20px rgba(255, 62, 62, 0.2); }
            .btn-checkin {
              width: 100%;
              padding: 1.5rem;
              background: var(--accent);
              color: white;
              border: none;
              border-radius: 12px;
              font-weight: 900;
              font-size: 1.2rem;
              cursor: pointer;
              transition: 0.2s;
            }
            .btn-checkin:active { transform: scale(0.98); }
            .btn-checkin:disabled { opacity: 0.5; }
            .trainer-link {
              display: block;
              margin-top: 1rem;
              padding: 1rem;
              border-radius: 12px;
              border: 1px solid var(--border);
              text-decoration: none;
              text-align: center;
              color: white;
              font-weight: 800;
              background: rgba(255,255,255,0.03);
            }
            .result-view { text-align: center; animation: fadeIn 0.4s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes backgroundCarousel {
              0% { opacity: 0; }
              6% { opacity: 1; }
              27% { opacity: 1; }
              33% { opacity: 0; }
              100% { opacity: 0; }
            }
            .streak-badge { font-size: 4rem; margin-bottom: 1rem; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
            .info-item { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); }
            .info-label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.5rem; }
            .info-value { font-weight: 800; font-size: 1.1rem; }
            .glass-card {
              padding: 3rem;
              background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
              border-radius: 24px;
              border: 1px solid var(--border);
            }
            .list { list-style: none; padding: 0; margin-top: 2rem; }
            .list li { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border); color: var(--text-dim); font-size: 0.9rem; gap: 1rem; }
            .list li span:last-child { color: white; font-weight: 700; }
            @media (max-width: 968px) {
              .main-content { grid-template-columns: 1fr; padding: 2rem 5%; }
              .glass-card { display: none; }
            }
          `
        }}
      />

      <div className="background-carousel" aria-hidden="true">
        {heroVideos.map((video, index) => (
          <video
            key={video}
            className="background-video"
            style={{ animationDelay: `${index * 6}s` }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src={video} type="video/mp4" />
          </video>
        ))}
      </div>

      <header className="kiosk-header">
        <Link href="/" className="logo">LUXE <span>KIOSK</span></Link>
        <div className="header-links">
          <Link href="/trainer-access" style={{ color: "white", textDecoration: "none", fontSize: "0.8rem", fontWeight: 700 }}>
            TRAINER LOGIN
          </Link>
          <Link href="/check-in" style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 700 }}>
            SWITCH TO QR FLOW
          </Link>
        </div>
      </header>

      <main className="main-content">
        <div className="kiosk-form-panel">
          {!result?.member ? (
            <>
              <div className="eyebrow">Front Desk Attendance</div>
              <h1>Enter Luxe ID</h1>
              <form onSubmit={handleKioskSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    className="kiosk-input"
                    placeholder="LUXE-1001"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    autoFocus
                  />
                </div>
                <button className="btn-checkin" disabled={loading || !memberId}>
                  {loading ? "VERIFYING..." : "CHECK-IN NOW"}
                </button>
                <Link href="/trainer-access" className="trainer-link">
                  TRAINER LOGIN / CLOCK-IN
                </Link>
                {result ? <p style={{ color: result.ok ? "var(--success)" : "var(--accent)", marginTop: "1rem" }}>{result.message}</p> : null}
              </form>
            </>
          ) : (
            <div className="result-view">
              <div className="streak-badge">🔥 {result.member.streak}</div>
              <div className="eyebrow" style={{ color: result.ok ? "var(--success)" : "var(--accent)" }}>{result.ok ? "Confirmed" : "Attention"}</div>
              <h1 style={{ marginBottom: "0.5rem" }}>{result.member.fullName}</h1>
              <p style={{ color: "var(--text-dim)" }}>{result.member.currentPlan}</p>
              <p style={{ color: result.ok ? "var(--success)" : "var(--accent)" }}>{result.message}</p>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Days Left</div>
                  <div className="info-value">{result.member.daysLeft}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Dues</div>
                  <div className="info-value" style={{ color: result.member.dueAmount > 0 ? "var(--accent)" : "var(--gold)" }}>
                    ₹{result.member.dueAmount}
                  </div>
                </div>
              </div>

              <button className="btn-checkin" style={{ marginTop: "2rem", background: "transparent", border: "1px solid var(--border)" }} onClick={resetKiosk}>
                NEXT MEMBER
              </button>
            </div>
          )}
        </div>

        <article className="glass-card">
          <div className="eyebrow">Instant Visibility</div>
          <h3>Operational Intelligence.</h3>
          <p style={{ color: "var(--text-dim)", marginTop: "1rem" }}>
            Check-ins are timestamped and synced to the <strong>Luxe Command Center</strong> for real-time occupancy and payment tracking.
          </p>
          <ul className="list">
            <li><span>Plan Status</span><span>Active</span></li>
            <li><span>Remaining Validity</span><span>Synced</span></li>
            <li><span>Due Notifications</span><span>Automated</span></li>
            <li><span>Streak Tracking</span><span>Live</span></li>
          </ul>
        </article>
      </main>
    </div>
  );
}

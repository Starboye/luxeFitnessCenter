"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TrainerDashboardData } from "@/lib/types";
import { formatDateTime, getInitials, getPhotoUrl } from "@/lib/utils";

const heroVideos = [
  "/media/carrosal_1.mp4",
  "/media/carrosal_2.mp4",
  "/media/carrosal_3.mp4"
];

const initialData: TrainerDashboardData = {
  trainer: {
    id: "loading",
    fullName: "Loading trainer",
    role: "trainer",
    active: true
  },
  visibleMembers: [],
  recentEvents: []
};

export default function TrainerPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trainerId, setTrainerId] = useState("");
  const [data, setData] = useState<TrainerDashboardData>(initialData);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/trainer-dashboard", { cache: "no-store" });
        if (response.status === 401) {
          setIsLoggedIn(false);
          setLoadError(null);
          return;
        }
        const text = await response.text();
        const payload = text ? JSON.parse(text) : null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load trainer dashboard.");
        }

        if (!payload) {
          throw new Error("Trainer dashboard returned an empty response.");
        }

        setData(payload as TrainerDashboardData);
        setIsLoggedIn(true);
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to load trainer dashboard.");
      }
    };

    void load();
    const intervalId = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/trainer-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerCode: trainerId })
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok || !payload?.ok) {
      setLoadError(payload?.message ?? "Unable to verify trainer Luxe ID.");
      setIsLoggedIn(false);
      return;
    }

    const dashboardResponse = await fetch("/api/trainer-dashboard", { cache: "no-store" });
    const dashboardPayload = (await dashboardResponse.json()) as TrainerDashboardData;
    setData(dashboardPayload);
    setIsLoggedIn(true);
    setLoadError(null);
  };

  const logoutTrainer = async () => {
    await fetch("/api/trainer-auth", { method: "DELETE" });
    setIsLoggedIn(false);
    setTrainerId("");
  };

  const handleAttendance = async (action: "login" | "logout") => {
    const formData = new FormData();
    formData.set("action", action);
    const attendanceResponse = await fetch("/api/trainer-dashboard", {
      method: "POST",
      body: formData
    });

    if (!attendanceResponse.ok) {
      const text = await attendanceResponse.text();
      try {
        const payload = text ? JSON.parse(text) : null;
        setLoadError(payload?.error ?? "Unable to update trainer attendance.");
      } catch {
        setLoadError("Unable to update trainer attendance.");
      }
      return;
    }

    const response = await fetch("/api/trainer-dashboard", { cache: "no-store" });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok || !payload) {
      setLoadError("Unable to refresh trainer dashboard.");
      return;
    }

    setData(payload as TrainerDashboardData);
    setLoadError(null);
  };

  return (
    <div className="trainer-root">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #050505;
          --surface: #111111;
          --accent: #ff3e3e;
          --success: #10b981;
          --text: #ffffff;
          --text-dim: #888888;
          --border: rgba(255, 255, 255, 0.08);
        }
        .trainer-root {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          position: relative;
          overflow: hidden;
        }
        .trainer-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(5, 5, 5, 0.88) 0%, rgba(5, 5, 5, 0.72) 45%, rgba(5, 5, 5, 0.84) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.58));
          z-index: 0;
          pointer-events: none;
        }
        .background-carousel { position: absolute; inset: 0; z-index: 0; }
        .background-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; animation: backgroundCarousel 18s infinite; }
        .sidebar {
          width: 240px;
          border-right: 1px solid var(--border);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
          background: rgba(5, 5, 5, 0.46);
          backdrop-filter: blur(8px);
        }
        .sidebar-brand { font-weight: 900; color: white; text-decoration: none; margin-bottom: 2.5rem; }
        .sidebar-brand span { color: var(--accent); }
        .nav-link { padding: 0.8rem 1rem; color: var(--text-dim); text-decoration: none; font-size: 0.85rem; font-weight: 600; border-radius: 6px; margin-bottom: 0.5rem; }
        .nav-link.active { background: var(--surface); color: white; border-left: 3px solid var(--accent); }
        .main-content { flex: 1; padding: 2rem 3rem; overflow-y: auto; position: relative; z-index: 1; }
        .eyebrow { font-size: 0.7rem; color: var(--accent); font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 0.5rem; }
        h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 2rem; }
        .login-overlay { position: fixed; inset: 0; background: rgba(5, 5, 5, 0.86); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
        .login-card { background: var(--surface); padding: 3rem; border-radius: 16px; border: 1px solid var(--border); width: 100%; max-width: 400px; text-align: center; }
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .metric-card { background: var(--surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); }
        .metric-label { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.5rem; }
        .metric-value { font-size: 1.4rem; font-weight: 800; }
        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .list { list-style: none; padding: 0; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border); gap: 1rem; }
        .list-item:last-child { border: none; }
        .person-row { display: flex; align-items: center; gap: 0.85rem; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .badge { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
        .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .input-field { width: 100%; background: #000; border: 1px solid var(--border); padding: 0.8rem; border-radius: 6px; color: white; margin-bottom: 1rem; }
        .btn { width: 100%; padding: 0.8rem; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; }
        .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        @keyframes backgroundCarousel {
          0% { opacity: 0; }
          6% { opacity: 1; }
          27% { opacity: 1; }
          33% { opacity: 0; }
          100% { opacity: 0; }
        }
        @media (max-width: 900px) { .split-grid, .metric-grid { grid-template-columns: 1fr; } .sidebar { display: none; } }
      `}} />

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

      {!isLoggedIn && (
        <div className="login-overlay">
          <div className="login-card">
            <div className="eyebrow">Trainer Secure Access</div>
            <h2 style={{ marginBottom: "1.5rem" }}>Verify Identity</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                className="input-field"
                placeholder="Trainer Luxe ID"
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value.toUpperCase())}
              />
              <button className="btn" type="submit">
                LOG IN TO WORKSPACE
              </button>
            </form>
            <Link href="/" style={{ display: "block", marginTop: "1.5rem", color: "var(--text-dim)", fontSize: "0.8rem" }}>Return to Home</Link>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">LUXE <span>COACH</span></Link>
        <nav>
          <Link href="/trainer" className="nav-link active">DASHBOARD</Link>
          <Link href="/check-in" className="nav-link">MEMBER CHECK-IN</Link>
          <Link href="/kiosk" className="nav-link">SHARED KIOSK</Link>
          <Link href="/" className="nav-link">HOME</Link>
        </nav>
      </aside>

      <main className="main-content">
        <div className="eyebrow">Floor Management</div>
        <h1>Coach Workspace</h1>
        {loadError ? (
          <div className="panel" style={{ borderColor: "var(--accent)", color: "var(--text)" }}>
            <strong style={{ display: "block", marginBottom: "0.5rem" }}>Dashboard unavailable</strong>
            <span style={{ color: "var(--text-dim)" }}>{loadError}</span>
          </div>
        ) : null}

        <section className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Trainer Status</div>
            <div className="metric-value" style={{ color: "var(--success)" }}>{(data.trainer.todayStatus ?? "offline").toUpperCase()}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{data.trainer.specialization ?? "Gym floor support"}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Members on Floor</div>
            <div className="metric-value">{data.visibleMembers.length}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Active members</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Recent Events</div>
            <div className="metric-value">{data.recentEvents.length}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Live activity feed</div>
          </div>
        </section>

        <article className="panel">
          <div className="section-header">
            <div className="person-row">
              <div className="avatar">
                {data.trainer.photoPath ? <img src={getPhotoUrl(data.trainer.photoPath) ?? ""} alt={data.trainer.fullName} /> : getInitials(data.trainer.fullName)}
              </div>
              <div>
                <div className="eyebrow">Self Attendance</div>
                <h2 style={{ margin: 0 }}>{data.trainer.fullName}</h2>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>{data.trainer.staffCode ?? "No Luxe ID"}</div>
              </div>
            </div>
            <span className="badge badge-success">{data.trainer.todayStatus ?? "offline"}</span>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn" style={{ background: "var(--surface)", border: "1px solid var(--border)", flex: 1 }} onClick={() => void handleAttendance("login")}>
              CLOCK IN
            </button>
            <button className="btn" style={{ background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", flex: 1 }} onClick={() => void handleAttendance("logout")}>
              CLOCK OUT
            </button>
          </div>
          <button className="btn" style={{ marginTop: "1rem", background: "transparent", border: "1px solid var(--border)" }} onClick={() => void logoutTrainer()}>
            LOG OUT TRAINER
          </button>
        </article>

        <div className="split-grid">
          <article className="panel">
            <div className="eyebrow">Member Lookup</div>
            <h2 style={{ marginBottom: "1rem" }}>Visible Athletes</h2>
            <ul className="list">
              {data.visibleMembers.map((member) => (
                <li key={member.id} className="list-item">
                  <div className="person-row">
                    <div className="avatar">
                      {member.photoPath ? <img src={getPhotoUrl(member.photoPath) ?? ""} alt={member.fullName} /> : getInitials(member.fullName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{member.fullName}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{member.memberCode} - {member.currentPlan}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{member.attendanceProgress.attended}/{member.attendanceProgress.target} sessions</div>
                    <div style={{ fontSize: "0.7rem", color: member.daysLeft < 7 ? "var(--accent)" : "var(--text-dim)" }}>{member.daysLeft} days left</div>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="eyebrow">Activity Feed</div>
            <h2 style={{ marginBottom: "1rem" }}>Latest Floor Events</h2>
            <ul className="list">
              {data.recentEvents.map((event) => (
                <li key={event.id} className="list-item">
                  <div>
                    <div style={{ fontWeight: 700 }}>{(event as any).actorName ?? event.source}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{formatDateTime(event.occurredAt)}</div>
                  </div>
                  <span className="badge badge-success">{event.result}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </main>
    </div>
  );
}

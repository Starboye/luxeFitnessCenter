"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrainerDashboardData } from "@/lib/types";
import { formatDateTime, getInitials, getPhotoUrl } from "@/lib/utils";

const heroVideos = ["/media/carrosal_1.mp4", "/media/carrosal_2.mp4", "/media/carrosal_3.mp4"];

const initialData: TrainerDashboardData = {
  trainer: { id: "loading", fullName: "Loading...", role: "trainer", active: true },
  visibleMembers: [],
  recentEvents: []
};

export function TrainerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<TrainerDashboardData>(initialData);
  const [loadError, setLoadError] = useState<string | null>(null);

  const visibleMembers = Array.isArray(data.visibleMembers) ? data.visibleMembers : [];
  const recentEvents = Array.isArray(data.recentEvents) ? data.recentEvents : [];

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/trainer-dashboard", { cache: "no-store" });

        if (response.status === 401) {
          router.replace("/trainer-access");
          return;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error ?? "Unable to load dashboard.");
        }

        const payload = await response.json();
        setData(payload as TrainerDashboardData);
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Connection error.");
      }
    };

    void load();
    const intervalId = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(intervalId);
  }, [router]);

  const logoutTrainer = async () => {
    await fetch("/api/trainer-auth", { method: "DELETE" });
    router.replace("/trainer-access");
  };

  const handleAttendance = async (action: "login" | "logout") => {
    const formData = new FormData();
    formData.set("action", action);
    const response = await fetch("/api/trainer-dashboard", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setLoadError("Unable to update attendance.");
      return;
    }

    const refresh = await fetch("/api/trainer-dashboard", { cache: "no-store" });
    const payload = await refresh.json();
    setData(payload);
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
          background: linear-gradient(90deg, rgba(5, 5, 5, 0.88) 0%, rgba(5, 5, 5, 0.72) 45%, rgba(5, 5, 5, 0.84) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.58));
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
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .metric-card { background: var(--surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); }
        .metric-label { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.5rem; }
        .metric-value { font-size: 1.4rem; font-weight: 800; }
        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .list { list-style: none; padding: 0; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border); gap: 1rem; }
        .person-row { display: flex; align-items: center; gap: 0.85rem; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .badge { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
        .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
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
            autoPlay muted loop playsInline preload="auto"
          >
            <source src={video} type="video/mp4" />
          </video>
        ))}
      </div>

      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">LUXE <span>COACH</span></Link>
        <nav>
          <Link href="/trainer" className="nav-link active">DASHBOARD</Link>
          <Link href="/trainer/search" className="nav-link">SEARCH</Link>
          <Link href="/check-in" className="nav-link">MEMBER CHECK-IN</Link>
          <Link href="/kiosk" className="nav-link">SHARED KIOSK</Link>
          <Link href="/" className="nav-link">HOME</Link>
        </nav>
      </aside>

      <main className="main-content">
        <div className="eyebrow">Floor Management</div>
        <h1>Coach Workspace</h1>

        {loadError && (
          <div className="panel" style={{ borderColor: "var(--accent)" }}>
            <strong style={{ display: "block" }}>System Alert</strong>
            <span style={{ color: "var(--text-dim)" }}>{loadError}</span>
          </div>
        )}

        <section className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Trainer Status</div>
            <div className="metric-value" style={{ color: "var(--success)" }}>{(data.trainer.todayStatus ?? "offline").toUpperCase()}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{data.trainer.specialization ?? "Gym floor support"}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Members on Floor</div>
            <div className="metric-value">{visibleMembers.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Recent Events</div>
            <div className="metric-value">{recentEvents.length}</div>
          </div>
        </section>

        <article className="panel">
          <div className="section-header">
            <div className="person-row">
              <div className="avatar">
                {data.trainer.photoPath ? <img src={getPhotoUrl(data.trainer.photoPath) ?? ""} alt={data.trainer.fullName} /> : getInitials(data.trainer.fullName)}
              </div>
              <div>
                <div className="eyebrow">Active Session</div>
                <h2 style={{ margin: 0 }}>{data.trainer.fullName}</h2>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn" style={{ background: "var(--surface)", border: "1px solid var(--border)", flex: 1 }} onClick={() => void handleAttendance("login")}>CLOCK IN</button>
            <button className="btn" style={{ background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", flex: 1 }} onClick={() => void handleAttendance("logout")}>CLOCK OUT</button>
          </div>
          <button className="btn" style={{ marginTop: "1rem", background: "transparent", border: "1px solid var(--border)" }} onClick={() => void logoutTrainer()}>LOG OUT TRAINER</button>
        </article>

        <div className="split-grid">
          <article className="panel">
            <div className="eyebrow">Visibility</div>
            <h2 style={{ marginBottom: "1rem" }}>Active Members</h2>
            <ul className="list">
              {visibleMembers.map((member) => (
                <li key={member.id} className="list-item">
                  <div className="person-row">
                    <div className="avatar">
                      {member.photoPath ? <img src={getPhotoUrl(member.photoPath) ?? ""} alt={member.fullName} /> : getInitials(member.fullName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{member.fullName}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{member.memberCode}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="eyebrow">Real-time</div>
            <h2 style={{ marginBottom: "1rem" }}>Floor Activity</h2>
            <ul className="list">
              {recentEvents.map((event) => (
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

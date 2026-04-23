// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";
// import { AdminDashboardData } from "@/lib/types";
// import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

// const initialData: AdminDashboardData = {
//   stats: {
//     totalMembers: 0,
//     activeMembers: 0,
//     activeTrainers: 0,
//     collectionsThisMonth: 0,
//     outstandingDues: 0,
//     profitEstimate: 0,
//     memberAttendanceToday: 0,
//     trainerAttendanceToday: 0
//   },
//   alerts: [],
//   attendanceEvents: [],
//   members: [],
//   trainers: [],
//   memberships: [],
//   payments: []
// };

// export default function AdminPage() {
//   const [data, setData] = useState<AdminDashboardData>(initialData);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let active = true;

//     const load = async () => {
//       const response = await fetch(`/api/admin-dashboard?ts=${Date.now()}`, { cache: "no-store" });
//       const payload = (await response.json()) as AdminDashboardData;
//       if (active) {
//         setData(payload);
//         setLoading(false);
//       }
//     };

//     void load();
//     const intervalId = window.setInterval(() => void load(), 15000);

//     if (!isSupabaseConfigured()) {
//       return () => {
//         active = false;
//         window.clearInterval(intervalId);
//       };
//     }

//     const supabase = createSupabaseBrowserClient();
//     const channel = supabase
//       .channel("admin-dashboard-live")
//       .on("postgres_changes", { event: "*", schema: "public", table: "attendance_events" }, () => void load())
//       .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => void load())
//       .on("postgres_changes", { event: "*", schema: "public", table: "memberships" }, () => void load())
//       .on("postgres_changes", { event: "*", schema: "public", table: "alert_queue" }, () => void load())
//       .subscribe();

//     return () => {
//       active = false;
//       window.clearInterval(intervalId);
//       void supabase.removeChannel(channel);
//     };
//   }, []);

//   return (
//     <div className="admin-root">
//       <style dangerouslySetInnerHTML={{ __html: `
//         :root {
//           --admin-bg: #050505;
//           --panel: #0f0f0f;
//           --accent: #ff3e3e;
//           --gold: #d4af37;
//           --text: #ffffff;
//           --text-dim: #888888;
//           --border: rgba(255, 255, 255, 0.08);
//           --success: #10b981;
//         }

//         .admin-root {
//           background: var(--admin-bg);
//           color: var(--text);
//           min-height: 100vh;
//           font-family: 'Inter', system-ui, sans-serif;
//           display: flex;
//         }
//         .sidebar {
//           width: 260px;
//           border-right: 1px solid var(--border);
//           padding: 2rem 1.5rem;
//           height: 100vh;
//           position: sticky;
//           top: 0;
//         }
//         .sidebar-brand { font-weight: 900; font-size: 1.2rem; letter-spacing: -0.5px; margin-bottom: 3rem; display: block; text-decoration: none; color: white; }
//         .sidebar-link { display: block; padding: 0.8rem 1rem; color: var(--text-dim); text-decoration: none; font-weight: 600; font-size: 0.9rem; border-radius: 6px; margin-bottom: 0.5rem; transition: 0.2s; }
//         .sidebar-link.active { background: var(--panel); color: var(--accent); border-left: 3px solid var(--accent); }
//         .sidebar-link:hover { color: white; background: rgba(255,255,255,0.03); }
//         .content { flex: 1; padding: 2rem 3rem; overflow-y: auto; }
//         .page-header { margin-bottom: 2.5rem; }
//         .page-header h1 { font-size: 1.8rem; font-weight: 800; margin-top: 0.5rem; }
//         .eyebrow { font-size: 0.7rem; color: var(--accent); font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
//         .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
//         .metric-card { background: var(--panel); border: 1px solid var(--border); padding: 1.5rem; border-radius: 8px; }
//         .metric-val { font-size: 1.5rem; font-weight: 800; margin: 0.5rem 0; }
//         .metric-hint { font-size: 0.75rem; color: var(--text-dim); }
//         .dashboard-split { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
//         .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; }
//         .list { list-style: none; padding: 0; }
//         .list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border); gap: 1rem; }
//         .list-item:last-child { border: none; }
//         .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
//         .table th { text-align: left; color: var(--text-dim); font-size: 0.75rem; padding: 1rem; border-bottom: 1px solid var(--border); text-transform: uppercase; }
//         .table td { padding: 1rem; font-size: 0.85rem; border-bottom: 1px solid var(--border); }
//         .badge { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
//         .badge-critical { background: rgba(255,62,62,0.15); color: var(--accent); }
//         .badge-warning { background: rgba(212,175,55,0.15); color: var(--gold); }
//         .badge-success { background: rgba(16,185,129,0.15); color: var(--success); }
//         @media (max-width: 1100px) { .dashboard-split { grid-template-columns: 1fr; } .sidebar { display: none; } }
//       `}} />

//       <aside className="sidebar">
//         <Link href="/" className="sidebar-brand">LUXE <span style={{ color: "var(--accent)" }}>OPS</span></Link>
//         <Link href="/admin" className="sidebar-link active">OVERVIEW</Link>
//         <Link href="/kiosk" className="sidebar-link">KIOSK VIEW</Link>
//         <Link href="/check-in" className="sidebar-link">QR SCANNER</Link>
//         <Link href="/trainer" className="sidebar-link">COACH PORTAL</Link>
//       </aside>

//       <main className="content">
//         <header className="page-header">
//           <div className="eyebrow">Command Center</div>
//           <h1>Operations Dashboard</h1>
//           <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
//             {loading ? "Loading live floor activity..." : "Live visibility into floor activity, renewals, collections, and attendance."}
//           </p>
//         </header>

//         <section className="metric-grid">
//           <div className="metric-card">
//             <div className="eyebrow">Members</div>
//             <div className="metric-val">{data.stats.totalMembers}</div>
//             <div className="metric-hint">{data.stats.activeMembers} currently active</div>
//           </div>
//           <div className="metric-card">
//             <div className="eyebrow">Attendance</div>
//             <div className="metric-val">{data.stats.memberAttendanceToday}</div>
//             <div className="metric-hint">Check-ins today</div>
//           </div>
//           <div className="metric-card">
//             <div className="eyebrow" style={{ color: "var(--success)" }}>Collections</div>
//             <div className="metric-val">{formatCurrency(data.stats.collectionsThisMonth)}</div>
//             <div className="metric-hint">Current month total</div>
//           </div>
//           <div className="metric-card">
//             <div className="eyebrow" style={{ color: "var(--gold)" }}>Due Amount</div>
//             <div className="metric-val">{formatCurrency(data.stats.outstandingDues)}</div>
//             <div className="metric-hint">Pending collection</div>
//           </div>
//         </section>

//         <div className="dashboard-split">
//           <article className="panel">
//             <div className="eyebrow">Alerts</div>
//             <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>Action Required</h2>
//             <ul className="list">
//               {data.alerts.map((alert) => (
//                 <li key={alert.id} className="list-item">
//                   <div>
//                     <div style={{ fontWeight: 700 }}>{alert.title}</div>
//                     <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{alert.description}</div>
//                   </div>
//                   <span className={`badge ${alert.severity === "critical" ? "badge-critical" : "badge-warning"}`}>
//                     {alert.dueOn ? formatDate(alert.dueOn) : "PENDING"}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </article>

//           <article className="panel">
//             <div className="eyebrow">Live Feed</div>
//             <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>Recent Check-ins</h2>
//             <ul className="list">
//               {data.attendanceEvents.map((event) => (
//                 <li key={event.id} className="list-item">
//                   <div>
//                     <div style={{ fontWeight: 700 }}>{event.actorType}</div>
//                     <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
//                       {event.source} • {formatDateTime(event.occurredAt)}
//                     </div>
//                   </div>
//                   <span className="badge badge-success">{event.result}</span>
//                 </li>
//               ))}
//             </ul>
//           </article>
//         </div>

//         <section className="panel">
//           <div className="eyebrow">Database</div>
//           <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Membership Status</h2>
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>Member</th>
//                 <th>Plan</th>
//                 <th>Days Left</th>
//                 <th>Due</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.members.map((member) => (
//                 <tr key={member.id}>
//                   <td>
//                     <div style={{ fontWeight: 700 }}>{member.fullName}</div>
//                     <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{member.memberCode}</div>
//                   </td>
//                   <td>{member.currentPlan}</td>
//                   <td style={{ color: member.daysLeft < 7 ? "var(--accent)" : "inherit" }}>{member.daysLeft}d</td>
//                   <td>{member.dueAmount > 0 ? formatCurrency(member.dueAmount) : "—"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </section>
//       </main>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { AdminDashboardData } from "@/lib/types";
import { formatCurrency, formatDate, getInitials, getPhotoUrl } from "@/lib/utils";

const initialData: AdminDashboardData = {
  stats: { totalMembers: 0, activeMembers: 0, activeTrainers: 0, collectionsThisMonth: 0, outstandingDues: 0, profitEstimate: 0, memberAttendanceToday: 0, trainerAttendanceToday: 0 },
  alerts: [], attendanceEvents: [], members: [], trainers: [], memberships: [], payments: []
};

export default function AdminPage() {
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const load = async (date?: string) => {
    const targetDate = date || selectedDate;
    const response = await fetch(`/api/admin-dashboard?date=${targetDate}&ts=${Date.now()}`, { cache: "no-store" });
    const payload = (await response.json()) as AdminDashboardData;
    setData(payload);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const intervalId = window.setInterval(() => load(), 15000);
    return () => window.clearInterval(intervalId);
  }, [selectedDate]);

  // Global Search Logic
  const searchResult = useMemo(() => {
    if (!globalSearch) return null;
    return data.members.find(m => 
      m.fullName.toLowerCase().includes(globalSearch.toLowerCase()) || 
      m.memberCode.toLowerCase() === globalSearch.toLowerCase() ||
      m.phone?.includes(globalSearch)
    );
  }, [globalSearch, data.members]);

  // Table Filter Logic
  const filteredMembers = data.members.filter(m => 
    m.fullName.toLowerCase().includes(tableSearch.toLowerCase()) || 
    m.memberCode.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="admin-root">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --admin-bg: #050505; --panel: #0f0f0f; --accent: #ff3e3e;
          --gold: #d4af37; --text: #ffffff; --text-dim: #888888;
          --border: rgba(255, 255, 255, 0.08); --success: #10b981;
          --danger: #ef4444; --warning: #f59e0b;
        }
        .admin-root { background: var(--admin-bg); color: var(--text); min-height: 100vh; font-family: 'Inter', sans-serif; display: flex; }
        .sidebar { width: 260px; border-right: 1px solid var(--border); padding: 2rem 1.5rem; height: 100vh; position: sticky; top: 0; }
        .sidebar-brand {
          width: 84px;
          height: 84px;
          margin-bottom: 3rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
        }
        .sidebar-brand img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sidebar-link { display: block; padding: 0.8rem 1rem; color: var(--text-dim); text-decoration: none; font-weight: 600; font-size: 0.9rem; border-radius: 6px; margin-bottom: 0.5rem; }
        .sidebar-link.active { background: var(--panel); color: var(--accent); border-left: 3px solid var(--accent); }
        .content { flex: 1; padding: 2rem 3rem; }
        
        /* Search Bar  */
        .search-container { margin-bottom: 2rem; position: relative; }
        .global-search { width: 100%; padding: 1rem 1.5rem; background: var(--panel); border: 1px solid var(--border); border-radius: 12px; color: white; font-size: 1rem; outline: none; transition: 0.3s; }
        .global-search:focus { border-color: var(--accent); box-shadow: 0 0 15px rgba(255,62,62,0.1); }
        
        /* Dashboard Layout */
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .metric-card { background: var(--panel); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; }
        .dashboard-split { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-bottom: 2rem; }
        
        /* Panels */
        .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; position: relative; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        
        /* Attendance Table Style */
        .att-table { width: 100%; border-collapse: collapse; }
        .att-table th { text-align: left; color: var(--text-dim); font-size: 0.7rem; padding: 1rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .att-table td { padding: 1.2rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 38px; height: 38px; background: #222; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border); overflow: hidden; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Badges */
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .bg-success { background: rgba(16,185,129,0.1); color: var(--success); }
        .bg-danger { background: rgba(239,68,68,0.1); color: var(--danger); }
        .bg-warning { background: rgba(245,158,11,0.1); color: var(--warning); }
        
        input[type="date"] { background: #000; color: white; border: 1px solid var(--border); padding: 0.5rem; border-radius: 6px; outline: none; }
      `}} />

      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">
          <img src="/media/Luxe_Fitness_Logo.jpg" alt="Luxe Fitness logo" />
        </Link>
        <nav>
          <Link href="/admin" className="sidebar-link active">DASHBOARD</Link>
          <Link href="/admin/manage" className="sidebar-link">MANAGE RECORDS</Link>
          <Link href="/kiosk" className="sidebar-link">OPEN KIOSK</Link>
          <Link href="/trainer" className="sidebar-link">STAFF PORTAL</Link>
          <Link href="/" className="sidebar-link">HOME</Link>
        </nav>
      </aside>

      <main className="content">
        {/* GLOBAL SEARCH */}
        <div className="search-container">
          <input 
            type="text" 
            className="global-search" 
            placeholder="Search Member by Name, ID, or Phone..." 
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {searchResult && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#111', border: '2px solid var(--accent)', borderRadius: '12px', padding: '1.5rem', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{searchResult.fullName}</h2>
                  <p style={{ color: 'var(--accent)', fontWeight: 800 }}>{searchResult.memberCode}</p>
                </div>
                <button onClick={() => setGlobalSearch("")} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                <div className="metric-card" style={{ background: '#000' }}>
                  <small style={{ color: '#888' }}>PLAN</small>
                  <p style={{ margin: '5px 0 0', fontWeight: 800 }}>{searchResult.currentPlan}</p>
                </div>
                <div className="metric-card" style={{ background: '#000' }}>
                  <small style={{ color: '#888' }}>STATUS</small>
                  <p style={{ margin: '5px 0 0', fontWeight: 800, color: searchResult.dueAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {searchResult.dueAmount > 0 ? 'BLOCKED/PENDING' : 'ACTIVE'}
                  </p>
                </div>
                <div className="metric-card" style={{ background: '#000' }}>
                  <small style={{ color: '#888' }}>BALANCE</small>
                  <p style={{ margin: '5px 0 0', fontWeight: 800 }}>{formatCurrency(searchResult.dueAmount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="metric-grid">
          <div className="metric-card">
            <small style={{ color: 'var(--accent)', fontWeight: 800 }}>MEMBERS</small>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.5rem 0' }}>{data.stats.totalMembers}</div>
            <small style={{ color: 'var(--text-dim)' }}>{data.stats.activeMembers} Active</small>
          </div>
          <div className="metric-card">
            <small style={{ color: 'var(--success)', fontWeight: 800 }}>FLOOR NOW</small>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.5rem 0' }}>{data.stats.memberAttendanceToday}</div>
            <small style={{ color: 'var(--text-dim)' }}>Daily check-ins</small>
          </div>
          <div className="metric-card">
            <small style={{ color: 'var(--gold)', fontWeight: 800 }}>COLLECTIONS</small>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.5rem 0' }}>{formatCurrency(data.stats.collectionsThisMonth)}</div>
            <small style={{ color: 'var(--text-dim)' }}>This month</small>
          </div>
          <div className="metric-card">
            <small style={{ color: '#888', fontWeight: 800 }}>OUTSTANDING</small>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.5rem 0', color: 'var(--accent)' }}>{formatCurrency(data.stats.outstandingDues)}</div>
            <small style={{ color: 'var(--text-dim)' }}>Pending recovery</small>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: "2rem" }}>
          <div className="panel-header">
            <div>
              <small style={{ color: 'var(--accent)', fontWeight: 800 }}>TRAINER TRACKING</small>
              <h2 style={{ margin: 0 }}>Staff on Record</h2>
            </div>
          </div>
          <table className="att-table">
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Luxe ID</th>
                <th>Specialization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.trainers.map((trainer) => (
                <tr key={trainer.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">
                        {trainer.photoPath ? <img src={getPhotoUrl(trainer.photoPath) ?? ""} alt={trainer.fullName} /> : getInitials(trainer.fullName)}
                      </div>
                      <div style={{ fontWeight: 800 }}>{trainer.fullName}</div>
                    </div>
                  </td>
                  <td>{trainer.staffCode ?? "Not set"}</td>
                  <td>{trainer.specialization ?? "General Floor"}</td>
                  <td>
                    <span className={`status-badge ${trainer.todayStatus === 'checked-in' ? 'bg-success' : trainer.todayStatus === 'checked-out' ? 'bg-warning' : 'bg-danger'}`}>
                      {trainer.todayStatus === 'checked-in' ? 'Checked In' : trainer.todayStatus === 'checked-out' ? 'Checked Out' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="dashboard-split">
          {/* LIVE ATTENDANCE (SWAPPED TO PRIMARY) */}
          <article className="panel">
            <div className="panel-header">
              <div>
                <small style={{ color: 'var(--accent)', fontWeight: 800 }}>LIVE FEED</small>
                <h2 style={{ margin: 0 }}>Attendance Log</h2>
              </div>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <table className="att-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Source</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.attendanceEvents
                  .filter((event) => event.actorType === "member")
                  .map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {(event as any).photoPath ? (
                            <img src={getPhotoUrl((event as any).photoPath) ?? ""} alt={(event as any).actorName || event.actorType} />
                          ) : (
                            getInitials((event as any).actorName || event.actorType)
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{(event as any).actorName || event.actorType}</div>
                          <small style={{ color: 'var(--text-dim)' }}>{event.actorType}</small>
                        </div>
                      </div>
                    </td>
                    <td><small>{event.source.toUpperCase()}</small></td>
                    <td>{new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`status-badge ${String((event as any).result ?? event.result).includes('Checked') ? 'bg-success' : 'bg-danger'}`}>
                        {String((event as any).result ?? event.result)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          {/* ALERTS (SWAPPED TO SECONDARY) */}
          <article className="panel">
            <small style={{ color: 'var(--accent)', fontWeight: 800 }}>ACTION REQUIRED</small>
            <h2 style={{ marginBottom: '1.5rem' }}>Priority Alerts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.alerts.map((alert) => (
                <div key={alert.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', borderLeft: `4px solid ${alert.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'}` }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{alert.title}</div>
                  <p style={{ margin: '5px 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{alert.description}</p>
                  <small style={{ color: alert.severity === 'critical' ? 'var(--danger)' : 'var(--gold)', fontWeight: 700 }}>
                    {alert.dueOn ? `DUE: ${formatDate(alert.dueOn)}` : 'IMMEDIATE'}
                  </small>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* MEMBER DATABASE WITH SEARCH */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <small style={{ color: 'var(--accent)', fontWeight: 800 }}>DATABASE</small>
              <h2 style={{ margin: 0 }}>Membership Directory</h2>
            </div>
            <input 
              type="text" 
              placeholder="Filter table..." 
              style={{ background: '#000', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
          <table className="att-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Days Left</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">
                        {member.photoPath ? <img src={getPhotoUrl(member.photoPath) ?? ""} alt={member.fullName} /> : getInitials(member.fullName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{member.fullName}</div>
                        <small style={{ color: 'var(--text-dim)' }}>{member.memberCode}</small>
                      </div>
                    </div>
                  </td>
                  <td>{member.currentPlan}</td>
                  <td>
                    <div style={{ color: member.daysLeft < 7 ? 'var(--danger)' : 'white', fontWeight: 700 }}>
                      {member.daysLeft} Days
                    </div>
                  </td>
                  <td>
                    {member.dueAmount > 0 ? (
                      <span className="status-badge bg-danger">PENDING: {formatCurrency(member.dueAmount)}</span>
                    ) : (
                      <span className="status-badge bg-success">PAID</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

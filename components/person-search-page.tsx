import Link from "next/link";
import { updateMemberAction } from "@/app/actions";
import { PersonProfileData, PersonSearchResult } from "@/lib/types";
import { formatCurrency, formatDate, getInitials, getPhotoUrl } from "@/lib/utils";

function buildCalendarCells(calendar: PersonProfileData["attendanceCalendar"]) {
  const countByDate = new Map(calendar.map((entry) => [entry.date, entry.count]));
  const days: Array<{ date: string; count: number }> = [];
  const today = new Date();

  for (let offset = 363; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    days.push({ date: iso, count: countByDate.get(iso) ?? 0 });
  }

  return days;
}

function buildCalendarMonths(calendar: PersonProfileData["attendanceCalendar"]) {
  const countByDate = new Map(calendar.map((entry) => [entry.date, entry.count]));
  const months: Array<{ key: string; label: string; year: string; leadingBlanks: number; days: Array<{ date: string; count: number; dayOfMonth: number }> }> = [];
  const today = new Date();

  for (let offset = 11; offset >= 0; offset -= 1) {
    const current = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const year = String(current.getFullYear());
    const monthIndex = current.getMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const label = current.toLocaleString("en-IN", { month: "long" });
    const daysInMonth = new Date(current.getFullYear(), monthIndex + 1, 0).getDate();
    const leadingBlanks = (current.getDay() + 6) % 7;
    const days = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(current.getFullYear(), monthIndex, day).toISOString().slice(0, 10);
      days.push({
        date,
        count: countByDate.get(date) ?? 0,
        dayOfMonth: day
      });
    }

    months.push({ key, label, year, leadingBlanks, days });
  }

  return months;
}

function getHeatColor(count: number) {
  if (count >= 3) return "#ff3e3e";
  if (count === 2) return "#ff7a59";
  if (count === 1) return "#d4af37";
  return "rgba(255,255,255,0.08)";
}

export function PersonSearchPage({
  viewer,
  query,
  results,
  profile,
  status
}: {
  viewer: "admin" | "trainer";
  query: string;
  results: PersonSearchResult[];
  profile: PersonProfileData | null;
  status?: string;
}) {
  const isAdmin = viewer === "admin";
  const basePath = isAdmin ? "/admin/search" : "/trainer/search";
  const calendarCells = profile ? buildCalendarCells(profile.attendanceCalendar) : [];
  const calendarMonths = profile ? buildCalendarMonths(profile.attendanceCalendar) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Link href={isAdmin ? "/admin" : "/trainer"} style={{ color: "white", textDecoration: "none", fontWeight: 800 }}>
            Back to {isAdmin ? "Admin Dashboard" : "Trainer Workspace"}
          </Link>
          <Link href="/" style={{ color: "#9a9a9a", textDecoration: "none", fontWeight: 700 }}>
            Luxe Home
          </Link>
        </div>

        <section style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.6rem", background: "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(11,11,11,0.98))", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff5a5a", fontWeight: 900, marginBottom: "0.8rem" }}>
            Person Search
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.95 }}>Find any member or trainer.</h1>
          <p style={{ color: "#9a9a9a", lineHeight: 1.65, maxWidth: 760 }}>
            Search by name, phone number, or Luxe ID. Open the full profile to review attendance, streaks, plan validity, assigned PT, and {isAdmin ? "collections" : "training history"}.
          </p>
          <form action={basePath} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "0.85rem", marginTop: "1rem" }}>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, phone, or Luxe ID"
              style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }}
            />
            <button type="submit" style={{ border: "none", borderRadius: 14, background: "linear-gradient(135deg, #ff4d4d 0%, #d92020 100%)", color: "white", padding: "0.95rem 1.3rem", fontWeight: 900, cursor: "pointer" }}>
              SEARCH
            </button>
          </form>
          {status === "member-updated" ? (
            <div style={{ marginTop: "1rem", padding: "0.9rem 1rem", borderRadius: 14, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#b7f7de", fontWeight: 800 }}>
              Member details updated successfully.
            </div>
          ) : null}
        </section>

        {results.length ? (
          <section style={{ display: "grid", gap: "0.9rem", marginBottom: "1.5rem" }}>
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={`${basePath}?q=${encodeURIComponent(query)}&id=${encodeURIComponent(result.id)}&type=${result.type}`}
                style={{ textDecoration: "none", color: "white", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "1rem 1.2rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 800 }}>
                    {result.photoPath ? <img src={getPhotoUrl(result.photoPath) ?? ""} alt={result.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(result.fullName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{result.fullName}</div>
                    <div style={{ color: "#9a9a9a", fontSize: 13 }}>{result.code}{result.phone ? ` - ${result.phone}` : ""}</div>
                  </div>
                </div>
                <div style={{ color: "#f7d77b", fontWeight: 800, fontSize: 13 }}>{result.roleLabel}</div>
              </Link>
            ))}
          </section>
        ) : query ? (
          <section style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: 16, background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: "#9a9a9a" }}>
            No member or trainer matched "{query}".
          </section>
        ) : null}

        {profile ? (
          <section style={{ display: "grid", gap: "1.5rem" }}>
            <article style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 900, fontSize: "1.2rem" }}>
                    {profile.result.photoPath ? <img src={getPhotoUrl(profile.result.photoPath) ?? ""} alt={profile.result.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(profile.result.fullName)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>{profile.result.type}</div>
                    <h2 style={{ margin: "0.4rem 0", fontSize: "2rem" }}>{profile.result.fullName}</h2>
                    <div style={{ color: "#9a9a9a" }}>{profile.result.code}{profile.result.phone ? ` - ${profile.result.phone}` : ""}</div>
                    {profile.member?.personalTrainerName ? (
                      <div style={{ display: "inline-flex", marginTop: "0.7rem", padding: "0.35rem 0.65rem", borderRadius: 999, background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.22)", color: "#f7d77b", fontSize: 12, fontWeight: 800 }}>
                        PT: {profile.member.personalTrainerName}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: "0.85rem", flex: 1, minWidth: 320 }}>
                  <div style={{ background: "#171717", borderRadius: 16, padding: "1rem" }}>
                    <div style={{ color: "#9a9a9a", fontSize: 12 }}>Streak</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{profile.member?.streak ?? 0}</div>
                  </div>
                  <div style={{ background: "#171717", borderRadius: 16, padding: "1rem" }}>
                    <div style={{ color: "#9a9a9a", fontSize: 12 }}>Days Left</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{profile.member?.daysLeft ?? "-"}</div>
                  </div>
                  <div style={{ background: "#171717", borderRadius: 16, padding: "1rem" }}>
                    <div style={{ color: "#9a9a9a", fontSize: 12 }}>Check-Ins</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{profile.member?.attendanceProgress.attended ?? profile.attendanceCalendar.length}</div>
                  </div>
                </div>
              </div>
            </article>

            <article style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>Attendance Calendar</div>
                  <div style={{ color: "#9a9a9a", fontSize: 13, marginTop: 6 }}>Last 12 months with weekday layout and month labels.</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#9a9a9a", fontSize: 12 }}>
                  <span>Less</span>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: getHeatColor(0) }} />
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: getHeatColor(1) }} />
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: getHeatColor(2) }} />
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: getHeatColor(3) }} />
                  <span>More</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                {calendarMonths.map((month) => (
                  <div key={month.key} style={{ background: "#171717", borderRadius: 18, padding: "1rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.85rem", alignItems: "center" }}>
                      <strong style={{ fontSize: 15 }}>{month.label}</strong>
                      <span style={{ color: "#9a9a9a", fontSize: 12 }}>{month.year}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8, color: "#777", fontSize: 11, textAlign: "center" }}>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                      {Array.from({ length: month.leadingBlanks }).map((_, index) => (
                        <div key={`${month.key}-blank-${index}`} />
                      ))}
                      {month.days.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.date} - ${day.count} check-in(s)`}
                          style={{
                            minHeight: 34,
                            borderRadius: 8,
                            background: getHeatColor(day.count),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            color: day.count > 0 ? "#fff" : "#8f8f8f",
                            border: "1px solid rgba(255,255,255,0.04)"
                          }}
                        >
                          {day.dayOfMonth}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
              <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.5rem" }}>
                <div style={{ fontSize: 12, color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.9rem" }}>Streak Trend</div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {profile.streakTrend.length ? profile.streakTrend.map((point) => (
                    <div key={point.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: "#9a9a9a" }}>{point.label}</span>
                        <strong>{point.value}</strong>
                      </div>
                      <div style={{ height: 10, borderRadius: 999, background: "#1b1b1b", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(point.value * 10, 100)}%`, height: "100%", background: "linear-gradient(90deg, #ff3e3e, #d4af37)" }} />
                      </div>
                    </div>
                  )) : <div style={{ color: "#9a9a9a" }}>No attendance data yet.</div>}
                </div>
              </div>

              {isAdmin && profile.member ? (
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.5rem" }}>
                  <div style={{ fontSize: 12, color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.9rem" }}>Financial View</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.85rem", marginBottom: "1rem" }}>
                    <div style={{ background: "#171717", borderRadius: 16, padding: "1rem" }}>
                      <div style={{ color: "#9a9a9a", fontSize: 12 }}>Total Paid</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900 }}>{formatCurrency(profile.totalPaid ?? 0)}</div>
                    </div>
                    <div style={{ background: "#171717", borderRadius: 16, padding: "1rem" }}>
                      <div style={{ color: "#9a9a9a", fontSize: 12 }}>Outstanding</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900 }}>{formatCurrency(profile.totalDue ?? 0)}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {(profile.financialTrend ?? []).length ? profile.financialTrend?.map((point) => (
                      <div key={point.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: "#9a9a9a" }}>{point.label}</span>
                          <strong>{formatCurrency(point.value)}</strong>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: "#1b1b1b", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min((point.value / Math.max(...(profile.financialTrend ?? []).map((item) => item.value), 1)) * 100, 100)}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #d4af37)" }} />
                        </div>
                      </div>
                    )) : <div style={{ color: "#9a9a9a" }}>No payment history yet.</div>}
                  </div>
                </div>
              ) : null}
            </article>

            {isAdmin && profile.member ? (
              <article style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.5rem" }}>
                <div style={{ fontSize: 12, color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.9rem" }}>Update Member</div>
                <form action={updateMemberAction} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.85rem" }}>
                  <input type="hidden" name="memberId" value={profile.member.id} />
                  <input type="hidden" name="profileId" value={profile.member.profileId} />
                  <input name="fullName" defaultValue={profile.member.fullName} placeholder="Full name" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }} />
                  <input name="phone" defaultValue={profile.member.phone} placeholder="Phone" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }} />
                  <input name="email" defaultValue={profile.member.email} placeholder="Email" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }} />
                  <input name="dueAmount" defaultValue={String(profile.member.dueAmount)} placeholder="Due amount" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }} />
                  <input name="membershipStatus" defaultValue={profile.member.active ? "active" : "expired"} placeholder="Membership status" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }} />
                  <input name="personalTrainerId" defaultValue={profile.member.personalTrainerId} placeholder="PT trainer ID" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#090909", color: "white", padding: "0.92rem 1rem" }} />
                  <button type="submit" style={{ gridColumn: "1 / -1", border: "none", borderRadius: 14, background: "linear-gradient(135deg, #ff4d4d 0%, #d92020 100%)", color: "white", padding: "1rem 1.1rem", fontWeight: 900, cursor: "pointer" }}>
                    UPDATE MEMBER
                  </button>
                </form>
              </article>
            ) : null}

            {isAdmin && profile.recentPayments?.length ? (
              <article style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.5rem" }}>
                <div style={{ fontSize: 12, color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.9rem" }}>Recent Payments</div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {profile.recentPayments.map((payment) => (
                    <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.9rem 1rem", borderRadius: 14, background: "#171717" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{formatCurrency(payment.amount)}</div>
                        <div style={{ color: "#9a9a9a", fontSize: 13 }}>{payment.method.toUpperCase()}</div>
                      </div>
                      <div style={{ color: "#9a9a9a", fontSize: 13 }}>{formatDate(payment.paidOn)}</div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { KioskCheckInResponse } from "@/lib/types";

const initialState: KioskCheckInResponse = {
  ok: false,
  message: "Enter a Luxe member ID to mark attendance.",
  member: undefined,
  latestEvent: undefined
};

export function KioskForm() {
  const [state, setState] = useState(initialState);
  const [memberCode, setMemberCode] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const response = await fetch("/api/kiosk-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCode })
    });

    const payload = (await response.json()) as KioskCheckInResponse;
    setState(payload);
    setPending(false);
  }

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="memberCode">Member ID</label>
          <input
            id="memberCode"
            name="memberCode"
            placeholder="LUXE-1001"
            autoComplete="off"
            value={memberCode}
            onChange={(event) => setMemberCode(event.target.value)}
          />
          <small>Members enter their unique ID here on the shared kiosk.</small>
        </div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Checking in..." : "Mark attendance"}
        </button>
      </form>

      <div className="stack">
        <div className="notice">{state.message}</div>
        {state.member ? (
          <article className="panel">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Member Snapshot</div>
                <h3>{state.member.fullName}</h3>
              </div>
              <StatusBadge status={state.latestEvent?.result ?? "success"}>
                {state.latestEvent?.result ?? "success"}
              </StatusBadge>
            </div>
            <div className="grid-3">
              <div>
                <strong>{state.member.currentPlan}</strong>
                <div className="muted">Current membership</div>
              </div>
              <div>
                <strong>{state.member.daysLeft} days</strong>
                <div className="muted">Remaining</div>
              </div>
              <div>
                <strong>{formatCurrency(state.member.dueAmount)}</strong>
                <div className="muted">Amount due</div>
              </div>
              <div>
                <strong>{state.member.streak} days</strong>
                <div className="muted">Streak</div>
              </div>
              <div>
                <strong>
                  {state.member.attendanceProgress.attended}/{state.member.attendanceProgress.target}
                </strong>
                <div className="muted">Attendance progress</div>
              </div>
              <div>
                <strong>{state.latestEvent ? formatDateTime(state.latestEvent.occurredAt) : "-"}</strong>
                <div className="muted">Latest event</div>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

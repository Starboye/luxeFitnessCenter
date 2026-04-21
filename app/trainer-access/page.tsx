"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TrainerAccessPage() {
  const router = useRouter();
  const [trainerCode, setTrainerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trainerCode) {
      setMessage("Enter a trainer Luxe ID to continue.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/trainer-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerCode })
    });
    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      setMessage(payload?.message ?? "Unable to verify trainer Luxe ID.");
      setLoading(false);
      return;
    }

    router.push("/trainer");
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
        background:
          "radial-gradient(circle at top, rgba(255,62,62,0.14), transparent 28%), linear-gradient(180deg, #020202 0%, #090909 100%)",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(13,13,13,0.96)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          padding: "2rem"
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff5a5a", fontWeight: 900 }}>
          Trainer Access
        </div>
        <h1 style={{ margin: "0.7rem 0 0.8rem", fontSize: "2.2rem", lineHeight: 1 }}>Log In With Luxe ID</h1>
        <p style={{ color: "#9a9a9a", lineHeight: 1.6 }}>
          Trainers use their own Luxe ID here before opening the coach workspace and attendance controls.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem", display: "grid", gap: "0.9rem" }}>
          <input
            type="text"
            value={trainerCode}
            onChange={(event) => setTrainerCode(event.target.value.toUpperCase())}
            placeholder="LUXE-TR-001"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#090909",
              color: "white",
              padding: "0.95rem 1rem"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg, #ff4d4d 0%, #d92020 100%)",
              color: "white",
              padding: "1rem 1.1rem",
              fontWeight: 900,
              letterSpacing: "0.08em",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "VERIFYING..." : "ENTER TRAINER WORKSPACE"}
          </button>
        </form>

        {message ? (
          <div
            style={{
              marginTop: "1rem",
              borderRadius: 14,
              padding: "0.95rem 1rem",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.22)",
              color: "#ffc4c4",
              fontWeight: 700
            }}
          >
            {message}
          </div>
        ) : null}

        <Link href="/" style={{ display: "inline-block", marginTop: "1.25rem", color: "#9a9a9a", textDecoration: "none", fontWeight: 700 }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}

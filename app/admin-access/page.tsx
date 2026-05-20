import { adminPanelLoginAction } from "@/app/actions";
import Link from "next/link";

type AdminAccessPageProps = {
  searchParams?: {
    error?: string;
  };
};

function getMessage(error?: string) {
  switch (error) {
    case "invalid-password":
      return "Incorrect admin password. Please try again.";
    case "missing-password-config":
      return "Set ADMIN_PANEL_PASSWORD in your environment before using the admin panel.";
    default:
      return null;
  }
}

export default function AdminAccessPage({ searchParams }: AdminAccessPageProps) {
  const message = getMessage(searchParams?.error);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(255,62,62,0.16), transparent 28%), linear-gradient(180deg, #020202 0%, #090909 100%)",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "1.5rem"
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "white", textDecoration: "none", fontWeight: 900, letterSpacing: "0.08em" }}>
            LUXE FITNESS
          </Link>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/" style={navLinkStyle}>
              Home
            </Link>
            <Link href="/trainer-access" style={navLinkStyle}>
              Trainer Access
            </Link>
            <Link href="/check-in" style={navLinkStyle}>
              Check-In
            </Link>
          </div>
        </div>

        <div style={{ minHeight: "calc(100vh - 7rem)", display: "grid", placeItems: "center" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "rgba(12,12,12,0.96)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              padding: "2rem"
            }}
          >
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em", color: "#ff5a5a", fontWeight: 900 }}>
              Secure Access
            </div>
            <h1 style={{ margin: "0.6rem 0 0.8rem", fontSize: "2.2rem", lineHeight: 1 }}>Admin Panel Lock</h1>
            <p style={{ margin: 0, color: "#9b9b9b", lineHeight: 1.6 }}>
              Enter the admin password before viewing member data, collections, or operational tools.
            </p>

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

            <form action={adminPanelLoginAction} style={{ marginTop: "1.4rem", display: "grid", gap: "0.9rem" }}>
              <label style={{ display: "grid", gap: "0.45rem", fontSize: 13, color: "#9b9b9b", fontWeight: 700 }}>
                Password
                <input
                  type="password"
                  name="password"
                  required
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#080808",
                    color: "white",
                    padding: "0.95rem 1rem"
                  }}
                />
              </label>
              <button
                type="submit"
                style={{
                  border: "none",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #ff4d4d 0%, #d92020 100%)",
                  color: "white",
                  padding: "1rem 1.1rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  cursor: "pointer"
                }}
              >
                Enter Admin Panel
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const navLinkStyle = {
  color: "#cfcfcf",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14
} as const;

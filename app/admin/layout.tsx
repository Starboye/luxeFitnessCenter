import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminPanelLogoutAction } from "@/app/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = cookies().get("luxe_admin_session")?.value;

  if (!process.env.ADMIN_PANEL_PASSWORD) {
    redirect("/admin-access?error=missing-password-config");
  }

  if (session !== "active") {
    redirect("/admin-access");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .admin-shell-header {
              padding: 1.5rem 5%;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              gap: 1rem;
              flex-wrap: wrap;
            }
            .admin-shell-brand {
              font-weight: 900;
              color: white;
              text-decoration: none;
              letter-spacing: 0.06em;
            }
            .admin-shell-brand span { color: #ff3e3e; }
            .admin-shell-links {
              display: flex;
              align-items: center;
              gap: 1rem;
              flex-wrap: wrap;
            }
            .admin-shell-navlink,
            .admin-shell-lockbtn {
              color: #9a9a9a;
              text-decoration: none;
              font-size: 0.8rem;
              font-weight: 700;
              background: transparent;
              border: none;
              padding: 0;
              cursor: pointer;
            }
            .admin-shell-main {
              min-width: 0;
            }
          `
        }}
      />
      <header className="admin-shell-header">
        <Link href="/" className="admin-shell-brand">
          LUXE <span>ADMIN</span>
        </Link>
        <div className="admin-shell-links">
          <Link href="/admin" className="admin-shell-navlink">Dashboard</Link>
          <Link href="/admin/search" className="admin-shell-navlink">Search</Link>
          <Link href="/admin/manage" className="admin-shell-navlink">Manage Records</Link>
          <Link href="/check-in" className="admin-shell-navlink">Check-In</Link>
          <Link href="/kiosk" className="admin-shell-navlink">Shared Kiosk</Link>
          <Link href="/" className="admin-shell-navlink">Home</Link>
          <form action={adminPanelLogoutAction}>
            <button
              className="admin-shell-lockbtn"
              type="submit"
              style={{ color: "white" }}
            >
              Lock Admin
            </button>
          </form>
        </div>
      </header>
      <main className="admin-shell-main">{children}</main>
    </div>
  );
}

import { cookies } from "next/headers";
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
    <>
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 200
        }}
      >
        <form action={adminPanelLogoutAction}>
          <button
            type="submit"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(7,7,7,0.92)",
              color: "white",
              padding: "0.75rem 1rem",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Lock Admin
          </button>
        </form>
      </div>
      {children}
    </>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const trainerSession = cookies().get("luxe_trainer_session")?.value;

  if (!trainerSession) {
    redirect("/trainer-access");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .trainer-shell-header {
              padding: 1.5rem 5%;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              gap: 1rem;
              flex-wrap: wrap;
              position: relative;
              z-index: 2;
            }
            .trainer-shell-brand {
              font-weight: 900;
              color: white;
              text-decoration: none;
              letter-spacing: -0.5px;
            }
            .trainer-shell-brand span { color: #ff3e3e; }
            .trainer-shell-links {
              display: flex;
              align-items: center;
              gap: 1rem;
              flex-wrap: wrap;
            }
            .trainer-shell-navlink {
              color: #9a9a9a;
              text-decoration: none;
              font-size: 0.8rem;
              font-weight: 700;
            }
          `
        }}
      />
      <header className="trainer-shell-header">
        <Link href="/" className="trainer-shell-brand">LUXE <span>COACH</span></Link>
        <div className="trainer-shell-links">
          <Link href="/trainer" className="trainer-shell-navlink">Dashboard</Link>
          <Link href="/trainer/search" className="trainer-shell-navlink">Search</Link>
          <Link href="/trainer/manage" className="trainer-shell-navlink">Add Member</Link>
          <Link href="/check-in" className="trainer-shell-navlink">Member Check-In</Link>
          <Link href="/kiosk" className="trainer-shell-navlink">Shared Kiosk</Link>
          <Link href="/" className="trainer-shell-navlink">Home</Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

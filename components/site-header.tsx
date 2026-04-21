import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <img
            src="/media/Luxe_Fitness_Logo.jpg"
            alt="Luxe Fitness logo"
            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 16 }}
          />
        </Link>
        <div className="nav-tools">
          <nav className="nav-links" aria-label="Primary">
            <Link href="/#programs">Programs</Link>
            <Link href="/#trainers">Trainers</Link>
            <Link href="/#experience">Experience</Link>
            <Link href="/#contact">Contact</Link>
            <Link className="button-secondary" href="/check-in">
              Member Check-In
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

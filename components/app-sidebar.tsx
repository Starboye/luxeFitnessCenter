import Link from "next/link";

export function AppSidebar({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <aside className="sidebar panel">
      <div className="stack">
        <div>
          <div className="eyebrow">Workspace</div>
          <h3>{title}</h3>
        </div>
        <nav aria-label={`${title} navigation`}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

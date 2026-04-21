export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="stat-card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {hint ? <span className="muted">{hint}</span> : null}
    </article>
  );
}

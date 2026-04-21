export default function Loading() {
  return (
    <div className="loader-screen">
      <div className="loader-shell">
        <div className="kettlebell" />
        <h2>Loading your next set</h2>
        <p className="muted">Luxe Fitness is warming up the next screen.</p>
        <div className="loader-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

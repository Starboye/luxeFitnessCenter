import React from "react";
import Link from "next/link";

const heroVideos = [
  "/media/carrosal_1.mp4",
  "/media/carrosal_2.mp4",
  "/media/carrosal_3.mp4"
];

const featureCards = [
  { title: "Strength Floor", detail: "Dedicated zones for lifting, conditioning, and focused gym sessions.", icon: "01" },
  { title: "Fast Check-In", detail: "Scan once, verify quickly, and move straight into your workout.", icon: "02" },
  { title: "Coach Support", detail: "Trainers stay close to the floor to guide form, intensity, and progress.", icon: "03" }
];

const programs = [
  {
    title: "Strength Progression",
    detail: "Barbell lifts, machine work, and progressive overload built for real gym results.",
    quote: "Every rep earns the next level.",
    content: "Build control, track your numbers, and chase stronger movement patterns every week.",
    img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800"
  },
  {
    title: "Conditioning Sessions",
    detail: "Athletic circuits, sled work, rowing, and endurance rounds that raise work capacity.",
    quote: "Conditioning is where grit becomes visible.",
    content: "Push pace, recover with purpose, and keep your energy sharp from warm-up to final round.",
    img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800"
  },
  {
    title: "Mobility and Recovery",
    detail: "Joint prep, guided stretching, and recovery-focused movement to keep training consistent.",
    quote: "Recover well so you can train hard again.",
    content: "Restore range, stay fresh between sessions, and keep your body ready for the next block.",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800"
  }
];

const trainers = [
  { name: "Sarath Kumar", role: "Floor Manager", detail: "Oversees the gym floor, member flow, and day-to-day training operations." },
  { name: "Jagan Raj", role: "Luxe Head", detail: "Leads the coaching culture, training standards, and daily energy of the gym." }
];

const cssStyles = `
  :root {
    --bg: #050505;
    --surface: #111111;
    --accent: #ff3e3e;
    --gold: #d4af37;
    --text-main: #ffffff;
    --text-muted: #a0a0a0;
    --glass: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.1);
  }

  .luxe-container {
    background-color: var(--bg);
    color: var(--text-main);
    font-family: 'Inter', system-ui, sans-serif;
    min-height: 100vh;
  }

  .nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 5%;
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(5, 5, 5, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--glass-border);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 68px;
    height: 68px;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.04);
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nav-links { display: flex; gap: 2rem; align-items: center; }
  .nav-links a { text-decoration: none; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; transition: 0.3s; }
  .nav-links a:hover { color: var(--accent); }

  .hero {
    position: relative;
    display: flex;
    min-height: 85vh;
    align-items: center;
    padding: 0 5%;
    overflow: hidden;
  }

  .hero-text h1 { font-size: clamp(3rem, 8vw, 5rem); line-height: 0.9; margin-bottom: 1.5rem; font-weight: 900; }
  .highlight { color: var(--accent); }
  .hero-p { color: var(--text-muted); font-size: 1.2rem; max-width: 500px; margin-bottom: 2rem; }

  .hero-background {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero-background::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.58) 45%, rgba(0, 0, 0, 0.72) 100%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.24), rgba(0, 0, 0, 0.6));
    pointer-events: none;
  }

  .hero-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    animation: heroCarousel 18s infinite;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 720px;
  }

  .brand-lockup {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .brand-mark {
    width: 104px;
    height: 104px;
    border-radius: 22px;
    object-fit: cover;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.04);
  }

  .brand-lockup-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .brand-lockup-text strong {
    font-size: 1.2rem;
    letter-spacing: 0.16em;
  }

  .brand-lockup-text span {
    color: var(--text-muted);
    font-size: 0.85rem;
    letter-spacing: 0.2em;
  }

  .section-padding { padding: 6rem 5%; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }

  .glass-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    padding: 2.5rem;
    border-radius: 8px;
    transition: transform 0.3s;
  }
  .glass-card:hover { transform: translateY(-5px); border-color: var(--accent); }

  .btn {
    padding: 1rem 2rem;
    border-radius: 4px;
    font-weight: 700;
    text-decoration: none;
    display: inline-block;
    transition: 0.3s;
    cursor: pointer;
  }
  .btn-primary { background: var(--accent); color: white; margin-right: 1rem; border: none; }
  .btn-outline { border: 1px solid var(--glass-border); color: white; }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 62, 62, 0.1);
    color: var(--accent);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 62, 62, 0.2);
  }

  @keyframes heroCarousel {
    0% { opacity: 0; }
    6% { opacity: 1; }
    27% { opacity: 1; }
    33% { opacity: 0; }
    100% { opacity: 0; }
  }

  @media (max-width: 968px) {
    .hero { text-align: center; padding-top: 4rem; }
    .nav-links { display: none; }
    .hero-content { width: 100%; max-width: none; }
    .hero-text {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 auto;
    }
    .brand-lockup { justify-content: center; }
    .hero-p { margin-left: auto; margin-right: auto; }
    .hero-actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.9rem;
    }
    .hero-actions .btn {
      width: min(100%, 280px);
      margin-right: 0;
      text-align: center;
    }
  }
`;

export default function HomePage() {
  return (
    <div className="luxe-container">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />

      <header className="nav-bar">
        <Link href="/" className="logo">
          <img src="/media/Luxe_Fitness_Logo.jpg" alt="Luxe Fitness logo" />
        </Link>
        <div className="nav-links">
          <Link href="#programs">PROGRAMS</Link>
          <Link href="#trainers">TRAINERS</Link>
          <Link href="#contact">CONTACT</Link>
          <Link href="/trainer-access">TRAINER LOGIN</Link>
          <Link href="/admin" style={{ color: "var(--gold)" }}>ADMIN</Link>
          <Link href="/check-in" className="btn btn-primary" style={{ padding: "0.6rem 1.2rem" }}>CHECK-IN</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-background">
            {heroVideos.map((video, index) => (
              <video
                key={video}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="hero-video"
                style={{ animationDelay: `${index * 6}s` }}
              >
                <source src={video} type="video/mp4" />
              </video>
            ))}
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <div className="brand-lockup">
                <img src="/media/Luxe_Fitness_Logo.jpg" alt="Luxe Fitness logo" className="brand-mark" />
                <div className="brand-lockup-text">
                  <strong>LUXE FITNESS</strong>
                  <span>PERUNGUDI</span>
                </div>
              </div>
              <div className="badge">
                <span style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />
                TRAIN HARD. RECOVER WELL.
              </div>
              <h1>EVOLVE <br /> <span className="highlight">STRONGER.</span></h1>
              <p className="hero-p">
                A premium training floor in Chennai built for disciplined check-ins, focused lifting, and consistent progress.
              </p>
              <div className="hero-actions">
                <Link href="/check-in" className="btn btn-primary">START CHECK-IN</Link>
                <Link href="#programs" className="btn btn-outline">EXPLORE TRAINING</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="grid-3">
            {featureCards.map((f, i) => (
              <div key={i} className="glass-card">
                <div style={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.2em", marginBottom: "1rem", color: "var(--gold)" }}>{f.icon}</div>
                <h3 style={{ marginBottom: "0.5rem" }}>{f.title}</h3>
                <p>{f.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="programs" className="section-padding" style={{ background: "var(--surface)" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "3rem", textAlign: "center" }}>
            TRAINING <span className="highlight">BLOCKS</span>
          </h2>
          <div className="grid-3">
            {programs.map((p, i) => (
              <div key={i} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--glass-border)", background: "var(--bg)" }}>
                <img src={p.img} alt={p.title} style={{ width: "100%", height: "250px", objectFit: "cover" }} />
                <div style={{ padding: "1.5rem" }}>
                  <h3>{p.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0.5rem 0 0.75rem" }}>{p.detail}</p>
                  <div style={{ color: "var(--gold)", fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.5rem" }}>{p.quote}</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{p.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="trainers" className="section-padding">
          <h2 style={{ fontSize: "2.5rem", marginBottom: "3rem" }}>THE <span className="highlight">COACHES</span></h2>
          <div className="grid-3">
            {trainers.map((t, i) => (
              <div key={i} className="glass-card">
                <span style={{ color: "var(--gold)", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "1px" }}>{t.role.toUpperCase()}</span>
                <h3 style={{ margin: "0.5rem 0" }}>{t.name}</h3>
                <p>{t.detail}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "2rem" }}>
            <Link href="/trainer-access" className="btn btn-primary">TRAINER LOGIN</Link>
          </div>
        </section>
      </main>

      <footer id="contact" className="section-padding" style={{ borderTop: "1px solid var(--glass-border)", textAlign: "center" }}>
        <p style={{ fontWeight: 800, letterSpacing: "2px" }}>LUXE FITNESS</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1rem" }}>
          Plot No 99, 3rd Cross St, Phase-2, Thirumalai Nagar Annexe, Perungudi, Chennai, Tamil Nadu 600096
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          Phone: 8754576669
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
          <a
            href="https://www.instagram.com/luxefitness_centre/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--text-main)", fontWeight: 700, textDecoration: "none" }}
          >
            Instagram
          </a>
          <a
            href="https://www.google.com/maps/place/Luxe+fitness+centre/@12.9584663,80.2436234,17z/data=!4m6!3m5!1s0x3a525d1569708809:0xc901805b048b0e19!8m2!3d12.9584663!4d80.2436234!16s%2Fg%2F11xg60fmlh?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--text-main)", fontWeight: 700, textDecoration: "none" }}
          >
            Maps
          </a>
        </div>
      </footer>
    </div>
  );
}

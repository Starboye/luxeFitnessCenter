export function SiteFooter() {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer__inner" style={{ textAlign: "center", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <div className="brand">
          <strong>Luxe Fitness</strong>
          <span>Premium training, disciplined systems, human coaching.</span>
        </div>
        <div className="muted">
          Plot No 99, 3rd Cross St, Phase-2, Thirumalai Nagar Annexe, Perungudi, Chennai, Tamil Nadu 600096
          <br />
          Phone: 8754576669
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <a href="https://www.instagram.com/luxefitness_centre/" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="https://www.google.com/maps/place/Luxe+fitness+centre/@12.9584663,80.2436234,17z/data=!4m6!3m5!1s0x3a525d1569708809:0xc901805b048b0e19!8m2!3d12.9584663!4d80.2436234!16s%2Fg%2F11xg60fmlh?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer">
            Maps
          </a>
        </div>
      </div>
    </footer>
  );
}

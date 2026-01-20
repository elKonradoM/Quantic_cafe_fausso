import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="container hero card">
      <div className="heroGrid">
        <div>
          <h1 className="heroTitle">Modern French dining with unapologetic charm.</h1>
          <p className="heroSub">
            Cafe Fausse blends classic technique with playful seasonal twists.
            Book a table, browse our menu, or explore the gallery for a taste of the vibe.
          </p>

          <div className="heroCTA">
            <Link to="/reservations" className="btn btnGold">Reserve a Table</Link>
            <Link to="/menu" className="btn">View Menu</Link>
            <Link to="/gallery" className="btn">Explore Gallery</Link>
          </div>
        </div>

        <div className="heroSide">
          <div className="kv">
            <div><b>Address</b><br />101 Rue Imaginaire, Paris</div>
            <div><b>Phone</b><br />+33 1 23 45 67 89</div>
            <div><b>Hours</b><br />Mon–Thu 5–10pm<br />Fri–Sat 5–11pm<br />Sun 11am–3pm</div>
          </div>
        </div>
      </div>
    </section>
  );
}

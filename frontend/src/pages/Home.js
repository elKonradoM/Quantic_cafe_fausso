import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <div className="container">
      <Hero />

      <section className="section">
        <div className="sectionHeader">
          <h2>Tonight’s Mood</h2>
          <p>Elegant, warm, and slightly dramatic (like French cinema, but with better lighting).</p>
        </div>

        <div className="grid2">
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Chef’s Philosophy</h3>
            <p className="help">
              Seasonal ingredients, classic technique, modern plating.
              We keep the rules… and occasionally bend them for fun.
            </p>
            <Link to="/about" className="btn">Meet the Team</Link>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Reserve in 30 seconds</h3>
            <p className="help">
              Pick a time slot, party size, and your contact details.
              We’ll randomly assign a table (we have 30 of them).
            </p>
            <Link to="/reservations" className="btn btnGold">Book a Table</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

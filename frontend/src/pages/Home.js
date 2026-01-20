import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <div className="container">
      <Hero />

      <section className="section">
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Tonight’s Mood</h2>
          <p className="help" style={{ margin: "8px 0 0" }}>
            Elegant, warm, and slightly dramatic (like French cinema, but with better lighting).
          </p>
        </div>

        <div className="grid2">
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Chef’s Philosophy</h3>
            <p className="help">
              Seasonal ingredients, classic technique, modern plating.
              We keep the rules… and occasionally bend them for fun.
            </p>
            <Link to="/about" className="btn btnGold">Meet the Team</Link>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Reserve in 30 seconds</h3>
            <p className="help">
              Pick a time slot, party size, and your contact details.
              We’ll randomly assign a table (we have 30 of them).
            </p>
            <Link to="/reservations" className="btn btnGold">Go to Reservations</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

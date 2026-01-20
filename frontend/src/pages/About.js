import React from "react";

export default function About() {
  return (
    <div className="container">
      <div className="sectionHeader">
        <h2>About Us</h2>
        <p>We take food seriously. Ourselves? Less so.</p>
      </div>

      <div className="grid2">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Our Story</h3>
          <p className="help">
            Cafe Fausse started as a “tiny pop-up with big opinions” and grew into a full dining room
            where the butter is real and the drama is mostly decorative.
          </p>
          <p className="help">
            We focus on seasonal French-inspired menus, handmade sauces, and a wine list curated for joy.
          </p>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Values</h3>
          <ul className="help" style={{ marginTop: 0 }}>
            <li>Seasonal ingredients and classic technique</li>
            <li>Warm hospitality (with a sprinkle of sparkle)</li>
            <li>Consistency in service and quality</li>
            <li>Accessibility: no snobbery, just good taste</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

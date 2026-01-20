import React from "react";
import { MENU } from "../data/menu";

export default function Menu() {
  return (
    <div className="container">
      <div className="sectionHeader">
        <h2>Menu</h2>
        <p>Classic French comfort with modern details.</p>
      </div>

      <div className="grid2">
        {MENU.map((cat) => (
          <div className="card menuCard" key={cat.category}>
            <h3 style={{ marginTop: 0 }}>{cat.category}</h3>
            {cat.items.map((it) => (
              <div className="menuItem" key={it.name}>
                <div>
                  <h4>{it.name}</h4>
                  <p>{it.desc}</p>
                </div>
                <div className="price">${it.price}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

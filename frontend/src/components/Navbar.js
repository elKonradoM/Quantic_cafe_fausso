import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? "var(--text)" : "var(--muted)",
    background: isActive ? "rgba(255,255,255,.08)" : "transparent"
  });

  return (
    <header className="nav">
      <div className="navInner">
        <NavLink className="brand" to="/">
          <span className="brandDot" />
          <span>Cafe Fausse</span>
        </NavLink>

        <nav className="navLinks">
          <NavLink to="/" style={linkStyle}>Home</NavLink>
          <NavLink to="/menu" style={linkStyle}>Menu</NavLink>
          <NavLink to="/reservations" style={linkStyle}>Reservations</NavLink>
          <NavLink to="/about" style={linkStyle}>About</NavLink>
          <NavLink to="/gallery" style={linkStyle}>Gallery</NavLink>
        </nav>
      </div>
    </header>
  );
}

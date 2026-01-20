import React, { useState } from "react";
import { postJson } from "../api";

export default function Footer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "", msg: "" });

    const n = name.trim();
    const v = email.trim().toLowerCase();

    if (!n) {
      setStatus({ type: "error", msg: "Please enter your name." });
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setStatus({ type: "error", msg: "Please enter a valid email." });
      return;
    }

    setLoading(true);
    const res = await postJson("/api/newsletter", { name: n, email: v });
    setLoading(false);

    if (res.ok && res.data?.ok) {
      setStatus({ type: "ok", msg: res.data.message || "Subscribed!" });
      setName("");
      setEmail("");
    } else {
      setStatus({ type: "error", msg: res.data?.message || "Something went wrong." });
    }
  }

  return (
    <footer className="footer">
      <div className="footerInner">
        <div>
          <div className="brand" style={{ marginBottom: 6 }}>
            <span className="brandDot" />
            <span>Cafe Fausse</span>
          </div>
          <small>
            101 Rue Imaginaire, Paris • +33 1 23 45 67 89<br />
            Mon–Thu 5–10pm • Fri–Sat 5–11pm • Sun 11am–3pm
          </small>
        </div>

        <div className="card" style={{ padding: 14, minWidth: 280 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Newsletter</div>

          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <input
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="row2" style={{ gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="btn btnGold" disabled={loading}>
                {loading ? "..." : "Join"}
              </button>
            </div>
          </form>

          {status.msg ? (
            <div className="alert" style={{ marginTop: 10 }}>{status.msg}</div>
          ) : (
            <div className="help" style={{ marginTop: 10 }}>
              Seasonal menus, chef’s table events, and zero spam (promise).
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

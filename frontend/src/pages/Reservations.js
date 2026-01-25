import React, { useEffect, useMemo, useRef, useState } from "react";
import { postJson } from "../api";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getDow(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay(); // Sun=0..Sat=6
}

function hoursForDow(dow) {
  // Mon–Thu 17–22, Fri–Sat 17–23, Sun 11–15
  if (dow >= 1 && dow <= 4) return { open: 17 * 60, close: 22 * 60 };
  if (dow === 5 || dow === 6) return { open: 17 * 60, close: 23 * 60 };
  return { open: 11 * 60, close: 15 * 60 };
}

function buildTimeSlotsForDate(dateStr) {
  if (!dateStr) return [];
  const dow = getDow(dateStr);
  const { open, close } = hoursForDow(dow);

  const duration = 60;
  const lastStart = close - duration;

  const slots = [];
  for (let m = open; m <= lastStart; m += 30) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${pad2(hh)}:${pad2(mm)}`);
  }
  return slots;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function composeTimeSlot(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

function hoursLabel(dateStr) {
  if (!dateStr) return "";
  const dow = getDow(dateStr);
  if (dow >= 1 && dow <= 4) return "Mon–Thu 17:00–22:00";
  if (dow === 5 || dow === 6) return "Fri–Sat 17:00–23:00";
  return "Sun 11:00–15:00";
}

/**
 * Custom dropdown: native <select> option list is not reliably stylable on Windows/Chrome.
 */
function TimeDropdown({ value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(v) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="timeDropdown" ref={wrapRef}>
      <button
        type="button"
        className="input timeBtn"
        onClick={() => !disabled && setOpen((s) => !s)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value || "Select time"}
      </button>

      {open && !disabled && (
        <div className="timeMenu" role="listbox" aria-label="Time slots">
          {options.map((t) => (
            <button
              key={t}
              type="button"
              className={`timeOption ${t === value ? "active" : ""}`}
              onClick={() => pick(t)}
              role="option"
              aria-selected={t === value}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Reservations() {
  const [form, setForm] = useState({
    date: "",
    time: "",
    guests: "",
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setForm((s) => (s.date ? s : { ...s, date: todayISO() }));
  }, []);

  const timeSlots = useMemo(() => buildTimeSlotsForDate(form.date), [form.date]);

  useEffect(() => {
    if (!form.date) return;

    if (timeSlots.length === 0) {
      setForm((s) => ({ ...s, time: "" }));
      return;
    }

    setForm((s) => {
      if (s.time && timeSlots.includes(s.time)) return s;
      return { ...s, time: timeSlots[0] };
    });
  }, [form.date, timeSlots]);

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  const timeSlot = composeTimeSlot(form.date, form.time);

  
  function validate() {
    if (!form.date) return "Please choose a date.";
    if (!form.time) return "Please choose a time.";
    if (!Number.isInteger(Number(form.guests)) || Number(form.guests) <= 0)
      return "Guests must be a positive number.";
    if (!form.name.trim()) return "Name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim().toLowerCase()))
      return "Email is invalid.";
    return null;
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setAvailability(null);
      if (!timeSlot) return;

      setChecking(true);
      try {
        const params = { timeSlot };
      if (form.guests) params.guests = String(form.guests);
      const qs = new URLSearchParams(params).toString();
        const r = await fetch(`/api/reservations/availability?${qs}`);
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;

        if (r.ok && data.ok) setAvailability(data);
        else setAvailability({ ok: false, message: data.message || "Could not check availability." });
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [timeSlot, form.guests]);

  async function submit(e) {
    e.preventDefault();
    setResult(null);

    const err = validate();
    if (err) {
      setResult({ ok: false, message: err });
      return;
    }

    setLoading(true);

    const payload = {
      timeSlot,
      guests: Number(form.guests),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
    };

    const res = await postJson("/api/reservations", payload);
    setLoading(false);

    if (res.ok && res.data?.ok) {
      setResult({
        ok: true,
        message: res.data.message,
        tableNumber: res.data.tableNumber,
        tableNumbers: res.data.tableNumbers,
        tablesBooked: res.data.tablesBooked,
        endTime: res.data.endTime,
      });
    } else {
      setResult({
        ok: false,
        message: res.data?.message || "Reservation failed.",
      });
    }
  }

  return (
    <div className="page reservations">
      <div className="container">
        <div className="twoCol">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Reservations</h2>
            <p className="help">
              Choose a date and a start time in <b>30‑minute slots</b>. Each reservation lasts <b>60 minutes</b>.
            </p>
            <p className="help">
              Hours for selected day: <b>{hoursLabel(form.date)}</b>
            </p>

            <form onSubmit={submit} className="form">
              <div className="row2">
                <label className="label">
                  Date
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                  />
                </label>

                <label className="label">
                  Time
                  <TimeDropdown
                    value={form.time}
                    options={timeSlots}
                    onChange={(v) => setField("time", v)}
                    disabled={!form.date || timeSlots.length === 0}
                  />
                </label>
              </div>

              <div className="help" style={{ marginTop: 6 }}>
                {checking ? (
                  <>Checking availability…</>
                ) : availability?.ok ? (
                  <>
                    <b>{availability.fullyBooked ? "Fully booked" : "Available"}</b>
                    {" — "}
                    {availability.availableTables} / {availability.tableCount} tables free.
                    {" "}
                    <span className="help">
                      (Ends at <b>{availability.endTime?.slice(11, 16)}</b>, 60 min)
                    </span>
                  </>
                ) : availability?.message ? (
                  <span>{availability.message}</span>
                ) : (
                  <>Pick a date/time to check availability.</>
                )}
              </div>

              <label className="label">
                Guests
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.guests}
                  onChange={(e) => setField("guests", e.target.value === "" ? "" : e.target.value)}
                />
              </label>

              <div className="row2">
                <label className="label">
                  Name
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label className="label">
                  Email
                  <input
                    className="input"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="name@example.com"
                  />
                </label>
              </div>

              <label className="label">
                Phone (optional)
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </label>

              <button className="btn" disabled={loading || !timeSlot}>
                {loading ? "Booking…" : "Reserve"}
              </button>

              {result && (
                <div className="alert" style={{ marginTop: 12 }}>
                  {result.ok ? (
                    <>
                      <b>Success.</b> {result.message}
                      <br />
                      <span className="help">
                        {result.endTime ? (
                          <>
                            {" — "}Ends at <b>{String(result.endTime).slice(11, 16)}</b>
                          </>
                        ) : null}
                      </span>
                    </>
                  ) : (
                    <>
                      <b>Failed, not confirmed.</b> {result.message}
                    </>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Hours</h3>
            <ul className="help" style={{ marginTop: 0 }}>
              <li>Mon–Thu: 17:00–22:00</li>
              <li>Fri–Sat: 17:00–23:00</li>
              <li>Sun: 11:00–15:00</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
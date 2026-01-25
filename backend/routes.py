import random
import re
import math
from datetime import datetime, timedelta, time

from flask import Blueprint, jsonify, request, current_app
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Customer, Reservation

api = Blueprint("api", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Reservation rules
SLOT_INTERVAL_MINUTES = 30
RESERVATION_DURATION_MINUTES = 60
SEATS_PER_TABLE = 4

# Business hours (local, naive):
# Mon–Thu 17:00–22:00
# Fri–Sat 17:00–23:00
# Sun     11:00–15:00
def hours_for_weekday(weekday: int):
    # Python datetime.weekday(): Mon=0..Sun=6
    if weekday in (0, 1, 2, 3):     # Mon–Thu
        return 17 * 60, 22 * 60
    if weekday in (4, 5):           # Fri–Sat
        return 17 * 60, 23 * 60
    return 11 * 60, 15 * 60         # Sun


def parse_time_slot(value: str) -> datetime:
    """Parse a datetime-local style string: YYYY-MM-DDTHH:MM (seconds optional).
    Returns a naive datetime (no timezone).
    """
    if not value:
        raise ValueError("timeSlot is required")
    v = value.strip()
    # Accept "YYYY-MM-DD HH:MM" by normalizing to ISO
    v = v.replace(" ", "T")
    # Strip trailing 'Z' if present (some clients send it)
    if v.endswith("Z"):
        v = v[:-1]
    try:
        dt = datetime.fromisoformat(v)
    except ValueError:
        raise ValueError("Invalid timeSlot format. Use YYYY-MM-DDTHH:MM.")
    return dt.replace(second=0, microsecond=0)


def validate_30_min_slot(dt: datetime):
    if dt.minute not in (0, 30) or dt.second != 0 or dt.microsecond != 0:
        raise ValueError("Please pick a slot on the half-hour (HH:00 or HH:30).")


def validate_opening_hours(start_dt: datetime):
    open_min, close_min = hours_for_weekday(start_dt.weekday())

    open_dt = datetime.combine(start_dt.date(), time(hour=open_min // 60, minute=open_min % 60))
    close_dt = datetime.combine(start_dt.date(), time(hour=close_min // 60, minute=close_min % 60))

    end_dt = start_dt + timedelta(minutes=RESERVATION_DURATION_MINUTES)

    if start_dt < open_dt:
        raise ValueError("Outside opening hours for that day (before opening).")
    if end_dt > close_dt:
        raise ValueError("Outside opening hours for that day (end time exceeds closing).")


def overlap_slots_60min(start: datetime):
    # For 60-minute reservations on a 30-minute grid, conflicts are starts at S-30, S, S+30.
    return [
        start - timedelta(minutes=30),
        start,
        start + timedelta(minutes=30),
    ]


def get_free_tables_for_start(time_slot: datetime):
    # Returns (free_tables, table_count) for a requested start time considering 60-min duration.
    table_count = int(current_app.config.get("TABLE_COUNT", 30))
    all_tables = list(range(1, table_count + 1))

    reserved = (
        db.session.query(Reservation.table_number)
        .filter(Reservation.time_slot.in_(overlap_slots_60min(time_slot)))
        .all()
    )
    reserved_set = {r[0] for r in reserved}
    free_tables = [t for t in all_tables if t not in reserved_set]
    return free_tables, table_count


def validate_reservation_payload(payload: dict):
    required = ["timeSlot", "guests", "name", "email"]
    for k in required:
        if k not in payload:
            return f"{k} is required"

    # guests
    try:
        guests = int(payload["guests"])
    except Exception:
        return "guests must be an integer"
    if guests <= 0:
        return "guests must be a positive integer"

    email = str(payload["email"]).strip().lower()
    if not EMAIL_RE.match(email):
        return "email is invalid"

    if not str(payload["name"]).strip():
        return "name is required"

    return None


@api.post("/newsletter")
def newsletter_signup():
    """
    Newsletter signup is stored on Customer only:
      - upsert by email
      - sets newsletter_signup=True
      - optionally updates name (if provided)
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip() or None

    if not email:
        return jsonify({"ok": False, "message": "email is required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"ok": False, "message": "email is invalid"}), 400

    customer = Customer.query.filter_by(email=email).first()

    if not customer:
        customer = Customer(email=email, name=name, newsletter_signup=True)
        db.session.add(customer)
        db.session.commit()
        return jsonify({"ok": True, "message": "Subscribed. Welcome to the (totally real) newsletter."})

    # existing customer
    already = bool(customer.newsletter_signup)
    customer.newsletter_signup = True

    if name and (customer.name or "") != name:
        customer.name = name

    db.session.commit()

    if already:
        return jsonify({"ok": True, "message": "You're already subscribed."})
    return jsonify({"ok": True, "message": "Subscribed. Welcome to the (totally real) newsletter."})


@api.get("/reservations/availability")
def reservation_availability():
    time_slot_raw = (request.args.get("timeSlot") or "").strip()
    guests_raw = (request.args.get("guests") or "").strip()

    if not time_slot_raw:
        return jsonify({"ok": False, "message": "Missing required query param: timeSlot"}), 400

    guests = 1
    if guests_raw:
        try:
            guests = int(guests_raw)
        except ValueError:
            return jsonify({"ok": False, "message": "guests must be an integer"}), 400
        if guests <= 0:
            return jsonify({"ok": False, "message": "guests must be a positive integer"}), 400

    try:
        time_slot = parse_time_slot(time_slot_raw)
        validate_30_min_slot(time_slot)
        validate_opening_hours(time_slot)
    except ValueError as e:
        return jsonify({"ok": False, "message": str(e)}), 400

    free_tables, table_count = get_free_tables_for_start(time_slot)
    tables_needed = max(1, math.ceil(guests / SEATS_PER_TABLE))

    return jsonify({
        "ok": True,
        "timeSlot": time_slot.isoformat(timespec="minutes"),
        "endTime": (time_slot + timedelta(minutes=RESERVATION_DURATION_MINUTES)).isoformat(timespec="minutes"),
        "durationMinutes": RESERVATION_DURATION_MINUTES,
        "seatsPerTable": SEATS_PER_TABLE,
        "tablesNeeded": tables_needed,
        "tableCount": table_count,
        "availableTables": len(free_tables),
        "fullyBooked": len(free_tables) < tables_needed,
    })


@api.post("/reservations")
def create_reservation():
    data = request.get_json(silent=True) or {}
    err = validate_reservation_payload(data)
    if err:
        return jsonify({"ok": False, "message": err}), 400

    try:
        time_slot = parse_time_slot(str(data["timeSlot"]))
        validate_30_min_slot(time_slot)
        validate_opening_hours(time_slot)
    except ValueError as e:
        return jsonify({"ok": False, "message": str(e)}), 400

    guests = int(data["guests"])
    name = str(data["name"]).strip()
    email = str(data["email"]).strip().lower()
    phone = (str(data.get("phone") or "").strip() or None)

    table_count = int(current_app.config.get("TABLE_COUNT", 30))
    max_guests = table_count * SEATS_PER_TABLE
    if guests > max_guests:
        return jsonify({
            "ok": False,
            "message": f"Too many guests for the restaurant capacity. Max for a single timeslot is {max_guests}."
        }), 400

    tables_needed = max(1, math.ceil(guests / SEATS_PER_TABLE))

    # Upsert customer
    customer = Customer.query.filter_by(email=email).first()
    if not customer:
        customer = Customer(email=email, name=name, phone=phone, newsletter_signup=False)
        db.session.add(customer)
        db.session.flush()
    else:
        if name and (customer.name or "") != name:
            customer.name = name
        if phone and (customer.phone or "") != phone:
            customer.phone = phone

    # Retry loop for concurrency: if another request books between check and insert
    max_retries = 5
    for attempt in range(max_retries):
        free_tables, _ = get_free_tables_for_start(time_slot)
        if len(free_tables) < tables_needed:
            return jsonify({
                "ok": False,
                "message": "That slot is fully booked for your party size. Please choose another time.",
                "tablesNeeded": tables_needed,
                "availableTables": len(free_tables),
                "seatsPerTable": SEATS_PER_TABLE,
            }), 409

        tables_to_use = random.sample(free_tables, k=tables_needed)

        remaining = guests
        reservations = []
        for tnum in tables_to_use:
            g = min(SEATS_PER_TABLE, remaining)
            remaining -= g
            reservations.append(Reservation(
                customer_id=customer.id,
                time_slot=time_slot,
                table_number=tnum,
                guests=g,
            ))

        try:
            for r in reservations:
                db.session.add(r)
            db.session.commit()

            n_tables = len(tables_to_use)
            table_word = "table" if n_tables == 1 else "tables"
            tables_csv = ", ".join(str(t) for t in sorted(tables_to_use))
            message = (
                f"Reservation confirmed. Reserved {n_tables} {table_word} "
                f"({tables_csv}) for {guests} guest(s)."
            )
            return jsonify({
                "ok": True,
                "message": message,
                "tablesBooked": len(tables_to_use),
                "tableNumbers": sorted(tables_to_use),
                # backward compatible consumers
                "tableNumber": sorted(tables_to_use)[0] if tables_to_use else None,
                "timeSlot": time_slot.isoformat(timespec="minutes"),
                "endTime": (time_slot + timedelta(minutes=RESERVATION_DURATION_MINUTES)).isoformat(timespec="minutes"),
                "durationMinutes": RESERVATION_DURATION_MINUTES,
                "guests": guests,
                "seatsPerTable": SEATS_PER_TABLE,
                "tablesNeeded": tables_needed,
            })
        except IntegrityError:
            db.session.rollback()
            if attempt == max_retries - 1:
                return jsonify({
                    "ok": False,
                    "message": "Could not confirm reservation due to concurrent booking. Please try again."
                }), 409

    return jsonify({"ok": False, "message": "Unknown error."}), 500

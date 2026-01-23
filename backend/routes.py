import random
import re
from datetime import datetime, timedelta, time

from flask import Blueprint, jsonify, request, current_app
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Customer, Reservation, NewsletterSubscription

api = Blueprint("api", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Business hours:
# Mon–Thu 17:00–22:00
# Fri–Sat 17:00–23:00
# Sun     11:00–15:00
#
# Slot grid: 30 minutes
# Reservation duration: 60 minutes
RESERVATION_DURATION_MINUTES = 60


def parse_time_slot(value: str) -> datetime:
    # Parses ISO-like datetime string: 'YYYY-MM-DDTHH:MM'
    try:
        return datetime.fromisoformat(value)
    except Exception as e:
        raise ValueError("Invalid timeSlot format. Use ISO like 2026-01-20T19:30") from e


def validate_30_min_slot(dt: datetime) -> None:
    # Enforce 30-minute slot boundaries (HH:00 or HH:30), no seconds/micros.
    if dt.second != 0 or dt.microsecond != 0:
        raise ValueError("timeSlot must be on a 30-minute boundary (HH:00 or HH:30)")
    if dt.minute not in (0, 30):
        raise ValueError("timeSlot must be on a 30-minute boundary (HH:00 or HH:30)")


def opening_hours_for_date(d: datetime):
    # Python weekday(): Mon=0 ... Sun=6
    wd = d.weekday()
    if wd in (0, 1, 2, 3):  # Mon–Thu
        return time(17, 0), time(22, 0)
    if wd in (4, 5):  # Fri–Sat
        return time(17, 0), time(23, 0)
    return time(11, 0), time(15, 0)  # Sun


def validate_opening_hours(start: datetime) -> None:
    # Enforce business hours + 60-minute duration within the same day.
    open_t, close_t = opening_hours_for_date(start)
    open_dt = start.replace(hour=open_t.hour, minute=open_t.minute, second=0, microsecond=0)
    close_dt = start.replace(hour=close_t.hour, minute=close_t.minute, second=0, microsecond=0)
    end_time = start + timedelta(minutes=RESERVATION_DURATION_MINUTES)

    if start < open_dt:
        raise ValueError("Outside opening hours for that day.")
    if end_time > close_dt:
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
    table_count = int(current_app.config["TABLE_COUNT"])
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
        if k not in payload or payload[k] in (None, ""):
            return f"Missing required field: {k}"

    try:
        guests = int(payload["guests"])
    except Exception:
        return "guests must be a positive integer"

    if guests <= 0:
        return "guests must be a positive integer"

    email = str(payload["email"]).strip().lower()
    if not EMAIL_RE.match(email):
        return "email is invalid"

    if not str(payload["name"]).strip():
        return "name is required"

    return None


@api.get("/health")
def health():
    return jsonify({"ok": True})


@api.post("/newsletter")
def newsletter_subscribe():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    name = str(data.get("name") or "").strip() or None

    if not email:
        return jsonify({"ok": False, "message": "email is required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"ok": False, "message": "email is invalid"}), 400

    sub = NewsletterSubscription.query.filter_by(email=email).first()
    if sub:
        if name and (sub.name or "") != name:
            sub.name = name
            db.session.commit()
        return jsonify({"ok": True, "message": "You're already subscribed."})

    sub = NewsletterSubscription(email=email, name=name)
    db.session.add(sub)
    db.session.commit()

    return jsonify({"ok": True, "message": "Subscribed. Welcome to the (totally real) newsletter."})


@api.get("/reservations/availability")
def reservation_availability():
    time_slot_raw = (request.args.get("timeSlot") or "").strip()
    if not time_slot_raw:
        return jsonify({"ok": False, "message": "Missing required query param: timeSlot"}), 400

    try:
        time_slot = parse_time_slot(time_slot_raw)
        validate_30_min_slot(time_slot)
        validate_opening_hours(time_slot)
    except ValueError as e:
        return jsonify({"ok": False, "message": str(e)}), 400

    free_tables, table_count = get_free_tables_for_start(time_slot)

    return jsonify({
        "ok": True,
        "timeSlot": time_slot.isoformat(timespec="minutes"),
        "endTime": (time_slot + timedelta(minutes=RESERVATION_DURATION_MINUTES)).isoformat(timespec="minutes"),
        "durationMinutes": RESERVATION_DURATION_MINUTES,
        "tableCount": table_count,
        "availableTables": len(free_tables),
        "fullyBooked": len(free_tables) == 0,
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
    phone = (data.get("phone") or "").strip() or None  # optional

    customer = Customer.query.filter_by(email=email).first()
    if not customer:
        customer = Customer(email=email, name=name)
        db.session.add(customer)
        db.session.commit()
    else:
        if name and (customer.name or "") != name:
            customer.name = name
            db.session.commit()

    max_retries = 3
    for attempt in range(max_retries):
        free_tables, _ = get_free_tables_for_start(time_slot)

        if not free_tables:
            db.session.rollback()
            return jsonify({
                "ok": False,
                "message": "This time slot is fully booked. Please choose another time."
            }), 409

        table_number = random.choice(free_tables)

        reservation = Reservation(
            customer_id=customer.id,
            time_slot=time_slot,
            table_number=table_number,
            guests=guests,
        )

        try:
            db.session.add(reservation)
            db.session.commit()
            return jsonify({
                "ok": True,
                "message": "Reservation confirmed.",
                "tableNumber": table_number,
                "timeSlot": time_slot.isoformat(timespec="minutes"),
                "endTime": (time_slot + timedelta(minutes=RESERVATION_DURATION_MINUTES)).isoformat(timespec="minutes"),
                "durationMinutes": RESERVATION_DURATION_MINUTES,
                "guests": guests,
            })
        except IntegrityError:
            db.session.rollback()
            if attempt == max_retries - 1:
                return jsonify({
                    "ok": False,
                    "message": "Could not confirm reservation due to concurrent booking. Please try again."
                }), 409

    return jsonify({"ok": False, "message": "Unknown error."}), 500

import random
import re
from datetime import datetime

from flask import Blueprint, jsonify, request, current_app
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Customer, Reservation, NewsletterSubscription

api = Blueprint("api", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def parse_time_slot(value: str) -> datetime:
    """Parses ISO-like datetime string: 'YYYY-MM-DDTHH:MM' (from <input type="datetime-local">)."""
    try:
        return datetime.fromisoformat(value)
    except Exception as e:
        raise ValueError("Invalid timeSlot format. Use ISO like 2026-01-20T19:30") from e


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
    return jsonify({"ok": True, "service": "cafe-fausse-api"})


@api.post("/newsletter")
def newsletter():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not name:
        return jsonify({"ok": False, "message": "Name is required."}), 400

    if not EMAIL_RE.match(email):
        return jsonify({"ok": False, "message": "Invalid email address."}), 400

    try:
        customer = Customer.query.filter_by(email=email).first()
        if customer is None:
            customer = Customer(email=email, name=name, newsletter_signup=True)
            db.session.add(customer)
        else:
            customer.newsletter_signup = True
            # keep the latest provided name (newsletter now requires it)
            customer.name = name

        # Keep a separate table for convenience/history (ignore duplicates nicely)
        if not NewsletterSubscription.query.filter_by(email=email).first():
            db.session.add(NewsletterSubscription(email=email))

        db.session.commit()
        return jsonify({"ok": True, "message": "Subscribed!"})
    except IntegrityError:
        db.session.rollback()
        return jsonify({"ok": True, "message": "You are already subscribed."})


@api.post("/reservations")
def create_reservation():
    data = request.get_json(silent=True) or {}
    err = validate_reservation_payload(data)
    if err:
        return jsonify({"ok": False, "message": err}), 400

    time_slot = parse_time_slot(str(data["timeSlot"]))
    guests = int(data["guests"])
    name = str(data["name"]).strip()
    email = str(data["email"]).strip().lower()
    phone = (data.get("phone") or "").strip() or None

    table_count = int(current_app.config["TABLE_COUNT"])
    all_tables = list(range(1, table_count + 1))

    customer = Customer.query.filter_by(email=email).first()
    if customer is None:
        customer = Customer(name=name, email=email, phone=phone)
        db.session.add(customer)
        try:
            db.session.flush()
        except IntegrityError:
            db.session.rollback()
            customer = Customer.query.filter_by(email=email).first()
            if customer is None:
                return jsonify({
                    "ok": False,
                    "message": "Could not create customer. Please try again."
                }), 409
    else:
        customer.name = name
        customer.phone = phone

    max_retries = 3

    for attempt in range(max_retries):
        reserved = (
            db.session.query(Reservation.table_number)
            .filter(Reservation.time_slot == time_slot)
            .all()
        )
        reserved_set = {r[0] for r in reserved}
        free_tables = [t for t in all_tables if t not in reserved_set]

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

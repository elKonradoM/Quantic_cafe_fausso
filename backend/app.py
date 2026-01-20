import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from config import Config
from extensions import db
from routes import api


def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=False,
    )

    app.register_blueprint(api)

    # Make local/dev setup frictionless: ensure the schema exists even when the
    # app is started via `flask run` (which would otherwise skip the __main__
    # block below).
    with app.app_context():
        db.create_all()

    @app.get("/")
    def root():
        return {"ok": True, "message": "Cafe Fausse API. Use /api/*."}

    @app.cli.command("init-db")
    def init_db_command():
        """Create database tables."""
        with app.app_context():
            db.create_all()
        print("Database tables created.")

    return app


app = create_app()

if __name__ == "__main__":
    # Optional local run via python app.py
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)

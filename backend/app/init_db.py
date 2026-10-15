"""
Database Initialization Script for EasyPay & SafePay
Initializes SQLite tables and seeds baseline demo data.
"""
from backend.app.database import Base, engine, SessionLocal
from backend.app.services.seed_data import seed_database


def init_db():
    print("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        print("Checking and seeding demo data...")
        seed_database(db)
        print("Database initialized and ready.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

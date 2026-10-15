import sys
from pathlib import Path

# Add project root and backend dir to sys.path so tests run from any directory
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import User
from backend.app.services.seed_data import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield


@pytest.fixture(autouse=True)
def reset_user_balances():
    db = SessionLocal()
    u1 = db.query(User).filter(User.id == 1).first()
    if u1:
        u1.balance = 18500.0
        u1.is_frozen = False
        u1.freeze_reason = None
        db.commit()
    db.close()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

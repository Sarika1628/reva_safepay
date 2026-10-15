"""
EasyPay & SafePay - Unified Production Server Runner
Runs the unified FastAPI production server serving both API and compiled React frontend on a single port.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"


def main():
    print("=" * 70)
    print("🛡️  EasyPay & SafePay — Unified Production Server")
    print("=" * 70)
    
    # 1. Verify or build frontend static bundle
    if not (DIST_DIR / "index.html").exists():
        print("\n📦 Compiling frontend production bundle (Vite)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "run", "build"], cwd=FRONTEND_DIR, check=True)
    else:
        print("\n✅ Production frontend bundle verified at frontend/dist")

    # 2. Verify ML model artifact
    model_path = ROOT_DIR / "backend" / "app" / "ml" / "scam_model.joblib"
    if not model_path.exists():
        print("🧠 Training ML scam detection model...")
        subprocess.run([sys.executable, "-m", "backend.app.ml.train_model"], cwd=ROOT_DIR, check=True)
    else:
        print("✅ Trained ML Scam Detection model verified.")

    # 3. Launch Uvicorn on 0.0.0.0:$PORT
    port = int(os.environ.get("PORT", 8000))
    print(f"\n🚀 Unified Production Server running on:")
    print(f"   • Web App:         http://localhost:{port}")
    print(f"   • API Swagger:     http://localhost:{port}/docs")
    print(f"   • Health Check:    http://localhost:{port}/api/health")
    print(f"   • Network Bind:    http://0.0.0.0:{port}")
    print("\nPress Ctrl+C to stop the server.")
    print("=" * 70 + "\n")

    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, log_level="info")


if __name__ == "__main__":
    main()

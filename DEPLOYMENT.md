# 🚀 EasyPay & SafePay — Production Cloud Deployment Guide

This guide provides instructions for deploying **EasyPay & SafePay (CyberCare Intelligence)** to free cloud hosting platforms including **Render**, **Railway**, and **Hugging Face Spaces**, or via containerized **Docker**.

---

## 🏗️ Architecture Overview

In production, EasyPay & SafePay uses a **Unified Single-Port Architecture**:
- The **FastAPI backend (Python 3.10+)** serves the API endpoints (`/api/...`), OpenAPI docs (`/docs`), and loads the local scikit-learn ML scam detector.
- The compiled **React 19 + Vite frontend (`frontend/dist`)** is served directly by FastAPI as static assets with client-side SPA routing fallback.
- **Benefits**:
  - **Single public URL** (`https://your-app.onrender.com`).
  - **Zero CORS issues** (frontend and backend share the same origin).
  - **Single free tier service** needed (no need to pay for or link separate frontend and backend hosting).
  - **Instant dynamic port binding** via `${PORT:-8000}`.

---

## 🌐 Option 1: 1-Click Cloud Deployment on Render (Recommended)

[Render](https://render.com) offers free web service hosting with automatic HTTPS and continuous deployment from GitHub.

### Step-by-Step Instructions:
1. **Push your repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete EasySafePay hackathon release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Log into Render**:
   - Visit [dashboard.render.com](https://dashboard.render.com) and sign in with your GitHub account.

3. **Deploy using Blueprint or Web Service**:
   - **Method A (Blueprint — Automatic 1-Click)**:
     - In Render dashboard, click **New +** -> **Blueprint**.
     - Select your connected GitHub repository.
     - Render will automatically read [`render.yaml`](./render.yaml) and configure the Docker runtime, environment variables, and health check path (`/api/health`).
     - Click **Apply**.
   - **Method B (Manual Web Service)**:
     - Click **New +** -> **Web Service**.
     - Select your repository.
     - **Runtime**: Select **Docker**.
     - **Region**: Any (e.g., Oregon or Frankfurt).
     - **Instance Type**: **Free**.
     - **Health Check Path**: `/api/health`.
     - Click **Create Web Service**.

4. **Verify Live Deployment**:
   - Once build finishes (~2-3 minutes), Render provides your live URL:
     - Web App: `https://<service-name>.onrender.com`
     - Swagger Docs: `https://<service-name>.onrender.com/docs`
     - Health Status: `https://<service-name>.onrender.com/api/health`

---

## 🚂 Option 2: Deploy on Railway

[Railway](https://railway.app) provides fast zero-config deployments using the included `Dockerfile` and `Procfile`.

### Step-by-Step Instructions:
1. Push code to GitHub.
2. Go to [railway.app](https://railway.app) and sign in with GitHub.
3. Click **New Project** -> **Deploy from GitHub repo**.
4. Select your repository.
5. Railway will automatically detect the multi-stage [`Dockerfile`](./Dockerfile) (or [`nixpacks.toml`](./nixpacks.toml) + [`Procfile`](./Procfile)).
6. Go to **Settings** -> **Networking** -> click **Generate Domain**.
7. Access your live app at the provided `*.up.railway.app` URL.

---

## 🤗 Option 3: Deploy on Hugging Face Spaces (Free Permanent Hosting)

Hugging Face Spaces provides completely free Docker container hosting with public sharing.

### Step-by-Step Instructions:
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space Name: `easysafepay` (or your preferred name).
3. Select **Space SDK**: **Docker** (choose **Blank**).
4. Select **Space Hardware**: **Free (CPU Basic • 2 vCPU • 16 GB RAM)**.
5. Space visibility: **Public**.
6. Follow the instructions to push your code to the Hugging Face Git remote:
   ```bash
   git remote add space https://huggingface.co/spaces/<your-username>/easysafepay
   git push space main
   ```
7. Hugging Face builds the [`Dockerfile`](./Dockerfile) and hosts your app with a public URL!

---

## 🐳 Option 4: Deploy with Docker Locally or on a VPS

A complete multi-stage [`Dockerfile`](./Dockerfile) and [`docker-compose.yml`](./docker-compose.yml) are included.

### Build and Run with Docker:
```bash
# 1. Build the production image
docker build -t easysafepay .

# 2. Run container on port 8000
docker run -d -p 8000:8000 --name easysafepay-app easysafepay
```

### Run with Docker Compose:
```bash
docker-compose up -d
```

### Accessing the Container:
- App URL: [http://localhost:8000](http://localhost:8000)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 💻 Option 5: Local Production Preview (Single-Command)

To test the unified production server locally without Docker:

```bash
# Using Python
python run_production.py

# Or using npm
npm start
```

This automatically:
1. Compiles the frontend (`npm --prefix frontend run build`).
2. Verifies the ML model artifact (`backend/app/ml/scam_model.joblib`).
3. Starts FastAPI on `http://localhost:8000` serving both the frontend SPA and backend API.

---

## ⚙️ Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for Uvicorn to listen on (automatically set by Render / Railway / Heroku). |
| `ENVIRONMENT` | `production` | Deployment mode identifier (`production` or `development`). |
| `SIMULATION_MODE` | `true` | Enforces the educational simulated environment (no real money moved). |
| `CORS_ORIGINS` | `*` | Allowed CORS origins for external API clients. |
| `APP_NAME` | `EasyPay & SafePay` | Display name for the application and API docs. |

---

## 🛡️ Hackathon Submission Checklist

- [x] Multi-stage `Dockerfile` with Node 20 builder and Python 3.11 runner.
- [x] `.dockerignore` configured to eliminate cache, node_modules, and virtualenvs.
- [x] `render.yaml` for 1-click Render blueprint deployment.
- [x] `Procfile` & `nixpacks.toml` for Railway deployment.
- [x] Unified SPA static routing configured in `backend/app/main.py`.
- [x] All 64 backend pytest tests passing.
- [x] Frontend production bundle built with 0 errors.
- [x] Zero real money / non-stored biometrics privacy safeguards enforced.

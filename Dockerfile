# ==============================================================================
# EasyPay & SafePay - Production Multi-Stage Dockerfile
# Combines React 19 Frontend + FastAPI ML Backend into a unified container
# ==============================================================================

# STAGE 1: Build the React + Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci || npm install

# Copy frontend source and compile static production bundle
COPY frontend/ ./
RUN npm run build

# STAGE 2: Production Python Backend
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies including ML packages
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and seed database
COPY backend/ ./backend/
COPY .env.example ./.env

# Copy compiled frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize demo SQLite database with sample safe contacts and scam catalogs
RUN python -m backend.app.init_db

# Expose application port
EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start unified FastAPI server dynamically bound to $PORT (compatible with Render, Railway, Hugging Face, Fly.io)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

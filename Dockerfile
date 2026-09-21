# Multi-Stage Dockerfile for Unified Production Deployment on Render
# Stage 1: Build the React frontend with Vite & Tailwind
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend + ChromaDB + PyMuPDF
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    STANDARDS_PATH=/app/backend/data/standards.json \
    CHROMA_PATH=/app/backend/storage/chroma

WORKDIR /app

# Install system utilities needed for building packages if necessary
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code and data
COPY backend/ /app/backend/

# Copy built frontend production bundle from stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend

# Render dynamically injects $PORT at runtime
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

# PADS Parkinson Care — single-container production image
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend-main
COPY frontend-main/package.json frontend-main/package-lock.json* ./
RUN npm install
COPY frontend-main/ ./
ENV VITE_API_URL=
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY physionet.org/ ./physionet.org/
COPY --from=frontend-build /app/frontend-main/dist ./frontend-main/dist

ENV PORT=8000
EXPOSE 8000

WORKDIR /app/backend
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}

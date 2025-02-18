# -------------------------------------------
# Frontend Build Stage
# -------------------------------------------
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# -------------------------------------------
# Backend Build Stage
# -------------------------------------------
FROM python:3.11 AS backend
WORKDIR /app/backend
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Set environment variables
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
# No need for `cd` here, as WORKDIR already handles it.
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]

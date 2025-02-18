# Frontend Build Stage
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Backend Stage
FROM python:3.11
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend files from frontend-build stage
COPY --from=frontend-build /app/frontend/build ./static

# Set environment variables
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["gunicorn", "app:app"]

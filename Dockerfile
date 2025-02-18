# Frontend Build Stage
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build && ls -la build/

# Backend Stage
FROM python:3.11
WORKDIR /app

# Copy backend requirements and install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Create the directory structure expected by Flask
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Add debugging
RUN ls -la
RUN ls -la frontend/build || echo "frontend/build directory not found"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV FLASK_APP=app.py

# Debug: Print environment and directory structure
CMD ["sh", "-c", "\
    echo 'Current directory:' && \
    pwd && \
    echo 'Directory contents:' && \
    ls -R && \
    echo 'Starting Gunicorn...' && \
    gunicorn --bind 0.0.0.0:$PORT --log-level debug app:app"]

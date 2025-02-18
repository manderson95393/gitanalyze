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

# Copy backend requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Create the directory structure expected by Flask
RUN mkdir -p frontend/build
COPY --from=frontend-build /app/frontend/build frontend/build

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV FLASK_APP=app.py

# Make sure these environment variables are set in Railway
ENV GITHUB_PAT=your_github_pat
ENV OPENROUTER_API_KEY=your_openrouter_key
ENV FLASK_SECRET_KEY=your_secret_key

EXPOSE 8000

# Start gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]

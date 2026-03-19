# ==========================================
# Atena API Gateway — Docker Container
# ==========================================
# Build: docker build -t atena-agent .
# Run:   docker run -p 8000:8000 --env-file .env atena-agent

FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps (minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (Docker cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the Cloud Run port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, os; port=os.environ.get('PORT', '8080'); urllib.request.urlopen(f'http://localhost:{port}/')" || exit 1

# Run the gateway (atena_api_gateway.py already parses the PORT env variable correctly)
CMD ["python", "atena_api_gateway.py"]

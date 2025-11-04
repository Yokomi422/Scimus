#!/bin/bash

# MinIO Podman Setup Script for Local Development
# This script starts MinIO in a Podman container for local PDF storage

set -e

CONTAINER_NAME="scimus-minio-local"
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"
MINIO_DATA_DIR="${HOME}/.scimus/minio/data"

echo "🚀 Starting MinIO for Scimus local development..."

# Create data directory if it doesn't exist
mkdir -p "$MINIO_DATA_DIR"

# Check if container already exists
if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Container $CONTAINER_NAME already exists. Removing..."
    podman rm -f "$CONTAINER_NAME"
fi

# Pull MinIO image
echo "📥 Pulling MinIO image..."
podman pull quay.io/minio/minio:latest

# Start MinIO container
echo "🔧 Starting MinIO container..."
podman run -d \
    --name "$CONTAINER_NAME" \
    -p $MINIO_PORT:9000 \
    -p $MINIO_CONSOLE_PORT:9001 \
    -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
    -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
    -v "$MINIO_DATA_DIR:/data:Z" \
    quay.io/minio/minio:latest \
    server /data --console-address ":9001"

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 3

# Check if MinIO is running
if podman ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ MinIO started successfully!"
    echo ""
    echo "📍 MinIO API endpoint: http://localhost:$MINIO_PORT"
    echo "🖥️  MinIO Console: http://localhost:$MINIO_CONSOLE_PORT"
    echo "👤 Username: $MINIO_ROOT_USER"
    echo "🔑 Password: $MINIO_ROOT_PASSWORD"
    echo ""
    echo "💡 To create the bucket, run: ./scripts/setup-minio-bucket.sh"
    echo "🛑 To stop: podman stop $CONTAINER_NAME"
    echo "🗑️  To remove: podman rm -f $CONTAINER_NAME"
else
    echo "❌ Failed to start MinIO container"
    exit 1
fi

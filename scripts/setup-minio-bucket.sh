#!/bin/bash

# MinIO Bucket Setup Script
# Creates the required bucket for PDF uploads

set -e

CONTAINER_NAME="scimus-minio-local"
BUCKET_NAME="pdf-uploads"

echo "Setting up MinIO bucket: $BUCKET_NAME"

# Check if container is running
if ! podman ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "MinIO container is not running. Please start it first with:"
    echo "   ./scripts/start-minio.sh"
    exit 1
fi

# Create bucket using mc (MinIO Client) inside the container
echo "📦 Creating bucket..."
podman exec "$CONTAINER_NAME" sh -c "
    mkdir -p /data/$BUCKET_NAME
    echo '✅ Bucket $BUCKET_NAME created successfully'
"

echo ""
echo "✅ MinIO setup complete!"
echo "📍 Bucket: $BUCKET_NAME"
echo "🔗 Endpoint: http://localhost:9000"

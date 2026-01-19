#!/bin/bash
set -e

echo "🔄 Updating Backend lockfile using node:20-alpine..."
docker run --rm -v "$(pwd)/HNUMarket-Backend:/app" -w /app node:20-alpine npm install
echo "✅ Backend done."

echo "🔄 Updating Storefront lockfile using node:20-alpine..."
docker run --rm -v "$(pwd)/HNUMarket-Storefront:/app" -w /app node:20-alpine npm install
echo "✅ Storefront done."

echo "🎉 All lockfiles updated to fit Alpine Linux environment."
echo "👉 Now you can commit and push: git add . && git commit -m 'chore: update lockfiles via docker' && git push"

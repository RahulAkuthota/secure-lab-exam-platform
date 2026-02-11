#!/bin/sh
set -eu

echo "[worker-init] checking executor images..."

for image in executor-c executor-cpp executor-java; do
  if docker image inspect "$image" >/dev/null 2>&1; then
    echo "[worker-init] found image: $image"
    continue
  fi

  context="/workspace/$image"
  if [ ! -f "$context/Dockerfile" ]; then
    echo "[worker-init] missing Dockerfile for $image at $context/Dockerfile"
    exit 1
  fi

  echo "[worker-init] building image: $image"
  docker build -t "$image" "$context"
done

echo "[worker-init] executor images are ready"
exec node worker.js

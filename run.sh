#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
image_name="${IMAGE_NAME:-dependency-risk-graph}"
container_name="${CONTAINER_NAME:-dependency-risk-graph}"
host_port="${PORT:-8080}"
data_volume="${DATA_VOLUME:-dependency-risk-data}"

docker build --tag "${image_name}" "${script_directory}"

exec docker run --rm \
  --name "${container_name}" \
  --publish "${host_port}:8080" \
  --volume "${data_volume}:/app/data" \
  "${image_name}"

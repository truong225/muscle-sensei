#!/usr/bin/env bash
# Tải free-exercise-db (Unlicense) — chỉ dùng trường dữ kiện (tên, cơ, dụng cụ, level); không dùng ảnh và văn bản hướng dẫn.
# Dùng: bash tools/data/fetch-data.sh [đích=tools/data/cache]
set -euo pipefail
DEST="$(realpath -m "${1:-tools/data/cache}")"; mkdir -p "$DEST"
RAW="https://raw.githubusercontent.com/yuhonas/free-exercise-db/main"
curl -fsSL "$RAW/dist/exercises.json" -o "$DEST/exercises.json"
curl -fsSL "$RAW/README.md" -o "$DEST/README.md"
curl -fsSL "$RAW/LICENSE.md" -o "$DEST/LICENSE" || curl -fsSL "$RAW/LICENSE" -o "$DEST/LICENSE"
echo "free-exercise-db: $(node -e "console.log(require('$DEST/exercises.json').length)") bài"

#!/usr/bin/env bash
# Tải đúng các file STL cần dùng từ bản sao GitHub của BodyParts3D 3.0 (20110915, CC BY-SA 2.1 JP).
# Nguồn gốc: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/ (bị chặn từ container → dùng bản sao, người dùng đã chấp nhận 2026-10-13)
# Bản sao: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D (OBJ→STL, giữ nguyên FMA ID)
# Dùng: bash tools/model/fetch-model.sh [đích=tools/model/cache/bp3d] [danh-sách=tools/model/cache/needed.txt]
set -euo pipefail
DEST="$(realpath -m "${1:-tools/model/cache/bp3d}")"
LIST="$(realpath -m "${2:-tools/model/cache/needed.txt}")"
REPO="https://github.com/Kevin-Mattheus-Moerman/BodyParts3D"
[ -f "$LIST" ] || { echo "Thiếu danh sách file: $LIST (sinh từ src/data/muscles.json + tools/model/bp3d-muscles.json)"; exit 1; }
if [ ! -d "$DEST/.git" ]; then
  git clone --filter=blob:none --no-checkout --depth 1 "$REPO" "$DEST"
fi
cd "$DEST"
git sparse-checkout init --no-cone
{ echo "/README.md"; echo "/LICENSE"; echo "/LICENSE_content"; cat "$LIST"; } | git sparse-checkout set --no-cone --stdin
git checkout
echo "Đã tải $(find assets -name '*.stl' | wc -l) file STL vào $DEST"

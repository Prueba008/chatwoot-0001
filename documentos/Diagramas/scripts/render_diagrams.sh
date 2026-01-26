#!/usr/bin/env bash
set -euo pipefail

mkdir -p docs/diagrams/rendered/png docs/diagrams/rendered/svg

echo "Rendering PNG..."
docker run --rm -v "$PWD":/work -w /work plantuml/plantuml -tpng docs/diagrams/*.puml
mv docs/diagrams/*.png docs/diagrams/rendered/png/ || true

echo "Rendering SVG..."
docker run --rm -v "$PWD":/work -w /work plantuml/plantuml -tsvg docs/diagrams/*.puml
mv docs/diagrams/*.svg docs/diagrams/rendered/svg/ || true

echo "Done. Output in docs/diagrams/rendered/"

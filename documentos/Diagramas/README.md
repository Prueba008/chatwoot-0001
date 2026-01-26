# Diagrams — Chatwoot + Tiendanube Widget

Estos diagramas modelan **la integración del Widget de Tiendanube como Dashboard App** (iframe) dentro de Chatwoot,
incluyendo flujo, secuencia, estados y componentes.

## Archivos

- `docs/diagrams/widget_flow.puml` — Diagrama de flujo (Activity)
- `docs/diagrams/widget_sequence.puml` — Diagrama secuencial
- `docs/diagrams/widget_state.puml` — Máquina de estados
- `docs/diagrams/widget_components.puml` — Componentes

## Render a PNG/SVG con PlantUML

### Opción A) Docker (recomendado)
```bash
# PNG
docker run --rm -v "$PWD":/work -w /work plantuml/plantuml -tpng docs/diagrams/*.puml

# SVG
docker run --rm -v "$PWD":/work -w /work plantuml/plantuml -tsvg docs/diagrams/*.puml
```

### Opción B) Java + PlantUML jar
1) Instalar Java 17+  
2) Descargar `plantuml.jar`  
3) Ejecutar:
```bash
java -jar plantuml.jar -tpng docs/diagrams/*.puml
java -jar plantuml.jar -tsvg docs/diagrams/*.puml
```

## Notas de modelado

- **Auth del widget**: token/basic auth para evitar exposición pública del catálogo.
- **Cache TTL**: reduce rate limit y mejora UX.
- **XSS**: sanitizar campos antes de inyectarlos en HTML.
- **postMessage (opcional)**: requiere listener en el frontend de Chatwoot.

Generado: 2026-01-24T05:26:52.931934Z


## Render automático en GitHub Actions

Este repo incluye workflow:

- `.github/workflows/render-plantuml.yml`

Cada push que modifique `docs/diagrams/*.puml` renderiza:
- PNG → `docs/diagrams/rendered/png/`
- SVG → `docs/diagrams/rendered/svg/`

También podés renderizar local con:
```bash
bash scripts/render_diagrams.sh
```

## Mermaid (alternativa)

Además se incluyen versiones Mermaid (`.mmd`) para documentación rápida:
- `docs/diagrams/*.mmd`

---
name: pptx-builder
description: Generate editable business presentations with local PptxGenJS and validate slide structure.
---
# Native PPTX Builder

Operate inside LB-Presentation-Studio:
1. Read docs/schema.md; construct source-checked \`deck.json\`.
2. Run \`npm install\` if dependencies are absent; no API key is needed for native rendering.
3. Execute \`node bin/lbp.mjs create deck.json --out dist/deck.pptx --qc\`.
4. Optional \`--pdf\` uses installed LibreOffice. Visual inspection of PDF/page PNGs is required for final production quality.
5. Audit report counts actual PPTX XML native text/shape/table/chart objects; it does not prove pixel-perfect fidelity.
6. Keep text, tables, numerical charts and flow arrows native. Treat supplied photographs/posters as editable-position raster objects, not vector-editable assets.
7. Return actual file paths and report missing components truthfully.

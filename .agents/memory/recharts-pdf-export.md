---
name: recharts PDF export
description: Why Reports PDF export serializes SVG to PNG instead of using html2canvas
---

# Reports "Export as PDF" — avoid html2canvas

The Reports page exports charts to PDF via jsPDF. It serializes each recharts
`svg.recharts-surface` element to a PNG (a custom `svgToPng` helper) and embeds
that into the PDF.

**Why:** `html2canvas` cannot parse Tailwind v4 `oklch(...)` utility colors and
throws at runtime, crashing the export. Tailwind v4 emits `oklch` for its default
palette, so any html2canvas-based capture of app UI will fail. Serializing the SVG
directly sidesteps the CSS-color parser entirely.

**How to apply:** If asked to add PDF/image export of on-screen content in a
Tailwind v4 app, do NOT reach for html2canvas. Prefer SVG-to-PNG for chart/vector
content, or render to a canvas with explicit non-oklch colors.

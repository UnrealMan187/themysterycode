#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate.py – Markdown → PDF via Chrome (headless) mit optionalem Cover.
- MD → HTML (pandoc)
- HTML → PDF (Chrome headless)
- Optional: Cover (PNG/JPG) als eigene Seite (A4 oder 1600x2000 px)
- Merge: cover.pdf + content.pdf -> output.pdf (pypdf)

Benutzung:
python3 tools/pdf_generator/generate.py \
  --input "content/kochbuecher/vegan/plant-euphoria.md" \
  --style "content/shared/pdf-style.css" \
  --output "content/kochbuecher/vegan/plant-euphoria.pdf" \
  --cover "content/covers/plant-euphoria.png" \
  --cover-mode a4 \
  --cover-frame 10 \
  --cover-alpha 0.25
"""

from __future__ import annotations
import argparse
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from pypdf import PdfReader, PdfWriter  # pip install pypdf


# ========================= Hilfsfunktionen ===============================

def run(cmd: list[str], *, check=True, capture=False) -> str | None:
    """Kommando ausführen und Ausgabe ggf. zurückgeben."""
    print("→", " ".join(shlex.quote(c) for c in cmd))
    res = subprocess.run(cmd, text=True, capture_output=capture)
    if check and res.returncode != 0:
        print(res.stderr or res.stdout)
        sys.exit(res.returncode)
    return res.stdout if capture else None


def find_chrome_binary() -> str:
    """Finde ausführbare Chrome-Binary."""
    candidates = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        "google-chrome",
        "chromium",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
    ]
    for c in candidates:
        if shutil.which(c) or Path(c).exists():
            return c
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def md_to_html(md_path: Path, css_path: Path, out_html: Path) -> None:
    """Pandoc: Markdown -> Standalone HTML5 (+ eingebettete Ressourcen)."""
    cmd = [
        "pandoc",
        str(md_path),
        "-t", "html5",
        "--standalone",
        "--embed-resources",  # Bilder/CSS inline (data: URIs)
        "--css", str(css_path),
        "--from", "markdown+raw_html+link_attributes+bracketed_spans+fenced_divs+markdown_in_html_blocks",
        "-o", str(out_html),
    ]
    run(cmd)





def html_to_pdf_with_chrome(html_path: Path, out_pdf: Path, *, chrome_bin: str):
    """Chrome headless: HTML → PDF."""
    cmd = [
        chrome_bin,
        "--headless",
        "--disable-gpu",
        "--print-to-pdf=" + str(out_pdf),
        "--no-pdf-header-footer",
        str(html_path.as_uri()),
    ]
    run(cmd)


def build_cover_html(cover_img: Path, frame_px: int, frame_alpha: float, mode: str) -> str:
    """
    Baut HTML für eine Titelseite mit optionalem Rahmen.
    mode = "a4" oder "portrait" (1600x2000 px)
    """
    alpha = max(0.0, min(1.0, frame_alpha))

    if mode == "a4":
        page_size = "A4 portrait"
    else:
        # Custom Smartphone-Layout
        page_size = "1600px 2000px"

    return f"""<!doctype html>
<html><head>
<meta charset="utf-8">
<style>
  @page {{ size: {page_size}; margin: 0; }}
  html, body {{
    margin: 0; padding: 0;
    height: 100%;
    background: rgba(0,0,0,{alpha});
  }}
  .page {{
    display: grid;
    place-items: center;
    height: 100vh;
  }}
  .frame {{
    position: relative;
    width: calc(100% - {frame_px*2}px);
    height: calc(100% - {frame_px*2}px);
    overflow: hidden;
    border-radius: 6px;
    box-shadow: 0 0 0 {frame_px}px rgba(0,0,0,{alpha});
  }}
  .frame img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }}
</style>
</head>
<body>
  <div class="page">
    <div class="frame">
      <img src="{cover_img.as_uri()}" alt="Cover" />
    </div>
  </div>
</body></html>"""


def merge_pdfs(cover_pdf: Path, content_pdf: Path, out_pdf: Path):
    """Merge: Cover + Inhalt → finale PDF."""
    writer = PdfWriter()
    for part in (cover_pdf, content_pdf):
        reader = PdfReader(str(part))
        for page in reader.pages:
            writer.add_page(page)
    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    with open(out_pdf, "wb") as f:
        writer.write(f)


# ============================= Main =====================================
def main():
    ap = argparse.ArgumentParser(description="Build PDF from Markdown using Chrome headless + optional cover")
    ap.add_argument("--input", required=True, help="Pfad zur .md-Datei")
    ap.add_argument("--style", required=True, help="Pfad zu css/pdf-style.css")
    ap.add_argument("--output", required=True, help="Ziel-PDF")
    ap.add_argument("--cover", default="", help="Optional: PNG/JPG für Titelseite")
    ap.add_argument("--cover-mode", choices=["a4", "portrait"], default="portrait", help="Cover-Größe: a4 oder portrait (1600x2000px)")
    ap.add_argument("--cover-frame", type=int, default=16, help="Rahmenbreite in px (0 = kein Rahmen)")
    ap.add_argument("--cover-alpha", type=float, default=0.35, help="Rahmen-Transparenz 0..1")
    args = ap.parse_args()

    md = Path(args.input).resolve()
    css = Path(args.style).resolve()
    out = Path(args.output).resolve()
    cover_img = Path(args.cover).resolve() if args.cover else None

    if not md.is_file():
        print(f"✖ Eingabedatei nicht gefunden: {md}")
        sys.exit(1)
    if not css.is_file():
        print(f"✖ CSS-Datei nicht gefunden: {css}")
        sys.exit(1)

    chrome = find_chrome_binary()
    if not (shutil.which(chrome) or Path(chrome).exists()):
        print("✖ Google Chrome nicht gefunden.")
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        html_content = tmp / "content.html"
        md_to_html(md, css, html_content)
        # Debug: HTML-Datei dauerhaft sichern
        debug_dir = Path("tmp/pdf_debug")
        debug_dir.mkdir(parents=True, exist_ok=True)
        debug_html = debug_dir / "content.html"
        shutil.copy(html_content, debug_html)
        print("↪ Debug HTML gespeichert unter:", debug_html.resolve())


        pdf_content = tmp / "content.pdf"
        html_to_pdf_with_chrome(html_content, pdf_content, chrome_bin=chrome)

        # Optionales Cover rendern
        if cover_img and cover_img.is_file():
            html_cover = tmp / "cover.html"
            html_cover.write_text(
                build_cover_html(cover_img, args.cover_frame, args.cover_alpha, args.cover_mode),
                encoding="utf-8",
            )
            pdf_cover = tmp / "cover.pdf"
            html_to_pdf_with_chrome(html_cover, pdf_cover, chrome_bin=chrome)
            merge_pdfs(pdf_cover, pdf_content, out)
        else:
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(pdf_content.read_bytes())

    print("✅ Fertig:", out)


if __name__ == "__main__":
    main()

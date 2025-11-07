#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate.py – Markdown → PDF (Pandoc + wkhtmltopdf) mit optionalem Cover-Bild (PNG/JPG).
Nutzt ein vollflächiges Cover als erste Seite, danach den MD-Inhalt mit deinem CSS.

Beispiel:
python tools/pdf_generator/generate.py \
  --input content/kochbuecher/plant-euphoria/plant-euphoria.md \
  --style content/shared/pdf-style.css \
  --output content/kochbuecher/plant-euphoria/plant-euphoria.pdf \
  --cover content/covers/plant-euphoria.png
"""
import argparse, os, sys, shlex, subprocess, tempfile

def run(cmd: str):
    print("→", cmd)
    p = subprocess.run(shlex.split(cmd), text=True, capture_output=True)
    if p.returncode != 0:
        print(p.stderr or p.stdout); sys.exit(p.returncode)
    if p.stdout.strip():
        print(p.stdout.strip())

def main():
    ap = argparse.ArgumentParser(description="Build PDF with optional full-page cover image")
    ap.add_argument("--input",  required=True, help="Pfad zur .md-Datei")
    ap.add_argument("--style",  required=True, help="Pfad zur .css-Datei")
    ap.add_argument("--output", required=True, help="Ziel-PDF")
    ap.add_argument("--cover",  default="",   help="Optional: Pfad zu PNG/JPG für die Titelseite")
    # wir bleiben bei wkhtmltopdf (stabil für MD→PDF)
    args = ap.parse_args()

    md  = os.path.abspath(args.input)
    css = os.path.abspath(args.style)
    pdf = os.path.abspath(args.output)
    cov = os.path.abspath(args.cover) if args.cover else ""

    if not os.path.isfile(md):
        print(f"✖ Eingabedatei nicht gefunden: {md}"); sys.exit(1)
    if not os.path.isfile(css):
        print(f"✖ CSS-Datei nicht gefunden: {css}"); sys.exit(1)
    if args.cover and not os.path.isfile(cov):
        print(f"✖ Cover-Datei nicht gefunden: {cov}"); sys.exit(1)

    os.makedirs(os.path.dirname(pdf), exist_ok=True)

    # Wenn Cover gesetzt: kleine HTML-Seite als erste PDF-Seite generieren
    cover_md = None
    if args.cover:
        # Raw-HTML in MD: bildet volle Seite (A4) ab; object-fit: cover füllt sauber aus
        html = f"""
<div style="
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
">
  <img src="file://{cov}"
       alt="Cover"
       style="width:100%; height:100vh; object-fit:cover; display:block;"/>
</div>
<div style="page-break-after: always;"></div>
""".strip()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".md")
        tmp.write(html.encode("utf-8")); tmp.flush(); tmp.close()
        cover_md = tmp.name

    # Pandoc-Aufruf (wkhtmltopdf wird von Pandoc genutzt)
    if cover_md:
        cmd = f'pandoc "{cover_md}" "{md}" -o "{pdf}" --css "{css}" --standalone --pdf-engine=wkhtmltopdf'
    else:
        cmd = f'pandoc "{md}" -o "{pdf}" --css "{css}" --standalone --pdf-engine=wkhtmltopdf'
    try:
        run(cmd)
        print("✅ Fertig.")
    finally:
        if cover_md and os.path.exists(cover_md):
            os.unlink(cover_md)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_build.py – Baut mehrere PDFs anhand einer books.json

Beispiel:
  python3 tools/pdf_generator/batch_build.py --json content/shared/books.json
Optional:
  --check     nur Pfade auflösen & anzeigen (kein Build)
  --verbose   mehr Log-Ausgabe

JSON-Struktur (Beispiel):
[
  {
    "input": "content/kochbuecher/vegan/plant-euphoria/plant-euphoria.md",
    "output": "content/kochbuecher/vegan/plant-euphoria/plant-euphoria.pdf",
    "style":  "content/shared/pdf-style.css",
    "cover":  "content/covers/plant-euphoria.png",
    "title":  "Plant Euphoria",
    "subtitle":"Modern Vegan Cuisine"
  }
]
"""

import os
import sys
import json
import shlex
import argparse
import subprocess

# Projekt-Root ermitteln: .../tools/pdf_generator -> zwei Ebenen hoch
PDF_GEN_DIR = os.path.dirname(os.path.abspath(__file__))
TOOLS_DIR   = os.path.dirname(PDF_GEN_DIR)
PROJ_ROOT   = os.path.dirname(TOOLS_DIR)

GENERATE_PY = os.path.join(PDF_GEN_DIR, "generate.py")


def run(cmd_list, verbose=False):
    if verbose:
        print("→", " ".join(shlex.quote(p) for p in cmd_list))
    p = subprocess.run(cmd_list, text=True)
    if p.returncode != 0:
        sys.exit(p.returncode)


def resolve_path(p: str, base_dir: str) -> str:
    """
    Löst Pfade robust auf:
    - Absolute Pfade bleiben wie sie sind
    - Projektweite Pfade (content/, image/, tools/, downloads/) relativ zum PROJ_ROOT
    - Alles andere relativ zum Ordner der books.json
    """
    if not p:
        return ""
    if os.path.isabs(p):
        return p

    norm = p.replace("\\", "/")
    if norm.startswith(("content/", "image/", "tools/", "downloads/")):
        return os.path.abspath(os.path.join(PROJ_ROOT, norm))
    return os.path.abspath(os.path.join(base_dir, p))


def main():
    ap = argparse.ArgumentParser(description="Build multiple PDFs from a books.json list")
    ap.add_argument("--json", required=True, help="Pfad zu books.json (z. B. content/shared/books.json)")
    ap.add_argument("--check", action="store_true", help="Nur Pfade auflösen & anzeigen, nicht bauen")
    ap.add_argument("--verbose", action="store_true", help="Detailierte Logs")
    args = ap.parse_args()

    cfg_path = os.path.abspath(args.json)
    if not os.path.isfile(cfg_path):
        print(f"✖ JSON nicht gefunden: {cfg_path}")
        sys.exit(1)

    base_dir = os.path.dirname(cfg_path)

    with open(cfg_path, "r", encoding="utf-8") as f:
        try:
            books = json.load(f)
        except Exception as e:
            print(f"✖ JSON-Fehler ({cfg_path}): {e}")
            sys.exit(1)

    if not isinstance(books, list):
        print("✖ books.json muss eine Liste von Objekten enthalten.")
        sys.exit(1)

    total = len(books)
    for i, b in enumerate(books, 1):
        inp      = resolve_path(b.get("input", ""), base_dir)
        out      = resolve_path(b.get("output", ""), base_dir)
        style    = resolve_path(b.get("style", ""), base_dir)
        cover    = resolve_path(b.get("cover", ""), base_dir)
        title    = b.get("title", "")
        subtitle = b.get("subtitle", "")

        print(f"\n[{i}/{total}] Baue: {title or os.path.basename(out)} — {subtitle}")

        if args.verbose or args.check:
            print("  • input :", inp)
            print("  • output:", out)
            print("  • style :", style)
            if cover:
                print("  • cover :", cover)

        # Nur prüfen?
        if args.check:
            # Existenzchecks
            ok_inp   = os.path.isfile(inp)
            ok_style = os.path.isfile(style)
            ok_cover = True if not cover else os.path.isfile(cover)
            print(f"  ✓ exists(input)   = {ok_inp}")
            print(f"  ✓ exists(style)   = {ok_style}")
            if cover:
                print(f"  ✓ exists(cover)   = {ok_cover}")
            continue

        # Validierung
        if not os.path.isfile(inp):
            print(f"✖ Eingabedatei nicht gefunden: {inp}")
            sys.exit(1)
        if not os.path.isfile(style):
            print(f"✖ Style nicht gefunden: {style}")
            sys.exit(1)
        if cover and (not os.path.isfile(cover)):
            print(f"✖ Cover-Datei nicht gefunden: {cover}")
            sys.exit(1)

        os.makedirs(os.path.dirname(out), exist_ok=True)

        # generate.py aufrufen
        cmd = ["python3", GENERATE_PY, "--input", inp, "--style", style, "--output", out]
        if cover:
            cmd += ["--cover", cover]
        # title/subtitle heute nur informativ im Log (werden nicht ans generate.py übergeben)
        run(cmd, verbose=args.verbose)

    if not args.check:
        print("\n✅ Alle PDFs gebaut.")


if __name__ == "__main__":
    main()

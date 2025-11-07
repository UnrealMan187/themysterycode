#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_build.py – baut mehrere PDFs anhand einer JSON-Liste.
Die JSON-Pfade werden relativ zum Speicherort der JSON aufgelöst.

Schema pro Eintrag:
{
  "input": "kochbuecher/vegan/plant-euphoria.md",
  "output": "kochbuecher/vegan/plant-euphoria.pdf",
  "style": "content/shared/pdf-style.css",
  "cover": "kochbuecher/vegan/plant-euphoria-cover.png",   # optional
  "title": "Plant Euphoria",                               # nur fürs Log
  "subtitle": "Modern Vegan Cuisine"                       # nur fürs Log
}
"""

import os
import json
import shlex
import subprocess
import sys
import argparse

# Pfad zu generate.py (liegt im selben Ordner wie dieses Skript)
GEN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generate.py")


def run(cmd: str) -> None:
    print("→", cmd)
    proc = subprocess.run(shlex.split(cmd), text=True)
    if proc.returncode != 0:
        sys.exit(proc.returncode)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Pfad zu books.json (z. B. content/shared/books.json)")
    args = ap.parse_args()

    cfg_path = os.path.abspath(args.json)
    if not os.path.isfile(cfg_path):
        print(f"✖ JSON nicht gefunden: {cfg_path}")
        sys.exit(1)

    # Basis für relative Pfadauflösung = Ordner der JSON
    base = os.path.dirname(cfg_path)

    with open(cfg_path, "r", encoding="utf-8") as f:
        books = json.load(f)

    total = len(books)
    for i, b in enumerate(books, 1):
        # Eingaben aus JSON lesen (mit Fallbacks)
        inp_rel = b.get("input", "")
        out_rel = b.get("output", "")
        style_rel = b.get("style", "")
        cover_rel = b.get("cover", "")
        title = b.get("title", "") or os.path.basename(out_rel)
        subtitle = b.get("subtitle", "")

        # zu Absolutpfaden relativ zu 'base' machen
        def to_abs(p: str) -> str:
            if not p:
                return ""
            return p if os.path.isabs(p) else os.path.abspath(os.path.join(base, p))

        inp = to_abs(inp_rel)
        out = to_abs(out_rel)
        style = to_abs(style_rel)
        cover = to_abs(cover_rel) if cover_rel else ""

        # Zielordner erstellen
        os.makedirs(os.path.dirname(out), exist_ok=True)

        print(f"\n[{i}/{total}] Baue: {title}{f' — {subtitle}' if subtitle else ''}")

        # generate.py Kommando (ohne --title/--subtitle)
        cmd = f'python3 "{GEN}" --input "{inp}" --style "{style}" --output "{out}"'
        if cover:
            cmd += f' --cover "{cover}"'

        run(cmd)

    print("\n✅ Alle PDFs gebaut.")


if __name__ == "__main__":
    main()

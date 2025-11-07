#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, os, subprocess, shlex, sys
from shutil import which as _which

def which(cmd): return _which(cmd)

def run(cmd: str):
    print(f"→ {cmd}")
    p = subprocess.run(shlex.split(cmd), capture_output=True, text=True)
    if p.returncode != 0:
        print("✖ Fehler:", p.stderr.strip() or p.stdout.strip()); sys.exit(p.returncode)
    if p.stdout.strip(): print(p.stdout.strip())

def main():
    p = argparse.ArgumentParser(description="Build PDF from Markdown using Pandoc + wkhtmltopdf")
    p.add_argument("--input", required=True, help="Pfad zur .md-Datei")
    p.add_argument("--style", required=True, help="Pfad zur .css-Datei")
    p.add_argument("--output", required=True, help="Ziel-PDF (Pfad)")
    p.add_argument("--engine", default="wkhtmltopdf", help="PDF-Engine (default: wkhtmltopdf)")
    a = p.parse_args()

    md, css, pdf = map(os.path.abspath, [a.input, a.style, a.output])
    if not os.path.isfile(md):  print(f"✖ Eingabedatei nicht gefunden: {md}");  sys.exit(1)
    if not os.path.isfile(css): print(f"✖ CSS-Datei nicht gefunden: {css}");   sys.exit(1)
    if which("pandoc") is None: print("✖ pandoc nicht gefunden.");              sys.exit(1)
    if which(a.engine) is None: print(f"✖ {a.engine} nicht gefunden.");         sys.exit(1)
    os.makedirs(os.path.dirname(pdf), exist_ok=True)

    cmd = f'pandoc "{md}" -o "{pdf}" --css "{css}" --standalone --pdf-engine={a.engine}'
    print(f"📄 Eingabe : {md}\n🎨 CSS     : {css}\n��️  Ausgabe: {pdf}\n⚙️  Engine : {a.engine}")
    run(cmd); print("✅ Fertig.")

if __name__ == "__main__": main()

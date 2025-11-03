#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TMC QR Batch Generator
Erzeugt serienweise QR-Codes (PNG, PNG transparent, SVG) mit optionalem Logo-Overlay.
– Fehlertoleranz: H
– Farbwelt: Gold (#d4af37) auf Schwarz (#000000) – umkehrbar
– Ziele: https://themysterycode.de/c/1 ... /c/N

Abhängigkeiten (Python 3.9+):
  pip install qrcode[pil] pillow cairosvg

Nutzung (Beispiele):
  python tmc_qr_batch.py --count 5
  python tmc_qr_batch.py --count 10 --base-url https://themysterycode.de/c --out-dir ./qr_out
  python tmc_qr_batch.py --count 5 --logo ./assets/tmc_logo.png --invert
  python tmc_qr_batch.py --count 3 --size 900 --box 12 --border 2 --no-svg
"""
import argparse
from pathlib import Path

from PIL import Image, ImageOps, ImageDraw
import qrcode
from qrcode.constants import ERROR_CORRECT_H

try:
    from qrcode.image.svg import SvgImage
    SVG_AVAILABLE = True
except Exception:
    SVG_AVAILABLE = False


def make_qr(text, box_size=10, border=2, version=None, err=ERROR_CORRECT_H):
    qr = qrcode.QRCode(
        version=version,
        error_correction=err,
        box_size=box_size,
        border=border,
    )
    qr.add_data(text)
    qr.make(fit=True)
    return qr


def paste_logo_center(qr_img: Image.Image, logo_path: Path, scale=0.2, circular=True):
    """
    Fügt ein Logo mittig ein.
    scale = Anteil der QR-Kantenlänge (0.2 = 20%)
    circular = kreisförmige Maske für edlen Look
    """
    if not logo_path or not Path(logo_path).exists():
        return qr_img

    qr_img = qr_img.convert("RGBA")
    L = min(qr_img.size)
    target = int(L * scale)

    logo = Image.open(logo_path).convert("RGBA")
    # Seitenverhältnis bewahren und in Quadratrahmen einpassen
    logo.thumbnail((target, target), Image.LANCZOS)

    if circular:
        # Kreis-Maske
        mask = Image.new("L", logo.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse([(0, 0), logo.size], fill=255)
        logo = ImageOps.fit(logo, logo.size, centering=(0.5, 0.5))
        logo.putalpha(mask)

        # dezente Schattenblende unter dem Logo (Scan-Sicherheit)
        pad = 6
        bg = Image.new("RGBA", (logo.width + pad*2, logo.height + pad*2), (0, 0, 0, 0))
        bg_mask = Image.new("L", bg.size, 0)
        draw2 = ImageDraw.Draw(bg_mask)
        draw2.ellipse([(pad-1, pad-1), (bg.width-pad+1, bg.height-pad+1)], fill=80)
        bg.putalpha(bg_mask)
        pos = ((qr_img.width - bg.width) // 2, (qr_img.height - bg.height) // 2)
        qr_img.alpha_composite(bg, dest=pos)

    # Logo mittig auf QR setzen
    pos = ((qr_img.width - logo.width) // 2, (qr_img.height - logo.height) // 2)
    qr_img.alpha_composite(logo, dest=pos)
    return qr_img


def ImageColor_getrgb(hex_color: str):
    hex_color = hex_color.strip().lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join([c*2 for c in hex_color])
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (r, g, b)


def main():
    parser = argparse.ArgumentParser(description="TMC QR Batch Generator")
    parser.add_argument("--base-url", default="https://themysterycode.de/c", help="Basis-URL ohne laufende Nummer")
    parser.add_argument("--count", type=int, default=5, help="Anzahl QR-Codes (z. B. /c/1 .. /c/N)")
    parser.add_argument("--start", type=int, default=1, help="Startindex (Standard 1)")
    parser.add_argument("--out-dir", default="./qr_out", help="Ausgabeverzeichnis")
    parser.add_argument("--size", type=int, default=800, help="Zielkantenlänge PNG (ca.)")
    parser.add_argument("--box", type=int, default=10, help="Pixelgröße pro QR-Modul")
    parser.add_argument("--border", type=int, default=2, help="Randmodule (2–4 empfohlen)")
    parser.add_argument("--version", type=int, default=None, help="QR-Version fixieren (optional)")
    parser.add_argument("--logo", type=str, default=None, help="Pfad zum Logo (PNG mit Transparenz empfohlen)")
    parser.add_argument(
    "--logo-scale",
    type=float,
    default=0.2,
    help="Logo-Anteil an QR-Kantenlänge (0.2 = 20%%)"
)

    parser.add_argument("--circular", action="store_true", help="Logo kreisförmig maskieren")
    parser.add_argument("--invert", action="store_true", help="Invertiert: Gold-Module auf schwarzem Grund")
    parser.add_argument("--no-svg", action="store_true", help="SVG-Ausgabe deaktivieren")
    parser.add_argument("--no-transparent", action="store_true", help="keine transparente PNG erzeugen")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Farben
    gold = (212, 175, 55, 255)  # #d4af37
    black = (0, 0, 0, 255)
    white = (255, 255, 255, 255)

    for i in range(args.start, args.start + args.count):
        url = f"{args.base_url}/{i}"
        qr = make_qr(url, box_size=args.box, border=args.border, version=args.version)

        # Farben setzen
        if args.invert:
            fill = gold
            back = black
            fg_name = "gold_on_black"
        else:
            fill = black
            back = white
            fg_name = "black_on_white"

        # PNG (mit Hintergrund)
        img = qr.make_image(fill_color=fill, back_color=back).convert("RGBA")
        img = img.resize((args.size, args.size), Image.LANCZOS)

        # Logo optional
        if args.logo:
            img = paste_logo_center(img, Path(args.logo), scale=args.logo_scale, circular=args.circular)

        base_name = f"TMC_QR_{i:03d}_{fg_name}"
        png_path = out_dir / f"{base_name}.png"
        img.save(png_path)

                # Transparente PNG (Hintergrund entfernen), wenn sinnvoll
        if not args.no_transparent:
            bg_rgb = (back[0], back[1], back[2])  # zu entfernende Hintergrundfarbe
            img_trans = Image.new("RGBA", img.size)
            new_data = []
            for p in img.getdata():
                if (p[0], p[1], p[2]) == bg_rgb:
                    new_data.append((255, 255, 255, 0))  # transparent
                else:
                    new_data.append(p)
            img_trans.putdata(new_data)
            img_trans.save(out_dir / f"{base_name}_transparent.png")


        # SVG (Vektor) – falls verfügbar
        if not args.no_svg and SVG_AVAILABLE:
            svg = qrcode.make(url, image_factory=SvgImage)
            (out_dir / f"{base_name}.svg").write_bytes(svg.to_string())

        print(f"✔︎ {url} → {png_path.name}")

    print(f"\nFertig. Ausgabeordner: {out_dir.resolve()}")
    print("Tipp: Für perfekte Scanbarkeit Logo ≤ 20–25 % der Kantenlänge, Fehlertoleranz H beibehalten.")


if __name__ == "__main__":
    main()

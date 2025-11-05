#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Erzeugt QR-Codes (PNG) für alle Codes in tools/qr_generator/codes.txt
– mit TMC-Logo zentriert
– hohe Fehlertoleranz (H)
– Dateinamen: TMC_QR_<CODE>_black.png
Ausgabe: tools/qr_generator/qr_out/
"""

from pathlib import Path
from PIL import Image, ImageOps
import qrcode
from qrcode.constants import ERROR_CORRECT_H

ROOT = Path(__file__).resolve().parents[0]           # tools/qr_generator
CODES_FILE = ROOT / "codes.txt"
LOGO_PATH  = ROOT / "assets" / "tmc_logo.png"        # transparentes PNG empfohlen
OUT_DIR    = ROOT / "qr_out"

# Design-Parameter
QR_BOX_SIZE   = 12   # Modulgröße – höher = größere PNG
QR_BORDER     = 2    # Ruhezone um den Code (mind. 2)
LOGO_SCALE    = 0.22 # Anteil der QR-Kantenlänge (0.22 = 22%) – gute Scanbarkeit
LOGO_CIRCULAR = True # rundes Logo (sanfte Maske)

def make_qr(url: str):
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,  # höchste Fehlertoleranz für Logo-Overlay
        box_size=QR_BOX_SIZE,
        border=QR_BORDER,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    return img

def paste_logo_center(qr_img: Image.Image, logo_path: Path) -> Image.Image:
    if not logo_path.exists():
        return qr_img

    # Logo laden & in RGBA
    logo = Image.open(logo_path).convert("RGBA")

    # Logo auf Zielgröße skalieren
    side = int(min(qr_img.size) * LOGO_SCALE)
    logo = ImageOps.contain(logo, (side, side))  # Seitenverhältnis beibehalten

    # Optional: runde Maske für edlen Look
    if LOGO_CIRCULAR:
        import numpy as np
        mask = Image.new("L", logo.size, 0)
        cx, cy = logo.size[0] // 2, logo.size[1] // 2
        y, x = np.ogrid[:logo.size[1], :logo.size[0]]
        r = min(cx, cy)
        circle = (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2
        mask_pixels = mask.load()
        for j in range(logo.size[1]):
            for i in range(logo.size[0]):
                mask_pixels[i, j] = 255 if circle[j, i] else 0
        logo.putalpha(mask)

    # Position mittig
    qr_w, qr_h = qr_img.size
    lx = (qr_w - logo.size[0]) // 2
    ly = (qr_h - logo.size[1]) // 2

    qr_img.alpha_composite(logo, (lx, ly))
    return qr_img

def main():
    codes = [c.strip() for c in CODES_FILE.read_text(encoding="utf-8").splitlines() if c.strip()]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for code in codes:
        url = f"https://themysterycode.de/c/{code}"
        qr = make_qr(url)
        qr = paste_logo_center(qr, LOGO_PATH)

        out_file = OUT_DIR / f"TMC_QR_{code}_black.png"
        qr.save(out_file)
        print(f"✔ {code:>12} → {out_file.name}")

    print(f"\nFertig. Ausgabeordner: {OUT_DIR.resolve()}")
    print("Tipp: Für perfekte Scanbarkeit Logo ≤ 20–25 % der Kantenlänge belassen (LOGO_SCALE).")

if __name__ == "__main__":
    main()

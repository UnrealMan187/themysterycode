#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# make_qrs_styled.py
# Erzeugt QR-Codes im Dark-Style:
# - Variante A: Standard (dunkel auf hell) + HALO (heller Freisteller) für dunkle Hintergründe
# - Variante B: ECHT invertiert (hell auf dunkel) – mit Hinweis: weniger robust
# - Logo: freigestellt/transparent, mittig (kein Teller)
#
# Usage-Beispiele siehe README / Befehlszeilen-Flags unten.

import os, json
from PIL import Image, ImageDraw, ImageOps
import qrcode
from qrcode.constants import ERROR_CORRECT_H

# ---------- Konfiguration ----------
DEFAULTS = {
    "out_dir": "qr_out_dark",
    "size_px": 1024,           # endgültige Kantenlänge
    "box_size": 20,            # QR-Modulgröße (wird von qrcode verwendet)
    "border": 4,               # Ruhezone (in Modulen)
    "error_correction": ERROR_CORRECT_H,
    # Farben
    "fg": "#111111",           # Vordergrund (Module)
    "bg": "#f5f5f7",           # Hintergrund (Ruhezone)
    # HALO: Helle Fläche hinter dem QR (für Variante A)
    "halo_px": 0,              # 0 = aus | 12..24 sehr gut | 0 = echte Invertierung möglich
    "halo_color": "#f5f5f7",
    "halo_radius": 36,         # Rundung des Halo-Rechtecks
    # Logo (freigestellt)
    "logo_path": None,         # z.B. "assets/tmc_logo.png" (PNG mit Transparenz empfohlen)
    "logo_scale": 0.22,        # Anteil an der QR-Kantenlänge
}

def make_qr(url, cfg):
    qr = qrcode.QRCode(
        version=None,
        error_correction=cfg["error_correction"],
        box_size=cfg["box_size"],
        border=cfg["border"],
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=cfg["fg"], back_color=cfg["bg"]).convert("RGBA")

    # auf gewünschte Größe skalieren
    img = img.resize((cfg["size_px"], cfg["size_px"]), Image.NEAREST)

    # HALO (Variante A): heller Freisteller hinter den QR kleben (für dunkle Umgebungen)
    if cfg["halo_px"] > 0:
        pad = cfg["halo_px"]
        W = cfg["size_px"] + pad * 2
        H = cfg["size_px"] + pad * 2
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        # abgerundetes helles Rechteck
        rr = cfg["halo_radius"]
        halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(halo)
        d.rounded_rectangle([0, 0, W, H], radius=rr, fill=cfg["halo_color"])
        canvas.alpha_composite(halo, (0, 0))
        # QR drauf
        canvas.alpha_composite(img, (pad, pad))
        img = canvas

    # Logo freigestellt (kein Teller): transparentes PNG empfohlen
    if cfg["logo_path"] and os.path.exists(cfg["logo_path"]):
        logo = Image.open(cfg["logo_path"]).convert("RGBA")
        L = int(min(img.size) * cfg["logo_scale"])
        # Logo proportional einpassen
        logo = ImageOps.contain(logo, (L, L))

        # mittig auf QR setzen
        x = (img.size[0] - logo.size[0]) // 2
        y = (img.size[1] - logo.size[1]) // 2
        img.alpha_composite(logo, (x, y))

    return img

def save_png(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)

def main():
    import argparse
    p = argparse.ArgumentParser(description="Erzeuge Dark-Style QR-Codes (Halo-Option, invertierbar, Logo freigestellt)")
    p.add_argument("--map", help="JSON-Datei: [{'name':'Mannheim-01','url':'https://themysterycode.de/c/101'}, ...]")
    p.add_argument("--out", default=DEFAULTS["out_dir"])
    p.add_argument("--fg", default=DEFAULTS["fg"])
    p.add_argument("--bg", default=DEFAULTS["bg"])
    p.add_argument("--halo", type=int, default=DEFAULTS["halo_px"])
    p.add_argument("--halo-color", default=DEFAULTS["halo_color"])
    p.add_argument("--logo", default=DEFAULTS["logo_path"])
    p.add_argument("--logo-scale", type=float, default=DEFAULTS["logo_scale"])
    p.add_argument("--size", type=int, default=DEFAULTS["size_px"])
    p.add_argument("--border", type=int, default=DEFAULTS["border"])
    args = p.parse_args()

    with open(args.map, "r", encoding="utf-8") as f:
        entries = json.load(f)

    cfg = DEFAULTS.copy()
    cfg.update({
        "out_dir": args.out,
        "fg": args.fg,
        "bg": args.bg,
        "halo_px": args.halo,
        "halo_color": args.halo_color,
        "logo_path": args.logo,
        "logo_scale": args.logo_scale,
        "size_px": args.size,
        "border": args.border,
    })

    for e in entries:
        name = e["name"]
        url  = e["url"]
        img = make_qr(url, cfg)
        out_path = os.path.join(args.out, f"{name}.png")
        save_png(img, out_path)
        print(f"✔ {url} → {out_path}")

if __name__ == "__main__":
    main()

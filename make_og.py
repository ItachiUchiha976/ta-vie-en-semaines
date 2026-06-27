# -*- coding: utf-8 -*-
"""Genere og-image.png (1200x630) pour Ta Vie en Semaines, sans dependance SVG."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "ta-vie-en-semaines", "og-image.png")
W, H = 1200, 630

img = Image.new("RGB", (W, H), "#0e1016")
d = ImageDraw.Draw(img)

# fond degrade vertical
for y in range(H):
    t = y / H
    r = int(0x1b + (0x0e - 0x1b) * t)
    g = int(0x20 + (0x10 - 0x20) * t)
    b = int(0x30 + (0x16 - 0x30) * t)
    d.line([(0, y), (W, y)], fill=(r, g, b))

def font(path, size):
    for p in (path, os.path.join("C:\\Windows\\Fonts", path)):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

f_title = font("arialbd.ttf", 70)
f_h = font("arial.ttf", 42)
f_sub = font("arial.ttf", 42)
f_small = font("arialbd.ttf", 30)
f_foot = font("arial.ttf", 26)

# texte gauche
d.text((80, 95), "Ta Vie en Semaines", font=f_title, fill="#eef1f7")
# trait accent
d.rounded_rectangle([82, 185, 232, 191], radius=3, fill="#ff5a5f")
d.text((80, 235), "Chaque case = une semaine de ta vie.", font=f_h, fill="#eef1f7")
d.text((80, 300), "Combien t'en reste-t-il ?", font=f_sub, fill="#9aa3b8")
d.text((80, 440), "Gratuit  -  Sans inscription  -  100% privé", font=f_small, fill="#ffb300")
d.text((80, 540), "ta-vie-en-semaines  -  Mindset Brut", font=f_foot, fill="#6c7488")

# grille decorative en bas a droite (compo diagonale, ne chevauche pas le texte)
cols, rows = 9, 8
cell, gap = 30, 8
gx, gy = 820, 312
phase_colors = ["#6ee7b7", "#38bdf8", "#a78bfa", "#f472b6", "#fbbf24"]
future = "#232838"
now_index = 3 * cols + 4  # une case "presente"
total = cols * rows
# environ 45% vecu
lived_until = int(total * 0.45)
for i in range(total):
    c = i % cols
    rr = i // cols
    x = gx + c * (cell + gap)
    y = gy + rr * (cell + gap)
    if i == now_index:
        color = "#ff5a5f"
    elif i < lived_until:
        color = phase_colors[min(len(phase_colors) - 1, rr // 2)]
    else:
        color = future
    d.rounded_rectangle([x, y, x + cell, y + cell], radius=5, fill=color)
# halo blanc sur la case presente
nx = gx + (now_index % cols) * (cell + gap)
ny = gy + (now_index // cols) * (cell + gap)
d.rounded_rectangle([nx - 2, ny - 2, nx + cell + 2, ny + cell + 2], radius=6, outline="#ffffff", width=3)

img.save(OUT, "PNG")
print("OK ->", OUT, os.path.getsize(OUT), "bytes")

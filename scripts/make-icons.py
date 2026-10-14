"""Eklenti ikonlarını üretir: mavi zemin üzerinde iki uçlu aralık slider'ı.

Bağımlılık yok (saf Python + zlib). Kenar yumuşatma için 4x süper örnekleme yapılır.
Kullanım: python3 scripts/make-icons.py
"""
import os
import struct
import zlib

SIZES = [16, 32, 48, 128]
SS = 4  # süper örnekleme katsayısı
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'icons')

BG = (16, 100, 188)
WHITE = (255, 255, 255)
TRACK = (122, 166, 214)


def inside_rounded_rect(x, y, size, radius):
    cx = min(max(x, radius), size - radius)
    cy = min(max(y, radius), size - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def shade(x, y):
    """128 birimlik tasarım koordinatlarında bir noktanın rengini döndürür (None = şeffaf)."""
    if not inside_rounded_rect(x, y, 128, 26):
        return None
    lo, hi, mid = 38, 90, 64
    knob_r = 12
    for kx in (lo, hi):
        if (x - kx) ** 2 + (y - mid) ** 2 <= knob_r ** 2:
            return WHITE
    if lo <= x <= hi and abs(y - mid) <= 5:
        return WHITE
    if 16 <= x <= 112 and abs(y - mid) <= 3:
        return TRACK
    return BG


def render(size):
    rows = []
    n = SS * SS
    for py in range(size):
        row = bytearray([0])  # filtre tipi: none
        for px in range(size):
            r = g = b = a = 0
            for sy in range(SS):
                for sx in range(SS):
                    x = (px + (sx + 0.5) / SS) * 128 / size
                    y = (py + (sy + 0.5) / SS) * 128 / size
                    c = shade(x, y)
                    if c:
                        r += c[0]; g += c[1]; b += c[2]; a += 255
            cov = a / 255
            if cov:
                row += bytes([round(r / cov), round(g / cov), round(b / cov), round(a / n)])
            else:
                row += bytes(4)
        rows.append(bytes(row))
    return b''.join(rows)


def png(size, raw):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    for s in SIZES:
        path = os.path.join(OUT_DIR, f'icon-{s}.png')
        with open(path, 'wb') as f:
            f.write(png(s, render(s)))
        print(path)

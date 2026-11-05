#!/usr/bin/env python3
"""Genera los iconos de AlarMap: reloj despertador antiguo con dos campanas.

Obra propia, dibujada con Pillow (supersampling 4x). La silueta es blanca sobre el degradado de
colores del logo de Angular (paradas tomadas de angular.dev). La UI interna de la app sigue siendo
monocromática: el color vive solo en el icono.

Salidas en assets/: icon.png, android-icon-background.png, android-icon-foreground.png,
android-icon-monochrome.png y splash-icon.png.

Uso: python3 scripts/generate-icons.py
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SS = 4  # supersampling

# Degradado del logo de Angular: (posición, color).
STOPS = [
    (0.0, (0xE4, 0x00, 0x35)),
    (0.24, (0xF6, 0x0A, 0x48)),
    (0.352, (0xF2, 0x07, 0x55)),
    (0.494, (0xDC, 0x08, 0x7D)),
    (0.745, (0x97, 0x17, 0xE7)),
    (1.0, (0x6C, 0x00, 0xF5)),
]


def ramp(t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    for (p0, c0), (p1, c1) in zip(STOPS, STOPS[1:]):
        if t <= p1:
            k = (t - p0) / (p1 - p0)
            return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
    return STOPS[-1][1]


def gradient(size: int) -> Image.Image:
    """Degradado diagonal: de abajo-izquierda (rojo) a arriba-derecha (violeta)."""
    x0, y0, x1, y1 = 0.05 * size, 0.95 * size, 0.95 * size, 0.05 * size
    dx, dy = x1 - x0, y1 - y0
    norm = dx * dx + dy * dy
    colors = [ramp(i / 255) for i in range(256)]
    data = []
    for y in range(size):
        for x in range(size):
            t = ((x - x0) * dx + (y - y0) * dy) / norm
            data.append(colors[max(0, min(255, round(t * 255)))])
    img = Image.new("RGB", (size, size))
    img.putdata(data)
    return img


def clock_mask(size: int, scale: float) -> Image.Image:
    """Silueta del reloj (L, 255 = reloj) centrada en un lienzo cuadrado de `size` px.

    Se dibuja en un espacio de 1000 unidades. `scale` ajusta su tamaño: el ícono adaptativo exige que
    todo quede dentro del círculo central (zona segura, ~66 % del lienzo).
    """
    big = size * SS
    img = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(img)

    k = big / 1000 * scale
    cx, cy = 500, 560  # centro del cuerpo

    def p(x: float, y: float) -> tuple[float, float]:
        # Centra el dibujo (centro visual ~ (500, 555)) en el lienzo y aplica la escala.
        return (big / 2 + (x - 500) * k, big / 2 + (y - 555) * k)

    def line(a, b, w):
        pa, pb = p(*a), p(*b)
        d.line([pa, pb], fill=255, width=round(w * k))
        r = w * k / 2
        for q in (pa, pb):
            d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=255)

    def circle(c, r, fill=255):
        q = p(*c)
        d.ellipse([q[0] - r * k, q[1] - r * k, q[0] + r * k, q[1] + r * k], fill=fill)

    # Cuerpo: aro grueso y esfera vacía.
    circle((cx, cy), 250)
    circle((cx, cy), 205, fill=0)

    # Campanas: medios discos que miran hacia afuera, a +-45 grados sobre el aro.
    for side in (-1, 1):
        ang = math.radians(-90 + side * 45)  # dirección desde el centro del cuerpo
        bx = cx + math.cos(ang) * 305
        by = cy + math.sin(ang) * 305
        pts = []
        for i in range(0, 181, 6):
            a = ang + math.radians(i - 90)  # semicírculo orientado hacia afuera
            pts.append(p(bx + math.cos(a) * 105, by + math.sin(a) * 105))
        d.polygon(pts, fill=255)
        # Base de la campana (borde plano) y vástago hacia el aro.
        line((bx + math.cos(ang + math.pi / 2) * 92, by + math.sin(ang + math.pi / 2) * 92),
             (bx - math.cos(ang + math.pi / 2) * 92, by - math.sin(ang + math.pi / 2) * 92), 22)
        line((bx, by), (cx + math.cos(ang) * 245, cy + math.sin(ang) * 245), 34)

    # Martillo entre las campanas.
    line((cx, cy - 250), (cx, cy - 300), 22)
    circle((cx, cy - 318), 30)

    # Patas.
    for side in (-1, 1):
        line((cx + side * 150, cy + 205), (cx + side * 225, cy + 310), 40)

    # Marcas de las 12, 3, 6 y 9.
    for i in range(4):
        a = math.radians(i * 90 - 90)
        line((cx + math.cos(a) * 160, cy + math.sin(a) * 160), (cx + math.cos(a) * 185, cy + math.sin(a) * 185), 20)

    # Manecillas (aprox. 10:10) y eje.
    line((cx, cy), (cx + math.cos(math.radians(-120)) * 105, cy + math.sin(math.radians(-120)) * 105), 26)
    line((cx, cy), (cx + math.cos(math.radians(-60)) * 145, cy + math.sin(math.radians(-60)) * 145), 20)
    circle((cx, cy), 26)

    return img.resize((size, size), Image.LANCZOS)


def white_on(mask: Image.Image, base: Image.Image | None) -> Image.Image:
    layer = Image.new("RGBA", mask.size, (255, 255, 255, 0))
    layer.putalpha(mask)
    if base is None:
        return layer
    out = base.convert("RGBA")
    out.alpha_composite(layer)
    return out


def rounded(img: Image.Image, radius_ratio: float) -> Image.Image:
    """Cuadrado redondeado con fondo transparente (para la pantalla de inicio)."""
    big = img.size[0] * 2
    m = Image.new("L", (big, big), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * radius_ratio), fill=255)
    m = m.resize(img.size, Image.LANCZOS)
    out = img.convert("RGBA")
    out.putalpha(m)
    return out


def main() -> None:
    ASSETS.mkdir(exist_ok=True)

    bg1024 = gradient(1024)
    icon = white_on(clock_mask(1024, 0.95), bg1024).convert("RGB")
    icon.save(ASSETS / "icon.png")

    gradient(512).save(ASSETS / "android-icon-background.png")
    white_on(clock_mask(512, 0.80), None).save(ASSETS / "android-icon-foreground.png")

    # Monocromático (iconos temáticos de Android 13+): solo la forma, el sistema la tiñe.
    mono = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
    mono_mask = clock_mask(432, 0.80)
    solid = Image.new("RGBA", (432, 432), (0, 0, 0, 255))
    solid.putalpha(mono_mask)
    mono.alpha_composite(solid)
    mono.save(ASSETS / "android-icon-monochrome.png")

    rounded(icon, 0.22).save(ASSETS / "splash-icon.png")
    print("Iconos generados en", ASSETS)


if __name__ == "__main__":
    main()

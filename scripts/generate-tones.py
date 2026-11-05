#!/usr/bin/env python3
"""Sintetiza los 5 tonos de alarma (obra propia, sin licencias de terceros).

Solo biblioteca estándar. Cada tono es un WAV mono 16 bit a 32 kHz que cierra en silencio,
así el bucle del reproductor no produce clics. Salida: res/raw del módulo alarm-engine.

Uso: python3 scripts/generate-tones.py
"""
import math
import struct
import wave
from pathlib import Path

RATE = 32000
OUT = Path(__file__).resolve().parent.parent / "modules/alarm-engine/android/src/main/res/raw"


def silence(seconds: float) -> list[float]:
    return [0.0] * int(RATE * seconds)


def envelope(n: int, attack: float, decay_tau: float | None = None, release: float = 0.01) -> list[float]:
    """Ataque lineal, decaimiento exponencial opcional y release lineal para evitar clics."""
    a, r = int(RATE * attack), int(RATE * release)
    env = []
    for i in range(n):
        g = min(1.0, i / a) if a else 1.0
        if decay_tau:
            g *= math.exp(-i / (RATE * decay_tau))
        g *= min(1.0, (n - 1 - i) / r) if r else 1.0
        env.append(g)
    return env


def tone(freqs: list[tuple[float, float]], seconds: float, attack=0.005, decay_tau=None) -> list[float]:
    """Suma de parciales (frecuencia, amplitud relativa)."""
    n = int(RATE * seconds)
    env = envelope(n, attack, decay_tau)
    norm = sum(a for _, a in freqs)
    return [
        env[i] * sum(a * math.sin(2 * math.pi * f * i / RATE) for f, a in freqs) / norm
        for i in range(n)
    ]


def square_soft(freq: float, seconds: float) -> list[float]:
    """Onda cuadrada suavizada (primeros armónicos impares) con envolvente."""
    return tone([(freq * k, 1 / k) for k in (1, 3, 5, 7)], seconds, attack=0.004)


def classic() -> list[float]:
    # Doble bip 880 Hz, pausa y repetir: el despertador de siempre.
    beep = square_soft(880, 0.12)
    return (beep + silence(0.08) + beep + silence(0.70)) * 2


def gentle() -> list[float]:
    # Arpegio ascendente tipo marimba, suave.
    notes = [523.25, 659.25, 783.99, 1046.5]
    out: list[float] = []
    for f in notes:
        out += tone([(f, 1.0), (2 * f, 0.15)], 0.55, attack=0.01, decay_tau=0.18)
    return out + silence(1.0)


def digital() -> list[float]:
    # Cuatro bips agudos de reloj digital + pausa.
    beep = tone([(2000, 1.0)], 0.07, attack=0.002)
    out: list[float] = []
    for _ in range(4):
        out += beep + silence(0.07)
    return out + silence(0.9)


def bell() -> list[float]:
    # Parciales inarmónicos con decaimiento largo.
    partials = [(660, 1.0), (660 * 2.76, 0.6), (660 * 5.4, 0.35), (660 * 8.93, 0.2)]
    strike = tone(partials, 2.6, attack=0.002, decay_tau=0.55)
    return strike + silence(0.8)


def pulse() -> list[float]:
    # 440 Hz con modulación de amplitud a 3 Hz: pulsos suaves y continuos.
    seconds = 3.0
    n = int(RATE * seconds)
    env = envelope(n, 0.01)
    return [
        env[i] * math.sin(2 * math.pi * 440 * i / RATE) * (0.5 + 0.5 * math.sin(2 * math.pi * 3 * i / RATE - math.pi / 2))
        for i in range(n)
    ]


TONES = {"default": classic, "gentle": gentle, "digital": digital, "bell": bell, "pulse": pulse}


def write(name: str, samples: list[float]) -> None:
    peak = max(abs(s) for s in samples) or 1.0
    scale = 0.8 * 32767 / peak  # -2 dBFS aprox.: sin recorte
    data = b"".join(struct.pack("<h", int(s * scale)) for s in samples)
    path = OUT / f"tone_{name}.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data)
    print(f"{path.name}: {len(samples) / RATE:.1f} s, {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for tone_id, make in TONES.items():
        write(tone_id, make())

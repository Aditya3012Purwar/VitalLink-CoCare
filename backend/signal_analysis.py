"""PADS smartwatch signal analysis — tremor frequency, amplitude, PSD."""

from __future__ import annotations

import numpy as np
from scipy import signal as scipy_signal

SAMPLE_RATE = 100  # Hz (Apple Watch Series 4 in PADS study)
SKIP_SAMPLES = 50  # first 0.5s removed per PADS preprocessing


def load_timeseries(path: str) -> np.ndarray:
    """Load PADS txt file: time, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z."""
    data = np.loadtxt(path, delimiter=",")
    if data.ndim == 1:
        data = data.reshape(1, -1)
    return data[SKIP_SAMPLES:]


def compute_psd(acc_axis: np.ndarray, fs: float = SAMPLE_RATE) -> tuple[list[float], list[float]]:
    """Welch PSD — 1 Hz bins, 0–19 Hz (PADS paper)."""
    freqs, psd = scipy_signal.welch(acc_axis, fs=fs, nperseg=min(256, len(acc_axis)))
    mask = (freqs >= 1) & (freqs <= 19)
    freqs = freqs[mask]
    psd = psd[mask]
    # bin to 1 Hz steps
    binned_freqs = list(range(1, 20))
    binned_psd = []
    for f in binned_freqs:
        idx = np.argmin(np.abs(freqs - f))
        binned_psd.append(float(np.log10(psd[idx] + 1e-12)))
    return binned_freqs, binned_psd


def analyze_movement(path: str) -> dict:
    """Full movement analysis for one wrist recording."""
    raw = load_timeseries(path)
    time_ms = (raw[:, 0] * 1000).tolist()
    acc = raw[:, 1:4]
    gyro = raw[:, 4:7]

    channels = {}
    for i, name in enumerate(["x", "y", "z"]):
        acc_data = acc[:, i].tolist()
        freqs, psd = compute_psd(acc[:, i])
        peak_idx = int(np.argmax(psd))
        channels[name] = {
            "acceleration": acc_data,
            "psd_frequencies": freqs,
            "psd_values": psd,
            "peak_frequency_hz": freqs[peak_idx],
            "peak_psd": psd[peak_idx],
            "std": float(np.std(acc[:, i])),
            "max_amplitude": float(np.max(np.abs(acc[:, i]))),
            "energy": float(np.sum(np.abs(acc[:, i]))),
        }

    # Combined tremor metrics (magnitude vector)
    magnitude = np.linalg.norm(acc, axis=1)
    freqs, psd = compute_psd(magnitude)
    peak_idx = int(np.argmax(psd))

    return {
        "time_ms": time_ms,
        "channels": channels,
        "tremor_frequency_hz": freqs[peak_idx],
        "tremor_amplitude_g": float(np.std(magnitude)),
        "max_amplitude_g": float(np.max(np.abs(magnitude))),
        "dominant_axis": max(channels, key=lambda k: channels[k]["std"]),
        "sample_count": len(time_ms),
    }


def score_task_severity(metrics: dict, task: str) -> str:
    """Heuristic severity based on PADS tremor characteristics (~4 Hz rest tremor)."""
    freq = metrics["tremor_frequency_hz"]
    amp = metrics["tremor_amplitude_g"]
    tremor_band = 3 <= freq <= 6

    if task in ("Relaxed", "RelaxedTask") and tremor_band and amp > 0.02:
        return "high" if amp > 0.05 else "moderate"
    if amp > 0.04:
        return "moderate"
    if amp > 0.015:
        return "mild"
    return "normal"

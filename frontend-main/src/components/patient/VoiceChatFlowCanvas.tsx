import { useEffect, useRef } from "react";

type FlowState = "" | "listening" | "speaking" | "thinking";

interface Props {
  state: FlowState;
  className?: string;
}

interface WaveConfig {
  count: number;
  amplitude: number;
  lineWidth: number;
  speed: number;
  step: number;
  spread: number;
  alpha: number;
}

function targetConfig(state: FlowState): WaveConfig {
  switch (state) {
    case "listening":
      return { count: 4, amplitude: 34, lineWidth: 2.2, speed: 1.1, step: 10, spread: 0.68, alpha: 0.62 };
    case "speaking":
      return { count: 3, amplitude: 26, lineWidth: 1.8, speed: 1.6, step: 9, spread: 0.5, alpha: 0.58 };
    case "thinking":
      return { count: 3, amplitude: 22, lineWidth: 1.4, speed: 0.75, step: 10, spread: 0.42, alpha: 0.48 };
    default:
      return { count: 3, amplitude: 20, lineWidth: 1, speed: 0.85, step: 11, spread: 0.32, alpha: 0.34 };
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothToward(current: WaveConfig, target: WaveConfig, dt: number): WaveConfig {
  const k = 1 - Math.pow(0.0008, dt);
  return {
    count: Math.round(lerp(current.count, target.count, k)),
    amplitude: lerp(current.amplitude, target.amplitude, k),
    lineWidth: lerp(current.lineWidth, target.lineWidth, k),
    speed: lerp(current.speed, target.speed, k),
    step: Math.round(lerp(current.step, target.step, k)),
    spread: lerp(current.spread, target.spread, k),
    alpha: lerp(current.alpha, target.alpha, k),
  };
}

function waveColor(state: FlowState, wave: number, alpha: number): string {
  if (state === "speaking") {
    const hues = ["244, 114, 182", "47, 148, 136", "236, 168, 214"];
    return `rgba(${hues[wave % hues.length]}, ${alpha})`;
  }
  if (state === "thinking") {
    return `rgba(${167 - wave * 8}, ${139 + wave * 4}, 250, ${alpha})`;
  }
  return `rgba(47, 148, 136, ${alpha - wave * 0.06})`;
}

/** Smooth flowing lines — delta-time animation with eased state transitions. */
export function VoiceChatFlowCanvas({ state, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationId = 0;
    let time = 0;
    let lastFrame = performance.now();
    let visible = true;
    let current = targetConfig("");
    let speakPulse = 1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) lastFrame = performance.now();
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const draw = (now: number) => {
      animationId = requestAnimationFrame(draw);
      if (!visible) return;

      const dt = Math.min((now - lastFrame) / 1000, 0.032);
      lastFrame = now;

      const flowState = stateRef.current;
      current = smoothToward(current, targetConfig(flowState), dt);
      time += current.speed * dt;

      if (flowState === "speaking") {
        speakPulse = 0.82 + Math.sin(time * 2.8) * 0.22;
      } else {
        speakPulse = lerp(speakPulse, 1, 1 - Math.pow(0.001, dt));
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const gap = height * (current.spread / Math.max(current.count - 1, 1));
      const originY = height * 0.5 - (gap * (current.count - 1)) / 2;
      const ampScale = flowState === "listening" ? 1.08 : speakPulse;

      for (let wave = 0; wave < current.count; wave++) {
        const baseY = originY + wave * gap;
        const amp = current.amplitude * ampScale * (flowState === "listening" ? 1 + wave * 0.04 : 1);
        ctx.strokeStyle = waveColor(flowState, wave, current.alpha);
        ctx.lineWidth = current.lineWidth;
        ctx.beginPath();

        for (let x = 0; x <= width; x += current.step) {
          const phase = x * 0.011 + time + wave * 0.5;
          const y =
            baseY
            + Math.sin(phase) * amp
            + Math.sin(phase * 1.85 + wave * 0.25) * (amp * 0.28);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      observer.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-full w-full"}
      aria-hidden
    />
  );
}

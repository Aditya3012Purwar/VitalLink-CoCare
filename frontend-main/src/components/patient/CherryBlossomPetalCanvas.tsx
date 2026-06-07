import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  intensity?: "calm" | "active";
}

interface Petal {
  x: number;
  y: number;
  size: number;
  rotation: number;
  spin: number;
  drift: number;
  speed: number;
  opacity: number;
  hue: number;
}

export function CherryBlossomPetalCanvas({ className, intensity = "calm" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const petals: Petal[] = [];
    const count = intensity === "active" ? 28 : 16;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (): Petal => ({
      x: Math.random() * canvas.offsetWidth,
      y: -12 - Math.random() * 40,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
      drift: (Math.random() - 0.5) * 0.35,
      speed: 0.35 + Math.random() * 0.55,
      opacity: 0.35 + Math.random() * 0.45,
      hue: Math.random() > 0.35 ? 330 : 0,
    });

    for (let i = 0; i < count; i++) {
      const p = spawn();
      p.y = Math.random() * canvas.offsetHeight;
      petals.push(p);
    }

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      const grad = ctx.createLinearGradient(-p.size, 0, p.size, 0);
      if (p.hue === 0) {
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(1, "rgba(255,241,242,0.5)");
      } else {
        grad.addColorStop(0, "rgba(252,231,243,0.95)");
        grad.addColorStop(0.5, "rgba(236,168,214,0.85)");
        grad.addColorStop(1, "rgba(244,114,182,0.55)");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.55);
      ctx.bezierCurveTo(p.size, -p.size * 0.2, p.size * 0.7, p.size * 0.5, 0, p.size * 0.65);
      ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.5, -p.size, -p.size * 0.2, 0, -p.size * 0.55);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const speedMul = intensity === "active" ? 1.65 : 1;

      for (const p of petals) {
        p.y += p.speed * speedMul;
        p.x += p.drift + Math.sin(p.y * 0.02) * 0.25;
        p.rotation += p.spin;
        if (p.y > h + 16) Object.assign(p, spawn());
        drawPetal(p);
      }

      animationId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={className ?? "h-full w-full"} aria-hidden />;
}

import React, { useRef, useEffect } from "react";

// Utility for random float in range
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

const COLORS = ["#4CAF50", "#FFD700", "#0f172a", "#fff"];

function drawStar(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(
      x + r * Math.cos(((18 + i * 72) * Math.PI) / 180),
      y - r * Math.sin(((18 + i * 72) * Math.PI) / 180)
    );
    ctx.lineTo(
      x + (r / 2) * Math.cos(((54 + i * 72) * Math.PI) / 180),
      y - (r / 2) * Math.sin(((54 + i * 72) * Math.PI) / 180)
    );
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

function drawHexagon(ctx, x, y, r, color, rotation, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(
      r * Math.cos((Math.PI / 3) * i),
      r * Math.sin((Math.PI / 3) * i)
    );
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.restore();
}

const IslamicAnimatedBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const stars = useRef([]);
  const hexes = useRef([]);

  // Responsive resize
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Initialize stars and hexes
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Stars
    stars.current = Array.from({ length: 32 }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(1.2, 2.8),
      color: COLORS[Math.floor(rand(0, 2))],
      alpha: rand(0.3, 0.7),
      speed: rand(0.02, 0.06),
      phase: rand(0, Math.PI * 2),
    }));
    // Hexagons
    hexes.current = Array.from({ length: 8 }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(32, 80),
      color: COLORS[Math.floor(rand(0, COLORS.length))],
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.003, 0.003),
      alpha: rand(0.08, 0.18),
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let lastW = canvas.width;
    let lastH = canvas.height;

    function animate() {
      if (canvas.width !== lastW || canvas.height !== lastH) {
        lastW = canvas.width;
        lastH = canvas.height;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw hexagons
      for (let hex of hexes.current) {
        drawHexagon(
          ctx,
          hex.x,
          hex.y,
          hex.r,
          hex.color,
          hex.rotation,
          hex.alpha
        );
        hex.rotation += hex.rotSpeed;
      }
      // Draw stars
      for (let star of stars.current) {
        let twinkle =
          0.2 * Math.sin(performance.now() * star.speed + star.phase);
        drawStar(
          ctx,
          star.x,
          star.y,
          star.r,
          star.color,
          Math.max(0, star.alpha + twinkle)
        );
      }
      animationRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none select-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
};

export default IslamicAnimatedBackground;

import { useEffect, useRef } from 'react';

export default function ClickSpark({
  sparkColor = 'var(--brand)',
  sparkSize = 5,
  sparkCount = 8,
  duration = 350,
  style = {},
  children
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId = null;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentDistance = spark.distance * ease;
        const x = spark.x + Math.cos(spark.angle) * currentDistance;
        const y = spark.y + Math.sin(spark.angle) * currentDistance;
        const alpha = 1 - ease;

        ctx.beginPath();
        ctx.arc(x, y, sparkSize * (1 - ease), 0, Math.PI * 2);
        ctx.fillStyle = sparkColor;
        ctx.globalAlpha = alpha;
        ctx.fill();

        return true;
      });

      if (sparksRef.current.length > 0) {
        animationId = requestAnimationFrame(updateAndDraw);
      } else {
        animationId = null;
      }
    };

    const handleClick = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const startTime = Date.now();

      const newSparks = Array.from({ length: sparkCount }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 20;
        return { x, y, angle, distance, startTime };
      });

      sparksRef.current = [...sparksRef.current, ...newSparks];

      if (!animationId) {
        animationId = requestAnimationFrame(updateAndDraw);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (container) {
        container.removeEventListener('click', handleClick);
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [sparkColor, sparkSize, sparkCount, duration]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
      {children}
    </div>
  );
}

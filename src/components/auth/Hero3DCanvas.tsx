import { useEffect, useRef } from 'react';

export function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // 3D Nodes & Rotating Polyhedron
    interface Node3D {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      vz: number;
    }

    const numNodes = 45;
    const nodes: Node3D[] = [];
    const colors = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#34d399'];

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        z: (Math.random() - 0.5) * 500,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
      });
    }

    let angleX = 0;
    let angleY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - width / 2) * 0.0005;
      mouseY = (e.clientY - rect.top - height / 2) * 0.0005;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const fov = 400;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angleX += 0.003 + mouseY;
      angleY += 0.004 + mouseX;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Project and sort points by Z for depth
      const projectedNodes = nodes.map((node) => {
        // Move nodes slightly
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        if (Math.abs(node.x) > 280) node.vx *= -1;
        if (Math.abs(node.y) > 280) node.vy *= -1;
        if (Math.abs(node.z) > 280) node.vz *= -1;

        // Rotate around Y then X
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        const scale = fov / (fov + z2 + 350);
        const projX = x1 * scale + width / 2;
        const projY = y2 * scale + height / 2;

        return {
          projX,
          projY,
          scale,
          z: z2,
          radius: node.radius * scale,
          color: node.color,
        };
      });

      // Draw connecting 3D wireframe edges
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p1 = projectedNodes[i];
          const p2 = projectedNodes[j];
          const dx = p1.projX - p2.projX;
          const dy = p1.projY - p2.projY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.25 * p1.scale;
            ctx.beginPath();
            ctx.moveTo(p1.projX, p1.projY);
            ctx.lineTo(p2.projX, p2.projY);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 1 * p1.scale;
            ctx.stroke();
          }
        }
      }

      // Draw Glowing Nodes
      projectedNodes.forEach((p) => {
        if (p.scale > 0) {
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, Math.max(1, p.radius), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12 * p.scale;
          ctx.fill();
        }
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

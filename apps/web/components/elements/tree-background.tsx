'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Branch {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  opacity: number;
  depth: number;
  growProgress: number;
  growSpeed: number;
  children: Branch[];
  angle: number;
  length: number;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  driftX: number;
  driftY: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  colorIndex: number;
  fallSpeed: number;
}

interface Firefly {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
  driftAngle: number;
  driftSpeed: number;
  driftRadius: number;
  originX: number;
  originY: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedY: number;
  life: number;
  maxLife: number;
}

interface ThemeColors {
  bg: string;
  branchColor: (opacity: number) => string;
  branchGlow: (opacity: number) => string;
  ambientGlow: string[];
  fireflyCore: (opacity: number) => string;
  fireflyGlow: (opacity: number) => string;
  leafColors: ((opacity: number) => string)[];
  particleColor: (opacity: number) => string;
  vignetteColor: string;
}

const darkColors: ThemeColors = {
  bg: '#0a0a0a',
  branchColor: (o) => `rgba(255, 255, 255, ${o})`,
  branchGlow: (o) => `rgba(74, 222, 128, ${o})`,
  ambientGlow: [
    'rgba(22, 101, 52, 0.04)',
    'rgba(22, 101, 52, 0.015)',
    'rgba(0, 0, 0, 0)',
  ],
  fireflyCore: (o) => `rgba(187, 247, 208, ${o})`,
  fireflyGlow: (o) => `rgba(74, 222, 128, ${o})`,
  leafColors: [
    (o) => `rgba(74, 222, 128, ${o})`,
    (o) => `rgba(34, 197, 94, ${o})`,
    (o) => `rgba(22, 163, 74, ${o})`,
    (o) => `rgba(134, 239, 172, ${o})`,
    (o) => `rgba(187, 247, 208, ${o})`,
  ],
  particleColor: (o) => `rgba(200, 200, 200, ${o})`,
  vignetteColor: 'rgba(0, 0, 0, 0.3)',
};

const lightColors: ThemeColors = {
  bg: '#f5f5f4',
  branchColor: (o) => `rgba(50, 40, 30, ${o * 1.8})`,
  branchGlow: (o) => `rgba(16, 120, 50, ${o * 1.5})`,
  ambientGlow: [
    'rgba(22, 130, 60, 0.06)',
    'rgba(22, 130, 60, 0.02)',
    'rgba(245, 245, 244, 0)',
  ],
  fireflyCore: (o) => `rgba(16, 120, 50, ${Math.min(1, o * 2)})`,
  fireflyGlow: (o) => `rgba(22, 130, 60, ${Math.min(1, o * 1.5)})`,
  leafColors: [
    (o) => `rgba(16, 120, 50, ${Math.min(1, o * 3.5)})`,
    (o) => `rgba(12, 95, 42, ${Math.min(1, o * 3.5)})`,
    (o) => `rgba(21, 128, 61, ${Math.min(1, o * 3)})`,
    (o) => `rgba(22, 163, 74, ${Math.min(1, o * 3)})`,
    (o) => `rgba(5, 102, 57, ${Math.min(1, o * 3.5)})`,
  ],
  particleColor: (o) => `rgba(16, 120, 50, ${Math.min(1, o * 2.5)})`,
  vignetteColor: 'rgba(245, 245, 244, 0.25)',
};

export function TreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const treeBranchesRef = useRef<Branch[]>([]);
  const leavesRef = useRef<Leaf[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const colorsRef = useRef<ThemeColors>(darkColors);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    colorsRef.current = resolvedTheme === 'light' ? lightColors : darkColors;
  }, [resolvedTheme]);

  const generateBranch = useCallback(
    (
      x: number,
      y: number,
      angle: number,
      length: number,
      thickness: number,
      depth: number,
      maxDepth: number
    ): Branch => {
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      const branch: Branch = {
        startX: x,
        startY: y,
        endX,
        endY,
        thickness,
        opacity: Math.max(0.08, 0.35 - depth * 0.03),
        depth,
        growProgress: 0,
        growSpeed: 0.008 + Math.random() * 0.006,
        children: [],
        angle,
        length,
      };

      if (depth < maxDepth) {
        const numChildren =
          depth < 3
            ? 2 + Math.floor(Math.random() * 2)
            : 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numChildren; i++) {
          const spread = 0.3 + Math.random() * 0.5;
          const childAngle =
            angle +
            (i === 0
              ? -spread
              : i === 1
              ? spread
              : (Math.random() - 0.5) * spread);
          const childLength = length * (0.6 + Math.random() * 0.2);
          const childThickness = thickness * 0.65;
          branch.children.push(
            generateBranch(
              endX,
              endY,
              childAngle,
              childLength,
              childThickness,
              depth + 1,
              maxDepth
            )
          );
        }
      }

      return branch;
    },
    []
  );

  const initializeElements = useCallback(
    (width: number, height: number) => {
      const trunkX = width * 0.5;
      const trunkY = height * 0.95;
      const trunkAngle = -Math.PI / 2;
      const trunkLength = height * 0.18;
      const maxDepth = 8;

      const trunk = generateBranch(
        trunkX,
        trunkY,
        trunkAngle,
        trunkLength,
        4,
        0,
        maxDepth
      );
      treeBranchesRef.current = [trunk];

      const leaves: Leaf[] = [];
      for (let i = 0; i < 35; i++) {
        leaves.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 6 + 3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          opacity: Math.random() * 0.3 + 0.08,
          driftX: (Math.random() - 0.5) * 0.4,
          driftY: Math.random() * 0.15 + 0.05,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.015 + 0.005,
          colorIndex: Math.floor(Math.random() * 5),
          fallSpeed: Math.random() * 0.3 + 0.1,
        });
      }
      leavesRef.current = leaves;

      const fireflies: Firefly[] = [];
      for (let i = 0; i < 25; i++) {
        const fx = Math.random() * width;
        const fy = Math.random() * height;
        fireflies.push({
          x: fx,
          y: fy,
          radius: Math.random() * 2 + 1,
          opacity: 0,
          pulseSpeed: Math.random() * 0.015 + 0.005,
          pulseOffset: Math.random() * Math.PI * 2,
          driftAngle: Math.random() * Math.PI * 2,
          driftSpeed: Math.random() * 0.003 + 0.001,
          driftRadius: Math.random() * 40 + 20,
          originX: fx,
          originY: fy,
        });
      }
      firefliesRef.current = fireflies;
      particlesRef.current = [];
    },
    [generateBranch]
  );

  const drawBranch = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      branch: Branch,
      time: number,
      colors: ThemeColors
    ) => {
      const effectiveProgress = Math.min(1, branch.growProgress);
      if (effectiveProgress <= 0) return;

      const sway =
        Math.sin(time * 0.001 + branch.depth * 0.5) * (branch.depth * 0.3);
      const currentEndX =
        branch.startX +
        (branch.endX - branch.startX) * effectiveProgress +
        sway;
      const currentEndY =
        branch.startY + (branch.endY - branch.startY) * effectiveProgress;

      const midX = (branch.startX + currentEndX) / 2 + sway * 0.5;
      const midY = (branch.startY + currentEndY) / 2;

      ctx.beginPath();
      ctx.moveTo(branch.startX, branch.startY);
      ctx.quadraticCurveTo(midX, midY, currentEndX, currentEndY);
      ctx.strokeStyle = colors.branchColor(branch.opacity * effectiveProgress);
      ctx.lineWidth = branch.thickness * effectiveProgress;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (branch.depth > 4 && effectiveProgress > 0.5) {
        ctx.beginPath();
        ctx.moveTo(branch.startX, branch.startY);
        ctx.quadraticCurveTo(midX, midY, currentEndX, currentEndY);
        ctx.strokeStyle = colors.branchGlow(
          branch.opacity * 0.15 * effectiveProgress
        );
        ctx.lineWidth = branch.thickness * effectiveProgress + 2;
        ctx.stroke();
      }

      if (effectiveProgress > 0.6) {
        branch.children.forEach((child) => {
          child.startX = currentEndX;
          child.startY = currentEndY;
          child.endX =
            currentEndX + Math.cos(child.angle + sway * 0.01) * child.length;
          child.endY = currentEndY + Math.sin(child.angle) * child.length;
          drawBranch(ctx, child, time, colors);
        });
      }
    },
    []
  );

  const growTree = useCallback((branch: Branch, dt: number) => {
    if (branch.growProgress < 1) {
      branch.growProgress = Math.min(
        1,
        branch.growProgress + branch.growSpeed * dt
      );
    }
    if (branch.growProgress > 0.6) {
      branch.children.forEach((child) => growTree(child, dt));
    }
  }, []);

  const drawLeaf = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.8, -size * 0.3, 0, size);
      ctx.quadraticCurveTo(-size * 0.8, -size * 0.3, 0, -size);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -size * 0.8);
      ctx.lineTo(0, size * 0.6);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeElements(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      timeRef.current += 1;
      const { width, height } = canvas;
      const time = timeRef.current;
      const colors = colorsRef.current;

      // Background fill
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // Ambient glow at bottom
      const ambientGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.85,
        0,
        width * 0.5,
        height * 0.85,
        height * 0.5
      );
      ambientGlow.addColorStop(0, colors.ambientGlow[0]);
      ambientGlow.addColorStop(0.5, colors.ambientGlow[1]);
      ambientGlow.addColorStop(1, colors.ambientGlow[2]);
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // Mouse parallax
      const mx = (mouseRef.current.x / width - 0.5) * 10;
      const my = (mouseRef.current.y / height - 0.5) * 10;

      // Grow and draw tree
      treeBranchesRef.current.forEach((trunk) => {
        growTree(trunk, 1);
        ctx.save();
        ctx.translate(mx * 0.3, my * 0.15);
        drawBranch(ctx, trunk, time, colors);
        ctx.restore();
      });

      // Fireflies
      firefliesRef.current.forEach((ff) => {
        ff.driftAngle += ff.driftSpeed;
        ff.x = ff.originX + Math.cos(ff.driftAngle) * ff.driftRadius;
        ff.y =
          ff.originY + Math.sin(ff.driftAngle * 0.7) * ff.driftRadius * 0.6;

        const pulse = Math.sin(time * ff.pulseSpeed + ff.pulseOffset);
        ff.opacity = Math.max(0, pulse * 0.5 + 0.1);

        if (ff.opacity > 0.02) {
          const px = ff.x + mx * 0.6;
          const py = ff.y + my * 0.6;

          const glow = ctx.createRadialGradient(
            px,
            py,
            0,
            px,
            py,
            ff.radius * 8
          );
          glow.addColorStop(0, colors.fireflyGlow(ff.opacity * 0.25));
          glow.addColorStop(0.4, colors.fireflyGlow(ff.opacity * 0.08));
          glow.addColorStop(1, colors.fireflyGlow(0));
          ctx.fillStyle = glow;
          ctx.fillRect(
            px - ff.radius * 8,
            py - ff.radius * 8,
            ff.radius * 16,
            ff.radius * 16
          );

          ctx.beginPath();
          ctx.arc(px, py, ff.radius, 0, Math.PI * 2);
          ctx.fillStyle = colors.fireflyCore(ff.opacity);
          ctx.fill();
        }
      });

      // Floating leaves
      leavesRef.current.forEach((leaf) => {
        leaf.rotation += leaf.rotationSpeed;
        const wobble =
          Math.sin(time * leaf.wobbleSpeed + leaf.wobbleOffset) * 1.5;
        leaf.x += leaf.driftX + wobble * 0.1;
        leaf.y += leaf.driftY + leaf.fallSpeed;

        if (leaf.y > height + 20) {
          leaf.y = -20;
          leaf.x = Math.random() * width;
        }
        if (leaf.x < -20) leaf.x = width + 20;
        if (leaf.x > width + 20) leaf.x = -20;

        const px = leaf.x + mx * 0.4;
        const py = leaf.y + my * 0.4;
        const leafColor = colors.leafColors[leaf.colorIndex](leaf.opacity);
        drawLeaf(ctx, px, py, leaf.size, leaf.rotation, leafColor);
      });

      // Rising particles (pollen/spores)
      if (Math.random() < 0.03) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height + 10,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.2 + 0.05,
          speedY: -(Math.random() * 0.5 + 0.2),
          life: 0,
          maxLife: Math.random() * 400 + 200,
        });
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        p.y += p.speedY;
        p.x += Math.sin(time * 0.01 + p.x * 0.005) * 0.3;

        const fadeIn = Math.min(1, p.life / 60);
        const fadeOut = Math.max(
          0,
          1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3)
        );
        const currentOpacity =
          p.opacity * fadeIn * (p.life > p.maxLife * 0.7 ? fadeOut : 1);

        if (currentOpacity > 0.01) {
          const px = p.x + mx * 0.5;
          const py = p.y + my * 0.5;

          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = colors.particleColor(currentOpacity);
          ctx.fill();
        }

        return p.life < p.maxLife;
      });

      // Subtle vignette
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.3,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, colors.vignetteColor);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initializeElements, drawBranch, growTree, drawLeaf]);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 h-full w-full'
      style={{ zIndex: 0 }}
      aria-hidden='true'
    />
  );
}

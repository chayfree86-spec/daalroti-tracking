import { useEffect, useRef } from 'react';

/**
 * Ultra-Visible Interactive Culinary Steam & Smoke Ribbon Engine
 * High-visibility culinary steam and swirling aromatic smoke curls that actively follow the mouse.
 */
export const SteamBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Only run on desktop/large screens (>= 768px)
    if (typeof window === 'undefined' || window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates and high-density trail buffer
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      vx: 0,
      vy: 0,
      isMoving: false,
      speed: 0
    };

    let prevPos = { x: width / 2, y: height / 2 };
    const mouseTrail = []; // Active mouse position history for smooth flowing ribbon
    const activePuffs = []; // Billowing smoke clouds spawned by mouse

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isMoving = true;

      const dx = e.clientX - prevPos.x;
      const dy = e.clientY - prevPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouse.speed = Math.min(dist, 60);

      // Add to mouse trail (Subtle and minimal)
      mouseTrail.unshift({ x: e.clientX, y: e.clientY, age: 0, size: 15 + Math.min(dist * 0.4, 20) });
      if (mouseTrail.length > 15) mouseTrail.pop();

      // Spawn occasional subtle soft smoke puffs on cursor path
      if (dist > 12 && activePuffs.length < 20 && Math.random() > 0.4) {
        activePuffs.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          radius: 18 + Math.random() * 15,
          maxRadius: 50 + Math.random() * 30,
          growth: 0.6 + Math.random() * 0.6,
          alpha: 0.08 + Math.random() * 0.05, // Very soft & non-distracting
          decay: 0.005 + Math.random() * 0.004,
          vx: (dx * 0.03) + (Math.random() - 0.5) * 0.8,
          vy: (dy * 0.03) - (0.6 + Math.random() * 0.6),
          angle: Math.random() * Math.PI * 2,
          angularVelocity: (Math.random() - 0.5) * 0.02,
          color: '245, 158, 11' // Warm Amber
        });
      }

      prevPos = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Minimal Subtle Ambient Steam Columns (6 soft gentle wisps)
    const ambientCount = 6;
    class SteamColumn {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + Math.random() * 40;
        this.radius = 60 + Math.random() * 70;
        this.maxRadius = this.radius * (1.4 + Math.random() * 0.4);
        this.alpha = 0;
        this.maxAlpha = 0.04 + Math.random() * 0.03; // Gentle, elegant background warmth
        this.vy = -0.4 - Math.random() * 0.6;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.004;
        this.curlPhase = Math.random() * 100;
        this.curlSpeed = 0.01 + Math.random() * 0.015;

        const warmTones = [
          '245, 158, 11',  // Amber
          '251, 191, 36'   // Soft Gold
        ];
        this.color = warmTones[Math.floor(Math.random() * warmTones.length)];
      }

      update() {
        this.curlPhase += this.curlSpeed;
        this.x += this.vx + Math.sin(this.curlPhase) * 0.8;
        this.y += this.vy;
        this.angle += this.angularVelocity;

        if (this.radius < this.maxRadius) {
          this.radius += 0.15;
        }

        // Calculate opacity based on altitude
        const lifeFraction = (height - this.y) / height;
        if (lifeFraction < 0.15) {
          this.alpha = (lifeFraction / 0.15) * this.maxAlpha;
        } else if (lifeFraction > 0.85) {
          this.alpha = ((1 - lifeFraction) / 0.15) * this.maxAlpha;
        } else {
          this.alpha = this.maxAlpha;
        }

        // Gentle attraction towards cursor
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influenceRadius = 240;

        if (dist < influenceRadius && dist > 10) {
          const force = (1 - dist / influenceRadius);
          const angle = Math.atan2(dy, dx);
          this.x += Math.cos(angle) * force * 1.2;
          this.y += Math.sin(angle) * force * 0.8;
        }

        if (this.y < -this.radius || this.x < -this.radius || this.x > width + this.radius || this.alpha <= 0) {
          this.reset();
        }
      }

      draw() {
        if (this.alpha <= 0.002) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, `rgba(${this.color}, ${this.alpha * 1.1})`);
        gradient.addColorStop(0.5, `rgba(${this.color}, ${this.alpha * 0.6})`);
        gradient.addColorStop(0.8, `rgba(${this.color}, ${this.alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    const ambientSteam = Array.from({ length: ambientCount }, () => new SteamColumn());

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Mouse Smooth Spring Physics
      const damp = 0.12;
      mouse.vx = (mouse.targetX - mouse.x) * damp;
      mouse.vy = (mouse.targetY - mouse.y) * damp;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;
      mouse.speed *= 0.92;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle warm ambient glow following cursor
      const spotGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 10,
        mouse.x, mouse.y, 280
      );
      spotGrad.addColorStop(0, 'rgba(251, 191, 36, 0.035)');
      spotGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.01)');
      spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Gentle Ambient Steam Wisps
      ambientSteam.forEach((p) => {
        p.update();
        p.draw();
      });

      // 3. Draw Subtle Mouse Trail
      if (mouseTrail.length > 2) {
        ctx.save();
        for (let i = 0; i < mouseTrail.length - 1; i++) {
          const pt = mouseTrail[i];
          const nextPt = mouseTrail[i + 1];
          pt.age += 1;

          const progress = 1 - (i / mouseTrail.length);
          const ribbonAlpha = progress * 0.04;

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(nextPt.x, nextPt.y);
          ctx.strokeStyle = `rgba(245, 158, 11, ${ribbonAlpha})`;
          ctx.lineWidth = pt.size * progress;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Draw Soft Micro Puffs
      for (let i = activePuffs.length - 1; i >= 0; i--) {
        const puff = activePuffs[i];
        puff.x += puff.vx;
        puff.y += puff.vy;
        puff.radius += puff.growth;
        puff.alpha -= puff.decay;
        puff.angle += puff.angularVelocity;

        if (puff.alpha <= 0 || puff.radius >= puff.maxRadius) {
          activePuffs.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(puff.x, puff.y);
        ctx.rotate(puff.angle);

        const puffGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, puff.radius);
        puffGrad.addColorStop(0, `rgba(${puff.color}, ${puff.alpha * 1.1})`);
        puffGrad.addColorStop(0.5, `rgba(${puff.color}, ${puff.alpha * 0.5})`);
        puffGrad.addColorStop(1, `rgba(${puff.color}, 0)`);

        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, puff.radius, puff.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isRunning = true;
        render();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 hidden md:block overflow-hidden"
      style={{
        width: '100vw',
        height: '100vh',
        opacity: 0.7
      }}
    />
  );
};

export default SteamBackground;

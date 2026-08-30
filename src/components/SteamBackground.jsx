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

      // Add to mouse trail
      mouseTrail.unshift({ x: e.clientX, y: e.clientY, age: 0, size: 25 + Math.min(dist * 0.8, 40) });
      if (mouseTrail.length > 25) mouseTrail.pop();

      // Spawn vibrant billowing smoke puffs directly on cursor path
      const spawnCount = Math.min(Math.ceil(dist / 8), 4);
      for (let i = 0; i < spawnCount; i++) {
        if (activePuffs.length < 80) {
          activePuffs.push({
            x: e.clientX + (Math.random() - 0.5) * 24,
            y: e.clientY + (Math.random() - 0.5) * 24,
            radius: 25 + Math.random() * 30,
            maxRadius: 90 + Math.random() * 70,
            growth: 1.2 + Math.random() * 1.4,
            alpha: 0.45 + Math.random() * 0.25, // BOLD & CLEARLY VISIBLE
            decay: 0.008 + Math.random() * 0.006,
            vx: (dx * 0.06) + (Math.random() - 0.5) * 1.5,
            vy: (dy * 0.06) - (1.0 + Math.random() * 1.2), // Rising steam speed
            angle: Math.random() * Math.PI * 2,
            angularVelocity: (Math.random() - 0.5) * 0.04,
            color: Math.random() > 0.35 ? '245, 158, 11' : '234, 88, 12' // Warm Amber & Spice Gold
          });
        }
      }

      prevPos = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Full-Width Rising Ambient Steam Columns (28 prominent steam wisps)
    const ambientCount = 30;
    class SteamColumn {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + Math.random() * 60;
        this.radius = 80 + Math.random() * 120;
        this.maxRadius = this.radius * (1.7 + Math.random() * 0.6);
        this.alpha = 0;
        this.maxAlpha = 0.22 + Math.random() * 0.16; // Bold, unmistakable visibility
        this.vy = -0.7 - Math.random() * 1.1;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.008;
        this.curlPhase = Math.random() * 100;
        this.curlSpeed = 0.015 + Math.random() * 0.02;

        const warmTones = [
          '245, 158, 11',  // Amber
          '251, 191, 36',  // Bright Gold
          '217, 119, 6',   // Rich Spice
          '253, 186, 116'  // Warm Peach Cream
        ];
        this.color = warmTones[Math.floor(Math.random() * warmTones.length)];
      }

      update() {
        this.curlPhase += this.curlSpeed;
        this.x += this.vx + Math.sin(this.curlPhase) * 1.2;
        this.y += this.vy;
        this.angle += this.angularVelocity;

        if (this.radius < this.maxRadius) {
          this.radius += 0.25;
        }

        // Calculate opacity based on altitude
        const lifeFraction = (height - this.y) / height;
        if (lifeFraction < 0.12) {
          this.alpha = (lifeFraction / 0.12) * this.maxAlpha;
        } else if (lifeFraction > 0.85) {
          this.alpha = ((1 - lifeFraction) / 0.15) * this.maxAlpha;
        } else {
          this.alpha = this.maxAlpha;
        }

        // Magnetic Attraction & Swirl towards Mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influenceRadius = 320;

        if (dist < influenceRadius && dist > 10) {
          const force = (1 - dist / influenceRadius);
          const angle = Math.atan2(dy, dx);
          const tangentAngle = angle + Math.PI / 2;

          // Pull towards mouse + swirl around cursor
          this.x += Math.cos(angle) * force * 3.2 + Math.cos(tangentAngle) * force * (mouse.speed * 0.12 + 1.8);
          this.y += Math.sin(angle) * force * 2.0 + Math.sin(tangentAngle) * force * (mouse.speed * 0.12 + 1.8) - force * 1.5;
          this.angle += force * 0.04;
        }

        if (this.y < -this.radius || this.x < -this.radius || this.x > width + this.radius || this.alpha <= 0) {
          this.reset();
        }
      }

      draw() {
        if (this.alpha <= 0.005) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, `rgba(${this.color}, ${this.alpha * 1.4})`);
        gradient.addColorStop(0.4, `rgba(${this.color}, ${this.alpha * 0.85})`);
        gradient.addColorStop(0.75, `rgba(${this.color}, ${this.alpha * 0.3})`);
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
      const damp = 0.15;
      mouse.vx = (mouse.targetX - mouse.x) * damp;
      mouse.vy = (mouse.targetY - mouse.y) * damp;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;
      mouse.speed *= 0.93;

      ctx.clearRect(0, 0, width, height);

      // 1. Prominent Warm Golden Radial Spotlight following cursor
      const spotGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 20,
        mouse.x, mouse.y, 420
      );
      spotGrad.addColorStop(0, 'rgba(251, 191, 36, 0.16)'); // Bold and warm
      spotGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.08)');
      spotGrad.addColorStop(0.8, 'rgba(217, 119, 6, 0.025)');
      spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Full-Width Rising Steam Columns (Swirling towards mouse)
      ambientSteam.forEach((p) => {
        p.update();
        p.draw();
      });

      // 3. Draw Active Mouse Smoke Trail Ribbons
      if (mouseTrail.length > 2) {
        ctx.save();
        for (let i = 0; i < mouseTrail.length - 1; i++) {
          const pt = mouseTrail[i];
          const nextPt = mouseTrail[i + 1];
          pt.age += 1;

          const progress = 1 - (i / mouseTrail.length);
          const ribbonAlpha = progress * 0.28;

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

      // 4. Draw Billowing Mouse Smoke Puffs
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
        puffGrad.addColorStop(0, `rgba(${puff.color}, ${puff.alpha * 1.5})`);
        puffGrad.addColorStop(0.4, `rgba(${puff.color}, ${puff.alpha * 0.9})`);
        puffGrad.addColorStop(0.75, `rgba(${puff.color}, ${puff.alpha * 0.3})`);
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
        opacity: 1
      }}
    />
  );
};

export default SteamBackground;

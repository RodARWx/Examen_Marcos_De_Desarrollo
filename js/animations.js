/* ============================================
   ANIMATIONS — Transitions, confetti, helpers
   ============================================ */

/**
 * Transition content area with a fade effect.
 */
export function transitionTo(container, renderFn) {
  container.style.opacity = '0';
  container.style.transform = 'translateY(8px)';
  setTimeout(() => {
    renderFn();
    container.style.transition = 'opacity .35s ease, transform .35s ease';
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  }, 150);
}

/**
 * Quick pulse animation on an element.
 */
export function pulse(el) {
  el.style.transition = 'transform .15s ease';
  el.style.transform = 'scale(1.05)';
  setTimeout(() => { el.style.transform = 'scale(1)'; }, 150);
}

/**
 * Canvas confetti (simple, no lib).
 */
export function confetti(container) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  const colors = ['#6C5CE7','#00B894','#FDCB6E','#E17055','#0984E3','#D63031','#00CEC9'];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 8,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 150;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rot += p.vr;
      if (frame > maxFrames * 0.6) p.opacity -= 0.02;
    }

    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(draw);
}

/**
 * Animate a number counting up.
 */
export function countUp(el, target, duration = 800) {
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/**
 * Animate progress bar width.
 */
export function animateProgressBar(el, targetPercent, duration = 800) {
  el.style.width = '0%';
  requestAnimationFrame(() => {
    el.style.transition = `width ${duration}ms cubic-bezier(.4,0,.2,1)`;
    el.style.width = `${targetPercent}%`;
  });
}

// Animated starfield canvas background
(function() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height, stars, scrollY = 0;
  const STAR_COUNT = 400;
  const LAYERS = 3;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = Math.floor(Math.random() * LAYERS);
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 3, // spread across 3x viewport for scroll
        radius: (0.3 + Math.random() * 1.2) * (1 + layer * 0.3),
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: layer
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      // Parallax offset based on scroll
      const parallax = 0.05 + star.layer * 0.1;
      const y = ((star.y - scrollY * parallax) % (height * 3) + height * 3) % (height * 3) - height;

      if (y < -10 || y > height + 10) continue;

      // Twinkle
      const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.alpha * (0.6 + 0.4 * twinkle);

      ctx.beginPath();
      ctx.arc(star.x, y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.fill();

      // Subtle glow for brighter stars
      if (star.radius > 1) {
        ctx.beginPath();
        ctx.arc(star.x, y, star.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${alpha * 0.15})`;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  function onScroll() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  }

  resize();
  createStars();
  window.addEventListener('resize', () => { resize(); createStars(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(draw);
})();

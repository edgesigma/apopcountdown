// Scroll reveal + lazy viewer loading
(function () {
  // Reveal on scroll
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // Lazy load orbital viewer
  let loaded = false;
  const vc = document.getElementById('viewer-container');
  if (vc) {
    const vObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !loaded) {
          loaded = true;
          loadViewer();
          vObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '300px 0px' });
    vObs.observe(vc);
  }

  function loadViewer() {
    // Three.js already loaded globally
    var v = '?v=5';
    loadScript('./viewer/constants.js' + v, () =>
      loadScript('./viewer/lighting.js' + v, () =>
        loadScript('./viewer/asteroid.js' + v, () =>
          loadScript('./viewer/earth.js' + v, () =>
            loadScript('./viewer/orbit.js' + v, () =>
              loadScript('./viewer/controls.js' + v, () =>
                loadScript('./viewer/viewer.js' + v)))))));
  }

  function loadScript(src, cb) {
    const s = document.createElement('script');
    s.src = src;
    if (cb) s.onload = cb;
    document.head.appendChild(s);
  }
})();

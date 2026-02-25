// Hero 3D asteroid — smooth, cinematic, high-detail
(function () {
  const canvas = document.getElementById('hero-asteroid');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 4.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // ── Lighting — key light from behind so the camera-facing surface is in shadow ──
  // Sun behind and below — lights the edges, camera side stays dark
  const key = new THREE.DirectionalLight(0xffeedd, 3.0);
  key.position.set(-3, -2, -5);
  scene.add(key);

  // Faint fill from below-right — just enough to hint at surface detail
  const fill = new THREE.DirectionalLight(0x223355, 0.12);
  fill.position.set(3, -3, -2);
  scene.add(fill);

  // Rim light from behind-left — defines the silhouette edge
  const rim = new THREE.DirectionalLight(0xe8a849, 0.8);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // Very low ambient — the front face should be mostly dark
  scene.add(new THREE.AmbientLight(0x111122, 0.05));

  // ── Asteroid ──
  let asteroid;
  try {
    asteroid = buildAsteroid();
    scene.add(asteroid);
  } catch (err) {
    console.error('buildAsteroid failed:', err);
    // Fallback: plain sphere so something renders
    asteroid = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 })
    );
    scene.add(asteroid);
  }

  // ── Drag to rotate the asteroid (not the camera) ──
  // Camera stays fixed, light stays fixed, the rock turns under them.
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let dragVelX = 0, dragVelY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    dragVelX = 0;
    dragVelY = 0;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    dragVelX = dx * 0.005;
    dragVelY = dy * 0.005;
    asteroid.rotation.y += dragVelX;
    asteroid.rotation.x += dragVelY;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  canvas.addEventListener('pointerup', () => { isDragging = false; });
  canvas.addEventListener('pointercancel', () => { isDragging = false; });

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
      // Auto-rotate when not dragging
      asteroid.rotation.y += 0.0012;
      // Dampen residual drag velocity
      dragVelX *= 0.95;
      dragVelY *= 0.95;
      asteroid.rotation.y += dragVelX;
      asteroid.rotation.x += dragVelY;
    }

    renderer.render(scene, camera);
  }
  animate();

  // ── Build smooth high-detail bilobed asteroid ──
  function buildAsteroid() {
    const geo = new THREE.IcosahedronGeometry(1, 6);
    const pos = geo.attributes.position;

    // Quintic-interpolated value noise — inherently smooth, no post-processing needed
    function hash(x, y, z) {
      const h = Math.sin(x * 374761.393 + y * 668265.263 + z * 127412.617) * 43758.5453;
      return h - Math.floor(h);
    }

    function smoothNoise(x, y, z) {
      const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
      const fx = x - ix, fy = y - iy, fz = z - iz;
      // Quintic interpolation — C2 continuous, no visible facet edges
      const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
      const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);

      const v000 = hash(ix, iy, iz),     v100 = hash(ix+1, iy, iz);
      const v010 = hash(ix, iy+1, iz),   v110 = hash(ix+1, iy+1, iz);
      const v001 = hash(ix, iy, iz+1),   v101 = hash(ix+1, iy, iz+1);
      const v011 = hash(ix, iy+1, iz+1), v111 = hash(ix+1, iy+1, iz+1);

      return (
        v000*(1-ux)*(1-uy)*(1-uz) + v100*ux*(1-uy)*(1-uz) +
        v010*(1-ux)*uy*(1-uz)     + v110*ux*uy*(1-uz) +
        v001*(1-ux)*(1-uy)*uz     + v101*ux*(1-uy)*uz +
        v011*(1-ux)*uy*uz         + v111*ux*uy*uz
      );
    }

    // Low-frequency FBM — fewer octaves, gentler falloff = smoother surface
    function fbm(x, y, z, octaves) {
      let val = 0, amp = 1, freq = 1, total = 0;
      for (let i = 0; i < octaves; i++) {
        val += amp * (smoothNoise(x * freq, y * freq, z * freq) - 0.5);
        total += amp;
        amp *= 0.45;
        freq *= 1.9;
      }
      return val / total;
    }

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);

      // Elongate
      x *= 2.3;

      // Bilobed pinch
      const along = x / 2.3;
      const pinch = 1.0 - 0.38 * Math.exp(-along * along * 12);
      y *= pinch;
      z *= pinch;

      // Asymmetric lobes
      if (x > 0) { y *= 1.08; z *= 1.08; }

      // Displacement — low frequencies only, smooth variation
      const broad  = fbm(x*0.5 + 1.3, y*0.5 + 2.1, z*0.5 + 0.7, 4) * 0.15;
      const medium = fbm(x*1.2 + 5.5, y*1.2 + 3.3, z*1.2 + 7.1, 3) * 0.06;
      const fine   = fbm(x*2.5 + 11,  y*2.5 + 13,  z*2.5 + 17,  2) * 0.025;

      const disp = broad + medium + fine;
      const len = Math.sqrt(x*x + y*y + z*z) || 1;
      x += (x / len) * disp;
      y += (y / len) * disp;
      z += (z / len) * disp;

      pos.setXYZ(i, x, y, z);
    }

    geo.computeVertexNormals();

    // Vertex colors
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n1 = smoothNoise(x*2 + 1, y*2 + 2, z*2 + 3);
      const n2 = smoothNoise(x*4 + 10, y*4 + 20, z*4 + 30);

      colors[i*3]     = 0.32 + n1 * 0.1  + n2 * 0.04;
      colors[i*3 + 1] = 0.27 + n1 * 0.07 + n2 * 0.03;
      colors[i*3 + 2] = 0.22 + n1 * 0.04 + n2 * 0.02;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: false
    }));
  }
})();

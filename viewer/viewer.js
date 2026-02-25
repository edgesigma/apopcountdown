// Main Three.js scene bootstrap and render loop
(function() {
  const container = document.getElementById('viewer-container');
  const loadingEl = document.getElementById('viewer-loading');
  if (!container || typeof THREE === 'undefined') return;

  // ── Scene setup ──
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ViewerConstants.BG_COLOR);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.001,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // ── Controls ──
  const controls = ViewerControls.setup(camera, renderer.domElement);

  // ── Lighting ──
  const lights = ViewerLighting.setup(scene);

  // ── State ──
  let currentMode = 'orbital';
  let orbitData = null;
  let orbitalGroup = new THREE.Group();
  let closeGroup = new THREE.Group();
  let asteroidMesh = null;

  scene.add(orbitalGroup);
  scene.add(closeGroup);
  closeGroup.visible = false;

  // ── HTML overlay labels ──
  const labelOverlay = document.createElement('div');
  labelOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:hidden;';
  container.appendChild(labelOverlay);

  // Track label positions for projection
  const labels = {};

  function createLabel(name, text, color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position:absolute; font-family:'JetBrains Mono',monospace; font-size:0.7rem;
      color:${color}; background:rgba(10,10,15,0.75); padding:2px 8px; border-radius:4px;
      border:1px solid ${color}33; white-space:nowrap; transform:translate(-50%,-100%);
      letter-spacing:0.05em; text-transform:uppercase; pointer-events:none;
    `;
    labelOverlay.appendChild(el);
    labels[name] = { el, position: new THREE.Vector3() };
    return labels[name];
  }

  // Create orbital view labels
  createLabel('sun', 'Sun', '#ffdd44');
  createLabel('earth', 'Earth', '#4488ff');
  createLabel('apophis', 'Apophis', '#ff6e40');

  // Create close approach labels
  createLabel('earth-close', 'Earth', '#4488ff');
  createLabel('apophis-close', 'Apophis', '#ff6e40');
  createLabel('geo-ring', 'Geostationary orbit', '#44ff88');

  function updateLabels() {
    const w = container.clientWidth;
    const h = container.clientHeight;

    for (const [name, label] of Object.entries(labels)) {
      // Determine visibility based on mode
      const isOrbital = ['sun', 'earth', 'apophis'].includes(name);
      const isClose = ['earth-close', 'apophis-close', 'geo-ring'].includes(name);
      if ((currentMode === 'orbital' && !isOrbital) || (currentMode === 'approach' && !isClose)) {
        label.el.style.display = 'none';
        continue;
      }

      // Project 3D position to screen
      const projected = label.position.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;

      // Behind camera or off screen
      if (projected.z > 1 || x < -50 || x > w + 50 || y < -50 || y > h + 50) {
        label.el.style.display = 'none';
        continue;
      }

      label.el.style.display = 'block';
      label.el.style.left = x + 'px';
      label.el.style.top = (y - 8) + 'px';
    }
  }

  // ── Build orbital view ──
  function buildOrbitalView(data) {
    while (orbitalGroup.children.length) orbitalGroup.remove(orbitalGroup.children[0]);

    // Sun at origin
    orbitalGroup.add(ViewerOrbit.createSun());
    labels.sun.position.set(0, 0.06, 0);

    // Earth orbit line
    if (data.earth.path) {
      const earthOrbit = ViewerOrbit.createOrbitLine(data.earth.path, ViewerConstants.ORBIT_EARTH_COLOR, 0.4);
      orbitalGroup.add(earthOrbit);
    }

    // Apophis orbit line
    if (data.apophis.path) {
      const apophisOrbit = ViewerOrbit.createOrbitLine(data.apophis.path, ViewerConstants.ORBIT_APOPHIS_COLOR, 0.6);
      orbitalGroup.add(apophisOrbit);
    }

    // Earth position marker
    if (data.earth.currentPosition) {
      const earthMarker = ViewerEarth.createOrbital();
      const ep = data.earth.currentPosition;
      earthMarker.position.set(ep.x, ep.z, -ep.y);
      orbitalGroup.add(earthMarker);
      labels.earth.position.copy(earthMarker.position).add(new THREE.Vector3(0, 0.04, 0));
    }

    // Apophis position marker
    if (data.apophis.currentPosition) {
      asteroidMesh = ViewerAsteroid.create(ViewerConstants.APOPHIS_RADIUS_ORBITAL, 3);
      const ap = data.apophis.currentPosition;
      asteroidMesh.position.set(ap.x, ap.z, -ap.y);
      orbitalGroup.add(asteroidMesh);
      labels.apophis.position.copy(asteroidMesh.position).add(new THREE.Vector3(0, 0.03, 0));

      const glow = ViewerAsteroid.createGlowSprite(ViewerConstants.APOPHIS_RADIUS_ORBITAL);
      asteroidMesh.add(glow);
    }

    // Ecliptic grid
    const gridHelper = new THREE.GridHelper(4, 20, ViewerConstants.GRID_COLOR, ViewerConstants.GRID_COLOR);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.1;
    orbitalGroup.add(gridHelper);
  }

  // ── Build close approach view ──
  function buildCloseView(data) {
    while (closeGroup.children.length) closeGroup.remove(closeGroup.children[0]);

    // Earth at center
    const earth = ViewerEarth.createCloseApproach();
    closeGroup.add(earth);
    const earthR = ViewerConstants.EARTH_RADIUS_KM / ViewerConstants.CLOSE_SCALE;
    labels['earth-close'].position.set(0, earthR + 0.15, 0);

    // Geostationary ring
    const geoRing = ViewerEarth.createGeoRing();
    closeGroup.add(geoRing);
    const geoR = (ViewerConstants.EARTH_RADIUS_KM + ViewerConstants.GEO_ALTITUDE_KM) / ViewerConstants.CLOSE_SCALE;
    labels['geo-ring'].position.set(geoR, 0.05, 0);

    // Flyby path
    if (data.closeApproach && data.closeApproach.length) {
      const flybyPath = ViewerOrbit.createCloseApproachPath(data.closeApproach);
      if (flybyPath) closeGroup.add(flybyPath);

      // Find closest point
      let minDist = Infinity;
      let closestPoint = null;
      data.closeApproach.forEach(p => {
        if (p.distance_km < minDist) { minDist = p.distance_km; closestPoint = p; }
      });

      if (closestPoint) {
        const scale = ViewerConstants.CLOSE_SCALE;
        const cx = closestPoint.geocentric[0] * ViewerConstants.AU_KM / scale;
        const cy = closestPoint.geocentric[2] * ViewerConstants.AU_KM / scale;
        const cz = -closestPoint.geocentric[1] * ViewerConstants.AU_KM / scale;

        const marker = ViewerOrbit.createPositionMarker({ x: cx, y: cy, z: cz }, ViewerConstants.APOPHIS_COLOR, ViewerConstants.APOPHIS_CLOSE_SIZE);
        marker.position.set(cx, cy, cz);
        closeGroup.add(marker);
        labels['apophis-close'].position.set(cx, cy + 0.15, cz);
      }
    }

    // Distance rings
    addDistanceRing(closeGroup, earthR, 0x4488ff);
    addDistanceRing(closeGroup, geoR, 0x44ff88);
  }

  function addDistanceRing(group, radius, color) {
    const geometry = new THREE.RingGeometry(radius - 0.001, radius + 0.001, 64);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
  }

  // ── Mode switching ──
  function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-orbital').classList.toggle('active', mode === 'orbital');
    document.getElementById('btn-approach').classList.toggle('active', mode === 'approach');

    if (mode === 'orbital') {
      orbitalGroup.visible = true;
      closeGroup.visible = false;
      ViewerControls.animateTo(controls, camera, { x: 0, y: 0, z: 0 }, { x: 1.5, y: 1.5, z: 1.5 });
      controls.minDistance = 0.5;
      controls.maxDistance = 10;
    } else {
      orbitalGroup.visible = false;
      closeGroup.visible = true;
      ViewerControls.animateTo(controls, camera, { x: 0, y: 0, z: 0 }, { x: 5, y: 3, z: 5 });
      controls.minDistance = 1;
      controls.maxDistance = 20;
    }
  }

  document.getElementById('btn-orbital').addEventListener('click', () => setMode('orbital'));
  document.getElementById('btn-approach').addEventListener('click', () => setMode('approach'));

  // ── Load data and build scene ──
  async function init() {
    try {
      const data = await ApophisAPI.orbit();
      orbitData = data;
      buildOrbitalView(data);
      buildCloseView(data);
    } catch (err) {
      console.warn('Failed to load orbit data, using empty scene:', err);
      orbitalGroup.add(ViewerOrbit.createSun());
    }

    camera.position.set(1.5, 1.5, 1.5);
    controls.target.set(0, 0, 0);
    controls.update();

    if (loadingEl) loadingEl.style.display = 'none';
    updateInfo();
  }

  function updateInfo() {
    if (!orbitData) return;
    const distEl = document.getElementById('viewer-distance');
    const speedEl = document.getElementById('viewer-speed');

    if (distEl && orbitData.apophis && orbitData.earth) {
      const ap = orbitData.apophis.currentPosition;
      const ep = orbitData.earth.currentPosition;
      if (ap && ep) {
        const dx = ap.x - ep.x, dy = ap.y - ep.y, dz = ap.z - ep.z;
        const distKm = Math.sqrt(dx * dx + dy * dy + dz * dz) * 149597870.7;
        distEl.textContent = distKm > 1e6 ? (distKm / 1e6).toFixed(2) + ' M km' : Math.round(distKm).toLocaleString() + ' km';
      }
    }
    if (speedEl) speedEl.textContent = '30.73 km/s';
  }

  // ── Render loop ──
  function animate() {
    requestAnimationFrame(animate);

    if (asteroidMesh) {
      asteroidMesh.rotation.x += asteroidMesh.userData.rotationSpeed.x;
      asteroidMesh.rotation.y += asteroidMesh.userData.rotationSpeed.y;
      asteroidMesh.rotation.z += asteroidMesh.userData.rotationSpeed.z;
    }

    controls.update();
    renderer.render(scene, camera);
    updateLabels();
  }

  function onResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  init();
  animate();
})();

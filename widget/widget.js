// Widget-specific Three.js initialization
(function() {
  const ARRIVAL_TIME = new Date('2029-04-13T21:46:00Z').getTime();
  const AU_KM = 149597870.7;

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  let currentMode = params.get('mode') || 'orbital';

  // ── Countdown ──
  function updateCountdown() {
    let diff = ARRIVAL_TIME - Date.now();
    if (diff < 0) diff = -diff;
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const y = Math.floor(d / 365.25);
    const rd = Math.floor(d - y * 365.25);
    document.getElementById('w-years').textContent = y;
    document.getElementById('w-days').textContent = String(rd).padStart(3, '0');
    document.getElementById('w-hours').textContent = String(h % 24).padStart(2, '0');
    document.getElementById('w-minutes').textContent = String(m % 60).padStart(2, '0');
    document.getElementById('w-seconds').textContent = String(s % 60).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ── Three.js Setup ──
  const container = document.getElementById('widget-viewer');
  if (!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.001, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;

  // Lights
  scene.add(new THREE.PointLight(0xffffff, 1.5, 100));
  scene.add(new THREE.AmbientLight(0x334466, 0.4));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 3, 5);
  scene.add(dirLight);

  // Groups
  const orbitalGroup = new THREE.Group();
  const closeGroup = new THREE.Group();
  scene.add(orbitalGroup);
  scene.add(closeGroup);
  closeGroup.visible = currentMode === 'approach';
  orbitalGroup.visible = currentMode === 'orbital';

  // ── Build scenes from API data ──
  async function init() {
    let data;
    try {
      const res = await fetch('../api/orbit.json');
      data = await res.json();
    } catch {
      data = null;
    }

    // Orbital view
    buildOrbitalView(data);
    await buildCloseView();

    // Initial camera
    if (currentMode === 'orbital') {
      camera.position.set(1.5, 1.5, 1.5);
    } else {
      camera.position.set(5, 3, 5);
    }
    controls.update();

    document.getElementById('widget-loading').style.display = 'none';

    // Update distance
    if (data && data.apophis && data.earth) {
      const ap = data.apophis.currentPosition;
      const ep = data.earth.currentPosition;
      if (ap && ep) {
        const dist = Math.sqrt((ap.x - ep.x) ** 2 + (ap.y - ep.y) ** 2 + (ap.z - ep.z) ** 2) * AU_KM;
        document.getElementById('w-distance').textContent =
          dist > 1e6 ? (dist / 1e6).toFixed(1) + 'M km' : Math.round(dist).toLocaleString() + ' km';
      }
    }
  }

  function buildOrbitalView(data) {
    // Sun
    const sunGeo = new THREE.SphereGeometry(0.04, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
    orbitalGroup.add(new THREE.Mesh(sunGeo, sunMat));

    if (!data) return;

    // Orbit lines
    if (data.earth && data.earth.path) {
      const pts = data.earth.path.map(p => new THREE.Vector3(p[0], p[2], -p[1]));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      orbitalGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.4 })));
    }
    if (data.apophis && data.apophis.path) {
      const pts = data.apophis.path.map(p => new THREE.Vector3(p[0], p[2], -p[1]));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      orbitalGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff6e40, transparent: true, opacity: 0.6 })));
    }

    // Position markers
    if (data.earth && data.earth.currentPosition) {
      const ep = data.earth.currentPosition;
      const earthGeo = new THREE.SphereGeometry(0.015, 16, 16);
      const earthMesh = new THREE.Mesh(earthGeo, new THREE.MeshStandardMaterial({ color: 0x4488ff }));
      earthMesh.position.set(ep.x, ep.z, -ep.y);
      orbitalGroup.add(earthMesh);
    }
    if (data.apophis && data.apophis.currentPosition) {
      const ap = data.apophis.currentPosition;
      const aGeo = new THREE.IcosahedronGeometry(0.008, 2);
      const aMesh = new THREE.Mesh(aGeo, new THREE.MeshStandardMaterial({ color: 0xff6e40, roughness: 0.8, flatShading: true }));
      aMesh.position.set(ap.x, ap.z, -ap.y);
      orbitalGroup.add(aMesh);
    }
  }

  async function buildCloseView() {
    const SCALE = 10000;
    const earthR = 6371 / SCALE;

    // Earth
    const earthGeo = new THREE.SphereGeometry(earthR, 64, 32);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.7 });
    closeGroup.add(new THREE.Mesh(earthGeo, earthMat));

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(earthR * 1.06, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.1, side: THREE.BackSide });
    closeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Geo ring — visible torus
    const geoR = (6371 + 35786) / SCALE;
    const ringGeo = new THREE.TorusGeometry(geoR, 0.01, 8, 128);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    closeGroup.add(ring);

    // Load real JPL close approach data
    try {
      const res = await fetch('../api/close-approach.json');
      const caData = await res.json();
      const trajectory = caData.trajectory;

      const pts = trajectory.map(p => new THREE.Vector3(
        p.x_km / SCALE,
        p.z_km / SCALE,
        -p.y_km / SCALE
      ));

      // Tube ribbon instead of thin line
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.02, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0xff6e40,
        transparent: true,
        opacity: 0.6
      });
      closeGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      // Closest approach marker
      let minDist = Infinity, closestPt = null;
      trajectory.forEach(p => {
        if (p.distance_km < minDist) {
          minDist = p.distance_km;
          closestPt = new THREE.Vector3(p.x_km / SCALE, p.z_km / SCALE, -p.y_km / SCALE);
        }
      });
      if (closestPt) {
        const markerGeo = new THREE.SphereGeometry(0.04, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff6e40 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(closestPt);
        closeGroup.add(marker);
      }
    } catch (err) {
      console.warn('Widget: failed to load close approach data:', err);
    }

    // Prevent zooming through Earth
    controls.minDistance = earthR + 0.1;
    controls.maxDistance = 25;
  }

  // ── Mode toggle ──
  function setMode(mode) {
    currentMode = mode;
    orbitalGroup.visible = mode === 'orbital';
    closeGroup.visible = mode === 'approach';
    document.getElementById('w-btn-orbital').classList.toggle('active', mode === 'orbital');
    document.getElementById('w-btn-approach').classList.toggle('active', mode === 'approach');

    if (mode === 'orbital') {
      camera.position.set(1.5, 1.5, 1.5);
    } else {
      camera.position.set(5, 3, 5);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  }

  document.getElementById('w-btn-orbital').addEventListener('click', () => setMode('orbital'));
  document.getElementById('w-btn-approach').addEventListener('click', () => setMode('approach'));

  // Set initial mode from URL param
  if (currentMode === 'approach') {
    setMode('approach');
  }

  // ── Render loop ──
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  init();
  animate();
})();

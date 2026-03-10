// Main Three.js scene bootstrap and render loop
(function() {
  var container = document.getElementById('viewer-container');
  var loadingEl = document.getElementById('viewer-loading');
  if (!container || typeof THREE === 'undefined') return;

  // ── Scene setup ──
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(ViewerConstants.BG_COLOR);

  var camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.001,
    1000
  );

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // ── Controls ──
  var controls = ViewerControls.setup(camera, renderer.domElement);

  // ── Lighting ──
  var lights = ViewerLighting.setup(scene);

  // ── State ──
  var currentMode = 'approach';
  var orbitData = null;
  var closeApproachData = null;
  var orbitalGroup = new THREE.Group();
  var closeGroup = new THREE.Group();
  var asteroidMesh = null;
  var ribbonArrowUniforms = null;

  scene.add(orbitalGroup);
  scene.add(closeGroup);
  orbitalGroup.visible = false;
  closeGroup.visible = true;

  // ── HTML overlay labels ──
  var labelOverlay = document.createElement('div');
  labelOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:hidden;';
  container.appendChild(labelOverlay);

  var labels = {};

  function createLabel(name, text, color, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.textContent = text;
    var fontSize = opts.large ? '0.8rem' : '0.65rem';
    var padding = opts.large ? '3px 10px' : '2px 8px';
    el.style.cssText =
      'position:absolute; font-family:"IBM Plex Mono","JetBrains Mono",monospace; font-size:' + fontSize + ';' +
      'color:' + color + '; background:rgba(10,10,15,0.8); padding:' + padding + '; border-radius:3px;' +
      'border:1px solid ' + color + '44; white-space:nowrap; transform:translate(-50%,-100%);' +
      'letter-spacing:0.06em; text-transform:uppercase; pointer-events:none;';
    if (opts.dim) el.style.opacity = '0.6';
    labelOverlay.appendChild(el);
    labels[name] = { el: el, position: new THREE.Vector3(), mode: opts.mode || 'both' };
    return labels[name];
  }

  // Orbital view labels
  createLabel('sun', 'Sun', '#ffdd44', { mode: 'orbital' });
  createLabel('earth', 'Earth', '#4488ff', { mode: 'orbital' });
  createLabel('apophis', 'Apophis', '#ff6e40', { mode: 'orbital' });

  // Close approach labels
  createLabel('earth-close', 'Earth', '#4488ff', { mode: 'approach', large: true });
  createLabel('apophis-close', 'Apophis — closest approach', '#ff6e40', { mode: 'approach', large: true });
  createLabel('geo-ring', 'GEO 35,786 km', '#44ff88', { mode: 'approach', dim: true });
  createLabel('approach-start', 'Approach', '#ff6e40', { mode: 'approach', dim: true });
  createLabel('approach-end', 'Departure', '#ff6e40', { mode: 'approach', dim: true });
  createLabel('moon', 'Moon — 406,000 km', '#aaaabb', { mode: 'approach' });
  createLabel('moon-orbit', 'Lunar orbit', '#aaaabb', { mode: 'approach', dim: true });

  function updateLabels() {
    var w = container.clientWidth;
    var h = container.clientHeight;

    for (var name in labels) {
      var label = labels[name];
      if ((currentMode === 'orbital' && label.mode === 'approach') ||
          (currentMode === 'approach' && label.mode === 'orbital')) {
        label.el.style.display = 'none';
        continue;
      }

      var projected = label.position.clone().project(camera);
      var x = (projected.x * 0.5 + 0.5) * w;
      var y = (-projected.y * 0.5 + 0.5) * h;

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

    orbitalGroup.add(ViewerOrbit.createSun());
    labels.sun.position.set(0, 0.06, 0);

    if (data.earth.path) {
      orbitalGroup.add(ViewerOrbit.createOrbitLine(data.earth.path, ViewerConstants.ORBIT_EARTH_COLOR, 0.4));
    }
    if (data.apophis.path) {
      orbitalGroup.add(ViewerOrbit.createOrbitLine(data.apophis.path, ViewerConstants.ORBIT_APOPHIS_COLOR, 0.6));
    }
    if (data.earth.currentPosition) {
      var earthMarker = ViewerEarth.createOrbital();
      var ep = data.earth.currentPosition;
      earthMarker.position.set(ep.x, ep.z, -ep.y);
      orbitalGroup.add(earthMarker);
      labels.earth.position.copy(earthMarker.position).add(new THREE.Vector3(0, 0.04, 0));
    }
    if (data.apophis.currentPosition) {
      asteroidMesh = ViewerAsteroid.create(ViewerConstants.APOPHIS_RADIUS_ORBITAL, 3);
      var ap = data.apophis.currentPosition;
      asteroidMesh.position.set(ap.x, ap.z, -ap.y);
      orbitalGroup.add(asteroidMesh);
      labels.apophis.position.copy(asteroidMesh.position).add(new THREE.Vector3(0, 0.03, 0));

      var glow = ViewerAsteroid.createGlowSprite(ViewerConstants.APOPHIS_RADIUS_ORBITAL);
      asteroidMesh.add(glow);
    }

    var gridHelper = new THREE.GridHelper(4, 20, ViewerConstants.GRID_COLOR, ViewerConstants.GRID_COLOR);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.1;
    orbitalGroup.add(gridHelper);
  }

  // ── Build close approach view ──
  function buildCloseView(trajectory) {
    while (closeGroup.children.length) closeGroup.remove(closeGroup.children[0]);

    var scale = ViewerConstants.CLOSE_SCALE;
    var earthR = ViewerConstants.EARTH_RADIUS_KM / scale;

    // Earth
    var earth = ViewerEarth.createCloseApproach();
    closeGroup.add(earth);
    labels['earth-close'].position.set(0, earthR + 0.12, 0);

    // Geostationary ring
    var geoRing = ViewerEarth.createGeoRing();
    closeGroup.add(geoRing);
    var geoR = (ViewerConstants.EARTH_RADIUS_KM + ViewerConstants.GEO_ALTITUDE_KM) / scale;
    labels['geo-ring'].position.set(geoR + 0.15, 0.08, 0);

    // Convert trajectory to scene coordinates
    var points = [];
    var distances = [];
    var minDist = Infinity;
    var closestIdx = 0;

    for (var i = 0; i < trajectory.length; i++) {
      var p = trajectory[i];
      // JPL Horizons ecliptic coordinates (km) to Three.js (Y-up)
      var x = p.x_km / scale;
      var y = p.z_km / scale;
      var z = -p.y_km / scale;
      points.push(new THREE.Vector3(x, y, z));
      distances.push(p.distance_km);
      if (p.distance_km < minDist) {
        minDist = p.distance_km;
        closestIdx = i;
      }
    }

    // ── Ribbon trajectory ──
    var ribbon = createTrajectoryRibbon(points, distances, minDist);
    closeGroup.add(ribbon.mesh);
    ribbonArrowUniforms = ribbon.uniforms;

    // ── Closest approach marker ──
    var cp = points[closestIdx];
    var markerGroup = new THREE.Group();
    markerGroup.position.copy(cp);

    // Pulsing sphere
    var markerGeo = new THREE.SphereGeometry(0.06, 16, 16);
    var markerMat = new THREE.MeshBasicMaterial({ color: ViewerConstants.APOPHIS_COLOR });
    markerGroup.add(new THREE.Mesh(markerGeo, markerMat));

    // Glow
    var glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    var gctx = glowCanvas.getContext('2d');
    var grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,110,64,0.9)');
    grad.addColorStop(0.4, 'rgba(255,110,64,0.3)');
    grad.addColorStop(1, 'rgba(255,110,64,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    var glowTex = new THREE.CanvasTexture(glowCanvas);
    var glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, blending: THREE.AdditiveBlending
    }));
    glowSprite.scale.set(0.5, 0.5, 1);
    markerGroup.add(glowSprite);

    closeGroup.add(markerGroup);
    labels['apophis-close'].position.set(cp.x, cp.y + 0.18, cp.z);

    // ── Dashed line from Earth to closest point ──
    var dashGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), cp
    ]);
    var dashMat = new THREE.LineDashedMaterial({
      color: 0xff6e40,
      dashSize: 0.1,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.4
    });
    var dashLine = new THREE.Line(dashGeo, dashMat);
    dashLine.computeLineDistances();
    closeGroup.add(dashLine);

    // ── Distance annotation at midpoint ──
    var midLabel = document.createElement('div');
    midLabel.textContent = Math.round(minDist - ViewerConstants.EARTH_RADIUS_KM).toLocaleString() + ' km from surface';
    midLabel.style.cssText =
      'position:absolute; font-family:"IBM Plex Mono",monospace; font-size:0.6rem;' +
      'color:#ff6e40; background:rgba(10,10,15,0.85); padding:2px 8px; border-radius:3px;' +
      'border:1px solid #ff6e4044; white-space:nowrap; transform:translate(-50%,-50%);' +
      'letter-spacing:0.05em; pointer-events:none; opacity:0.8;';
    labelOverlay.appendChild(midLabel);
    var midPos = new THREE.Vector3().lerpVectors(new THREE.Vector3(0,0,0), cp, 0.5);
    labels['dist-annotation'] = { el: midLabel, position: midPos, mode: 'approach' };

    // Start/end labels
    labels['approach-start'].position.copy(points[0]).add(new THREE.Vector3(0, 0.12, 0));
    labels['approach-end'].position.copy(points[points.length - 1]).add(new THREE.Vector3(0, 0.12, 0));

    // ── Moon (actual position at 2029-04-13 ~21:46 UTC from JPL Horizons) ──
    var moonKm = { x: 370317.4, y: 163839.6, z: 33982.08 }; // ecliptic geocentric km
    var moonPos = new THREE.Vector3(moonKm.x / scale, moonKm.z / scale, -moonKm.y / scale);
    var moonDistKm = 406366;
    var moonOrbitR = moonDistKm / scale; // ~40.6 units

    // Moon sphere — proportionally sized (radius 1,737 km)
    var moonRadius = 1737 / scale; // 0.17 units
    var moonGeo = new THREE.SphereGeometry(moonRadius, 32, 32);
    var moonMat = new THREE.MeshStandardMaterial({
      color: 0xbbbbcc,
      roughness: 0.9,
      metalness: 0.0
    });
    var moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.copy(moonPos);
    closeGroup.add(moonMesh);

    // Subtle glow around the moon
    var moonGlowGeo = new THREE.SphereGeometry(moonRadius * 1.3, 16, 16);
    var moonGlowMat = new THREE.MeshBasicMaterial({
      color: 0xaaaacc,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    var moonGlow = new THREE.Mesh(moonGlowGeo, moonGlowMat);
    moonMesh.add(moonGlow);

    labels['moon'].position.copy(moonPos).add(new THREE.Vector3(0, moonRadius + 0.25, 0));

    // Lunar orbit ring — dashed circle at Moon's distance
    var moonOrbitSegs = 256;
    var moonOrbitPts = [];
    for (var mi = 0; mi <= moonOrbitSegs; mi++) {
      var angle = (mi / moonOrbitSegs) * Math.PI * 2;
      moonOrbitPts.push(new THREE.Vector3(
        Math.cos(angle) * moonOrbitR,
        0,
        Math.sin(angle) * moonOrbitR
      ));
    }
    var moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPts);
    var moonOrbitMat = new THREE.LineDashedMaterial({
      color: 0x666677,
      dashSize: 1.5,
      gapSize: 0.8,
      transparent: true,
      opacity: 0.25
    });
    var moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
    moonOrbitLine.computeLineDistances();
    closeGroup.add(moonOrbitLine);

    // Label at the top of the orbit ring
    labels['moon-orbit'].position.set(0, 0.1, -moonOrbitR);

    // Ecliptic grid (subtle)
    var gridHelper = new THREE.GridHelper(100, 50, 0x222244, 0x222244);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.04;
    closeGroup.add(gridHelper);
  }

  // ── Ribbon trajectory with animated arrows ──
  function createTrajectoryRibbon(points, distances, minDist) {
    // Build a tube geometry along the path — acts as a ribbon
    var curve = new THREE.CatmullRomCurve3(points);
    var numSegments = 256;
    var tubeRadius = 0.03;

    var tubeGeo = new THREE.TubeGeometry(curve, numSegments, tubeRadius, 8, false);

    // Custom shader for animated directional arrows
    var uniforms = {
      time: { value: 0 },
      minDist: { value: minDist },
      totalLength: { value: curve.getLength() },
      color1: { value: new THREE.Color(0xff6e40) },  // Apophis orange
      color2: { value: new THREE.Color(0xffaa44) },   // Warm highlight at closest
    };

    var ribbonMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vPosition;',
        'void main() {',
        '  vUv = uv;',
        '  vPosition = position;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float time;',
        'uniform vec3 color1;',
        'uniform vec3 color2;',
        'varying vec2 vUv;',
        'varying vec3 vPosition;',
        '',
        'void main() {',
        '  float t = vUv.x;', // 0..1 along the tube
        '',
        '  // Color: orange, brightening near closest approach (center)',
        '  float closeness = 1.0 - abs(t - 0.5) * 2.0;',
        '  closeness = pow(closeness, 3.0);',
        '  vec3 col = mix(color1, color2, closeness * 0.6);',
        '',
        '  // Animated arrows — chevron pattern moving along the tube',
        '  float arrowScale = 40.0;',
        '  float speed = 0.5;',
        '  float pattern = fract(t * arrowScale - time * speed);',
        '',
        '  // Triangle wave for arrow shape',
        '  float arrow = 1.0 - abs(pattern - 0.5) * 2.0;',
        '  arrow = smoothstep(0.0, 0.7, arrow);',
        '',
        '  // Edge glow — brighter at edges of the tube cross-section',
        '  float edgeDist = abs(vUv.y - 0.5) * 2.0;',
        '  float edge = smoothstep(0.3, 1.0, edgeDist);',
        '',
        '  // Combine: base ribbon + arrow pattern + edge glow',
        '  float alpha = 0.3 + arrow * 0.5 + closeness * 0.2;',
        '  col += vec3(0.2, 0.1, 0.0) * edge * 0.5;',
        '',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n'),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var mesh = new THREE.Mesh(tubeGeo, ribbonMat);
    return { mesh: mesh, uniforms: uniforms };
  }

  // ── Mode switching ──
  function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-orbital').classList.toggle('active', mode === 'orbital');
    document.getElementById('btn-approach').classList.toggle('active', mode === 'approach');

    if (mode === 'orbital') {
      orbitalGroup.visible = true;
      closeGroup.visible = false;
      controls.minDistance = 0.5;
      controls.maxDistance = 10;
      controls.enablePan = true;
      ViewerControls.animateTo(controls, camera, { x: 0, y: 0, z: 0 }, { x: 1.5, y: 1.5, z: 1.5 });
    } else {
      orbitalGroup.visible = false;
      closeGroup.visible = true;
      // Prevent zooming through Earth: min distance = Earth radius + buffer
      var earthR = ViewerConstants.EARTH_RADIUS_KM / ViewerConstants.CLOSE_SCALE;
      controls.minDistance = earthR + 0.15;
      controls.maxDistance = 80; // Far enough to see Moon's orbit
      controls.enablePan = true;
      ViewerControls.animateTo(controls, camera, { x: 0, y: 0, z: 0 }, { x: 5, y: 3, z: 5 });
    }
  }

  document.getElementById('btn-orbital').addEventListener('click', function() { setMode('orbital'); });
  document.getElementById('btn-approach').addEventListener('click', function() { setMode('approach'); });

  // ── Scroll-triggered intro animation ──
  var introPlayed = false;

  function setupScrollTrigger() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !introPlayed) {
          introPlayed = true;
          playIntroZoom();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    observer.observe(container);
  }

  function playIntroZoom() {
    // Start camera close to Earth, looking at the flyby
    var earthR = ViewerConstants.EARTH_RADIUS_KM / ViewerConstants.CLOSE_SCALE;
    var startPos = new THREE.Vector3(1.2, 0.6, 1.2);
    var endPos = new THREE.Vector3(5, 3, 5);
    var target = new THREE.Vector3(0, 0, 0);

    camera.position.copy(startPos);
    controls.target.copy(target);
    controls.update();

    ViewerControls.animateTo(controls, camera, target, { x: endPos.x, y: endPos.y, z: endPos.z }, 2500);
  }

  // ── Load data and build scene ──
  async function init() {
    try {
      // Load orbit data for orbital view
      var data = await ApophisAPI.orbit();
      orbitData = data;
      buildOrbitalView(data);
    } catch (err) {
      console.warn('Failed to load orbit data:', err);
      orbitalGroup.add(ViewerOrbit.createSun());
    }

    try {
      // Load real JPL Horizons close approach data
      var caResp = await fetch('./api/close-approach.json');
      if (!caResp.ok) throw new Error('Failed to load close-approach.json');
      var caData = await caResp.json();
      closeApproachData = caData.trajectory;
      buildCloseView(caData.trajectory);
    } catch (err) {
      console.warn('Failed to load close approach data:', err);
    }

    // Start with approach view — camera positioned close, waiting for scroll trigger
    var earthR = ViewerConstants.EARTH_RADIUS_KM / ViewerConstants.CLOSE_SCALE;
    controls.minDistance = earthR + 0.15;
    controls.maxDistance = 80;
    camera.position.set(1.2, 0.6, 1.2);
    controls.target.set(0, 0, 0);
    controls.update();

    if (loadingEl) loadingEl.style.display = 'none';
    updateInfo();

    // Set up scroll-triggered zoom-out
    setupScrollTrigger();
  }

  function updateInfo() {
    if (!orbitData) return;
    var distEl = document.getElementById('viewer-distance');
    var speedEl = document.getElementById('viewer-speed');

    if (distEl && orbitData.apophis && orbitData.earth) {
      var ap = orbitData.apophis.currentPosition;
      var ep = orbitData.earth.currentPosition;
      if (ap && ep) {
        var dx = ap.x - ep.x, dy = ap.y - ep.y, dz = ap.z - ep.z;
        var distKm = Math.sqrt(dx * dx + dy * dy + dz * dz) * 149597870.7;
        distEl.textContent = distKm > 1e6 ? (distKm / 1e6).toFixed(2) + ' M km' : Math.round(distKm).toLocaleString() + ' km';
      }
    }
    if (speedEl) speedEl.textContent = '30.73 km/s';
  }

  // ── Render loop ──
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var elapsed = clock.getElapsedTime();

    if (asteroidMesh && asteroidMesh.userData.rotationSpeed) {
      asteroidMesh.rotation.x += asteroidMesh.userData.rotationSpeed.x;
      asteroidMesh.rotation.y += asteroidMesh.userData.rotationSpeed.y;
      asteroidMesh.rotation.z += asteroidMesh.userData.rotationSpeed.z;
    }

    // Animate ribbon arrows
    if (ribbonArrowUniforms && currentMode === 'approach') {
      ribbonArrowUniforms.time.value = elapsed;
    }

    controls.update();
    renderer.render(scene, camera);
    updateLabels();
  }

  function onResize() {
    var width = container.clientWidth;
    var height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  init();
  animate();
})();

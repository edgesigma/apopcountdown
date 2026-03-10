// Earth sphere creation
const ViewerEarth = {
  createOrbital(radius) {
    radius = radius || ViewerConstants.EARTH_RADIUS_ORBITAL;

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: ViewerConstants.EARTH_COLOR,
      roughness: 0.7,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'earth';

    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(radius * 1.15, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: ViewerConstants.EARTH_ATMOSPHERE,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    return mesh;
  },

  createCloseApproach() {
    var earthRadius = ViewerConstants.EARTH_RADIUS_KM / ViewerConstants.CLOSE_SCALE;

    var geometry = new THREE.SphereGeometry(earthRadius, 128, 64);

    // Procedural Earth texture — high res canvas
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');

    // Ocean base — deep blue gradient
    var oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0c2a5a');
    oceanGrad.addColorStop(0.3, '#1a3d7a');
    oceanGrad.addColorStop(0.5, '#1e4488');
    oceanGrad.addColorStop(0.7, '#1a3d7a');
    oceanGrad.addColorStop(1, '#0c2a5a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Ice caps
    ctx.fillStyle = '#d8dce8';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillRect(0, 482, 1024, 30);
    // Softer edges
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ctx.fillRect(0, 30, 1024, 15);
    ctx.fillRect(0, 467, 1024, 15);

    // Landmass color palette
    var landColors = ['#1a5c1a', '#2a6e2a', '#3a7e3a', '#2d6b2d', '#4a7a3a'];
    var desertColors = ['#9a8a5a', '#a89860', '#8a7a50'];

    // Draw continents with multiple overlapping shapes for realism
    function drawLand(shapes, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      shapes.forEach(function(s) {
        ctx.moveTo(s[0], s[1]);
        // Simple polygon from points
        if (s.length > 4) {
          for (var i = 2; i < s.length; i += 2) {
            ctx.lineTo(s[i], s[i+1]);
          }
        } else {
          ctx.ellipse(s[0], s[1], s[2], s[3], 0, 0, Math.PI * 2);
        }
      });
      ctx.fill();
    }

    // North America
    drawContinent(ctx, [
      { x: 120, y: 100, rx: 55, ry: 35, color: '#2a6e2a' },
      { x: 140, y: 130, rx: 40, ry: 30, color: '#3a7e3a' },
      { x: 155, y: 160, rx: 25, ry: 20, color: '#2d6b2d' },
      { x: 100, y: 110, rx: 30, ry: 25, color: '#1a5c1a' },
      // Great Lakes region
      { x: 165, y: 115, rx: 15, ry: 10, color: '#1a3d7a' },
    ]);
    // Central America
    drawContinent(ctx, [
      { x: 145, y: 185, rx: 12, ry: 18, color: '#2a6e2a' },
    ]);

    // South America
    drawContinent(ctx, [
      { x: 185, y: 230, rx: 30, ry: 25, color: '#1a6e1a' },
      { x: 195, y: 270, rx: 35, ry: 40, color: '#2a7e2a' },
      { x: 190, y: 320, rx: 25, ry: 35, color: '#3a7e3a' },
      { x: 180, y: 360, rx: 15, ry: 25, color: '#2d6b2d' },
    ]);

    // Europe
    drawContinent(ctx, [
      { x: 490, y: 100, rx: 30, ry: 15, color: '#2a6e2a' },
      { x: 510, y: 115, rx: 20, ry: 12, color: '#3a7e3a' },
      { x: 475, y: 110, rx: 15, ry: 20, color: '#2d6b2d' },
      // Scandinavia
      { x: 505, y: 80, rx: 10, ry: 20, color: '#1a5c1a' },
      // UK/Ireland
      { x: 470, y: 98, rx: 6, ry: 10, color: '#2a6e2a' },
    ]);

    // Africa
    drawContinent(ctx, [
      { x: 510, y: 170, rx: 35, ry: 20, color: '#8a7a50' },
      { x: 520, y: 210, rx: 40, ry: 35, color: '#9a8a5a' },
      { x: 530, y: 260, rx: 35, ry: 40, color: '#2a6e2a' },
      { x: 525, y: 310, rx: 25, ry: 30, color: '#3a7e3a' },
      { x: 535, y: 345, rx: 15, ry: 15, color: '#2d6b2d' },
      // Madagascar
      { x: 570, y: 320, rx: 5, ry: 15, color: '#2a6e2a' },
    ]);

    // Asia
    drawContinent(ctx, [
      { x: 580, y: 100, rx: 50, ry: 20, color: '#2d6b2d' },
      { x: 640, y: 110, rx: 60, ry: 30, color: '#3a7e3a' },
      { x: 700, y: 90, rx: 50, ry: 25, color: '#1a5c1a' },
      { x: 720, y: 130, rx: 40, ry: 25, color: '#2a6e2a' },
      // India
      { x: 620, y: 180, rx: 18, ry: 30, color: '#3a7e3a' },
      // Middle East
      { x: 560, y: 155, rx: 25, ry: 15, color: '#9a8a5a' },
      // Southeast Asia
      { x: 700, y: 170, rx: 20, ry: 15, color: '#2a6e2a' },
      // Siberia
      { x: 700, y: 65, rx: 80, ry: 18, color: '#2d6b2d' },
    ]);

    // Japan / Korea
    drawContinent(ctx, [
      { x: 755, y: 120, rx: 5, ry: 15, color: '#2a6e2a' },
      { x: 745, y: 130, rx: 4, ry: 8, color: '#3a7e3a' },
    ]);

    // Indonesia / Philippines
    drawContinent(ctx, [
      { x: 710, y: 215, rx: 30, ry: 6, color: '#2a6e2a' },
      { x: 730, y: 200, rx: 5, ry: 10, color: '#3a7e3a' },
      { x: 750, y: 210, rx: 8, ry: 5, color: '#2d6b2d' },
    ]);

    // Australia
    drawContinent(ctx, [
      { x: 780, y: 310, rx: 40, ry: 25, color: '#9a8a5a' },
      { x: 770, y: 300, rx: 30, ry: 20, color: '#a89860' },
      { x: 795, y: 320, rx: 20, ry: 15, color: '#8a7a50' },
      // New Zealand
      { x: 850, y: 345, rx: 4, ry: 12, color: '#2a6e2a' },
    ]);

    // Greenland
    drawContinent(ctx, [
      { x: 310, y: 60, rx: 25, ry: 18, color: '#c8d0e0' },
    ]);

    // Antarctica
    drawContinent(ctx, [
      { x: 512, y: 490, rx: 200, ry: 20, color: '#d0d8e8' },
    ]);

    // Cloud layer — subtle white wisps
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    for (var c = 0; c < 40; c++) {
      var cx = (Math.sin(c * 17.3) * 0.5 + 0.5) * 1024;
      var cy = 60 + (Math.sin(c * 23.7) * 0.5 + 0.5) * 380;
      var crx = 20 + Math.abs(Math.sin(c * 7.1)) * 60;
      var cry = 5 + Math.abs(Math.sin(c * 11.3)) * 15;
      ctx.beginPath();
      ctx.ellipse(cx, cy, crx, cry, Math.sin(c) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;

    var material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.75,
      metalness: 0.05,
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'earth-close';
    mesh.rotation.y = -Math.PI / 2;

    // Atmosphere — visible blue halo
    var atmosGeometry = new THREE.SphereGeometry(earthRadius * 1.04, 128, 64);
    var atmosMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x4488ff) },
        viewVector: { value: new THREE.Vector3(0, 0, 1) }
      },
      vertexShader: [
        'varying float intensity;',
        'void main() {',
        '  vec3 vNormal = normalize(normalMatrix * normal);',
        '  vec3 vNormel = normalize(normalMatrix * vec3(0,0,1));',
        '  intensity = pow(0.65 - dot(vNormal, vNormel), 2.0);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 glowColor;',
        'varying float intensity;',
        'void main() {',
        '  gl_FragColor = vec4(glowColor, 1.0) * intensity;',
        '}'
      ].join('\n'),
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    var atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
    mesh.add(atmosphere);

    // Second atmosphere layer — outer glow, wider
    var outerAtmos = new THREE.SphereGeometry(earthRadius * 1.08, 64, 32);
    var outerMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    mesh.add(new THREE.Mesh(outerAtmos, outerMat));

    return mesh;
  },

  createGeoRing() {
    var geoRadius = (ViewerConstants.EARTH_RADIUS_KM + ViewerConstants.GEO_ALTITUDE_KM) / ViewerConstants.CLOSE_SCALE;
    var ringWidth = 0.015; // Visible thickness

    // Dashed ring using a torus
    var geometry = new THREE.TorusGeometry(geoRadius, ringWidth, 8, 128);
    var material = new THREE.MeshBasicMaterial({
      color: ViewerConstants.GEOSTATIONARY_COLOR,
      transparent: true,
      opacity: 0.35,
    });

    var ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.name = 'geo-ring';

    // Add tick marks at cardinal points
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var tickGeo = new THREE.BoxGeometry(0.005, ringWidth * 4, 0.04);
      var tickMat = new THREE.MeshBasicMaterial({
        color: ViewerConstants.GEOSTATIONARY_COLOR,
        transparent: true,
        opacity: 0.5
      });
      var tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(
        Math.cos(angle) * geoRadius,
        0,
        Math.sin(angle) * geoRadius
      );
      tick.rotation.y = -angle;
      ring.add(tick);
    }

    return ring;
  }
};

function drawContinent(ctx, blobs) {
  blobs.forEach(function(b) {
    if (b.color === '#1a3d7a') {
      // Water cutout (like Great Lakes)
      ctx.fillStyle = b.color;
    } else {
      ctx.fillStyle = b.color;
    }
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

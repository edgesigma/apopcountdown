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
    const earthRadius = ViewerConstants.EARTH_RADIUS_KM / ViewerConstants.CLOSE_SCALE;

    const geometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Create a simple procedural texture for Earth
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Ocean base
    ctx.fillStyle = '#1a3a6a';
    ctx.fillRect(0, 0, 512, 256);

    // Rough landmasses
    ctx.fillStyle = '#2a5a2a';
    // Americas
    drawBlob(ctx, 120, 80, 40, 80);
    drawBlob(ctx, 110, 170, 30, 50);
    // Europe/Africa
    drawBlob(ctx, 270, 70, 30, 40);
    drawBlob(ctx, 270, 130, 35, 70);
    // Asia
    drawBlob(ctx, 330, 60, 80, 60);
    drawBlob(ctx, 380, 120, 40, 30);
    // Australia
    drawBlob(ctx, 420, 170, 30, 25);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.05
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'earth-close';
    mesh.rotation.y = -Math.PI / 2;

    // Atmosphere
    const atmosGeometry = new THREE.SphereGeometry(earthRadius * 1.02, 64, 64);
    const atmosMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    mesh.add(new THREE.Mesh(atmosGeometry, atmosMaterial));

    return mesh;
  },

  createGeoRing() {
    const geoRadius = (ViewerConstants.EARTH_RADIUS_KM + ViewerConstants.GEO_ALTITUDE_KM) / ViewerConstants.CLOSE_SCALE;

    const geometry = new THREE.RingGeometry(geoRadius - 0.002, geoRadius + 0.002, 128);
    const material = new THREE.MeshBasicMaterial({
      color: ViewerConstants.GEOSTATIONARY_COLOR,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'geo-ring';

    return ring;
  }
};

function drawBlob(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Procedural bilobed asteroid geometry
const ViewerAsteroid = {
  create(radius, detail) {
    radius = radius || 0.008;
    detail = detail || 3;

    // Start with icosahedron
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const positions = geometry.attributes.position;

    // Deform to bilobed shape (2.6:1 elongation with pinch)
    for (let i = 0; i < positions.count; i++) {
      let x = positions.getX(i);
      let y = positions.getY(i);
      let z = positions.getZ(i);

      // Elongate along X axis (2.6:1 ratio)
      x *= 2.6;

      // Bilobed pinch in the middle
      const normalizedX = x / (radius * 2.6);
      const pinch = 1.0 - 0.35 * Math.exp(-normalizedX * normalizedX * 8);
      y *= pinch;
      z *= pinch;

      // Add noise displacement for surface roughness
      const noiseScale = 0.15;
      const nx = Math.sin(x * 40 + y * 20) * Math.cos(z * 30);
      const ny = Math.sin(y * 35 + z * 25) * Math.cos(x * 20);
      const nz = Math.sin(z * 30 + x * 15) * Math.cos(y * 35);
      const noise = (nx + ny + nz) * noiseScale * radius;

      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        x += (x / len) * noise;
        y += (y / len) * noise;
        z += (z / len) * noise;
      }

      positions.setXYZ(i, x, y, z);
    }

    geometry.computeVertexNormals();

    // Material - rocky, slightly reflective
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'apophis';

    // Slow tumbling rotation
    mesh.userData.rotationSpeed = { x: 0.001, y: 0.003, z: 0.0005 };

    return mesh;
  },

  createGlowSprite(radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 110, 64, 0.6)');
    gradient.addColorStop(0.3, 'rgba(255, 110, 64, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 110, 64, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(radius * 8, radius * 8, 1);
    return sprite;
  }
};

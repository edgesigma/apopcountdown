// Orbit path lines and position markers
const ViewerOrbit = {
  /**
   * Create an orbit line from an array of [x, y, z] points.
   */
  createOrbitLine(pathPoints, color, opacity) {
    opacity = opacity !== undefined ? opacity : 0.6;

    const points = pathPoints.map(p => new THREE.Vector3(p[0], p[2], -p[1]));
    // Swap Y/Z for Three.js coordinate system (Y-up)

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity
    });

    return new THREE.Line(geometry, material);
  },

  /**
   * Create a position marker (small sphere + glow).
   */
  createPositionMarker(position, color, size) {
    size = size || 0.006;

    const group = new THREE.Group();

    // Solid sphere
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Glow sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.8)`);
    gradient.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(size * 6, size * 6, 1);
    group.add(sprite);

    // Set position (swap Y/Z for Three.js)
    if (position) {
      group.position.set(position.x || position[0] || 0, position.z || position[2] || 0, -(position.y || position[1] || 0));
    }

    return group;
  },

  /**
   * Create the Sun mesh at origin.
   */
  createSun() {
    const geometry = new THREE.SphereGeometry(ViewerConstants.SUN_RADIUS, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: ViewerConstants.SUN_COLOR
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'sun';

    // Sun glow
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const ctx = glowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 221, 68, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 180, 40, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(glowCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.2, 0.2, 1);
    mesh.add(sprite);

    return mesh;
  },

  /**
   * Create close approach flyby path.
   */
  createCloseApproachPath(pathData) {
    if (!pathData || !pathData.length) return null;

    const points = pathData.map(p => {
      const scale = ViewerConstants.CLOSE_SCALE;
      return new THREE.Vector3(
        p.geocentric[0] * ViewerConstants.AU_KM / scale,
        p.geocentric[2] * ViewerConstants.AU_KM / scale,
        -p.geocentric[1] * ViewerConstants.AU_KM / scale
      );
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: ViewerConstants.APOPHIS_COLOR,
      transparent: true,
      opacity: 0.8
    });

    return new THREE.Line(geometry, material);
  }
};

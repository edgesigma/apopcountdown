// Lighting setup for the 3D viewer
const ViewerLighting = {
  setup(scene) {
    // Sun light (point light at origin for orbital view)
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 100);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Ambient light for visibility
    const ambient = new THREE.AmbientLight(0x334466, 0.4);
    scene.add(ambient);

    // Directional light for close approach view
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Rim light (subtle blue backlight)
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    return { sunLight, ambient, dirLight, rimLight };
  }
};

// OrbitControls wrapper
const ViewerControls = {
  setup(camera, domElement) {
    const controls = new THREE.OrbitControls(camera, domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;

    controls.minDistance = 0.5;
    controls.maxDistance = 10;

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    return controls;
  },

  /**
   * Animate camera to a new position/target.
   */
  animateTo(controls, camera, targetPos, cameraPos, duration) {
    duration = duration || 1500;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z);
    const endTarget = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (t < 1) requestAnimationFrame(update);
    }

    update();
  }
};

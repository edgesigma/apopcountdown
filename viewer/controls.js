// OrbitControls wrapper
var ViewerControls = {
  setup: function(camera, domElement) {
    var controls = new THREE.OrbitControls(camera, domElement);

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
  animateTo: function(controls, camera, targetPos, cameraPos, duration) {
    duration = duration || 1500;
    var startPos = camera.position.clone();
    var startTarget = controls.target.clone();
    var endPos = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z);
    var endTarget = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    var startTime = Date.now();

    function update() {
      var elapsed = Date.now() - startTime;
      var t = Math.min(elapsed / duration, 1);
      // Ease out quart — slow, cinematic deceleration
      var ease = 1 - Math.pow(1 - t, 4);

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (t < 1) requestAnimationFrame(update);
    }

    update();
  }
};

// Viewer constants and scale factors
const ViewerConstants = {
  // Scale: 1 unit = 1 AU for orbital view
  AU: 1.0,
  AU_KM: 149597870.7,

  // Colors
  SUN_COLOR: 0xffdd44,
  EARTH_COLOR: 0x4488ff,
  EARTH_ATMOSPHERE: 0x88ccff,
  APOPHIS_COLOR: 0xff6e40,
  ORBIT_EARTH_COLOR: 0x2244aa,
  ORBIT_APOPHIS_COLOR: 0xff6e40,
  GRID_COLOR: 0x222244,
  GEOSTATIONARY_COLOR: 0x44ff88,

  // Sizes
  SUN_RADIUS: 0.04,
  EARTH_RADIUS_ORBITAL: 0.015,
  APOPHIS_RADIUS_ORBITAL: 0.008,

  // Close approach view (1 unit = 10,000 km)
  CLOSE_SCALE: 10000, // km per unit
  EARTH_RADIUS_KM: 6371,
  GEO_ALTITUDE_KM: 35786,
  APOPHIS_CLOSE_SIZE: 0.02,

  // Camera
  ORBITAL_CAM_DISTANCE: 2.5,
  CLOSE_CAM_DISTANCE: 8,

  // Background
  BG_COLOR: 0x0a0a0f
};

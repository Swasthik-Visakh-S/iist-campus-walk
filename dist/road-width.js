// Widths in campus metres, shared by asphalt, graded road beds and the map.
export function roadWidth(feature) {
  if (feature.width !== undefined) return feature.width;
  return ['footway','steps','path'].includes(feature.tags.highway) ? 2.4 : 7.4;
}

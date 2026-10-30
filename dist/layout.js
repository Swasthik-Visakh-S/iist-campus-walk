// Reference-plan corrections are separate from the original OSM export.
export function polygonCenter(points) {
  const ring = points.slice(0, -1);
  return ring.reduce((c, p) => [c[0] + p[0] / ring.length, c[1] + p[1] / ring.length], [0, 0]);
}
export function polygonArea(points) {
  return Math.abs(points.slice(1).reduce((a, p, i) => a + points[i][0] * p[1] - p[0] * points[i][1], 0)) / 2;
}
export function applyReferenceLayout(data, config) {
  const edits = config.layout || {};
  let features = data.features.map(feature => {
    let result = {...feature, tags: {...feature.tags}, points: feature.points.map(p => [...p])};
    const edit = edits.buildings?.[feature.id];
    if (edit) {
      if (edit.planPoints) {
        // Plan orientation is anchored by the roundabout, OAT and Library.
        const project = ([x, y]) => [401.102919 - .237409386*x - 1.43265929*y, -388.494945 + 1.16396414*x - .0434948493*y];
        const traced = edit.planPoints.map(project), c = polygonCenter(traced);
        const scale = Math.sqrt(polygonArea(feature.points) / polygonArea(traced)) * (edit.scale ?? 1);
        const target = edit.center || polygonCenter(feature.points);
        result.points = traced.map(p => [target[0]+(p[0]-c[0])*scale, target[1]+(p[1]-c[1])*scale]);
      } else if (edit.points) result.points = edit.points.map(p => [...p]);
      if (edit.name) result.tags.name = edit.name;
      result.surveyNumber = edit.surveyNumber;
      result.reference = edit.source;
    }
    const road = edits.roads?.[feature.id];
    if (road) result.points = [...road.approach, ...feature.points.slice(road.keepFromIndex)].map(p => [...p]);
    return result;
  });
  features.push(...(edits.extraBuildings || []), ...(edits.extraPaths || []));
  const garden = libraryGarden(features, config);
  if (garden) {
    const ring = Array.from({length:49}, (_, i) => {
      const angle=i*Math.PI*2/48;
      return garden.point(Math.cos(angle)*(garden.halfWidth+6),Math.sin(angle)*(garden.halfLength+6));
    });
    features = features.map(f => {
      if (f.id !== '619162423') return f;
      const entry=f.points[0];
      let nearest=0;
      for(let i=1;i<48;i++) if(Math.hypot(ring[i][0]-entry[0],ring[i][1]-entry[1])<Math.hypot(ring[nearest][0]-entry[0],ring[nearest][1]-entry[1])) nearest=i;
      const loop=Array.from({length:49},(_,i)=>ring[(nearest+i)%48]);
      return {...f,points:[entry,...loop],reference:'Library garden perimeter, aligned to the revised entrance axis.'};
    });
  }
  return {...data, features};
}
export function libraryGarden(features, config) {
  const spec = config.layout?.libraryGarden;
  if (!spec) return null;
  const library = features.find(f => f.tags.amenity === 'library');
  const c = polygonCenter(library.points), delta = [spec.center[0]-c[0], spec.center[1]-c[1]], length = Math.hypot(...delta);
  const front = delta.map(v => v/length), right = [front[1], -front[0]];
  const point = (u,v) => [spec.center[0]+right[0]*u+front[0]*v, spec.center[1]+right[1]*u+front[1]*v];
  return {...spec, front, right, point, libraryCenter:c};
}

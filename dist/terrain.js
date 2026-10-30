import {inside, edgeDistance} from './geometry.js';
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function makeTerrain(data, config, buildings, ponds) {
  const spec=config.terrain;
  const anchors=buildings.map(b=>({point:b.center,height:spec.levels[b.id]??spec.defaultLevel})).concat(spec.anchors||[]);
  for(const b of buildings) {
    b.level=spec.levels[b.id]??spec.defaultLevel;
    b.height=config.heights[b.id]??(b.tags.tourism==='hostel'?16:b.tags.man_made==='storage_tank'?4:12);
  }
  for(const p of ponds)p.level=spec.pondLevel;
  function baseHeight(x,z) {
    let sum=0,weight=0;
    for(const a of anchors){const w=1/(36+(x-a.point[0])**2+(z-a.point[1])**2)**1.6;sum+=a.height*w;weight+=w;}
    let h=sum/weight;
    for(const t of spec.terraces||[]){const d=edgeDistance(x,z,t.points);if(d<t.blend)h+=(t.level-h)*(1-smooth(d/t.blend));}
    return h;
  }
  const widthForFeature=f=>f.width??(['footway','steps','path'].includes(f.tags.highway)?2.4:6.5);
  const routes=[],highways=data.features.filter(f=>f.tags.highway),junctions=new Map();
  const key=p=>p.join(',');
  // Shared junctions inherit explicit road elevations instead of unrelated base terrain.
  for(const f of highways){const profile=f.levels??spec.roadProfiles?.[f.id];if(profile!==undefined)f.points.forEach((p,i)=>{const h=typeof profile==='number'?profile:profile[i];if(Number.isFinite(h)&&!junctions.has(key(p)))junctions.set(key(p),h);});}
  for(const f of highways) {
    const profile=f.levels??spec.roadProfiles?.[f.id];
    if(Array.isArray(profile)&&profile.length!==f.points.length)throw Error(`Road ${f.id}: ${profile.length} levels for ${f.points.length} points`);
    const grade=widthForFeature(f)>4||!!f.levels;
    const levels=f.points.map((p,i)=>junctions.get(key(p))??(typeof profile==='number'?profile:profile?.[i]??baseHeight(...p)));
    const width=f.width??(['footway','steps','path'].includes(f.tags.highway)?2.4:6.5);
    for(let i=1;i<f.points.length;i++) {
      const a=f.points[i-1],b=f.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(!length)continue;
      routes.push({grade,id:f.id,a,b,dx,dz,length,width,y0:levels[i-1],y1:levels[i],steps:f.tags.highway==='steps',covered:f.tags.covered==='yes'});
    }
  }
  function routeSample(x,z,r) {
    const t=clamp(((x-r.a[0])*r.dx+(z-r.a[1])*r.dz)/r.length**2);
    return {t,d:Math.hypot(x-r.a[0]-t*r.dx,z-r.a[1]-t*r.dz),height:r.y0+(r.y1-r.y0)*t};
  }
  function groundAt(x,z) {
    let h=baseHeight(x,z),sum=0,weights=0,blend=0;
    for(const p of ponds){const d=edgeDistance(x,z,p.points);if(d<13){const dest=inside(x,z,p.points)?p.level-2:p.level+.25;h+=(dest-h)*(1-smooth(d/13));}}
    for(const r of routes) {
      if(!r.grade)continue;
      if(x<Math.min(r.a[0],r.b[0])-8||x>Math.max(r.a[0],r.b[0])+8||z<Math.min(r.a[1],r.b[1])-8||z>Math.max(r.a[1],r.b[1])+8)continue;
      const s=routeSample(x,z,r),d=Math.max(0,s.d-r.width/2);
      if(d<5){const w=(1-smooth(d/5))/(.2+s.d*s.d)**2;sum+=w*s.height;weights+=w;blend=Math.max(blend,1-smooth(d/5));}
    }
    if(weights)h+=(sum/weights-h)*blend;
    for(const b of buildings){const d=edgeDistance(x,z,b.points);if(d<5)h+=(b.level-h)*(1-smooth(d/5));}
    return h;
  }
  const stepRoutes=routes.filter(r=>r.steps);
  function stairHeight(x,z) {
    for(const r of stepRoutes){const s=routeSample(x,z,r);if(s.d<=r.width/2+.02){const n=Math.max(1,Math.ceil(Math.abs(r.y1-r.y0)/.18));return r.y0+(r.y1-r.y0)*Math.round(s.t*n)/n+.12;}}
    return null;
  }
  return {groundAt,baseHeight,routes,routeSample,stairHeight};
}

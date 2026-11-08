import {roadWidth} from './road-width.js?v=13';
import {inside, edgeDistance} from './geometry.js?v=6';
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
// Use the same tread index for player contact and the rendered stair boxes.
export function stepCount(r){return Math.max(1,Math.ceil(Math.abs(r.y1-r.y0)/.175));}
export function stepTop(r,index){return r.y0+(r.y1-r.y0)*(index+1)/stepCount(r)+.14;}
export function makeTerrain(data, config, buildings, ponds) {
  const spec=config.terrain;
  const anchors=buildings.map(b=>({point:b.center,height:spec.levels[b.id]??spec.defaultLevel})).concat(spec.anchors||[]);
  for(const b of buildings) {
    b.level=spec.levels[b.id]??spec.defaultLevel;
    b.height=config.heights[b.id]??(b.tags.tourism==='hostel'?16:b.tags.man_made==='storage_tank'?4:12);
  }
  for(const p of ponds)p.level=spec.pondLevel;
  const forest=config.landscape.libraryForest;
  const terraces=(spec.terraces||[]).map(t=>{
    if(t.profile==='forest')return t;
    const xs=t.points.map(p=>p[0]),zs=t.points.map(p=>p[1]);
    return {...t,minX:Math.min(...xs)-t.blend,maxX:Math.max(...xs)+t.blend,minZ:Math.min(...zs)-t.blend,maxZ:Math.max(...zs)+t.blend};
  });
  function forestHeight(x,z,h){
    if(!forest || x<forest.west-20 || x>forest.east+40 || z < -95 || z>25)return h;
    const d=edgeDistance(x,z,forest.points);
    if(d>=forest.blend)return h;
    const u=clamp((x-forest.west)/(forest.east-forest.west));
    const undulation=Math.sin(Math.PI*u)*(.62*Math.sin(x*.079+z*.054)+.4*Math.cos(z*.14-x*.035));
    const hillside=forest.upperLevel+(forest.lowerLevel-forest.upperLevel)*smooth(u)+undulation;
    return h+(hillside-h)*(1-smooth(d/forest.blend));
  }
  function baseHeight(x,z) {
    let sum=0,weight=0;
    for(const a of anchors){const w=1/(36+(x-a.point[0])**2+(z-a.point[1])**2)**1.6;sum+=a.height*w;weight+=w;}
    let h=sum/weight;
    for(const t of terraces){
      if(t.profile==='forest'){h=forestHeight(x,z,h);continue;}
      if(x<t.minX||x>t.maxX||z<t.minZ||z>t.maxZ)continue;
      const d=edgeDistance(x,z,t.points);if(d<t.blend)h+=(t.level-h)*(1-smooth(d/t.blend));
    }
    return h;
  }
  const surveyedBeds=new Set(['365911687','365911688','365911691','618490368','turf-soil-road','hostel-lower-landing','hostel-upper-landing']);
  const routes=[],highways=data.features.filter(f=>f.tags.highway),junctions=new Map();
  const key=p=>p.join(',');
  // Shared junctions inherit explicit road elevations instead of unrelated base terrain.
  for(const f of highways){const profile=f.levels??spec.roadProfiles?.[f.id];if(profile!==undefined)f.points.forEach((p,i)=>{const h=typeof profile==='number'?profile:profile[i];if(Number.isFinite(h)&&!junctions.has(key(p)))junctions.set(key(p),h);});}
  for(const f of highways) {
    const profile=f.levels??spec.roadProfiles?.[f.id];
    if(Array.isArray(profile)&&profile.length!==f.points.length)throw Error(`Road ${f.id}: ${profile.length} levels for ${f.points.length} points`);
    const grade=roadWidth(f)>4||!!f.levels;
    const levels=f.points.map((p,i)=>junctions.get(key(p))??(typeof profile==='number'?profile:profile?.[i]??baseHeight(...p)));
    const width=roadWidth(f);
    for(let i=1;i<f.points.length;i++) {
      const a=f.points[i-1],b=f.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(!length)continue;
      routes.push({grade,verge:spec.roadVerges?.[f.id]||0,surveyedBed:surveyedBeds.has(f.id),id:f.id,a,b,dx,dz,length,width,y0:levels[i-1],y1:levels[i],steps:f.tags.highway==='steps',covered:f.tags.covered==='yes'});
    }
  }
  function routeSample(x,z,r) {
    const t=clamp(((x-r.a[0])*r.dx+(z-r.a[1])*r.dz)/r.length**2);
    return {t,d:Math.hypot(x-r.a[0]-t*r.dx,z-r.a[1]-t*r.dz),height:r.y0+(r.y1-r.y0)*t};
  }
  const stepRoutes=routes.filter(r=>r.steps);
  const hostelFlight=stepRoutes.find(r=>r.id==='hostel-stairs');
  function stairPosition(x,z,r){
    const t=((x-r.a[0])*r.dx+(z-r.a[1])*r.dz)/r.length**2;
    const side=Math.abs((x-r.a[0])*r.dz-(z-r.a[1])*r.dx)/r.length;
    return {t,side};
  }
  function groundAt(x,z) {
    let h=baseHeight(x,z),sum=0,weights=0,blend=0,roadInterior=0,bedWeight=0;
    let vergeHeight=0,vergeWeight=0,vergeBlend=0;
    for(const p of ponds){const d=edgeDistance(x,z,p.points);if(d<13){const dest=inside(x,z,p.points)?p.level-2:p.level+.25;h+=(dest-h)*(1-smooth(d/13));}}
    for(const r of routes) {
      if(!r.grade)continue;
      const margin=Math.max(8,r.width/2+r.verge+9);
      if(x<Math.min(r.a[0],r.b[0])-margin||x>Math.max(r.a[0],r.b[0])+margin||z<Math.min(r.a[1],r.b[1])-margin||z>Math.max(r.a[1],r.b[1])+margin)continue;
      const s=routeSample(x,z,r);if(r.width>4)roadInterior=Math.max(roadInterior,1-smooth(s.d/(r.width*.5)));
      const d=Math.max(0,s.d-r.width/2);
      if(r.verge&&d<r.verge+9){const w=1/(1+s.d*s.d);vergeHeight+=w*s.height;vergeWeight+=w;vergeBlend=Math.max(vergeBlend,1-smooth((d-r.verge)/9));}
      if(r.surveyedBed)bedWeight=Math.max(bedWeight,1-smooth(d/3));
      if(d<5){const w=(1-smooth(d/5))/(.2+s.d*s.d)**2;sum+=w*s.height;weights+=w;blend=Math.max(blend,1-smooth(d/5));}
    }
    if(vergeWeight)h+=(vergeHeight/vergeWeight-h)*vergeBlend;
    if(weights)h+=(sum/weights-h)*blend;
    for(const b of buildings){const d=edgeDistance(x,z,b.points);if(d<5)h+=(b.level-h)*(1-smooth(d/5))*(1-roadInterior*smooth(d/.7));}
    if(bedWeight&&weights)h+=(sum/weights-h)*bedWeight;
    const forecourt=config.landscape.turfForecourt;
    if(forecourt){const d=edgeDistance(x,z,forecourt.points);if(d<1)h+=(forecourt.level-h)*(1-smooth(d));}
    if(hostelFlight){
      const r=hostelFlight;
      if(Math.abs(x-r.a[0])<12&&Math.abs(z-r.a[1])<16){
        const s=routeSample(x,z,r);
        const shoulder=smooth(1-(s.d-r.width/2-1)/2.5);
        h+=(s.height-h)*shoulder;
      }
    }
    return h;
  }
  function stairHeight(x,z) {
    for(const r of stepRoutes){
      const {t,side}=stairPosition(x,z,r);
      if(t<0||t>1||side>r.width/2)continue;
      return stepTop(r,Math.min(stepCount(r)-1,Math.floor(t*stepCount(r))));
    }
    return null;
  }
  return {groundAt,baseHeight,routes,routeSample,stairHeight};
}

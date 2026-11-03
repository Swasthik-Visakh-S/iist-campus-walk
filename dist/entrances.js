import {inside,edgeDistance,distSegment} from './geometry.js?v=6';
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const nearest=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return lerp(a,b,t);};
// Entrances are illustrative: choose a real outer wall with a clear connection
// to an existing route, never a line through another building or pond.
export function planEntrances(data,buildings,ponds,terrain,config){
 const boundary=data.features.find(f=>f.tags.amenity==='university').points;
 const routes=terrain.routes.filter(r=>!r.steps),entries=[];
 const occupied=buildings.filter(b=>b.surveyNumber!==7&&b.tags.man_made!=='storage_tank');
 for(const b of occupied){
  const choices=[];
  for(let i=1;i<b.points.length;i++){
   const a=b.points[i-1],q=b.points[i],len=Math.hypot(q[0]-a[0],q[1]-a[1]);if(len<6.2)continue;
   for(const t of [.25,.5,.75]){
    const door=lerp(a,q,t);if(Math.min(t,1-t)*len<3.1)continue;
    let n=[-(q[1]-a[1])/len,(q[0]-a[0])/len];if(inside(door[0]+n[0]*.1,door[1]+n[1]*.1,b.points))n=n.map(v=>-v);
    const porch=[door[0]+n[0]*4,door[1]+n[1]*4];
    for(const r of routes){
     const end=nearest(porch,r.a,r.b),length=Math.hypot(end[0]-porch[0],end[1]-porch[1]);if(length>80)continue;
     if((end[0]-door[0])*n[0]+(end[1]-door[1])*n[1]<3)continue;
     let clear=true;
     for(let k=0;k<=Math.ceil(length/1.2);k++){
      const p=lerp(porch,end,k/Math.max(1,Math.ceil(length/1.2)));
      if(!inside(...p,boundary)||buildings.some(other=>other.surveyNumber!==7&&edgeDistance(...p,other.points)<1.9)||ponds.some(other=>edgeDistance(...p,other.points)<2.5)){clear=false;break;}
     }
     // The portico needs room at both sides of its door.
     const right=[n[1],-n[0]];
     for(const side of [-1,1]){const p=[door[0]+n[0]*2+right[0]*side*3,door[1]+n[1]*2+right[1]*side*3];if(buildings.some(o=>o!==b&&o.surveyNumber!==7&&edgeDistance(...p,o.points)<1))clear=false;const pillar=[door[0]+n[0]*2.4+right[0]*side*2.55,door[1]+n[1]*2.4+right[1]*side*2.55];if(routes.some(route=>distSegment(...pillar,route.a,route.b)<route.width/2+.7))clear=false;}
     if(!clear)continue;
     const rise=Math.abs(b.level-terrain.groundAt(...end));
     const preferred=(config.layout.entranceFaces?.[b.id]||[]),facing=preferred.length?1-(n[0]*preferred[0]+n[1]*preferred[1]):0;
     choices.push({buildingId:b.id,name:b.tags.name||`Building ${b.surveyNumber||''}`,door,porch,end,n,right,width:3.6,level:b.level,endLevel:terrain.groundAt(...end),score:length+rise*3+facing*60});
    }
   }
  }
  choices.sort((a,b)=>a.score-b.score);if(!choices.length)throw Error('No clear entrance approach for '+b.id);
  const e=choices[0];e.pillars=[-1,1].map(s=>[e.door[0]+e.n[0]*2.4+e.right[0]*s*2.55,e.door[1]+e.n[1]*2.4+e.right[1]*s*2.55]);entries.push(e);
 }
 return entries;
}
export function entrancePaths(entries,terrain){return entries.map(e=>({id:'entrance-'+e.buildingId,tags:{highway:'footway',name:e.name+' entrance'},width:e.width,points:[[e.door[0]+e.n[0]*.7,e.door[1]+e.n[1]*.7],e.porch,e.end],levels:[e.level,e.level,e.endLevel]}));}
export function clearOfEntrances(x,z,entries,margin=0){return entries.every(e=>distSegment(x,z,e.door,e.porch)>3.7+margin&&distSegment(x,z,e.porch,e.end)>e.width/2+margin);}
export function addEntrances(entries,box,m){
 for(const e of entries){
  const angle=Math.atan2(e.n[0],e.n[1]),point=(u,v)=>[e.door[0]+e.right[0]*u+e.n[0]*v,e.door[1]+e.right[1]*u+e.n[1]*v];
  const part=(mat,u,y,v,w,h,d)=>{const p=point(u,v);box(mat,p[0],e.level+y,p[1],w,h,d,angle);};
  // Red entrance piers, cream lintel and a projecting sheltered porch.
  for(const side of [-1,1]){part(m.brick,side*2.55,1.8,2.4,.8,3.6,.85);part(m.white,side*2.55,3.55,2.4,1,.18,1.05);}
  part(m.white,0,3.75,1.7,6.8,.4,4.8);part(m.roof,0,4.03,1.7,6.6,.16,4.6);
  part(m.brick,0,3.2,.22,5.6,.7,.4);part(m.glass,0,3.22,.46,3.8,.46,.08);
  part(m.glass,0,1.4,.10,3.2,2.8,.18);
  for(const u of [-1.65,0,1.65])part(m.white,u,1.42,.24,.09,2.85,.08);
  part(m.white,0,2.84,.24,3.4,.12,.10);
  for(const u of [-.18,.18])part(m.white,u,1.3,.33,.04,.42,.07);
 }
}

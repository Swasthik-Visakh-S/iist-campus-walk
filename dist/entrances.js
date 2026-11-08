import {inside,edgeDistance,distSegment} from './geometry.js?v=6';
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const nearest=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return lerp(a,b,t);};
// Keep a marked entrance on its photographed wall even when the nearest road is behind it.
function markedEntrance(b, mark, index, buildings, ponds, routes, terrain, boundary) {
  const faces=[];
  for(let i=1;i<b.points.length;i++){
    const a=b.points[i-1],q=b.points[i],length=Math.hypot(q[0]-a[0],q[1]-a[1]);
    if(length<1.9)continue;
    let door=nearest(mark,a,q);
    const t=Math.hypot(door[0]-a[0],door[1]-a[1])/length,margin=Math.min(.48,1.4/length);
    door=lerp(a,q,Math.max(margin,Math.min(1-margin,t)));
    let n=[-(q[1]-a[1])/length,(q[0]-a[0])/length];
    if(inside(door[0]+n[0]*.05,door[1]+n[1]*.05,b.points))n=n.map(v=>-v);
    faces.push({door,n,distance:Math.hypot(door[0]-mark[0],door[1]-mark[1])});
  }
  const clear=(p)=>inside(...p,boundary)&&buildings.every(o=>o.surveyNumber===7||edgeDistance(...p,o.points)>.7)&&ponds.every(o=>edgeDistance(...p,o.points)>1.2);
  function visible(a,b){
    const steps=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1]));
    for(let i=0;i<=steps;i++)if(!clear(lerp(a,b,i/Math.max(steps,1))))return false;
    return true;
  }
  for(const {door,n} of faces.sort((a,b)=>a.distance-b.distance)){
    const right=[n[1],-n[0]];
    for(const depth of [2.8,1.7,1.1]){
      const porch=[door[0]+n[0]*depth,door[1]+n[1]*depth];
      if(!clear(porch))continue;
      const postDepth=Math.min(depth*.5,1.3),span=1.7;
      const pillars=[-1,1].map(side=>[door[0]+n[0]*postDepth+right[0]*span*side,door[1]+n[1]*postDepth+right[1]*span*side]);
      // Keep the photographed door, and give it a road-facing approach on the exterior side of its wall.
      const forward=p=>(p[0]-door[0])*n[0]+(p[1]-door[1])*n[1];
      const ends=routes.map(r=>nearest(porch,r.a,r.b)).filter(p=>forward(p)>.65&&clear(p));
      const cost=p=>Math.hypot(p[0]-porch[0],p[1]-porch[1])+.6*Math.abs((p[0]-door[0])*right[0]+(p[1]-door[1])*right[1]);
      ends.sort((a,b)=>cost(a)-cost(b));
      const accessible=(a,b)=>visible(a,b)&&pillars.every(p=>distSegment(...p,a,b)>1.03);
      let end=ends.find(p=>accessible(porch,p)),bend=null;
      if(!end){
        for(const distance of [5,10,18,28])for(let k=0;k<12&&!end;k++){
          const mid=[porch[0]+distance*Math.cos(k*Math.PI/6),porch[1]+distance*Math.sin(k*Math.PI/6)];
          if(!accessible(porch,mid))continue;
          end=ends.find(p=>accessible(mid,p));if(end)bend=mid;
        }
      }
      if(!end)continue;
      // Use a shallow portico where the lane runs directly along the facade.
      return {id:b.id+'-'+index,buildingId:b.id,name:b.tags.name,mark,door,n,right,porch,end,bend,pillars,span,postDepth,width:2.7,level:b.level,endLevel:terrain.groundAt(...end)};
    }
  }
  throw Error('No accessible wall for the marked entrance at '+b.tags.name);
}
// Entrances are illustrative: choose a real outer wall with a clear connection
// to an existing route, never a line through another building or pond.
export function planEntrances(data,buildings,ponds,terrain,config){
 const boundary=data.features.find(f=>f.tags.amenity==='university').points;
 const routes=terrain.routes.filter(r=>!r.steps),entries=[];
 const occupied=buildings.filter(b=>b.surveyNumber!==7&&b.tags.man_made!=='storage_tank');
 for(const b of occupied){
  const marks=config.layout.markedDoors?.[b.id] || config.layout.entranceHints?.[b.id] || [null];
  for(const [index,mark] of marks.entries()){
  if(mark){
    const entry=markedEntrance(b,mark,index,buildings,ponds,routes,terrain,boundary);
    const portico=config.layout.entrancePorticos?.[b.id];
    if(portico){
      entry.span=portico.span;entry.postDepth=portico.depth;
      entry.pillars=[-1,1].map(side=>[entry.door[0]+entry.n[0]*entry.postDepth+entry.right[0]*entry.span*side,entry.door[1]+entry.n[1]*entry.postDepth+entry.right[1]*entry.span*side]);
    }
    if(!config.layout.markedDoors?.[b.id])delete entry.mark;
    entry.stepCount=config.layout.entranceStairs?.[b.id]||0;
    entries.push(entry);continue;
  }
  const choices=[];
  for(let i=1;i<b.points.length;i++){
   const a=b.points[i-1],q=b.points[i],len=Math.hypot(q[0]-a[0],q[1]-a[1]);if(len<3)continue;
   for(const t of [.25,.5,.75]){
    const door=lerp(a,q,t);if(Math.min(t,1-t)*len<Math.min(3.05,len*.45))continue;
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
  const e=choices[0];e.pillars=[-1,1].map(s=>[e.door[0]+e.n[0]*2.4+e.right[0]*s*2.55,e.door[1]+e.n[1]*2.4+e.right[1]*s*2.55]);e.id=b.id+'-'+index;entries.push(e);
  }
 }
 return entries;
}
export function entrancePaths(entries){
 return entries.map(e=>{
   const points=[[e.door[0]+e.n[0]*.7,e.door[1]+e.n[1]*.7],e.porch,...(e.bend?[e.bend]:[]),e.end];
   const levels=[e.level,e.level,...(e.bend?[(e.level+e.endLevel)/2]:[]),e.endLevel];
   return {id:'entrance-'+(e.id||e.buildingId),tags:{highway:'footway',name:e.name+' entrance'},width:e.width,points,levels};
 });
}
export function clearOfEntrances(x,z,entries,margin=0){
 return entries.every(e=>distSegment(x,z,e.door,e.porch)>3.7+margin
   &&distSegment(x,z,e.porch,e.bend||e.end)>e.width/2+margin
   &&(!e.bend||distSegment(x,z,e.bend,e.end)>e.width/2+margin));
}
export const riser=.15, tread=.30, landing=.84, stairWidth=4.6;
export function hostelStepHeight(x,z,entry){
 const dx=x-entry.door[0],dz=z-entry.door[1];
 const depth=dx*entry.n[0]+dz*entry.n[1];
 if(depth<-.05||depth>=landing+tread*entry.stepCount||Math.abs(dx*entry.right[0]+dz*entry.right[1])>stairWidth/2)return null;
 const down=Math.max(0,Math.floor((depth-landing)/tread));
 return entry.level+.15+(entry.stepCount-down)*riser;
}
export function addEntrances(entries,box,m){
 for(const e of entries){
  const span=e.span||2.55,depth=e.postDepth||2.4;
  const angle=Math.atan2(e.n[0],e.n[1]),point=(u,v)=>[e.door[0]+e.right[0]*u+e.n[0]*v,e.door[1]+e.right[1]*u+e.n[1]*v];
  const steps=e.stepCount||0;
  const part=(mat,u,y,v,w,h,d)=>{const p=point(u,v);box(mat,p[0],e.level+steps*riser+y,p[1],w,h,d,angle);};
  if(steps){
    // From the road the first tread rises one riser. The last joins the landing.
    for(let i=0;i<steps;i++){
      const top=(steps-i)*riser+.15;
      const p=point(0,landing+(i+.5)*tread);
      box(m.roof,p[0],e.level+top/2,p[1],stairWidth,top,tread+.002,angle);
      box(m.white,p[0]+e.n[0]*(tread/2-.019),e.level+top+.004,p[1]+e.n[1]*(tread/2-.019),stairWidth,.01,.035,angle);
    }
    part(m.roof,0,.15-(steps*riser+.15)/2,landing/2,stairWidth,steps*riser+.15,landing);
  }
  // Red entrance piers, cream lintel and a projecting sheltered porch.
  for(const side of [-1,1]){part(m.brick,side*span,1.8,depth,.8,3.6,.85);part(m.white,side*span,3.55,depth,1,.18,1.05);}
  part(m.white,0,3.75,depth/2,span*2+1.6,.4,depth+1.8);part(m.roof,0,4.03,depth/2,span*2+1.4,.16,depth+1.6);
  part(m.brick,0,3.2,.22,5.6,.7,.4);part(m.glass,0,3.22,.46,3.8,.46,.08);
  part(m.glass,0,1.4,.10,3.2,2.8,.18);
  for(const u of [-1.65,0,1.65])part(m.white,u,1.42,.24,.09,2.85,.08);
  part(m.white,0,2.84,.24,3.4,.12,.10);
  for(const u of [-.18,.18])part(m.white,u,1.3,.33,.04,.42,.07);
 }
}

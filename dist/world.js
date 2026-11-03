import {applyReferenceLayout,libraryGarden} from './layout.js?v=6';
import {addLibraryFacade,addLibraryGarden} from './library.js?v=6';
import * as T from './vendor/three.module.js';
import {inside,distSegment,center,edgeDistance} from './geometry.js?v=6';
export {inside,distSegment,center} from './geometry.js?v=6';
import {addRoads} from './roads.js?v=6';
import {createTerrainSurface} from './terrain-mesh.js?v=6';
import {planEntrances,entrancePaths,clearOfEntrances,addEntrances} from './entrances.js?v=6';
import {planGates,addGates} from './gates.js?v=6';
import {foliageChunks,mergeStaticMeshes} from './render-utils.js?v=6';
import {makeTerrain} from './terrain.js?v=6';
import {addCampusDetails,wallSegments} from './campus-details.js?v=6';
export function buildWorld(scene,data,config){
 data=applyReferenceLayout(data,config);
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.9,...extra});
 const m={brick:material('#8e4435'),white:material('#dadbd2'),roof:material('#9c998c'),glass:material('#344c50',{roughness:.3,metalness:.25}),road:material('#343738'),path:material('#a29880'),soil:material('#816b48'),leaf:material('#244d30'),trunk:material('#655744'),water:material('#516b46',{roughness:.24,metalness:.2}),panel:material('#273744',{roughness:.35}),lawn:material('#547241')};
 const buildings=data.features.filter(f=>f.tags.building).map(f=>({...f,center:center(f.points)}));
 const boundary=data.features.find(f=>f.tags.amenity==='university').points;
 const ponds=[...data.features.filter(f=>f.tags.natural==='water').map(f=>({...f,name:'South pond',source:'OpenStreetMap'})),...config.extraPonds];
 const sac=buildings.find(b=>b.id==='618490372'),oat=config.layout?.oat||{};const amph={x:oat.center?.[0]??sac.center[0],z:oat.center?.[1]??sac.center[1]-2,r:oat.radius||17,inner:oat.innerRadius||6,steps:oat.steps||12,rise:oat.rise||.34};
 const garden=libraryGarden(data.features,config),lib=buildings.find(b=>b.tags.amenity==='library');


 const baseTerrain=makeTerrain(data,config,buildings,ponds);
 const entrances=config.layout.entrances||planEntrances(data,buildings,ponds,baseTerrain,config);
 data={...data,features:[...data.features,...entrancePaths(entrances,baseTerrain)]};
 const terrainModel=makeTerrain(data,config,buildings,ponds);
 const {groundAt}=terrainModel;
 const terrainSurface=createTerrainSurface(groundAt,terrainModel.routes,config.landscape.soilGround.points);
 const gardenLevel=lib.level+.02;
 const gates=planGates(config,groundAt);
 const noPlants=(x,z,margin=0)=>!clearOfEntrances(x,z,entrances,margin)||gates.some(g=>Math.hypot(x-g.center[0],z-g.center[1])<g.width/2+7+margin);
 const towerSpec=config.layout.waterTower,tower=buildings.find(b=>b.id===towerSpec.id);
 const towerPillars=tower.points.slice(0,4).map(p=>[tower.center[0]+(p[0]-tower.center[0])*.67,tower.center[1]+(p[1]-tower.center[1])*.67]);
 const walls=wallSegments(boundary,terrainModel.routes,config.landscape.boundaryWall);
 const aisleAngles=config.layout.oat.aisles.map(p=>Math.atan2(p[0]-amph.x,p[1]-amph.z));
 const inAisle=(x,z)=>aisleAngles.some(a=>{const dx=x-amph.x,dz=z-amph.z;return dx*Math.sin(a)+dz*Math.cos(a)>=0&&Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<2.3;});
 function amphHeight(x,z){const r=Math.hypot(x-amph.x,z-amph.z);if(r>amph.r)return null;if(inAisle(x,z)||r<amph.inner)return sac.level+.16;const theta=(Math.atan2(x-amph.x,z-amph.z)+Math.PI*.13+Math.PI*4)%(Math.PI*2);if(theta>Math.PI*1.72)return sac.level+.16;return sac.level+.16+Math.ceil((r-amph.inner)/(amph.r-amph.inner)*amph.steps)*amph.rise;}
 const routeCells=new Map();for(const r of terrainModel.routes){const m=r.width/2+2;for(let x=Math.floor((Math.min(r.a[0],r.b[0])-m)/32);x<=Math.floor((Math.max(r.a[0],r.b[0])+m)/32);x++)for(let z=Math.floor((Math.min(r.a[1],r.b[1])-m)/32);z<=Math.floor((Math.max(r.a[1],r.b[1])+m)/32);z++){const k=x+','+z;if(!routeCells.has(k))routeCells.set(k,[]);routeCells.get(k).push(r);}}
 function walkHeight(x,z){const nearby=routeCells.get(Math.floor(x/32)+','+Math.floor(z/32))||[],road=nearby.some(r=>distSegment(x,z,r.a,r.b)<=r.width/2+.1);return Math.max(terrainSurface.heightAt(x,z)+(road?.14:-.04),terrainModel.stairHeight(x,z)??-Infinity,amphHeight(x,z)??-Infinity);}
 function blocked(x,z){if(entrances.some(e=>e.pillars.some(p=>Math.hypot(x-p[0],z-p[1])<.9))||gates.some(g=>g.obstacles.some(o=>Math.hypot(x-o.p[0],z-o.p[1])<o.r)))return true;if(!inside(x,z,boundary)||walls.some(w=>distSegment(x,z,w.a,w.b)<config.landscape.boundaryWall.thickness/2+.35))return true;if(garden&&Math.hypot(x-garden.fountain[0],z-garden.fountain[1])<garden.basinRadius+.6)return true;if(ponds.some(p=>edgeDistance(x,z,p.points)<.8))return true;return buildings.some(b=>{if(b===sac)return false;if(b===tower)return towerPillars.some(p=>Math.hypot(x-p[0],z-p[1])<towerSpec.pillarWidth*.75+.45);return edgeDistance(x,z,b.points)<.65;});}
 function cameraBlocked(x,y,z){
   if(!inside(x,z,boundary))return true;
   if(entrances.some(e=>{const dx=x-e.door[0],dz=z-e.door[1],u=dx*e.right[0]+dz*e.right[1],v=dx*e.n[0]+dz*e.n[1];return Math.abs(u)<3.6&&v>-.8&&v<4.3&&y>e.level+3.4&&y<e.level+4.3;}))return true;
   if(terrainModel.routes.some(r=>r.covered&&distSegment(x,z,r.a,r.b)<r.width/2+.6&&Math.abs(y-groundAt(x,z)-3.4)<.3))return true;
   if(entrances.some(e=>y<e.level+4.3&&e.pillars.some(p=>Math.hypot(x-p[0],z-p[1])<.9)))return true;
   if(gates.some(g=>g.obstacles.some(o=>y<g.level+4.7&&Math.hypot(x-o.p[0],z-o.p[1])<o.r)))return true;
   if(walls.some(w=>distSegment(x,z,w.a,w.b)<.6&&y<groundAt(x,z)+config.landscape.boundaryWall.height+.2))return true;
   return buildings.some(b=>{
    if(b===sac)return false;
    if(b===tower)return y<b.level+towerSpec.supportHeight?towerPillars.some(p=>Math.hypot(x-p[0],z-p[1])<.8):y<b.level+towerSpec.supportHeight+towerSpec.tankHeight+1&&edgeDistance(x,z,b.points)<.5;
    return y<b.level+b.height+1&&edgeDistance(x,z,b.points)<.5;
   });
 }
 function safePoint(p){for(let r=0;r<100;r+=2)for(let a=0;a<6.29;a+=.25){const x=p[0]+Math.cos(a)*r,z=p[1]+Math.sin(a)*r;if(inside(x,z,boundary)&&!blocked(x,z))return[x,z];}throw new Error('No walkable point near destination');}
 function mesh(g,mat,x=0,y=0,z=0){const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;scene.add(o);return o;}
 function polygon(p,h,mat,y){const s=new T.Shape(p.map(v=>new T.Vector2(v[0],-v[1])));const g=h?new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false}):new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);return mesh(g,mat,0,y,0);}
 const batches=new Map();function box(mat,x,y,z,sx,sy,sz,angle=0){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({x,y,z,sx,sy,sz,angle});}
 const terr=mesh(terrainSurface.geometry,material('#ffffff',{vertexColors:true}));terr.castShadow=false;
 const roadDetails=addRoads(scene,data,boundary,groundAt,blocked,m,terrainSurface);
 const {roads}=roadDetails;
 const landmarks=[];
 for(const b of buildings){const t=b.tags,h=b.height,y=b.level,[cx,cz]=b.center;const isSac=b===sac;
 if(b===tower){
  const concrete=material('#b9b4a5'),support=towerSpec.supportHeight;
  for(const p of towerPillars)box(concrete,p[0],y+support/2,p[1],towerSpec.pillarWidth,support,towerSpec.pillarWidth);
  for(const elevation of [support*.33,support*.66,support])for(let i=0;i<4;i++){const a=towerPillars[i],p=towerPillars[(i+1)%4];box(concrete,(a[0]+p[0])/2,y+elevation,(a[1]+p[1])/2,.55,.7,Math.hypot(p[0]-a[0],p[1]-a[1]),Math.atan2(p[0]-a[0],p[1]-a[1]));}
  polygon(b.points,.65,concrete,y+support-.65);polygon(b.points,towerSpec.tankHeight,concrete,y+support);polygon(b.points,.25,m.white,y+support+towerSpec.tankHeight);
  landmarks.push({name:t.name,p:safePoint([cx+10,cz]),label:b.center,height:y+support+towerSpec.tankHeight});continue;
 }
 if(!isSac){const bottom=Math.min(y-.25,...b.points.map(p=>terrainSurface.heightAt(...p)-.15));polygon(b.points,y-bottom,m.white,bottom);polygon(b.points,h,m.brick,y);polygon(b.points,.32,m.white,y+h);polygon(b.points,.3,m.roof,y+h+.33);}
 if(isSac){landmarks.push({name:'Open Air Theatre',shortName:'OAT',p:[amph.x,amph.z],label:b.center,height:y+8});continue;}
 // Recessed dark openings, white floor bands and regular white vertical framing.
 for(let i=1;i<b.points.length;i++){const a=b.points[i-1],p=b.points[i],len=Math.hypot(p[0]-a[0],p[1]-a[1]),angle=Math.atan2(p[0]-a[0],p[1]-a[1]);if(len<1)continue;

 for(let level=3.4;level<h;level+=3.4)box(m.white,(a[0]+p[0])/2,y+level,(a[1]+p[1])/2,.35,.3,len,angle);
 for(let d=1.8;d<len-1;d+=3.5){const x=a[0]+(p[0]-a[0])*d/len,z=a[1]+(p[1]-a[1])*d/len;for(let level=2;level<h-1;level+=3.4)box(m.glass,x,y+level,z,.22,1.75,1.55,angle);if(d%7<3.6)box(m.white,x,y+h/2,z,.38,h,.3,angle);}}
 if(!isSac&&t.man_made!=='storage_tank'&&b.id!=='user-mph'){
 // Solar panels follow mapped roof polygons and leave an edge margin.
 const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);for(let x=Math.min(...xs)+4;x<Math.max(...xs)-3;x+=5)for(let z=Math.min(...zs)+4;z<Math.max(...zs)-3;z+=6){if([[x-1.6,z-2],[x+1.6,z+2],[x-1.6,z+2],[x+1.6,z-2]].every(p=>inside(...p,b.points)))box(m.panel,x,y+h+.9,z,3.2,.16,4.2);}
 }
 if(t.amenity==='library'){
 addLibraryFacade(scene,b,garden,m);
 landmarks.push({name:'Library',p:entrances.find(e=>e.buildingId===b.id)?.porch||safePoint(b.center),label:b.center,height:y+h});
 }else if(t.name)landmarks.push({name:t.name,p:entrances.find(e=>e.buildingId===b.id)?.porch||safePoint(b.center),label:b.center,height:y+h});

 }
 // Separate open stepped amphitheatre. A radial opening faces the roundabout.
 const arcStart=-Math.PI*.13,arcLength=Math.PI*1.72;
 // Split seating arcs around the through aisles instead of covering the paths.
 function seatingArcs(radius){const segments=160,arcs=[];let start=null;for(let i=0;i<=segments;i++){const a=arcStart+i*arcLength/segments,open=i<segments&&!inAisle(amph.x+Math.sin(a)*radius,amph.z+Math.cos(a)*radius);if(open&&start===null)start=a;if(!open&&start!==null){arcs.push([start,a-start]);start=null;}}return arcs;}
 for(let i=0;i<amph.steps;i++){const r=amph.inner+(i+1)*(amph.r-amph.inner)/amph.steps,inner=r-(amph.r-amph.inner)/amph.steps;
  for(const [a,len] of seatingArcs(inner)){const segments=Math.max(3,Math.ceil(len*12));mesh(new T.CylinderGeometry(r,r,amph.rise,segments,1,true,a,len),m.brick,amph.x,sac.level+.16+(i+.5)*amph.rise,amph.z);const ring=new T.RingGeometry(inner,r,segments,1,a-Math.PI/2,len);ring.rotateX(-Math.PI/2);mesh(ring,m.white,amph.x,sac.level+.16+(i+1)*amph.rise,amph.z);}
 }
 for(const [a,len] of seatingArcs(amph.r)){const wall=mesh(new T.CylinderGeometry(amph.r+1,amph.r+1,1.2,Math.max(3,Math.ceil(len*12)),1,true,a,len),m.white,amph.x,sac.level+amph.steps*amph.rise+.75,amph.z);wall.material.side=T.DoubleSide;}
 const stage=new T.CircleGeometry(amph.inner,48);stage.rotateX(-Math.PI/2);mesh(stage,m.white,amph.x,sac.level+.17,amph.z);
 // A few dark floor squares echo the paved amphitheatre stage.
 for(let x=-4;x<=4;x+=2)for(let z=-4;z<=4;z+=2)if(Math.hypot(x,z)<5&&((x+z)/2)%2===0)box(m.roof,amph.x+x,sac.level+.2,amph.z+z,1.8,.04,1.8);
 for(const p of ponds){polygon(p.points,0,m.water,p.level);landmarks.push({name:p.name,p:safePoint(center(p.points)),label:center(p.points),height:p.level});}
 // Ground covers and sports surfaces retain map locations.
 const sports=data.features.filter(f=>f.tags.sport);for(const f of sports){const c=center(f.points),h=groundAt(...c)+.2;polygon(f.points,0,material(f.tags.sport==='basketball'?'#9d7052':'#718052'),h);landmarks.push({name:f.tags.sport+' ground',p:safePoint(c),label:c,height:h});}
 addEntrances(entrances,box,m);
 const gateDetails=addGates(gates,scene,box,m,(x,z)=>terrainSurface.heightAt(x,z)-.04);
 const details=addCampusDetails({scene,data,config,buildings,ponds,roads,terrainModel,terrainSurface,groundAt,walkHeight,blocked,mesh,polygon,box,m,walls,noPlants});
 const rb=data.features.find(f=>f.tags.junction==='roundabout'),spawn=safePoint(rb.points[0]);landmarks.unshift({name:'Roundabout',p:spawn,label:center(rb.points),height:groundAt(...center(rb.points))});
 // Dense irregular broadleaf crowns; palms around the Library garden.
 let seed=3954;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trees=[];
 function plantable(x,z){return !noPlants(x,z,11)&&inside(x,z,boundary)&&!(garden&&Math.hypot(x-garden.center[0],z-garden.center[1])<34)&&!inside(x,z,config.landscape.soilGround.points)&&!inside(x,z,config.landscape.bamboo.points)&&Math.hypot(x-details.roundabout[0],z-details.roundabout[1])>16&&!buildings.some(b=>edgeDistance(x,z,b.points)<5)&&!ponds.some(p=>edgeDistance(x,z,p.points)<5)&&!terrainModel.routes.some(r=>distSegment(x,z,r.a,r.b)<r.width/2+3)&&!sports.some(f=>inside(x,z,f.points))&&Math.hypot(x-amph.x,z-amph.z)>amph.r+2;}
 for(let i=0;i<40000&&trees.length<1300;i++){const x=(random()-.5)*700,z=(random()-.5)*800;if(!plantable(x,z))continue;const slope=inside(x,z,config.landscape.woodedSlope.points);if(!slope&&random()>.6)continue;trees.push([x,z,8+random()*10]);}
 // Closely spaced trees on the steep hostel bank and regular shade trees beside roads.
 for(let i=0;i<900;i++){const x=65+random()*100,z=-240+random()*110;if(inside(x,z,config.landscape.woodedSlope.points)&&plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>3))trees.push([x,z,13+random()*7]);}
 for(const r of terrainModel.routes.filter(r=>r.width>4)){for(let d=8;d<r.length;d+=17)for(const side of [-1,1]){const x=r.a[0]+r.dx*d/r.length-side*r.dz/r.length*9,z=r.a[1]+r.dz*d/r.length+side*r.dx/r.length*9;if(plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>5))trees.push([x,z,9+random()*5]);}}

 const foliage=foliageChunks(scene,trees,(x,z)=>terrainSurface.heightAt(x,z)-.04,m),dummy=new T.Object3D();
 if(garden){addLibraryGarden(scene,garden,gardenLevel,m,(x,z)=>terrainSurface.heightAt(x,z)-.04,noPlants);landmarks.push({name:'Library fountain & garden',shortName:'Library garden',p:safePoint(garden.fountain),label:garden.fountain,height:gardenLevel+4});}
 for(const [mat,list] of batches){const inst=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,list.length);list.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.angle,0);dummy.scale.set(b.sx,b.sy,b.sz);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
 const mergedDrawCalls=mergeStaticMeshes(scene);
 for(const g of gates)landmarks.push({name:g.name,p:safePoint(g.point(0,6)),label:g.point(0,0),height:g.level+5});
 return {entrances,gates,gateDetails,foliage,mergedDrawCalls,noPlants,buildings,boundary,ponds,roads,places:landmarks,spawn,groundAt,walkHeight,blocked,safePoint,amph,garden,treeCount:trees.length,trees,walls,details,terrainModel,data,cameraBlocked,roadDetails,terrainSurface,tower:{building:tower,pillars:towerPillars,...towerSpec}};
}

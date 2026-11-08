import {addCrystalFacade} from './crystal.js?v=14';
import {planForecourt,addForecourt} from './turf-forecourt.js?v=14';
import {planCafeteria,addCafeteria} from './cafeteria.js?v=14';
import {academicIds,addAcademicEntrances,academicCanopyBlocked} from './academic.js?v=14';
import {planMedical,addMedical} from './medical.js?v=14';
import {createOat} from './oat.js?v=14';
import {addBasketballCourt} from './basketball.js?v=14';
import {addAvenueShrubs,addBanyan} from './planting.js?v=14';
import {perimeterRails,addSurveyDetails,addTurf} from './site-details.js?v=14';
import {applyReferenceLayout,libraryGarden} from './layout.js?v=14';
import {addLibraryFacade,addLibraryGarden} from './library.js?v=6';
import * as T from './vendor/three.module.js';
import {inside,distSegment,center,edgeDistance} from './geometry.js?v=6';
export {inside,distSegment,center} from './geometry.js?v=6';
import {addRoads} from './roads.js?v=14';
import {createTerrainSurface} from './terrain-mesh.js?v=14';
import {planEntrances,entrancePaths,clearOfEntrances,addEntrances,hostelStepHeight,riser} from './entrances.js?v=14';
import {planGates,addGates} from './gates.js?v=14';
import {foliageChunks,mergeStaticMeshes} from './render-utils.js?v=14';
import {makeTerrain} from './terrain.js?v=14';
import {addCampusDetails,wallSegments} from './campus-details.js?v=14';
export function buildWorld(scene,data,config){
 data=applyReferenceLayout(data,config);
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.9,...extra});
 const m={brick:material('#8e4435'),white:material('#dadbd2'),roof:material('#9c998c'),glass:material('#344c50',{roughness:.3,metalness:.25}),road:material('#343738'),path:material('#a29880'),soil:material('#a4865c'),leaf:material('#244d30'),trunk:material('#655744'),water:material('#516b46',{roughness:.24,metalness:.2}),panel:material('#273744',{roughness:.35}),lawn:material('#547241')};
 const buildings=data.features.filter(f=>f.tags.building).map(f=>({...f,center:center(f.points)}));
 const boundary=data.features.find(f=>f.tags.amenity==='university').points;
 const ponds=[...data.features.filter(f=>f.tags.natural==='water').map(f=>({...f,name:f.tags.name||'Bhagirati',source:'OpenStreetMap'})),...config.extraPonds];
 const sites={...config.layout.surveySites,umbrellaLevel:config.layout.cafeSeating.level+.10},rails=perimeterRails(ponds,sites.fences);
 const sac=buildings.find(b=>b.id==='618490372'),oat=config.layout?.oat||{};const amph={x:oat.center?.[0]??sac.center[0],z:oat.center?.[1]??sac.center[1]-2,r:oat.radius||17,inner:oat.innerRadius||6,steps:oat.steps||12,rise:oat.rise||.34};
 const garden=libraryGarden(data.features,config),lib=buildings.find(b=>b.tags.amenity==='library');


 const baseTerrain=makeTerrain(data,config,buildings,ponds);
 const entrances=config.layout.entrances||planEntrances(data,buildings,ponds,baseTerrain,config);
 data={...data,features:[...data.features,...entrancePaths(entrances,baseTerrain)]};
 const hostelSteps=entrances.filter(e=>e.stepCount);
 let pitch=null,basketball=null;
 const terrainModel=makeTerrain(data,config,buildings,ponds);
 const {groundAt}=terrainModel;
 const clinic=entrances.find(e=>e.name==='Medical Services');
 const medical=planMedical(clinic,terrainModel.routes);
 const cafeEntry=entrances.find(e=>e.buildingId==='cafeteria');
 const cafe=planCafeteria(cafeEntry,sites.umbrellaCentres);
 const forecourt=planForecourt(config);
 const columns=entrances.flatMap(e=>e===clinic?medical.posts:e===cafeEntry?cafe.posts:e.buildingId==='crystal-hostel'?[-1,1].map(side=>[e.door[0]+e.right[0]*side*2.35+e.n[0]*.3,e.door[1]+e.right[1]*side*2.35+e.n[1]*.3]):e.pillars);
 const sports=data.features.filter(f=>f.tags.sport);
 const courts=sports.filter(f=>f.tags.sport!=='soccer');
 const fieldEdges=[...sports,forecourt].flatMap(f=>f.points.slice(1).map((b,i)=>({a:f.points[i],b,width:1})));
 const terrainSurface=createTerrainSurface(groundAt,[...terrainModel.routes,...fieldEdges]);
 const gardenLevel=lib.level+.02;
 const gates=planGates(config,groundAt);
 const noPlants=(x,z,margin=0)=>forecourt.clear(x,z,margin+1)||cafe.noPlants(x,z,margin)||medical.clearPlanting(x,z,margin)||sites.umbrellaCentres.some(p=>Math.hypot(x-p[0],z-p[1])<2.2+margin)||Math.hypot(x-sites.shrine[0],z-sites.shrine[1])<2+margin||!clearOfEntrances(x,z,entrances,margin)||gates.some(g=>Math.hypot(x-g.center[0],z-g.center[1])<g.width/2+7+margin);
 const towerSpec=config.layout.waterTower,tower=buildings.find(b=>b.id===towerSpec.id);
 const towerPillars=tower.points.slice(0,4).map(p=>[tower.center[0]+(p[0]-tower.center[0])*.67,tower.center[1]+(p[1]-tower.center[1])*.67]);
 const walls=wallSegments(boundary,terrainModel.routes,config.landscape.boundaryWall);
 const aisleRoutes=terrainModel.routes.filter(r=>oat.aisleRoutes.includes(r.id));
 const theatre=createOat(amph,sac.level,aisleRoutes);
 const routeCells=new Map();for(const r of terrainModel.routes){const m=r.width/2+2;for(let x=Math.floor((Math.min(r.a[0],r.b[0])-m)/32);x<=Math.floor((Math.max(r.a[0],r.b[0])+m)/32);x++)for(let z=Math.floor((Math.min(r.a[1],r.b[1])-m)/32);z<=Math.floor((Math.max(r.a[1],r.b[1])+m)/32);z++){const k=x+','+z;if(!routeCells.has(k))routeCells.set(k,[]);routeCells.get(k).push(r);}}
 function walkHeight(x,z){
  if(forecourt.contains(x,z))return forecourt.level+.16;
  const cafeFloor=cafe.heightAt(x,z);if(cafeFloor!==null)return cafeFloor;
  for(const e of hostelSteps){const step=hostelStepHeight(x,z,e);if(step!==null)return step;}
  const stair=terrainModel.stairHeight(x,z);
  if(stair!==null)return stair;
  if(medical.apron(...medical.local(x,z)))return terrainSurface.heightAt(x,z)+.177;
  if(pitch?.contains(x,z)||courts.some(f=>inside(x,z,f.points)))return terrainSurface.heightAt(x,z)+.16;
  const nearby=routeCells.get(Math.floor(x/32)+','+Math.floor(z/32))||[],road=nearby.some(r=>distSegment(x,z,r.a,r.b)<=r.width/2+.1);return Math.max(terrainSurface.heightAt(x,z)+(road?.14:-.04),theatre.heightAt(x,z)??-Infinity);}
 function exteriorGate(x,z){return gates.find(g=>{
   const dx=x-g.center[0],dz=z-g.center[1],along=dx*g.n[0]+dz*g.n[1],across=dx*g.right[0]+dz*g.right[1];
   return along<=2&&along>=-g.exteriorLength&&Math.abs(across)<g.width/2-.8;
 });}
 const exteriorRoad=(x,z)=>!!exteriorGate(x,z);
 function blocked(x,z){if(cafe.blocked(x,z)||medical.blocked(x,z)||theatre.blocked(x,z))return true;if(pitch?.blocked(x,z)||basketball?.blocked(x,z))return true;if(rails.some(r=>distSegment(x,z,r.a,r.b)<.42))return true;if(columns.some(p=>Math.hypot(x-p[0],z-p[1])<.9)||gates.some(g=>g.obstacles.some(o=>Math.hypot(x-o.p[0],z-o.p[1])<o.r)))return true;if((!inside(x,z,boundary)&&!exteriorRoad(x,z))||walls.some(w=>distSegment(x,z,w.a,w.b)<config.landscape.boundaryWall.thickness/2+.35))return true;if(garden&&Math.hypot(x-garden.fountain[0],z-garden.fountain[1])<garden.basinRadius+.6)return true;if(ponds.some(p=>edgeDistance(x,z,p.points)<.8))return true;return buildings.some(b=>{if(b===sac)return false;if(b===tower)return towerPillars.some(p=>Math.hypot(x-p[0],z-p[1])<towerSpec.pillarWidth*.75+.45);return edgeDistance(x,z,b.groundPoints||b.points)<.65;});}
 function cameraBlocked(x,y,z){
   if(cafe.cameraBlocked(x,y,z))return true;
   if(theatre.cameraBlocked(x,y,z))return true;
   if(medical.cameraBlocked(x,y,z)||y<clinic.level+4.3&&medical.posts.some(p=>Math.hypot(x-p[0],z-p[1])<.5))return true;
   if(basketball?.cameraBlocked(x,y,z))return true;
   if(!inside(x,z,boundary)&&!exteriorRoad(x,z))return true;
   if(entrances.some(e=>{if(e===clinic||e===cafeEntry||e.buildingId==='crystal-hostel')return false;if(academicIds.has(e.buildingId))return academicCanopyBlocked(x,y,z,e);const dx=x-e.door[0],dz=z-e.door[1],u=dx*e.right[0]+dz*e.right[1],v=dx*e.n[0]+dz*e.n[1];return Math.abs(u)<3.6&&v>-.8&&v<4.3&&y>e.level+3.4&&y<e.level+4.3;}))return true;
   if(terrainModel.routes.some(r=>r.covered&&distSegment(x,z,r.a,r.b)<r.width/2+.6&&Math.abs(y-r.y0-3.85)<.4))return true;
   if(entrances.some(e=>e.buildingId!=='crystal-hostel'&&e!==clinic&&e!==cafeEntry&&y<e.level+4.3&&e.pillars.some(p=>Math.hypot(x-p[0],z-p[1])<.9)))return true;
   if(gates.some(g=>g.obstacles.some(o=>y<g.level+4.7&&Math.hypot(x-o.p[0],z-o.p[1])<o.r)))return true;
   if(walls.some(w=>distSegment(x,z,w.a,w.b)<.6&&y<groundAt(x,z)+config.landscape.boundaryWall.height+.2))return true;
   return buildings.some(b=>{
    if(b===sac)return false;
    if(b===tower)return y<b.level+towerSpec.supportHeight?towerPillars.some(p=>Math.hypot(x-p[0],z-p[1])<.8):y<b.level+towerSpec.supportHeight+towerSpec.tankHeight+1&&edgeDistance(x,z,b.points)<.5;
    const footprint=b.groundPoints&&y<b.level+b.passageHeight-.1?b.groundPoints:b.points;
    return y<b.level+b.height+1&&edgeDistance(x,z,footprint)<.5;
   });
 }
 function safePoint(p){for(let r=0;r<100;r+=2)for(let a=0;a<6.29;a+=.25){const x=p[0]+Math.cos(a)*r,z=p[1]+Math.sin(a)*r;if(inside(x,z,boundary)&&!blocked(x,z))return[x,z];}throw new Error('No walkable point near destination');}
 function mesh(g,mat,x=0,y=0,z=0){const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;scene.add(o);return o;}
 function polygon(p,h,mat,y){const s=new T.Shape(p.map(v=>new T.Vector2(v[0],-v[1])));const g=h?new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false}):new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);return mesh(g,mat,0,y,0);}
 const batches=new Map();function box(mat,x,y,z,sx,sy,sz,angle=0){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({x,y,z,sx,sy,sz,angle});}
 // Draw the mapped soil boundary exactly, including its concave corners.
 const soilRing=config.landscape.soilGround.points.slice(0,-1);
 const surfaceSoil=[];
 for(const tri of T.ShapeUtils.triangulateShape(soilRing.map(p=>new T.Vector2(...p)),[])){
   terrainSurface.project(tri.map(i=>soilRing[i]),.025,surfaceSoil);
 }
 const soilGeometry=new T.BufferGeometry();
 soilGeometry.setAttribute('position',new T.Float32BufferAttribute(surfaceSoil,3));soilGeometry.computeVertexNormals();
 const clearing=mesh(soilGeometry,m.soil);clearing.castShadow=false;
 const terr=mesh(terrainSurface.geometry,material('#ffffff',{vertexColors:true}));terr.castShadow=false;
 const roadDetails=addRoads(scene,data,boundary,groundAt,blocked,m,terrainSurface,exteriorRoad,medical.inDriveway);
 const {roads}=roadDetails;
 const flight=terrainModel.routes.find(r=>r.id==='hostel-stairs');
 const lowerRoad=data.features.find(f=>f.id==='365911691');
 const stairView=lowerRoad.points[1];
 const landmarks=[{name:'OAT hostel steps',p:stairView,viewToward:flight.b,label:flight.a,height:flight.y0+.5}];
 for(const b of buildings){const t=b.tags,h=b.height,y=b.level+(config.layout.entranceStairs?.[b.id]||0)*riser,[cx,cz]=b.center;const isSac=b===sac;
 if(b===tower){
  const concrete=material('#b9b4a5'),support=towerSpec.supportHeight;
  for(const p of towerPillars)box(concrete,p[0],y+support/2,p[1],towerSpec.pillarWidth,support,towerSpec.pillarWidth);
  for(const elevation of [support*.33,support*.66,support])for(let i=0;i<4;i++){const a=towerPillars[i],p=towerPillars[(i+1)%4];box(concrete,(a[0]+p[0])/2,y+elevation,(a[1]+p[1])/2,.55,.7,Math.hypot(p[0]-a[0],p[1]-a[1]),Math.atan2(p[0]-a[0],p[1]-a[1]));}
  polygon(b.points,.65,concrete,y+support-.65);polygon(b.points,towerSpec.tankHeight,concrete,y+support);polygon(b.points,.25,m.white,y+support+towerSpec.tankHeight);
  landmarks.push({name:t.name,p:safePoint([cx+10,cz]),label:b.center,height:y+support+towerSpec.tankHeight});continue;
 }
 if(isSac){landmarks.push({name:'Open Air Theatre',shortName:'OAT',p:theatre.view,viewToward:theatre.aim,label:b.center,height:y+8});continue;}
 const footprint=b.groundPoints||b.points;
 const bottom=Math.min(y-.25,...footprint.map(p=>terrainSurface.heightAt(...p)-.15));
 polygon(footprint,y-bottom,m.white,bottom);
 const wings=b.groundPoints?[
   {points:footprint,base:y,height:b.passageHeight},
   {points:b.points,base:y+b.passageHeight,height:h-b.passageHeight}
 ]:[{points:b.points,base:y,height:h}];
 for(const {points,base,height} of wings){
   polygon(points,height,m.brick,base);
   for(let i=1;i<points.length;i++){
     const a=points[i-1],p=points[i],len=Math.hypot(p[0]-a[0],p[1]-a[1]);
     if(len<1)continue;
     const angle=Math.atan2(p[0]-a[0],p[1]-a[1]);
     for(let level=3.4;level<height;level+=3.4)box(m.white,(a[0]+p[0])/2,base+level,(a[1]+p[1])/2,.35,.3,len,angle);
     for(let d=1.8;d<len-1;d+=3.5){
       const x=a[0]+(p[0]-a[0])*d/len,z=a[1]+(p[1]-a[1])*d/len;
       for(let level=2;level<height-1;level+=3.4)box(m.glass,x,base+level,z,.22,1.75,1.55,angle);
       if(d%7<3.6)box(m.white,x,base+height/2,z,.38,height,.3,angle);
     }
   }
 }
 polygon(b.points,.32,m.white,y+h);polygon(b.points,.3,m.roof,y+h+.33);
 if(!isSac&&t.man_made!=='storage_tank'&&b.id!=='user-mph'){
 // Solar panels follow mapped roof polygons and leave an edge margin.
 const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);for(let x=Math.min(...xs)+4;x<Math.max(...xs)-3;x+=5)for(let z=Math.min(...zs)+4;z<Math.max(...zs)-3;z+=6){if([[x-1.6,z-2],[x+1.6,z+2],[x-1.6,z+2],[x+1.6,z-2]].every(p=>inside(...p,b.points)))box(m.panel,x,y+h+.9,z,3.2,.16,4.2);}
 }
 if(t.amenity==='library')addLibraryFacade(scene,b,garden,m);
 const name=t.amenity==='library'?'Library':t.name;
 if(name){
   const entrance=entrances.find(e=>e.buildingId===b.id);
   const destination=b.id==='crystal-hostel'?entrance.end:academicIds.has(b.id)?entrance.end:entrance===cafeEntry?cafe.spawn:entrance===clinic?safePoint(medical.spawn):entrance?.stepCount?entrance.end:entrance?.porch||safePoint(b.center);
   landmarks.push({name,p:destination,door:entrance?.door,viewToward:academicIds.has(b.id)?entrance.door:entrance===cafeEntry?cafe.aim:entrance===clinic?medical.aim:undefined,viewPitch:entrance===clinic?.16:undefined,label:b.center,height:y+h});
 }

 }
 theatre.draw({mesh,polygon,box,m,outline:sac.points});
 for(const p of ponds){polygon(p.points,0,m.water,p.level);landmarks.push({name:p.name,p:safePoint(center(p.points)),label:center(p.points),height:p.level});}
 // Ground covers and sports surfaces retain map locations.
 for(const f of sports){
   const c=center(f.points);
   if(f.tags.sport==='soccer')pitch=addTurf(scene,f.points,terrainSurface);
   else if(f.tags.sport==='basketball')basketball=addBasketballCourt(scene,f.points,terrainSurface);
   else{
     const vertices=[];terrainSurface.project(f.points.slice(0,-1),.16,vertices);
     const geometry=new T.BufferGeometry();
     geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
     mesh(geometry,material('#718052')).castShadow=false;
   }
   landmarks.push({name:f.tags.name||f.tags.sport+' ground',p:f.tags.sport==='soccer'?pitch.spawn:f.tags.sport==='basketball'?basketball.spawn:safePoint(c),viewToward:f.tags.sport==='basketball'?basketball.aim:undefined,label:c,height:terrainSurface.heightAt(...c)+.16});
 }
 const access=data.features.find(f=>f.id==='turf-soil-road');
 const gateView=access.points.at(-3);
 landmarks.push({name:'Football turf entrance',p:gateView,viewToward:pitch.gate,label:pitch.gate,height:walkHeight(...pitch.gate)+1});
 addSurveyDetails({scene,rails,sites,surface:terrainSurface,mesh,box,m});
 for(const [name,p] of [['Muthiyammain Kshethram',sites.shrine],['Cafeteria seating',sites.umbrellaCentres[0]]]){
   const approach=name==='Muthiyammain Kshethram'?[p[0]+5,p[1]+4]:[p[0]-2,p[1]];
   landmarks.push({name,p:safePoint(approach),viewToward:p,label:p,height:walkHeight(...p)+1});
 }
 addCrystalFacade(entrances.find(e=>e.buildingId==='crystal-hostel'),buildings.find(b=>b.id==='crystal-hostel'),box,m);
 addCafeteria({scene,cafe,box,m,mesh,polygon});
 addForecourt(forecourt,box,polygon,m);
 addMedical(scene,medical,terrainSurface,box,m);
 addAcademicEntrances(scene,entrances,buildings,m);
 addEntrances(entrances.filter(e=>e.buildingId!=='crystal-hostel'&&e!==cafeEntry&&e!==clinic&&!academicIds.has(e.buildingId)),box,m);
 addBanyan({site:sites.shrine,surface:terrainSurface,mesh});
 const avenueShrubs=addAvenueShrubs({scene,config,routes:terrainModel.routes,buildings,boundary,surface:terrainSurface,noPlants});
 const gateDetails=addGates(gates,scene,box,m,(x,z)=>terrainSurface.heightAt(x,z)-.04);
 const details=addCampusDetails({scene,data,config,buildings,ponds,roads,terrainModel,terrainSurface,groundAt,walkHeight,blocked,mesh,polygon,box,m,walls,noPlants});
 const rb=data.features.find(f=>f.tags.junction==='roundabout'),spawn=safePoint(rb.points[0]);landmarks.unshift({name:'Roundabout',p:spawn,label:center(rb.points),height:groundAt(...center(rb.points))});
 // Dense irregular broadleaf crowns; palms around the Library garden.
 let seed=3954;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trees=[];
 function plantable(x,z){return !noPlants(x,z,11)&&inside(x,z,boundary)&&!(garden&&Math.hypot(x-garden.center[0],z-garden.center[1])<34)&&!inside(x,z,config.landscape.soilGround.points)&&!inside(x,z,config.landscape.bamboo.points)&&Math.hypot(x-details.roundabout[0],z-details.roundabout[1])>16&&!buildings.some(b=>edgeDistance(x,z,b.points)<5)&&!ponds.some(p=>edgeDistance(x,z,p.points)<5)&&!terrainModel.routes.some(r=>distSegment(x,z,r.a,r.b)<r.width/2+(r.covered||r.steps||oat.aisleRoutes.includes(r.id)||r.id.startsWith('hostel-')||r.id==='turf-soil-road'?9:3))&&!sports.some(f=>edgeDistance(x,z,f.points)<3)&&Math.hypot(x-amph.x,z-amph.z)>amph.r+2;}
 for(const r of terrainModel.routes.filter(r=>r.id==='365911682')){for(let d=8;d<r.length;d+=17)for(const side of [-1,1]){const x=r.a[0]+r.dx*d/r.length-side*r.dz/r.length*9,z=r.a[1]+r.dz*d/r.length+side*r.dx/r.length*9;if(plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>5))trees.push([x,z,9+random()*5]);}}
 for(let i=0;i<40000&&trees.length<1300;i++){const x=(random()-.5)*700,z=(random()-.5)*800;if(!plantable(x,z))continue;const slope=inside(x,z,config.landscape.woodedSlope.points);if(!slope&&random()>.6)continue;trees.push([x,z,8+random()*10]);}
 // Closely spaced trees on the steep hostel bank and regular shade trees beside roads.
 for(let i=0;i<900;i++){const x=65+random()*100,z=-240+random()*110;if(inside(x,z,config.landscape.woodedSlope.points)&&plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>3))trees.push([x,z,13+random()*7]);}


 for(const r of terrainModel.routes.filter(r=>r.width>4&&r.id!=='365911682')){for(let d=8;d<r.length;d+=17)for(const side of [-1,1]){const x=r.a[0]+r.dx*d/r.length-side*r.dz/r.length*9,z=r.a[1]+r.dz*d/r.length+side*r.dx/r.length*9;if(plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>5))trees.push([x,z,9+random()*5]);}}
 const forest=config.landscape.libraryForest;
 const clearingCenter=center(config.landscape.soilGround.points);
 landmarks.push({name:'Library ground',p:safePoint(clearingCenter),viewToward:center(forest.core),label:clearingCenter,height:groundAt(...clearingCenter)});
 for(let i=0;i<620;i++){
   const x=12+random()*99,z=-74+random()*76;
   if(inside(x,z,forest.points)&&plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>4.8))
     trees.push([x,z,8+random()*8]);
 }
 const foliage=foliageChunks(scene,trees,(x,z)=>terrainSurface.heightAt(x,z)-.04,m),dummy=new T.Object3D();
 if(garden){addLibraryGarden(scene,garden,gardenLevel,m,(x,z)=>terrainSurface.heightAt(x,z)-.04,noPlants);landmarks.push({name:'Library fountain & garden',shortName:'Library garden',p:safePoint(garden.fountain),label:garden.fountain,height:gardenLevel+4});}
 for(const [mat,list] of batches){const inst=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,list.length);list.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.angle,0);dummy.scale.set(b.sx,b.sy,b.sz);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
 const mergedDrawCalls=mergeStaticMeshes(scene);
 for(const g of gates)landmarks.push({name:g.name,p:safePoint(g.point(0,6)),label:g.point(0,0),height:g.level+5});
 return {cafeUmbrellas:sites.umbrellaCentres,forecourt,cafe,medical,landscape:config.landscape,pitch,basketball,avenueShrubs,rails,exteriorRoad,exteriorGate,entrances,gates,gateDetails,foliage,mergedDrawCalls,noPlants,buildings,boundary,ponds,roads,places:landmarks,spawn,groundAt,walkHeight,blocked,safePoint,amph,garden,treeCount:trees.length,trees,walls,details,terrainModel,data,cameraBlocked,roadDetails,terrainSurface,tower:{building:tower,pillars:towerPillars,...towerSpec}};
}

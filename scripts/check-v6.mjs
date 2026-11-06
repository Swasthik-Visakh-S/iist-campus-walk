import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';
import {createCharacter} from '../dist/character.js';
import {buildWorld,distSegment} from '../dist/world.js';import {resetMotion,stepMotion} from '../dist/movement.js';import {chooseQuality,qualitySettings,applyQuality} from '../dist/quality.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/'+n,import.meta.url))),scene=new T.Scene(),avatar=createCharacter();scene.add(avatar.root);const start=performance.now(),w=buildWorld(scene,read('campus.json'),read('model-config.json'));
assert.equal(avatar.root.parent,scene);assert(avatar.root.children.length>0);for(const leg of avatar.legs){let p=leg;while(p&&p!==avatar.root)p=p.parent;assert.equal(p,avatar.root,'Static batching must preserve the animated rig');}
assert.equal(w.entrances.length,27);assert.equal(w.gates.length,2);assert.equal(w.gateDetails.officers,4);
for(const e of w.entrances){
 assert(!w.blocked(...e.porch),e.name+' porch blocked');
 const length=Math.hypot(e.end[0]-e.porch[0],e.end[1]-e.porch[1]),steps=Math.ceil(length/.12),s={};resetMotion(s,...e.end,w);
 for(let k=0;k<steps;k++)stepMotion(s,(e.porch[0]-e.end[0])/steps,(e.porch[1]-e.end[1])/steps,1/60,false,w);
 assert(Math.hypot(s.x-e.porch[0],s.z-e.porch[1])<.5,e.name+' approach is not walkable');
 for(const t of w.trees)assert(distSegment(t[0],t[1],e.porch,e.end)>e.width/2+11,'Tree crown intrudes on '+e.name+' approach');
 for(const t of w.details.bambooPositions)assert(!w.noPlants(...t,4),'Bamboo intrudes on an entrance');
}
const med=w.medical;
assert(Math.abs(med.roadEdge(0)-4)<.5,'Clinic entrance has four metres of frontage');
assert(w.blocked(...med.at(med.parked.u,med.parked.v)),'Parked ambulance has collision');
for(let v=1;v<med.roadEdge(0)+1;v+=.2)assert(!w.blocked(...med.at(0,v)),'Clear walk to clinic door');
const oat=w.places.find(p=>p.name==='Open Air Theatre');assert(!w.blocked(...oat.p));
const stageLink=w.data.features.find(f=>f.id==='oat-stage-access');
assert.deepEqual(stageLink.points.at(-1),[w.amph.x,w.amph.z],'Stage remains accessible from the through aisle');
// Raycast the photo-based stage and seating to catch invisible or inverted tops.
scene.updateMatrixWorld(true);
for(const [dx,dz] of [[1.15,1.1],[-3,-12],[3,-15]]){
 const x=w.amph.x+dx,z=w.amph.z+dz,y=w.walkHeight(x,z);
 const ray=new T.Raycaster(new T.Vector3(x,y+.5,z),new T.Vector3(0,-1,0),0,.8);
 const hit=ray.intersectObjects(scene.children)[0];
 assert(hit&&Math.abs(hit.point.y-y)<.03,'Visible solid OAT surface agrees with walking height');
}
assert(w.blocked(w.amph.x,w.amph.z+5.75),'Solid stage backdrop stops the player');
for(const g of w.gates){assert(!w.blocked(...w.safePoint(g.point(0,6))));for(const t of w.trees)assert(Math.hypot(t[0]-g.center[0],t[1]-g.center[1])>g.width/2+18,'Gate approach clear of trees');}
assert.equal(chooseQuality('auto',{coarse:true,width:390,cores:8}),'low');assert.equal(chooseQuality('auto',{width:1400,cores:8}),'balanced');assert.equal(chooseQuality('high',{coarse:true}),'high');assert.equal(qualitySettings('low').shadows,false);
const renderer={shadowMap:{},setPixelRatio(n){this.ratio=n}},sun={shadow:{}};applyQuality(renderer,sun,w,'low',3);assert.equal(renderer.ratio,1);assert.equal(renderer.shadowMap.autoUpdate,false);assert(w.foliage.every(g=>g.crowns.count===g.trunks.count*3));applyQuality(renderer,sun,w,'high',2);assert(w.foliage.every(g=>g.trunks.count===g.count));
let draws=0,triangles=0;scene.traverse(o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamic)return;if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
assert(draws<220,'Static geometry is batched');assert(triangles<1500000,'Full-detail geometry stays within the budget');
console.log(JSON.stringify({entrances:w.entrances.length,officers:w.gateDetails.officers,draws,triangles:Math.round(triangles),mergedDrawCalls:w.mergedDrawCalls,buildMs:Math.round(performance.now()-start)}));
console.log('Passed entrance access, vegetation clearance, connected OAT paths, gate approaches and graphics budgets.');

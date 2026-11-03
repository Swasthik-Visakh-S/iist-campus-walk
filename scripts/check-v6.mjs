import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';
import {createCharacter} from '../dist/character.js';
import {buildWorld,distSegment} from '../dist/world.js';import {resetMotion,stepMotion} from '../dist/movement.js';import {chooseQuality,qualitySettings,applyQuality} from '../dist/quality.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/'+n,import.meta.url))),scene=new T.Scene(),avatar=createCharacter();scene.add(avatar.root);const start=performance.now(),w=buildWorld(scene,read('campus.json'),read('model-config.json'));
assert.equal(avatar.root.parent,scene);assert(avatar.root.children.length>0);for(const leg of avatar.legs){let p=leg;while(p&&p!==avatar.root)p=p.parent;assert.equal(p,avatar.root,'Static batching must preserve the animated rig');}
assert.equal(w.entrances.length,22);assert.equal(w.gates.length,2);assert.equal(w.gateDetails.officers,4);
for(const e of w.entrances){
 assert(!w.blocked(...e.porch),e.name+' porch blocked');
 const length=Math.hypot(e.end[0]-e.porch[0],e.end[1]-e.porch[1]),steps=Math.ceil(length/.12),s={};resetMotion(s,...e.end,w);
 for(let k=0;k<steps;k++)stepMotion(s,(e.porch[0]-e.end[0])/steps,(e.porch[1]-e.end[1])/steps,1/60,false,w);
 assert(Math.hypot(s.x-e.porch[0],s.z-e.porch[1])<.5,e.name+' approach is not walkable');
 for(const t of w.trees)assert(distSegment(t[0],t[1],e.porch,e.end)>e.width/2+11,'Tree crown intrudes on '+e.name+' approach');
 for(const t of w.details.bambooPositions)assert(!w.noPlants(...t,4),'Bamboo intrudes on an entrance');
}
const oat=w.places.find(p=>p.name==='Open Air Theatre');assert(!w.blocked(...oat.p));
for(const id of ['sac-oat-link','oat-mph-link']){const f=w.data.features.find(f=>f.id===id);assert(f.points.some(p=>Math.hypot(p[0]-w.amph.x,p[1]-w.amph.z)<.01),'Path passes through OAT stage');}
assert.deepEqual(w.data.features.find(f=>f.id==='365911687').points[0],[24,-145],'Invented MPH road loop removed');
for(const g of w.gates){assert(!w.blocked(...w.safePoint(g.point(0,6))));for(const t of w.trees)assert(Math.hypot(t[0]-g.center[0],t[1]-g.center[1])>g.width/2+18,'Gate approach clear of trees');}
assert.equal(chooseQuality('auto',{coarse:true,width:390,cores:8}),'low');assert.equal(chooseQuality('auto',{width:1400,cores:8}),'balanced');assert.equal(chooseQuality('high',{coarse:true}),'high');assert.equal(qualitySettings('low').shadows,false);
const renderer={shadowMap:{},setPixelRatio(n){this.ratio=n}},sun={shadow:{}};applyQuality(renderer,sun,w,'low',3);assert.equal(renderer.ratio,1);assert.equal(renderer.shadowMap.autoUpdate,false);assert(w.foliage.every(g=>g.crowns.count===g.trunks.count*3));applyQuality(renderer,sun,w,'high',2);assert(w.foliage.every(g=>g.trunks.count===g.count));
let draws=0,triangles=0;scene.traverse(o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamic)return;if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
assert(draws<220,'Static geometry is batched');assert(triangles<1500000,'Full-detail geometry stays within the budget');
console.log(JSON.stringify({entrances:w.entrances.length,officers:w.gateDetails.officers,draws,triangles:Math.round(triangles),mergedDrawCalls:w.mergedDrawCalls,buildMs:Math.round(performance.now()-start)}));
console.log('Passed entrance access, vegetation clearance, connected OAT paths, gate approaches and graphics budgets.');

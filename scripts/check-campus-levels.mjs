import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildWorld} from '../dist/world.js';
import {distSegment} from '../dist/geometry.js';
import {resetMotion,stepMotion} from '../dist/movement.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/'+n+'.json',import.meta.url)));
const config=read('model-config'),scene=new T.Scene(),w=buildWorld(scene,read('campus'),config);
const routes=id=>w.terrainModel.routes.filter(r=>r.id===id);
// The main descent ends at Rohini; there must be no second artificial hill.
const rohini=routes('365911691');
assert(rohini[0].y0-rohini[5].y1>=9);
assert(rohini.some(r=>(r.y0-r.y1)/r.length>.2));
for(const r of rohini.slice(6))assert(Math.abs(r.y1-r.y0)/r.length<.05);
// Check both shoulders away from junctions/doorways, not just the asphalt centre.
for(const [id,indices] of [['365911682',[1,2,3,4,5,6,7,8,9,10,11,15,16]],['618490368',[1,2,3,5,6,7,8,9]]]){
 for(const index of indices){const r=routes(id)[index],x=(r.a[0]+r.b[0])/2,z=(r.a[1]+r.b[1])/2;
  for(const sign of [-1,1])assert(Math.abs(w.groundAt(x-sign*r.dz/r.length*6,z+sign*r.dx/r.length*6)-w.groundAt(x,z))<.5,'Raised verge '+id+' '+index);
 }
}
const avenue=routes('365911682');
for(const side of [-1,1]){
 const trees=w.trees.filter(([x,z])=>avenue.some(r=>distSegment(x,z,r.a,r.b)<12&&Math.sign(r.dx*(z-r.a[1])-r.dz*(x-r.a[0]))===side));
 assert(trees.length>=8,'Trees on both sides of the academic approach');
}
const forecourt=w.forecourt;
for(const p of [[190,-55],[204,-56],[211,-53]]){
 assert(forecourt.contains(...p));assert.equal(w.walkHeight(...p),13.16);
 assert(!w.blocked(...p));assert(w.noPlants(...p));
}
const soil=w.data.features.find(f=>f.id==='turf-soil-road');
assert(soil.points.every(p=>p[1]>-55),'Soil access no longer follows Crystal Jubilee entrance');
assert(soil.points.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-soil.points[i][0],p[1]-soil.points[i][1]),0)<22);
// Both the stairs and accessible side ramp reach the cafe landing through its fence opening.
function walk(points){const player={};resetMotion(player,...points[0],w);for(const q of points.slice(1)){
 const dx=q[0]-player.x,dz=q[1]-player.z,n=Math.ceil(Math.hypot(dx,dz)/.08);
 for(let i=0;i<n;i++)stepMotion(player,dx/n,dz/n,1/60,false,w);
 assert(Math.hypot(player.x-q[0],player.z-q[1])<.1,'Cafe path obstructed');
}}
const c=w.cafe;
for(let u=-21;u<8;u+=.5)for(let v=.5;v<13;v+=.5){if(u<-8.3&&v>8.5)continue;assert(w.terrainSurface.heightAt(...c.at(u,v))<c.level+.12,'Terrain must stay below cafe paving');}
const umbrellas=w.cafeUmbrellas.map(p=>c.local(...p));
assert.equal(umbrellas.length,8);assert(umbrellas.every(p=>p[0]<-3.5));assert.equal(umbrellas.filter(p=>p[0]<-7).length,5);
for(const p of w.cafeUmbrellas){assert(w.blocked(...p));assert(Math.abs(w.walkHeight(...p)-c.level-.14)<.001);}
const upper=routes('365911690').slice(1),crystal=routes('365910893').slice(1,3);
assert(upper.every(r=>r.y1<r.y0&&Math.abs(r.y1-r.y0)/r.length<.06));
assert(crystal.every(r=>Math.abs(r.y1-r.y0)/r.length>.2&&Math.abs(r.y1-r.y0)/r.length<.51));
assert(c.cameraBlocked(...(()=>{const p=c.at(6,8);return [p[0],c.level+3.15,p[1]]})()),'Solid right-hand shed ceiling');
walk([[0,12],[0,9],[0,3],[0,1]].map(p=>c.at(...p)));
walk([[0,12],[0,9],[-2.3,8],[-2.3,2],[-2.3,1]].map(p=>c.at(...p)));
assert(c.entry.n[0]<-.8,'Cafe faces the Dhruva road');
const building=w.buildings.find(b=>b.id==='cafeteria');
const gaps=building.points.slice(0,-1).map(p=>Math.min(...w.boundary.slice(1).map((b,i)=>distSegment(...p,b,w.boundary[i])))).sort((a,b)=>a-b);
assert(gaps[1]<1,'Rear of cafeteria is against the campus boundary');
assert(scene.getObjectByName('Academic entrances and ventilated facades'));
assert.equal(config.layout.scaleReference.metresPerWorldUnit,1);
assert(Math.abs(config.layout.scaleReference.landmarkFitPixelsPerMetre/(75/50)-1)<.05);
console.log('Passed Rohini grades, level road verges, academic tree rows, turf forecourt, cafe stair/ramp access and scale reference.');

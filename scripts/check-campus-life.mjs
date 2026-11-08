import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.js';
import {buildWorld,inside,center,distSegment} from '../dist/world.js';
import {createResidents} from '../dist/residents.js';
import {resetMotion,stepMotion} from '../dist/movement.js';
import {tread,landing,riser} from '../dist/entrances.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../dist/'+name,import.meta.url)));
const config=read('model-config.json'),scene=new T.Scene(),w=buildWorld(scene,read('campus.json'),config);
for(const [name,count] of [['Chitra',10],['Dhanishta',4],['Dhruva',0],['Cafeteria',0]]){
 const entry=w.entrances.find(e=>e.name===name);
 assert.equal(entry.stepCount||0,count);
 assert(entry.level>=24&&entry.level<=30);
 assert(Math.abs(w.walkHeight(...entry.end)-entry.endLevel-.14)<.09,name+' road connection');
 if(!count)continue;
 const point=d=>entry.door.map((v,i)=>v+entry.n[i]*d);
 const player={};resetMotion(player,...point(landing+count*tread+.10),w);
 for(let n=1;n<=count;n++){
   const target=point(landing+(count-n+.5)*tread);
   for(let k=0;k<5;k++)stepMotion(player,(target[0]-player.x)/(5-k),(target[1]-player.z)/(5-k),1/60,false,w);
   assert(Math.hypot(player.x-target[0],player.z-target[1])<.02,name+' traversable steps');
   assert(Math.abs(player.y-(entry.level+.165+n*riser))<.03,name+' climbs one riser per tread');
 }
}
for(const e of w.entrances)assert((e.end[0]-e.door[0])*e.n[0]+(e.end[1]-e.door[1])*e.n[1]>.6,e.name+' faces its access road');
for(const side of [-1,1])assert(w.avenueShrubs.filter(s=>s.side===side).length>=20,'Shrubs on both verges');
for(const s of w.avenueShrubs)assert(!w.noPlants(s.x,s.z,1),'Clear entrances');
const sports=w.data.features.filter(f=>f.tags.sport);
const court=center(sports.find(f=>f.tags.sport==='basketball').points);
const road=w.groundAt(175,-49),courtY=w.walkHeight(...court);
assert(courtY<road-2&&courtY<w.buildings.find(b=>b.tags.name==='Vishaka').level-8);
assert(w.groundAt(151,14)<w.groundAt(178,14)-5,'Bhagirati hollow below road');
const heights=[22,44,65,85,105].map(x=>w.walkHeight(x,-35));
for(let i=1;i<heights.length;i++)assert(heights[i]<heights[i-1],'Woodland descends to basketball');
assert(w.trees.filter(p=>inside(p[0],p[1],config.landscape.libraryForest.core)).length>30);
assert(inside(-35,-62,config.landscape.soilGround.points));
const shrine=config.layout.surveySites.shrine;
assert(w.terrainModel.routes.every(r=>distSegment(...shrine,r.a,r.b)>r.width/2+5),'Shrine well inside road verge');
const residents=createResidents(scene,w);
for(const [kind,n] of [['student',6],['cat',3],['husky',1],['street dog',4]])assert.equal(residents.actors.filter(a=>a.kind===kind).length,n);
const start=residents.actors.map(a=>a.rig.position.clone());
for(let i=0;i<90;i++)residents.update(1/24);
residents.actors.forEach((a,i)=>{const p=a.rig.position;assert(!w.blocked(p.x,p.z));assert(start[i].distanceTo(p)>.1);});
console.log('Verified hostel stairs on foot, level road access, clear shrubs, wooded descent, low court and pond, and all 14 moving residents.');

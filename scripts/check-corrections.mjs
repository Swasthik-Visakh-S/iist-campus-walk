import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildWorld,inside,distSegment} from '../dist/world.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/'+n,import.meta.url)));
const config=read('model-config.json'),w=buildWorld(new T.Scene(),read('campus.json'),config);
const b=n=>w.buildings.find(b=>b.surveyNumber===n);
const names={21:'Dhruva',15:'Chitra',20:'Revati',16:'Rohini',22:'Vishaka',19:'Ashwini',11:'Phalguni',17:'Dhanishta',13:'Anuradha',23:'Tripthi canteen',7:'Open Air Theatre',8:'Student Activity Centre'};
for(const [n,name] of Object.entries(names))assert.equal(b(+n).tags.name,name);
assert.equal(b(14).tags.name,'Hostel 14','Conflicting name stays unresolved');
for(const group of [[16,20,22,23],[15,17,21],[14,19,11,9],[18,13],[1,2],[4,5,6],[7,8]])for(const n of group)assert.equal(b(n).level,b(group[0]).level);
assert(b(15).level>b(16).level&&b(18).level>b(19).level&&b(7).level>b(16).level&&b(7).level<b(19).level);
assert(b(12).level>Math.max(...w.buildings.filter(x=>x!==b(12)).map(x=>x.level)));
assert(b(3).level<b(1).level&&b(4).level<b(3).level);
assert(Math.abs(w.groundAt(...w.details.roundabout)-b(1).level)<.01);
assert(Math.abs(w.groundAt(...w.garden.fountain)-b(1).level)<.01);
const mph=w.buildings.find(b=>b.id==='user-mph');assert.equal(mph.level,b(7).level);assert.equal(w.buildings.length,25);
for(const pond of w.ponds)assert(pond.level<Math.min(...w.buildings.map(b=>b.level))-8);
for(const wall of w.walls.slice(0,25))assert(w.blocked((wall.a[0]+wall.b[0])/2,(wall.a[1]+wall.b[1])/2));
assert(w.details.wallCount>100&&w.details.roofSegments>10&&w.details.stairCount>50&&w.details.bambooStems>60&&w.details.mastHeight>=20);
const road=w.data.features.find(f=>f.id==='365910893');
const valley=road.points[2],north=road.points[1],south=road.points.at(-1);
assert(w.groundAt(...valley)<w.groundAt(...north)-5&&w.groundAt(...valley)<w.groundAt(...south)-5,'Road to canteen has a dip');
const ascent=w.data.features.find(f=>f.id==='365911690').points.slice().reverse();
for(let i=1;i<ascent.length;i++)assert(w.groundAt(...ascent[i])>=w.groundAt(...ascent[i-1])-.2,'Road rises from canteen towards upper hostel row');
for(const path of w.data.features.filter(f=>f.id==='hostel-stairs'||f.tags.covered==='yes'))for(let i=1;i<path.points.length;i++){
 const a=path.points[i-1],b=path.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
 for(let d=2;d<length-2;d+=.5){const p=[a[0]+(b[0]-a[0])*d/length,a[1]+(b[1]-a[1])*d/length];assert(!w.blocked(...p),'Connecting path blocked: '+path.id+' '+p);}
}
for(const tree of w.trees)assert(!inside(tree[0],tree[1],config.landscape.soilGround.points),'Soil ground is open');
console.log('Passed names, terrace relationships, pond depth, ascent/dip, wall collision, covered walks, steps, bamboo and open ground checks.');

// Catch abrupt height discontinuities at junctions and pond shoulders.
for(const r of w.terrainModel.routes.filter(r=>r.width>4)){
 const limit=['365911682','365911683'].includes(r.id)?.35:.8;
 for(let d=.5;d<=r.length;d+=.5){const point=t=>[r.a[0]+r.dx*t/r.length,r.a[1]+r.dz*t/r.length];
  assert(Math.abs(w.groundAt(...point(d))-w.groundAt(...point(d-.5)))/.5<limit,'Road grade discontinuity '+r.id);
 }
}
console.log('Road grades remain continuous, with gradual academic approaches.');

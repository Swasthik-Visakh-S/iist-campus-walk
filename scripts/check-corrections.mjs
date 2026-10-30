import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildWorld,inside,distSegment} from '../dist/world.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/'+n,import.meta.url)));
const config=read('model-config.json'),scene=new T.Scene(),w=buildWorld(scene,read('campus.json'),config);
const b=n=>w.buildings.find(b=>b.surveyNumber===n);
const names={21:'Dhruva',15:'Chitra',20:'Revati',16:'Rohini',22:'Vishaka',19:'Ashwini',11:'Phalguni',17:'Dhanishta',13:'Anuradha',23:'Tripthi canteen',7:'Open Air Theatre',8:'Student Activity Centre'};
for(const [n,name] of Object.entries(names))assert.equal(b(+n).tags.name,name);
assert.equal(b(14).tags.name,'Ardra');assert.equal(b(18).tags.name,'Arundhathy');
for(const group of [[16,20,22,23],[15,17,21],[14,19,11,9],[18,13],[1,2],[4,5,6],[7,8]])for(const n of group)assert.equal(b(n).level,b(group[0]).level);
assert(b(15).level>b(16).level&&b(18).level>b(19).level&&b(7).level>b(16).level&&b(7).level<b(19).level);
assert.equal(b(12).level,b(11).level,'Water tower shares Phalguni ground level');assert.equal(w.tower.pillars.length,4);assert(w.tower.supportHeight>=15);for(const p of w.tower.pillars)assert(w.blocked(...p),'Tower pillar collision');assert(!w.blocked(...b(12).center),'Open space below tank');assert(w.roadDetails.edgePieces>100&&w.roadDetails.dashPieces>100,'Roads have defined edges and markings');
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

// Rendered terrain and road triangles must share the same surface on steep banks.
let roadTriangles=0;
for(const name of ['Continuous asphalt','Pedestrian surfaces','Road edge and centre paint']){
 const positions=scene.getObjectByName(name).geometry.attributes.position;assert(positions.count>0);
 const offset=name.includes('paint')?.17:.14;
 for(let i=0;i<positions.count;i+=3){
  const x=(positions.getX(i)+positions.getX(i+1)+positions.getX(i+2))/3;
  const z=(positions.getZ(i)+positions.getZ(i+1)+positions.getZ(i+2))/3;
  const y=(positions.getY(i)+positions.getY(i+1)+positions.getY(i+2))/3;
  assert(Math.abs(y-w.terrainSurface.heightAt(x,z)-offset)<.002,'Road or marking intersects terrain');roadTriangles++;
 }
}
for(const r of w.roads.filter(r=>r.width>4)){
 const x=(r.a[0]+r.b[0])/2,z=(r.a[1]+r.b[1])/2;
 assert(w.walkHeight(x,z)>=w.terrainSurface.heightAt(x,z)-.001,'Feet stay above rendered road');
 if(w.terrainModel.stairHeight(x,z)===null)assert(Math.abs(w.walkHeight(x,z)-w.terrainSurface.heightAt(x,z))<.001,'Feet follow rendered road');
}
console.log(`Checked ${roadTriangles} road/paint triangles for terrain clearance; ${w.terrainSurface.refinedCells} terrain cells refined near roads.`);

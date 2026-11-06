import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.js';
import {buildWorld} from '../dist/world.js';
import {resetMotion,stepMotion} from '../dist/movement.js';
import {stepCount,stepTop} from '../dist/terrain.js';

const read=name=>JSON.parse(fs.readFileSync(new URL('../dist/'+name+'.json',import.meta.url)));
const scene=new T.Scene(),world=buildWorld(scene,read('campus'),read('model-config'));
const feature=id=>world.data.features.find(f=>f.id===id);
const player={};
function walk(points){
  resetMotion(player,...points[0],world);
  for(const [x,z] of points.slice(1)){
    const dx=x-player.x,dz=z-player.z,n=Math.ceil(Math.hypot(dx,dz)/.13);
    for(let i=0;i<n;i++)stepMotion(player,dx/n,dz/n,1/60,false,world);
    assert(Math.hypot(player.x-x,player.z-z)<.08,'Blocked on the way to '+[x,z]);
  }
}
const ids=['sac-front-path','sac-oat-link','oat-through-walk','oat-mph-link','hostel-lower-landing','hostel-stairs','hostel-upper-landing'];
const route=ids.flatMap((id,i)=>{
  const f=feature(id);
  if(i)assert.deepEqual(f.points[0],feature(ids[i-1]).points.at(-1),'Shared landing at '+id);
  return i?f.points.slice(1):f.points;
});
assert.deepEqual(world.data.features.filter(f=>f.tags.covered==='yes').map(f=>f.id),['sac-oat-link','oat-mph-link']);
for(const arm of ['365911687','365911688']){
  const points=feature(arm).points;
  assert.deepEqual(points[0],route.at(-1));
  walk([...route,...points.slice(1,7)]);
  walk([...points.slice(1,7).reverse(),...route.slice().reverse()]);
}
assert.deepEqual(feature('365911691').points[0],feature('hostel-lower-landing').points[0]);
walk(feature('365911691').points);
const flight=world.terrainModel.routes.find(r=>r.id==='hostel-stairs');
assert(flight.length<9&&flight.y1>flight.y0);
for(let i=0;i<stepCount(flight);i++)for(const side of [-.8,0,.8]){
 const t=(i+.5)/stepCount(flight),x=flight.a[0]+t*flight.dx+side*flight.dz/flight.length,z=flight.a[1]+t*flight.dz-side*flight.dx/flight.length;
 assert(Math.abs(world.walkHeight(x,z)-stepTop(flight,i))<.001);
 assert(world.walkHeight(x,z)>world.terrainSurface.heightAt(x,z)-.04,'Tread stands clear of its bank');
}
const paved=feature('365910893'),soil=feature('turf-soil-road');
assert.equal(soil.tags.surface,'compacted');
assert(paved.points.some(p=>p[0]===soil.points[0][0]&&p[1]===soil.points[0][1]));
assert(Math.hypot(...soil.points.at(-1).map((v,i)=>v-world.pitch.gate[i]))<.0001);
walk([...soil.points,[world.pitch.gate[0]+.5,world.pitch.gate[1]+3],world.pitch.spawn]);
for(const name of ['Basketball hoops','Basketball backboards'])assert.equal(scene.getObjectByName(name).count,2);
assert.equal(scene.getObjectByName('Basketball floodlights').count,4);
assert(scene.getObjectByName('Basketball nets').geometry.attributes.position.count>100);
assert(scene.getObjectByName('Basketball court markings').geometry.attributes.position.count>100);
walk([world.basketball.spawn,world.basketball.aim]);
console.log('Walked all OAT passages, the stair flight both ways, both hostel arms and the soil road through the turf gate. Verified both baskets and court fittings.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.js';
import {buildWorld,inside} from '../dist/world.js';
import {createCheckpoint,nearbyGate,transitSpeed} from '../dist/transit.js';
import {resetMotion,stepMotion} from '../dist/movement.js';

const read=file=>JSON.parse(fs.readFileSync(new URL('../dist/'+file,import.meta.url)));
const world=buildWorld(new T.Scene(),read('campus.json'),read('model-config.json'));
assert.deepEqual(world.ponds.map(p=>p.name),['Bhagirati','Bhagirati 2.0','Bhagirati 3.0']);
for(const r of world.rails)assert(world.blocked((r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2),'Rail collision');
for(const name of ['Crystal Jubilee Hostel','Football turf','Cafeteria','Cafeteria seating','Water purification station','Muthiyammain Kshethram'])
  assert(world.places.some(p=>p.name===name&&!world.blocked(...p.p)),name+' has a reachable destination');
const marked=world.entrances.filter(e=>e.mark);
assert.equal(marked.length,23);
assert.equal(marked.filter(e=>e.name==='Admin Block').length,3);
for(const e of marked)assert(Math.hypot(e.mark[0]-e.door[0],e.mark[1]-e.door[1])<1.5,e.name+' door is at its registered pink dot');
assert(transitSpeed(true,true)>transitSpeed(true,false)&&transitSpeed(true,false)>transitSpeed(false,true));
for(const gate of world.gates){
  const checkpoint=createCheckpoint(),player={};
  resetMotion(player,...gate.point(0,4),world);
  assert.equal(nearbyGate(world.gates,player),gate);
  const crossing=(a,b)=>checkpoint.cross(world.gates,{x:a[0],z:a[1]},{x:b[0],z:b[1]});
  assert.equal(crossing(gate.point(0,2),gate.point(0,-2)).allowed,false);
  assert.equal(crossing(gate.point(0,-2),gate.point(0,2)).allowed,false);
  checkpoint.show(gate);
  let crossings=0,steps=Math.floor((gate.exteriorLength+2)*10);
  for(const sign of [-1,1]){
    for(let i=0;i<steps;i++){
      const old={...player};stepMotion(player,sign*gate.n[0]*.1,sign*gate.n[1]*.1,1/60,false,world);
      const crossing=checkpoint.cross(world.gates,old,player);
      if(crossing){assert(crossing.allowed);crossings++;}
    }
    assert.equal(inside(player.x,player.z,world.boundary),sign===1,gate.name+' exit / re-entry');
  }
  assert.equal(crossings,2);assert.equal(checkpoint.cleared(gate),false);
  assert.equal(gate.muzzles.length,2);
}
console.log('Checked registered doors, new destinations, pond/fence collision, boosted travel and both physical gate round trips.');

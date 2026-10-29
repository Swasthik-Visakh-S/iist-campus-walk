import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';import {buildWorld,inside} from '../dist/world.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/'+n,import.meta.url)));const scene=new T.Scene();const w=buildWorld(scene,read('campus.json'),read('model-config.json'));let meshes=0;scene.traverse(o=>{if(o.geometry){meshes++;assert([...o.geometry.attributes.position.array].every(Number.isFinite),'Finite vertices');if(o.isInstancedMesh)assert([...o.instanceMatrix.array].every(Number.isFinite),'Finite transforms');}});
assert(w.groundAt(0,-300)>w.groundAt(0,260)+20,'Hostel terrain rises');for(const b of w.buildings){assert(Math.abs(w.groundAt(...b.center)-b.level)<.01,'Building foundation is level');}
for(const p of w.places){assert(!w.blocked(...p.p),'Safe destination '+p.name);assert(inside(...p.p,w.boundary),'Destination in campus');assert(Number.isFinite(w.walkHeight(...p.p)));}
for(const p of w.ponds){const q=p.points[0];assert(w.blocked(...q),'Pond shore collision');}
assert(w.ponds.length===2);assert(w.treeCount>1000);assert(w.places.some(p=>p.name==='Student Activity Centre'));assert(!w.blocked(w.amph.x,w.amph.z),'Stage accessible');
console.log(JSON.stringify({meshes,buildings:w.buildings.length,ponds:w.ponds.length,trees:w.treeCount,landmarks:w.places.length,northHeight:w.groundAt(0,-300),southHeight:w.groundAt(0,260),status:'Passed scene construction, terrain, foundations, water collisions and safe destinations'}));
// Walking uses substeps <= .25 m; verify shoreline cannot be crossed and road elevations are finite.
for(const r of w.roads){for(const p of [r.a,r.b])assert(Number.isFinite(w.walkHeight(...p)),'Road elevation finite');}
for(const p of w.places){const y=w.walkHeight(...p.p)+1.7;assert(y>w.groundAt(...p.p),'Spawn above terrain '+p.name);}
const expected=['Library','Student Activity Centre','Roundabout','South pond','West pond'];for(const name of expected)assert(w.places.some(p=>p.name===name));
console.log('Road elevations, player ground clearance and landmark coverage passed');

// Reference-plan changes must keep the public walking routes usable.
assert(w.places.some(p=>p.name==='Multipurpose Hall'),'Hall has a destination');
assert(w.places.some(p=>p.name==='Library fountain & garden'),'Garden has a destination');
assert(w.garden.basinRadius>3.5,'Fountain is larger than Version 2');
assert(w.blocked(...w.garden.fountain),'Player cannot walk into fountain basin');
assert(!w.blocked(...w.safePoint(w.garden.fountain)),'Fountain has a reachable approach');
for(const r of w.roads.filter(r=>r.width>3)){
 const p=[(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2];
 assert(!w.blocked(...p),'Road crosses a building or water at '+JSON.stringify(p));
}
const rightSide=w.roads.some(r=>r.width>3&&r.a[0]>w.amph.x+w.amph.r+5&&Math.abs(r.a[1]-w.amph.z)<10);
assert(rightSide,'Approach road passes the right side of the OAT');
console.log('Reference layout, hall, fountain and corrected road checks passed');

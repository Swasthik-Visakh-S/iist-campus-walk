import assert from 'node:assert/strict';
import {resetMotion,stepMotion,followCamera} from '../dist/movement.js';
import {createCharacter} from '../dist/character.js';
import {createResidents} from '../dist/residents.js';
import {Box3,Scene,Vector3} from '../dist/vendor/three.module.js';
const flat={walkHeight:()=>0,blocked:(x,z)=>x>3||z>3,cameraBlocked:(x,y,z)=>z>2};
for(const fps of [30,60,144]){
 const s={};resetMotion(s,0,0,flat);let peak=0;
 for(let i=0;i<fps*2;i++){stepMotion(s,0,0,1/fps,i===0,flat);peak=Math.max(peak,s.y);assert(s.y>=.015);}
 assert(s.grounded&&Math.abs(s.y-.015)<1e-8);assert(peak>1.1&&peak<1.4,'Stable jump height');
 // Holding movement/jumping cannot tunnel through blocked areas.
 for(let i=0;i<fps*2;i++)stepMotion(s,8/fps,0,1/fps,i===0,flat);
 assert(s.x<=3&&s.x>2.7);
 resetMotion(s,0,0,flat);stepMotion(s,0,0,1/fps,true,flat);const v=s.vy;stepMotion(s,0,0,1/fps,true,flat);assert(s.vy<v,'No second airborne jump');
 resetMotion(s,0,0,flat);assert(s.grounded&&s.vy===0,'Teleport resets jump');
 const cam=followCamera(s,0,.32,6,flat);assert(cam.position.z<2,'Camera stays in front of wall');assert(cam.position.y>.015);
}
const slope={walkHeight:(x)=>x*.25,blocked:()=>false,cameraBlocked:()=>false};const s={};resetMotion(s,0,0,slope);
for(let i=0;i<120;i++)stepMotion(s,.04,0,1/60,false,slope);assert(Math.abs(s.y-(s.x*.25+.015))<1e-6,'Feet follow terrain');
const cliff={...slope,walkHeight:x=>x>1?5:0};resetMotion(s,0,0,cliff);for(let i=0;i<120;i++)stepMotion(s,.04,0,1/60,false,cliff);assert(s.x<=1,'No walking up vertical banks');
const girl=createCharacter();girl.animate(.016,.2,3.6,true,1);assert(girl.legs[0].rotation.x*girl.legs[1].rotation.x<0);assert(girl.arms[0].rotation.x*girl.legs[0].rotation.x<0);
for(const grounded of [true,false]){girl.animate(.05,.3,7.5,grounded,2);girl.root.updateMatrixWorld(true);girl.root.traverse(o=>{assert(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry)assert([...o.geometry.attributes.position.array].every(Number.isFinite));});}
console.log('Passed jump/landing at 30–144 FPS, collision, no double jump, teleport, camera clearance, slopes, gait and character geometry.');

for(const ground of [flat,{walkHeight:()=>0,cameraBlocked:()=>false}]){
 const {position,target}=followCamera({x:0,y:0,z:0},.3,-80*Math.PI/180,5.8,ground);
 const angle=Math.atan2(target.y-position.y,Math.hypot(target.x-position.x,target.z-position.z));
 assert(angle>=75*Math.PI/180&&position.y>.3,'Can see the sky from above the ground');
}

// Measure both meshes in campus metres. A single straight lane produces one
// neutral, forward-facing resident, with no other residents in its GPU batch.
const route={a:[0,0],b:[0,30],dx:0,dz:30,width:6,length:30};
const comparisonWorld={...flat,blocked:()=>false,spawn:[0,0],places:[],terrainModel:{routes:[route]}};
const residents=createResidents(new Scene(),comparisonWorld);
assert.equal(residents.actors.length,1);
const student=residents.group.getObjectByName('Resident figures');
student.computeBoundingBox();
const peerSize=student.boundingBox.getSize(new Vector3());
const player=createCharacter();
player.animate(0,0,0,true,0);
player.root.updateMatrixWorld(true);
const uprightRig=player.legs[0].parent;
const standingBounds=new Box3().setFromObject(uprightRig,true);
const playerSize=standingBounds.getSize(new Vector3());
for(const axis of ['x','y','z'])assert(Math.abs(playerSize[axis]-peerSize[axis])<.035,'Player and resident size agree on '+axis);
assert(Math.abs(standingBounds.min.y)<.005,'Shoes meet the ground');
player.animate(0,0,0,true,0,true);
player.root.updateMatrixWorld(true);
const deckTop=new Box3().setFromObject(player.board.children[1],true).max.y;
for(const leg of player.legs)assert(Math.abs(new Box3().setFromObject(leg,true).min.y-deckTop)<.015,'Both feet on the deck');
console.log('Playable student matches resident dimensions and stands on the skateboard.');

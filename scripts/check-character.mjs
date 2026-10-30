import assert from 'node:assert/strict';
import {resetMotion,stepMotion,followCamera} from '../dist/movement.js';
import {createCharacter} from '../dist/character.js';
const flat={walkHeight:()=>0,blocked:(x,z)=>x>3||z>3,cameraBlocked:(x,y,z)=>z>2};
for(const fps of [30,60,144]){
 const s={};resetMotion(s,0,0,flat);let peak=0;
 for(let i=0;i<fps*2;i++){stepMotion(s,0,0,1/fps,i===0,flat);peak=Math.max(peak,s.y);assert(s.y>=.14);}
 assert(s.grounded&&Math.abs(s.y-.14)<1e-8);assert(peak>1.2&&peak<1.5,'Stable jump height');
 // Holding movement/jumping cannot tunnel through blocked areas.
 for(let i=0;i<fps*2;i++)stepMotion(s,8/fps,0,1/fps,i===0,flat);
 assert(s.x<=3&&s.x>2.7);
 resetMotion(s,0,0,flat);stepMotion(s,0,0,1/fps,true,flat);const v=s.vy;stepMotion(s,0,0,1/fps,true,flat);assert(s.vy<v,'No second airborne jump');
 resetMotion(s,0,0,flat);assert(s.grounded&&s.vy===0,'Teleport resets jump');
 const cam=followCamera(s,0,.32,6,flat);assert(cam.position.z<2,'Camera stays in front of wall');assert(cam.position.y>.14);
}
const slope={walkHeight:(x)=>x*.25,blocked:()=>false,cameraBlocked:()=>false};const s={};resetMotion(s,0,0,slope);
for(let i=0;i<120;i++)stepMotion(s,.04,0,1/60,false,slope);assert(Math.abs(s.y-(s.x*.25+.14))<1e-6,'Feet follow terrain');
const cliff={...slope,walkHeight:x=>x>1?5:0};resetMotion(s,0,0,cliff);for(let i=0;i<120;i++)stepMotion(s,.04,0,1/60,false,cliff);assert(s.x<=1,'No walking up vertical banks');
const girl=createCharacter();girl.animate(.016,.2,3.6,true,1);assert(girl.legs[0].rotation.x*girl.legs[1].rotation.x<0);assert(girl.arms[0].rotation.x*girl.legs[0].rotation.x<0);
for(const grounded of [true,false]){girl.animate(.05,.3,7.5,grounded,2);girl.root.updateMatrixWorld(true);girl.root.traverse(o=>{assert(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry)assert([...o.geometry.attributes.position.array].every(Number.isFinite));});}
console.log('Passed jump/landing at 30–144 FPS, collision, no double jump, teleport, camera clearance, slopes, gait and character geometry.');

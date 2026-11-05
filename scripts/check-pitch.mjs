import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {addTurf} from '../dist/pitch.js';

const points=[[-16,-21],[16,-21],[16,21],[-16,21],[-16,-21]];
const surface={heightAt:()=>13,project(p,h,out){
  for(const i of [0,2,1,0,3,2]) out.push(p[i][0],13+h,p[i][1]);
}};
const scene=new T.Scene(),pitch=addTurf(scene,points,surface),ball=pitch.ball;
assert.equal(scene.getObjectByName('Two football goals').count,16);
const net=scene.getObjectByName('Open-top enclosure net').geometry.getAttribute('position');
assert(Math.max(...Array.from(net.array).filter((_,i)=>i%3===1))>20);
for(let i=0;i<net.count;i++) {
  assert(Math.abs(Math.abs(net.getX(i))-16)<1e-5||Math.abs(Math.abs(net.getZ(i))-21)<1e-5,'Only perimeter netting encloses the turf');
}
assert(pitch.contains(...pitch.spawn));
assert(!pitch.blocked(...pitch.gate)&&pitch.blocked(-16,5),'Roadside opening and fence collision');
assert(pitch.blocked(0,-21*(1-.14)-1.55)&&!pitch.blocked(0,-21*(1-.14)),'Goal net has a back and an open mouth');
const y=13.16,dt=1/60;
pitch.update(dt,{x:0,y,z:.25},0,0);
assert.equal(ball.position.z,0,'Idle player leaves ball at rest');
pitch.update(dt,{x:0,y,z:-.30},0,.23);
assert(ball.position.z>0,'Walking into the ball kicks it');
let bounced=false,previous=ball.position.z;
for(let i=0;i<900;i++){pitch.update(dt,null);assert(pitch.contains(ball.position.x,ball.position.z));if(ball.position.z<previous-.001)bounced=true;previous=ball.position.z;}
assert(bounced,'Ball rolls through the mouth and rebounds off the goal net');
assert(Math.abs(ball.position.y-y-.225)<1e-5);
const rest=ball.position.clone();pitch.update(dt,null);assert(rest.equals(ball.position));
console.log('Pitch checks passed for both goals, the 7m open-top net, gate access, ball contact, rolling, collision and rest.');

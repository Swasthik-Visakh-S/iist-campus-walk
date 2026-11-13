import * as T from './vendor/three.module.js';
import {inside,distSegment} from './geometry.js?v=6';
export const DAY_SECONDS=3600;
const clamp=T.MathUtils.clamp;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
// One simulated hour takes 150 real seconds; elapsed time is never frame-clamped.
export function environmentAt(seconds,timeMode='auto',weatherMode='auto'){
 const hour=timeMode==='morning'?8:timeMode==='night'?22:(8+seconds*24/DAY_SECONDS)%24;
 const daylight=smooth((hour-5.5)/1.5)*(1-smooth((hour-17.5)/1.5));
 const cycle=((seconds%720)+720)%720;
 const rain=weatherMode==='rain'?1:weatherMode==='clear'?0:smooth((cycle-150)/25)*(1-smooth((cycle-285)/35));
 return {hour,daylight,rain,night:daylight<.4};
}
export function createEnvironment(scene,world,lighting){
 const group=new T.Group();group.name='Campus weather';group.userData.dynamic=true;scene.add(group);
 let timeMode='morning',weatherMode='auto',anchor=performance.now()/1000,state=environmentAt(0,timeMode),lastLight=-1;
 const count=420,positions=new Float32Array(count*6),seeds=Array.from({length:count},(_,i)=>[(i*.61803398875)%1,(i*.41421356237)%1,(i*.73205080757)%1]);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
 const rain=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#bcd1df',transparent:true,opacity:.52,depthWrite:false}));rain.name='Local rain';rain.frustumCulled=false;group.add(rain);
 // Soft ground-level haze is restricted to the wooded hollow, never the campus UI.
 const size=32,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);pixels[i]=193;pixels[i+1]=211;pixels[i+2]=212;pixels[i+3]=Math.round(Math.max(0,1-r)**2*255);}
 const texture=new T.DataTexture(pixels,size,size);texture.needsUpdate=true;
 const mistMaterial=new T.SpriteMaterial({map:texture,transparent:true,opacity:.14,depthWrite:false});
 const mist=[];
 for(const p of world.trees.filter(p=>inside(p[0],p[1],world.landscape.libraryForest.points)).filter((_,i)=>i%4===0).slice(0,18)){
  const s=new T.Sprite(mistMaterial);s.position.set(p[0],world.terrainSurface.heightAt(p[0],p[1])+2,p[1]);s.scale.set(17,5,1);group.add(s);mist.push(s);
 }
 let sheltered=false,roofTimer=0;
 function update(camera,now,dt){
  const seconds=Math.max(0,now/1000-anchor);state=environmentAt(seconds,timeMode,weatherMode);
  if(now-lastLight>150||lastLight<0){lighting.setDaylight(state.daylight,state.rain);lastLight=now;}
  mistMaterial.opacity=.08+.10*(1-state.daylight)+.07*state.rain;
  roofTimer-=dt;
  if(roofTimer<=0){roofTimer=.25;sheltered=[1,2,3,4,5,6].some(h=>world.cameraBlocked(camera.position.x,camera.position.y+h,camera.position.z));}
  rain.visible=state.rain>.01&&!sheltered&&camera.position.y<world.groundAt(camera.position.x,camera.position.z)+35;
  if(rain.visible){
   rain.material.opacity=.45*state.rain;
   const floor=world.groundAt(camera.position.x,camera.position.z)+.25;
   seeds.forEach(([a,b,c],i)=>{const x=camera.position.x+(a-.5)*32,z=camera.position.z+(b-.5)*32,y=Math.max(floor,camera.position.y-5)+((c*24-seconds*15)%24+24)%24;positions.set([x,y,z,x-.09,y+.8,z+.03],i*6);});
   geometry.attributes.position.needsUpdate=true;
  }
  return state;
 }
 return {group,mist,rain,update,get state(){return state},setTime(v){if(['auto','morning','night'].includes(v)){timeMode=v;lastLight=-1;}},setWeather(v){if(['auto','clear','rain'].includes(v))weatherMode=v;}};
}
export function createForestSnakes(scene,world){
 const homes=[];
 for(const t of world.trees){
  if(homes.length===5)break;
  const p=[t[0]+2,t[1]+1];
  if(!inside(...p,world.landscape.libraryForest.points)||homes.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<15))continue;
  const safe=Array.from({length:24},(_,i)=>[p[0]+Math.cos(i*Math.PI/12)*2.4,p[1]+Math.sin(i*Math.PI/12)*2.4]).every(q=>!world.blocked(...q)&&world.terrainModel.routes.every(r=>distSegment(...q,r.a,r.b)>r.width/2+3));
  if(safe)homes.push(p);
 }
 const segments=13,mesh=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshStandardMaterial({color:'#526044',roughness:1}),homes.length*segments);mesh.name='Small forest snakes';mesh.userData.dynamic=true;mesh.frustumCulled=false;scene.add(mesh);
 const o=new T.Object3D();let phase=0,accum=0;
 function update(dt){phase+=dt;accum+=dt;if(accum<1/20&&dt)return;accum=0;
  homes.forEach((p,k)=>{const a=phase*.09+k,x=p[0]+Math.cos(a)*1.8,z=p[1]+Math.sin(a)*1.8;
   for(let i=0;i<segments;i++){const t=i/(segments-1),side=Math.sin(t*9-phase*3)*.07,px=x+Math.sin(a)*t*.9+Math.cos(a)*side,pz=z-Math.cos(a)*t*.9+Math.sin(a)*side;
    o.position.set(px,world.terrainSurface.heightAt(px,pz)+.045,pz);const r=.046*(1-.65*t);o.scale.set(r,.034,r*1.8);o.rotation.y=-a;o.updateMatrix();mesh.setMatrixAt(k*segments+i,o.matrix);
   }});mesh.instanceMatrix.needsUpdate=true;
 }update(0);return {homes,mesh,update};
}

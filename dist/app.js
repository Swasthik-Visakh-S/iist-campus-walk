import {createCharacter} from './character.js';
import {resetMotion,stepMotion,followCamera} from './movement.js';
import {buildWorld,inside} from './world.js?v=5';
import * as T from './vendor/three.module.js';
const $=id=>document.getElementById(id);
const canvas=$('world'), keys=new Set();
let mode='aerial',yaw=Math.PI,pitch=.32,orbit=0.35,tilt=.85,distance=710,drag=null,last=0,travel=0;
const player=Object.assign(new T.Vector3(),{vy:0,grounded:true}),target=new T.Vector3(0,18,-30);
const scene=new T.Scene();scene.background=new T.Color('#b8c5c6');scene.fog=new T.Fog('#b8c5c6',850,1900);
const camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.1,2500);
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch(e){import('./fallback.js?v=5');throw e;}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
scene.add(new T.HemisphereLight(0xe5f5ff,0x59614b,1.8));
const sun=new T.DirectionalLight(0xffedcf,2.5);sun.position.set(-230,440,150);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-470,right:470,top:470,bottom:-470,near:1,far:1000});sun.shadow.bias=-.0004;scene.add(sun);
let jumpQueued=false,followDistance=5.8;
const avatar=createCharacter();scene.add(avatar.root);
const shadowGeometry=new T.CircleGeometry(.5,24);shadowGeometry.rotateX(-Math.PI/2);
const contactShadow=new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({color:'#172820',transparent:true,opacity:.22,depthWrite:false}));scene.add(contactShadow);
let buildings=[],roads=[],places=[],labels=[],ponds=[],boundary,spawn,world;
function label(text,p,height){
 const c=document.createElement('canvas');c.width=512;c.height=96;
 const ctx=c.getContext('2d');ctx.fillStyle='#f7f7ed';ctx.beginPath();ctx.roundRect(8,8,496,74,12);ctx.fill();ctx.fillStyle='#244e40';ctx.font='600 25px Arial';ctx.textAlign='center';ctx.fillText(text,256,55);
 const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:true,transparent:true}));
 sprite.position.set(p[0],height+6,p[1]);const width=Math.max(19,Math.min(30,12+text.length*.55));sprite.scale.set(width,width*96/512,1);scene.add(sprite);labels.push(sprite);
}

const blocked=(x,z)=>world.blocked(x,z);
try{
const [data,config,heights]=await Promise.all(['campus.json','model-config.json','heights.json'].map(async path=>{const r=await fetch(path+'?v=5');if(!r.ok)throw Error(path+' unavailable');return r.json()}));
config.heights={...config.heights,...heights};world=buildWorld(scene,data,config);({buildings,roads,places,ponds,boundary,spawn}=world);
for(const p of places)label(p.shortName||p.name,p.label,p.height);
for(let i=0;i<places.length;i++){let o=document.createElement('option');o.value=i;o.textContent=places[i].name;$('destination').append(o);}
resetMotion(player,...spawn,world);avatar.root.visible=false;contactShadow.visible=false;$('loading').remove();requestAnimationFrame(frame);
}catch(e){$('loading').textContent='Unable to load the campus. '+e.message;console.error(e);}
function setMode(m){mode=m;document.activeElement?.blur();keys.clear();document.body.classList.toggle('walk',m==='walk');$('overview').classList.toggle('active',m==='aerial');$('walk').classList.toggle('active',m==='walk');$('walking').hidden=m!=='walk';$('crosshair').hidden=true;jumpQueued=false;avatar.root.visible=m==='walk';contactShadow.visible=m==='walk';if(m==='aerial')document.exitPointerLock?.();}
async function capture(){if(mode!=='walk')return;try{await canvas.requestPointerLock?.();}catch{ /* Drag-to-look remains available in embedded previews. */ }}
$('start').onclick=()=>{resetMotion(player,...spawn,world);yaw=Math.PI;pitch=.32;avatar.root.rotation.y=0;setMode('walk');capture()};$('walk').onclick=()=>{setMode('walk');capture()};$('overview').onclick=()=>setMode('aerial');$('reset').onclick=()=>{resetMotion(player,...spawn,world);yaw=Math.PI;pitch=.32;avatar.root.rotation.y=0;distance=710;orbit=.35;tilt=.85;travel=0};$('about').onclick=()=>{$('info').showModal();document.exitPointerLock?.();keys.clear();jumpQueued=false};$('closeInfo').onclick=()=>$('info').close();$('destination').onchange=e=>{if(e.target.value==='')return;const p=places[+e.target.value];e.target.blur();resetMotion(player,...p.p,world);setMode('walk');pitch=.32;if(p.name==='Library fountain & garden'){const c=world.garden.libraryCenter;yaw=Math.atan2(player.x-c[0],player.z-c[1]);}e.target.value='';};
window.addEventListener('keydown',e=>{if(['SELECT','INPUT'].includes(e.target.tagName)||$('info').open)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat&&mode==='walk')jumpQueued=true;if(e.code==='KeyV'&&!e.repeat)setMode(mode==='walk'?'aerial':'walk');if(e.code==='Enter'){setMode('walk');capture()}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();jumpQueued=false;});document.addEventListener('visibilitychange',()=>{keys.clear();jumpQueued=false;});
canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);if(mode==='walk'&&e.pointerType==='mouse')capture()});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
function look(dx,dy){yaw-=dx*.003;pitch=Math.max(.12,Math.min(1.0,pitch+dy*.003));}
window.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas&&mode==='walk')look(e.movementX,e.movementY);else if(drag){const dx=e.clientX-drag[0],dy=e.clientY-drag[1];drag=[e.clientX,e.clientY];if(mode==='walk')look(dx,dy);else{orbit-=dx*.005;tilt=Math.max(.25,Math.min(1.48,tilt+dy*.004))}}});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode==='aerial')distance=Math.max(180,Math.min(1150,distance+e.deltaY*.5));else followDistance=Math.max(3.5,Math.min(10,followDistance+e.deltaY*.006));},{passive:false});
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);if(b.dataset.key==='Space')jumpQueued=true;};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const ctx=$('map').getContext('2d');let mapFrame=0;
function map(){ctx.clearRect(0,0,260,310);const mx=x=>130+x*.39,mz=z=>155+z*.39;function path(p){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(mx(v[0]),mz(v[1])):ctx.moveTo(mx(v[0]),mz(v[1])))}path(boundary);ctx.fillStyle='#dde6ca';ctx.fill();ctx.strokeStyle='#afc4a5';ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle='#343738';for(const r of roads){path([r.a,r.b]);ctx.lineWidth=r.width*.39;ctx.stroke()}for(const b of buildings){path(b.points);ctx.fillStyle='#985344';ctx.fill()}for(const p of ponds){path(p.points);ctx.fillStyle='#587b59';ctx.fill()}if(world.garden){const g=world.garden;path(Array.from({length:49},(_,i)=>g.point(Math.cos(i*Math.PI/24)*g.halfWidth,Math.sin(i*Math.PI/24)*g.halfLength)));ctx.fillStyle='#6c934a';ctx.fill();ctx.beginPath();ctx.arc(mx(g.fountain[0]),mz(g.fountain[1]),g.basinRadius*.39,0,Math.PI*2);ctx.fillStyle='#409aa6';ctx.fill()}if(mode==='walk'){const x=mx(player.x),y=mz(player.z);ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI-avatar.root.rotation.y);ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.closePath();ctx.fillStyle='#ec804a';ctx.strokeStyle='white';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.restore();}ctx.fillStyle='#536b5b';ctx.font='10px Arial';ctx.fillText('100 m',10,300);ctx.fillRect(10,285,39,2);}
function frame(time){
 const dt=Math.min((time-last)/1000||.016,.05);last=time;
 if(mode==='walk'&&!$('info').open){
  const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
  const side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?7.5:3.6)*dt/Math.max(1,Math.hypot(f,side));
  const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*side)*speed;
  const ox=player.x,oz=player.z,moved=stepMotion(player,dx,dz,dt,jumpQueued,world);jumpQueued=false;travel+=moved;
  if(moved>.0001){const heading=Math.atan2(player.x-ox,player.z-oz),delta=Math.atan2(Math.sin(heading-avatar.root.rotation.y),Math.cos(heading-avatar.root.rotation.y));avatar.root.rotation.y+=delta*(1-Math.exp(-15*dt));}
  avatar.root.position.copy(player);avatar.animate(dt,moved,moved/dt,player.grounded,time/1000);
  const floor=world.walkHeight(player.x,player.z);contactShadow.position.set(player.x,floor+.19,player.z);contactShadow.material.opacity=.22/Math.max(1,player.y-floor);contactShadow.scale.setScalar(Math.max(.5,1-(player.y-floor)*.15));
  const follow=followCamera(player,yaw,pitch,followDistance,world);camera.position.set(follow.position.x,follow.position.y,follow.position.z);camera.lookAt(follow.target.x,follow.target.y,follow.target.z);
  const near=places.reduce((a,b)=>Math.hypot(player.x-b.p[0],player.z-b.p[1])<Math.hypot(player.x-a.p[0],player.z-a.p[1])?b:a,places[0]);
  $('location').textContent='Near '+near.name;$('walkStatus').textContent=(player.grounded?'Exploring':'Jumping')+' · '+near.name;
 }else if(mode==='aerial'){
  camera.position.set(target.x+Math.sin(orbit)*Math.cos(tilt)*distance,target.y+Math.sin(tilt)*distance,target.z+Math.cos(orbit)*Math.cos(tilt)*distance);camera.lookAt(target);$('location').textContent='Aerial overview';
 }
 labels.forEach(l=>{l.visible=mode==='aerial'||l.position.distanceTo(player)<110});
 if(++mapFrame%4===0)map();renderer.render(scene,camera);requestAnimationFrame(frame);
}

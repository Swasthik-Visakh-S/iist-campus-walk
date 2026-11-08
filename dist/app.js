import {createLighting} from './lighting.js?v=13';
import {createCampusAudio} from './audio.js?v=13';
import {createResidents} from './residents.js?v=13';
import {createCheckpoint,nearbyGate,transitSpeed} from './transit.js?v=13';
import {chooseQuality,applyQuality} from './quality.js?v=6';
import {createCharacter} from './character.js?v=13';
import {resetMotion,stepMotion,followCamera} from './movement.js?v=13';
import {buildWorld,inside} from './world.js?v=13';
import * as T from './vendor/three.module.js';
const $=id=>document.getElementById(id);
const canvas=$('world'), keys=new Set();
let touchVector={x:0,y:0},touchRun=false,qualityPreference='auto',quality;
const coarse=matchMedia('(pointer: coarse)').matches;
try{qualityPreference=localStorage.getItem('iist-quality')||'auto';}catch{}
if(!['auto','low','balanced','high'].includes(qualityPreference))qualityPreference='auto';
quality=chooseQuality(qualityPreference,{coarse,width:innerWidth,cores:navigator.hardwareConcurrency});
let mode='aerial',yaw=Math.PI,pitch=.32,orbit=0.35,tilt=.85,distance=710,drag=null,last=0,travel=0;
const player=Object.assign(new T.Vector3(),{vy:0,grounded:true}),target=new T.Vector3(0,18,-30);
const scene=new T.Scene();scene.background=new T.Color('#b8c5c6');scene.fog=new T.Fog('#b8c5c6',850,1900);
const camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,8,2500);
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:!coarse&&quality!=='low',powerPreference:quality==='low'?'low-power':'high-performance'});}catch(e){import('./fallback.js?v=13');throw e;}
const sound=createCampusAudio($('soundButton'));
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.25));renderer.shadowMap.enabled=quality!=='low';renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const sky=new T.HemisphereLight(0xe5f5ff,0x59614b,1.8);scene.add(sky);
const sun=new T.DirectionalLight(0xffedcf,2.5);sun.position.set(-230,440,150);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-470,right:470,top:470,bottom:-470,near:1,far:1000});sun.shadow.bias=-.0004;scene.add(sun);
let jumpQueued=false,followDistance=5.8,contextLost=false;
const avatar=createCharacter();avatar.root.traverse(o=>{if(o.isMesh)o.castShadow=false});scene.add(avatar.root);
const shadowGeometry=new T.CircleGeometry(.5,24);shadowGeometry.rotateX(-Math.PI/2);
const contactShadow=new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({color:'#172820',transparent:true,opacity:.22,depthWrite:false}));contactShadow.userData.dynamic=true;scene.add(contactShadow);
let lighting;
let buildings=[],roads=[],places=[],labels=[],ponds=[],boundary,spawn,world,residents;
function label(text,p,height){
 const c=document.createElement('canvas');c.width=384;c.height=80;
 const ctx=c.getContext('2d');ctx.fillStyle='#f7f7ed';ctx.beginPath();ctx.roundRect(4,4,376,66,10);ctx.fill();ctx.fillStyle='#244e40';ctx.font='600 22px Arial';ctx.textAlign='center';ctx.fillText(text,192,45,360);
 const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:true,transparent:true}));
 sprite.position.set(p[0],height+6,p[1]);const width=Math.max(12,Math.min(21,8+text.length*.4));sprite.scale.set(width,width*80/384,1);scene.add(sprite);labels.push(sprite);
}

const blocked=(x,z)=>world.blocked(x,z);
try{
const [data,config,heights]=await Promise.all(['campus.json','model-config.json','heights.json'].map(async path=>{const r=await fetch(path+'?v=13');if(!r.ok)throw Error(path+' unavailable');return r.json()}));
config.heights={...config.heights,...heights};world=buildWorld(scene,data,config);residents=createResidents(scene,world);lighting=createLighting(scene,renderer,sun,sky,world);applyQuality(renderer,sun,world,quality,devicePixelRatio);({buildings,roads,places,ponds,boundary,spawn}=world);
for(const p of places)label(p.shortName||p.name,p.label,p.height);
for(let i=0;i<places.length;i++){let o=document.createElement('option');o.value=i;o.textContent=places[i].name;$('destination').append(o);}
resetMotion(player,...spawn,world);avatar.root.visible=false;contactShadow.visible=false;$('loading').remove();addSigns();requestAnimationFrame(frame);
}catch(e){$('loading').textContent='Unable to load the campus. '+e.message;console.error(e);}
const checkpoint=createCheckpoint();
let skating=false,dead=false,deathAt=0;
const shotGeometry=new T.BufferGeometry();
shotGeometry.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(6),3));
const shot=new T.Line(shotGeometry,new T.LineBasicMaterial({color:'#ffc76a',depthTest:false}));
shot.frustumCulled=false;shot.renderOrder=4;shot.visible=false;scene.add(shot);
function toggleBoard(){
 if(mode!=='walk'||dead)return;
 skating=!skating;resetTouch();document.activeElement?.blur();
 $('boardButton').setAttribute('aria-pressed',String(skating));
 $('boardButton').textContent=skating?'Walk · B':'Skateboard · B';
 $('runButton').textContent=skating?'Boost':'Run';
}
function updateCheckpoint(){
 const gate=mode==='walk'&&!dead?nearbyGate(world.gates,player):null;
 $('idButton').hidden=!gate;
 $('idButton').disabled=!!gate&&checkpoint.cleared(gate);
 $('gateStatus').textContent=gate?(checkpoint.cleared(gate)?'ID accepted · '+gate.name:gate.name+' · Show ID to cross'):'';
}
function showID(){
 if(mode!=='walk'||dead)return;
 checkpoint.show(nearbyGate(world.gates,player));document.activeElement?.blur();updateCheckpoint();
}
function restartWalk(){
 dead=false;sound.setDead(false);document.body.classList.remove('dying');shot.visible=false;avatar.root.rotation.z=0;
 resetMotion(player,...spawn,world);checkpoint.reset();updateCheckpoint();
}
function fireAtPlayer(gate){
 dead=true;deathAt=last;sound.setDead(true);document.body.classList.add('dying');keys.clear();jumpQueued=false;resetTouch();drag=null;document.exitPointerLock?.();
 const muzzle=gate.muzzles.reduce((nearest,p)=>p.distanceToSquared(player)<nearest.distanceToSquared(player)?p:nearest);
 const line=shotGeometry.attributes.position;
 line.setXYZ(0,muzzle.x,muzzle.y,muzzle.z);line.setXYZ(1,player.x,player.y+1,player.z);line.needsUpdate=true;shot.visible=true;
 updateCheckpoint();
}
$('death').addEventListener('cancel',e=>e.preventDefault());
$('respawn').onclick=()=>{if(!$('death').open)return;$('death').close();restartWalk();setMode('walk');};
$('boardButton').onclick=toggleBoard;$('idButton').onclick=showID;
function setMode(m){if(dead)return;
 // The overview looks across hundreds of metres. A larger near plane keeps
 // asphalt, its markings and the terrain distinct at that distance.
 if(mode!==m){
  camera.near=m==='aerial'?8:.1;
  camera.updateProjectionMatrix();
 }
 mode=m;updateCheckpoint();resetTouch();document.activeElement?.blur();keys.clear();document.body.classList.toggle('walk',m==='walk');$('overview').classList.toggle('active',m==='aerial');$('walk').classList.toggle('active',m==='walk');$('walking').hidden=m!=='walk';$('crosshair').hidden=true;jumpQueued=false;avatar.root.visible=m==='walk';contactShadow.visible=m==='walk';if(m==='aerial')document.exitPointerLock?.();}
async function capture(){if(mode!=='walk')return;try{await canvas.requestPointerLock?.();}catch{ /* Drag-to-look remains available in embedded previews. */ }}
$('start').onclick=()=>{if(dead)return;restartWalk();yaw=Math.PI;pitch=.32;avatar.root.rotation.y=0;setMode('walk');capture()};$('walk').onclick=()=>{setMode('walk');capture()};$('overview').onclick=()=>setMode('aerial');$('reset').onclick=()=>{if(dead)return;document.activeElement?.blur();keys.clear();jumpQueued=false;resetTouch();restartWalk();yaw=Math.PI;pitch=.32;avatar.root.rotation.y=0;distance=710;orbit=.35;tilt=.85;travel=0};$('about').onclick=()=>{if(dead)return;$('info').showModal();document.exitPointerLock?.();keys.clear();jumpQueued=false;resetTouch()};$('closeInfo').onclick=()=>$('info').close();
$('destination').onchange=e=>{
 if(dead||e.target.value==='')return;
 const place=places[+e.target.value];
 e.target.blur();
 checkpoint.reset();
 resetMotion(player,...place.p,world);
 setMode('walk');
 document.body.classList.remove('map-open');
 $('mapToggle').setAttribute('aria-expanded','false');
 const gate=world.gates.find(g=>g.name===place.name);
 const goal=place.name==='Football turf'?world.pitch.aim:null;
 const facing=gate?.center||place.viewToward||place.door||goal||(place.name==='Library fountain & garden'?world.garden.libraryCenter:null);
 if(facing){
  yaw=Math.atan2(player.x-facing[0],player.z-facing[1]);
  avatar.root.rotation.y=yaw+Math.PI;
 }
 pitch=place.viewPitch??.32;
 e.target.value='';
};
window.addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes(e.target.tagName)||$('info').open||dead)return;if(e.code==='KeyB'&&!e.repeat)toggleBoard();if(e.code==='KeyI'&&!e.repeat)showID();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat&&mode==='walk')jumpQueued=true;if(e.code==='KeyV'&&!e.repeat)setMode(mode==='walk'?'aerial':'walk');if(e.code==='Enter'){setMode('walk');capture()}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{drag=null;keys.clear();jumpQueued=false;resetTouch();});document.addEventListener('visibilitychange',()=>{keys.clear();jumpQueued=false;resetTouch();});
canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,e.pointerId];canvas.setPointerCapture(e.pointerId);if(mode==='walk'&&e.pointerType==='mouse')capture()});canvas.addEventListener('pointerup',e=>{if(drag?.[2]===e.pointerId)drag=null});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('lostpointercapture',()=>drag=null);
function look(dx,dy){yaw-=dx*.003;pitch=Math.max(-80*Math.PI/180,Math.min(1.0,pitch+dy*.003));}
window.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas&&mode==='walk')look(e.movementX,e.movementY);else if(drag&&drag[2]===e.pointerId){const dx=e.clientX-drag[0],dy=e.clientY-drag[1];drag=[e.clientX,e.clientY,e.pointerId];if(mode==='walk')look(dx,dy);else{orbit-=dx*.005;tilt=Math.max(.25,Math.min(1.48,tilt+dy*.004))}}});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode==='aerial')distance=Math.max(180,Math.min(1150,distance+e.deltaY*.5));else followDistance=Math.max(3.5,Math.min(10,followDistance+e.deltaY*.006));},{passive:false});
const joy=$('joystick'),stick=$('stick');let joyPointer=null;
function resetTouch(){touchVector={x:0,y:0};joyPointer=null;touchRun=false;if(stick)stick.style.transform='translate(-50%,-50%)';$('runButton')?.setAttribute('aria-pressed','false');}
function moveStick(e){if(e.pointerId!==joyPointer)return;const rect=joy.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,r=Math.min(rect.width/2-20,42),len=Math.hypot(dx,dy),scale=Math.min(1,r/Math.max(1,len));touchVector={x:dx*scale/r,y:-dy*scale/r};if(len<8)touchVector={x:0,y:0};stick.style.transform=`translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dy*scale}px))`;}
joy.onpointerdown=e=>{e.preventDefault();joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveStick(e)};joy.onpointermove=moveStick;joy.onpointerup=joy.onpointercancel=joy.onlostpointercapture=()=>{touchVector={x:0,y:0};joyPointer=null;stick.style.transform='translate(-50%,-50%)'};
$('jumpButton').onpointerdown=e=>{e.preventDefault();if(mode==='walk')jumpQueued=true;};$('jumpButton').onclick=e=>{if(e.detail===0&&mode==='walk')jumpQueued=true;};
$('runButton').onclick=()=>{touchRun=!touchRun;$('runButton').setAttribute('aria-pressed',String(touchRun));};
$('mapToggle').onclick=()=>{document.activeElement?.blur();const open=document.body.classList.toggle('map-open');$('mapToggle').setAttribute('aria-expanded',String(open));};
$('timeOfDay').onchange=e=>{lighting?.setMode(e.target.value);document.body.classList.toggle('night',e.target.value==='night');e.target.blur?.();try{localStorage.setItem('iist-time',e.target.value)}catch{}};
try{const saved=localStorage.getItem('iist-time');if(saved==='night'){$('timeOfDay').value=saved;$('timeOfDay').onchange({target:$('timeOfDay')});}}catch{}
$('quality').value=qualityPreference;$('quality').onchange=e=>{qualityPreference=e.target.value;e.target.blur?.();quality=chooseQuality(qualityPreference,{coarse,width:innerWidth,cores:navigator.hardwareConcurrency});applyQuality(renderer,sun,world,quality,devicePixelRatio);try{localStorage.setItem('iist-quality',qualityPreference)}catch{}};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;keys.clear();resetTouch();$('renderMessage').hidden=false;});
canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;renderer.shadowMap.needsUpdate=true;$('renderMessage').hidden=true;});
$('reloadScene').onclick=()=>location.reload();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const ctx=$('map').getContext('2d'),mapBase=document.createElement('canvas');mapBase.width=260;mapBase.height=310;let staticMapReady=false,lastMap=0,lastHud=0;
function drawStaticMap(){staticMapReady=false;map();mapBase.getContext('2d').drawImage($('map'),0,0);staticMapReady=true;}
function map(){ctx.clearRect(0,0,260,310);if(staticMapReady){ctx.drawImage(mapBase,0,0);drawMarker();return;}const mx=x=>130+x*.39,mz=z=>155+z*.39;function path(p){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(mx(v[0]),mz(v[1])):ctx.moveTo(mx(v[0]),mz(v[1])))}path(boundary);ctx.fillStyle='#dde6ca';ctx.fill();if(world.landscape){
  path(world.landscape.libraryForest.points);ctx.fillStyle='#779266';ctx.fill();
  path(world.landscape.soilGround.points);ctx.fillStyle='#ad8d64';ctx.fill();path(boundary);
 }ctx.strokeStyle='#afc4a5';ctx.lineWidth=1;ctx.stroke();for(const r of roads){ctx.strokeStyle=r.unpaved?'#a4865c':'#343738';path([r.a,r.b]);ctx.lineWidth=r.width*.39;ctx.stroke()}for(const b of buildings){path(b.points);ctx.fillStyle='#985344';ctx.fill()}for(const p of ponds){path(p.points);ctx.fillStyle='#587b59';ctx.fill()}if(world.garden){const g=world.garden;path(Array.from({length:49},(_,i)=>g.point(Math.cos(i*Math.PI/24)*g.halfWidth,Math.sin(i*Math.PI/24)*g.halfLength)));ctx.fillStyle='#6c934a';ctx.fill();ctx.beginPath();ctx.arc(mx(g.fountain[0]),mz(g.fountain[1]),g.basinRadius*.39,0,Math.PI*2);ctx.fillStyle='#409aa6';ctx.fill()}ctx.fillStyle='#536b5b';ctx.font='10px Arial';ctx.fillText('100 m',10,300);ctx.fillRect(10,285,39,2);}
function drawMarker(){if(mode==='walk'){const x=130+player.x*.39,y=155+player.z*.39;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI-avatar.root.rotation.y);ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.closePath();ctx.fillStyle='#ec804a';ctx.strokeStyle='white';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.restore();}}
function addSigns(){for(const g of world.gates){for(const [name,spec] of [['IIST · '+g.name,g.sign],['CISF',g.guardSign]]){const c=document.createElement('canvas');c.width=512;c.height=64;const context=c.getContext('2d');context.fillStyle='#f5efdf';context.font='bold 34px Arial';context.textAlign='center';context.fillText(name,256,45,490);const material=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,side:T.DoubleSide,depthWrite:false});const mesh=new T.Mesh(new T.PlaneGeometry(name==='CISF'?1.7:Math.min(8,g.width-1),.40),material);mesh.position.set(spec.p[0],spec.y,spec.p[1]);mesh.rotation.y=spec.angle;scene.add(mesh);}}}
let frameBudget=0,frameSamples=0;
function frame(time){
 if(!staticMapReady)drawStaticMap();
 const elapsed=(time-last)/1000||.016,dt=Math.min(elapsed,.05);last=time;if(document.hidden||contextLost){requestAnimationFrame(frame);return;}
 if(qualityPreference==='auto'&&quality!=='low'&&time>6000){frameBudget+=elapsed;frameSamples++;if(frameSamples>=120){if(frameBudget/frameSamples>.032){quality='low';applyQuality(renderer,sun,world,quality,devicePixelRatio);}frameBudget=0;frameSamples=0;}}
 const travelling=mode==='walk'&&!$('info').open&&!dead;
 residents.update(dt);
 if(!travelling){world.pitch?.update(dt,null);}
 if(travelling){
  const f=touchVector.y+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
  const side=touchVector.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  const boosted=keys.has('ShiftLeft')||keys.has('ShiftRight')||touchRun;
  const speed=transitSpeed(skating,boosted)*dt/Math.max(1,Math.hypot(f,side));
  const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*side)*speed;
  const ox=player.x,oz=player.z,moved=stepMotion(player,dx,dz,dt,jumpQueued,world);jumpQueued=false;travel+=moved;
  world.pitch?.update(dt,player,player.x-ox,player.z-oz);
  const crossing=checkpoint.cross(world.gates,{x:ox,z:oz},player);
  if(crossing&&!crossing.allowed)fireAtPlayer(crossing.gate);
  else if(moved>0&&inside(ox,oz,boundary)&&!inside(player.x,player.z,boundary)){
    const gate=world.exteriorGate(player.x,player.z);
    if(gate&&!checkpoint.cleared(gate))fireAtPlayer(gate);
  }
  if(moved>.0001){const heading=Math.atan2(player.x-ox,player.z-oz),delta=Math.atan2(Math.sin(heading-avatar.root.rotation.y),Math.cos(heading-avatar.root.rotation.y));avatar.root.rotation.y+=delta*(1-Math.exp(-15*dt));}
  avatar.root.position.copy(player);avatar.animate(dt,moved,moved/dt,player.grounded,time/1000,skating,boosted);
  const floor=world.walkHeight(player.x,player.z);contactShadow.position.set(player.x,floor+.025,player.z);contactShadow.material.opacity=.22/Math.max(1,player.y-floor);contactShadow.scale.setScalar(Math.max(.5,1-(player.y-floor)*.15));
  const follow=followCamera(player,yaw,pitch,followDistance,world);camera.position.set(follow.position.x,follow.position.y,follow.position.z);camera.lookAt(follow.target.x,follow.target.y,follow.target.z);
  if(time-lastHud>200){lastHud=time;updateCheckpoint();const near=places.reduce((a,b)=>Math.hypot(player.x-b.p[0],player.z-b.p[1])<Math.hypot(player.x-a.p[0],player.z-a.p[1])?b:a,places[0]);
  $('location').textContent='Near '+near.name;$('walkStatus').textContent=(player.grounded?(skating?(boosted?'Boosting':'Skating'):'Walking'):'Jumping')+' · '+near.name;}
 }else if(mode==='aerial'){
  camera.position.set(target.x+Math.sin(orbit)*Math.cos(tilt)*distance,target.y+Math.sin(tilt)*distance,target.z+Math.cos(orbit)*Math.cos(tilt)*distance);camera.lookAt(target);$('location').textContent='Aerial overview';
 }
 if(dead){
  const elapsed=(time-deathAt)/1000;
  shot.visible=elapsed<.23;
  avatar.root.rotation.z=Math.min(1.35,elapsed*5);
  if(elapsed>=3&&!$('death').open)$('death').showModal();
 }
 labels.forEach(l=>{l.visible=mode==='aerial'||l.position.distanceTo(player)<110});
 if(time-lastMap>125){lastMap=time;if(!coarse||document.body.classList.contains('map-open'))map();}lighting?.update(camera);renderer.render(scene,camera);requestAnimationFrame(frame);
}

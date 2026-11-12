import * as T from './vendor/three.module.js';
import {edgeDistance,distSegment} from './geometry.js?v=6';
export function planStreetlights(world){
 const lamps=[];
 for(const r of world.terrainModel?.routes||[]){
  if(r.covered||r.id.startsWith('entrance-'))continue;
  const count=Math.max(1,Math.ceil(r.length/25));
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,c=[r.a[0]+r.dx*t,r.a[1]+r.dz*t];
   if(lamps.some(l=>Math.hypot(l.x-c[0],l.z-c[1])<13))continue;
   for(const side of [1,-1]){
    const offset=r.width/2+1.1,x=c[0]-r.dz/r.length*offset*side,z=c[1]+r.dx/r.length*offset*side;
    if(world.terrainModel.routes.some(q=>distSegment(x,z,q.a,q.b)<q.width/2+.6)||world.blocked(x,z)||world.buildings.some(b=>edgeDistance(x,z,b.points)<1.5)||world.entrances.some(e=>Math.hypot(x-e.end[0],z-e.end[1])<4))continue;
    lamps.push({x,z,y:world.terrainSurface.heightAt(x,z),cx:c[0],cz:c[1],height:r.width>4?6.5:4.4});break;
   }
  }
 }
 return lamps;
}
export function createLighting(scene,renderer,sun,sky,world){
 const lamps=planStreetlights(world),group=new T.Group();group.name='LED road lighting';group.userData.dynamic=true;scene.add(group);
 const metal=new T.MeshStandardMaterial({color:'#68777b',roughness:.55,metalness:.55});
 const glow=new T.MeshBasicMaterial({color:'#fff2cd'}),pools=new T.MeshBasicMaterial({color:'#9abed3',transparent:true,opacity:.13,depthWrite:false});
 const dummy=new T.Object3D();
 function instances(geometry,material,transform){const mesh=new T.InstancedMesh(geometry,material,lamps.length);lamps.forEach((l,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);transform(l,dummy);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});group.add(mesh);return mesh;}
 instances(new T.CylinderGeometry(.055,.10,1,6),metal,(l,o)=>{o.position.set(l.x,l.y+l.height/2,l.z);o.scale.y=l.height;});
 instances(new T.BoxGeometry(.1,.1,1.4),metal,(l,o)=>{const a=Math.atan2(l.cx-l.x,l.cz-l.z);o.position.set(l.x+Math.sin(a)*.6,l.y+l.height,l.z+Math.cos(a)*.6);o.rotation.y=a;});
 const heads=instances(new T.BoxGeometry(.38,.09,.9),glow,(l,o)=>{const a=Math.atan2(l.cx-l.x,l.cz-l.z);o.position.set(l.x+Math.sin(a)*1.1,l.y+l.height-.05,l.z+Math.cos(a)*1.1);o.rotation.y=a;});
 const positions=[];for(const l of lamps){const ring=Array.from({length:17},(_,i)=>[l.cx+Math.cos(i*Math.PI/8)*4.8,l.cz+Math.sin(i*Math.PI/8)*4.8]);world.terrainSurface.project(ring,.19,positions);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const pool=new T.Mesh(g,pools);group.add(pool);
 // A fixed light pool keeps shader cost independent of the total road length.
 const lights=Array.from({length:6},()=>{const l=new T.PointLight('#e4f1ff',0,23,2);l.castShadow=false;scene.add(l);return l;});
 const interiors=[];for(const e of world.entrances||[]){if(!['cafeteria','crystal-hostel'].includes(e.buildingId))continue;const light=new T.PointLight('#ffd9a0',0,16,2);light.position.set(e.door[0]+e.n[0]*2,e.level+2.8,e.door[1]+e.n[1]*2);scene.add(light);interiors.push(light);}
 const seating=world.data?world.cafe:null,umbrellas=world.cafeUmbrellas||[];
 const rings=new T.InstancedMesh(new T.TorusGeometry(1.78,.035,5,32),glow,umbrellas.length);rings.name='Umbrella inward LED rims';
 umbrellas.forEach((p,i)=>{dummy.position.set(p[0],seating.level+2.42,p[1]);dummy.rotation.set(Math.PI/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();rings.setMatrixAt(i,dummy.matrix);});group.add(rings);
 const localLights=umbrellas.map(p=>({x:p[0],z:p[1],cx:p[0],cz:p[1],y:seating.level,height:2.6,intensity:32}));
 if(seating)for(const v of [6.3,10.7]){const p=seating.at(6,v),panel=new T.Mesh(new T.BoxGeometry(1.2,.045,.18),glow);panel.position.set(p[0],seating.level+3.03,p[1]);panel.rotation.y=Math.atan2(seating.entry.n[0],seating.entry.n[1]);group.add(panel);localLights.push({x:p[0],z:p[1],cx:p[0],cz:p[1],y:seating.level,height:3,intensity:40});}
 const candidates=[...lamps,...localLights];
 let night=false,lastX=Infinity,lastZ=Infinity;
 let strength=0;
 function setDaylight(daylight,rain=0){
  const previous=strength;strength=1-daylight;night=strength>.01;
  scene.background.copy(new T.Color('#101d32')).lerp(new T.Color('#c3d5dc'),daylight).lerp(new T.Color('#657984'),rain*.28);
  scene.fog.color.copy(scene.background);scene.fog.near=850-rain*480;scene.fog.far=1900-rain*850;
  sky.intensity=(.38+1.42*daylight)*(1-.24*rain);sun.intensity=(.35+2.15*daylight)*(1-.7*rain);
  sun.color.copy(new T.Color('#a9c8f4')).lerp(new T.Color('#ffedcf'),daylight);
  renderer.toneMappingExposure=1.2-.15*daylight;glow.color.copy(new T.Color('#d6dfe0')).lerp(new T.Color('#fff2cd'),strength);
  pool.visible=night;pools.opacity=.13*strength;interiors.forEach(l=>l.intensity=55*strength);
  if(Math.abs(previous-strength)>.001)lastX=Infinity;
  if(!night)lights.forEach(l=>l.intensity=0);
 }
 function setMode(value){setDaylight(value==='night'?0:1);lastX=Infinity;renderer.shadowMap.needsUpdate=true;sun.shadow.needsUpdate=true;}
 function update(camera){if(!night||Math.hypot(camera.position.x-lastX,camera.position.z-lastZ)<4)return;lastX=camera.position.x;lastZ=camera.position.z;const nearest=candidates.slice().sort((a,b)=>(a.x-lastX)**2+(a.z-lastZ)**2-(b.x-lastX)**2-(b.z-lastZ)**2);lights.forEach((light,i)=>{const l=nearest[i];light.intensity=l?(l.intensity||110)*strength:0;if(l)light.position.set(l.cx,l.y+l.height-.15,l.cz);});}
 const original=world.blocked;world.blocked=(x,z)=>original(x,z)||lamps.some(l=>Math.hypot(x-l.x,z-l.z)<.3);
 setMode('morning');return {lamps,lights,setMode,setDaylight,update};
}

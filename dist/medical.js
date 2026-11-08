import * as T from './vendor/three.module.js';
import {addAmbulance} from './ambulance.js?v=12';

export function planMedical(entry,routes){
  const {door,right,n,level}=entry;
  const at=(u,v)=>[door[0]+u*right[0]+v*n[0],door[1]+u*right[1]+v*n[1]];
  const local=(x,z)=>[(x-door[0])*right[0]+(z-door[1])*right[1],(x-door[0])*n[0]+(z-door[1])*n[1]];
  const edges=routes.filter(r=>r.id==='365911690').map(r=>{
    const a=local(...r.a),b=local(...r.b);
    const du=b[0]-a[0],dv=b[1]-a[1],side=Math.sign(du)*r.width/(2*r.length);
    return [[a[0]+dv*side,a[1]-du*side],[b[0]+dv*side,b[1]-du*side]];
  });
  function roadEdge(u){
    for(const [a,b] of edges){
      const t=(u-a[0])/(b[0]-a[0]);
      if(t>=0&&t<=1)return a[1]+t*(b[1]-a[1]);
    }
    // The small gaps between the offset segments occur at rounded bends.
    const nearest=edges.flat().reduce((p,q)=>Math.abs(q[0]-u)<Math.abs(p[0]-u)?q:p);
    return nearest[1];
  }
  const apron=(u,v)=>u>=-10&&u<=3.8&&v>=-.55&&v<=roadEdge(u)+.14;
  const inDriveway=(x,z)=>{const [u,v]=local(x,z);return u>=-10.6&&u<=4.4&&v>=-.6&&v<=7;};
  const posts=[at(-8.6,.43),at(2.65,.43)];
  const parked={u:-4.75,v:2.05};
  function vehicle(x,z,margin){
    const [u,v]=local(x,z);
    return Math.abs(u-parked.u)<=3.12+margin&&Math.abs(v-parked.v)<=1.1+margin;
  }
  function cameraBlocked(x,y,z){
    const [u,v]=local(x,z);
    return y<level+3.25&&vehicle(x,z,.12) ||
      y>level+3.84&&y<level+4.40&&u>-9.45&&u<3.55&&v>-.65&&v<4;
  }
  function clearPlanting(x,z,margin){
    const [u,v]=local(x,z);
    return u>=-41-margin&&u<=8+margin&&v>=-1-margin&&v<=5+margin;
  }
  return {entry,level,at,local,posts,parked,roadEdge,apron,inDriveway,clearPlanting,cameraBlocked,
    blocked:(x,z)=>vehicle(x,z,.22),spawn:at(6,9),aim:at(-3,.9)};
}

export function addMedical(scene,medical,surface,box,m){
  const {at,entry,level,posts,parked,roadEdge}=medical;
  const yaw=Math.atan2(entry.n[0],entry.n[1]);
  function part(mat,u,v,y,w,h,d){
    const [x,z]=at(u,v);
    box(mat,x,level+y,z,w,h,d,yaw);
  }
  const paving=[];
  for(let u=-10;u<3.8;u+=.5){
    const next=Math.min(3.8,u+.5);
    surface.project([at(u,-.55),at(next,-.55),at(next,roadEdge(next)+.07),at(u,roadEdge(u)+.07)],.177,paving);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(paving,3));g.computeVertexNormals();
  const apron=new T.Mesh(g,new T.MeshStandardMaterial({color:'#b9b5aa',roughness:.97,side:T.DoubleSide}));
  apron.name='Medical drop-off paving';apron.receiveShadow=true;scene.add(apron);
  for(const [x,z] of posts)box(m.white,x,level+2,z,.40,4,.44,yaw);
  part(m.white,-2.95,1.66,4.02,12.9,.35,4.65);
  part(m.roof,-2.95,1.66,4.24,12.83,.13,4.58);
  part(m.glass,0,.12,1.52,2.55,2.74,.13);
  for(const u of [-1.28,0,1.28])part(m.white,u,.23,1.51,.08,2.82,.06);
  part(m.white,0,.2,2.94,2.75,.16,.18);
  // A slim fascia identifies the vehicle porch at street level.
  if(typeof document!=='undefined'){
    const c=document.createElement('canvas');c.width=768;c.height=86;
    const ctx=c.getContext('2d');ctx.fillStyle='#23594e';ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 55px sans-serif';ctx.fillText('Medical Services',384,45);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(4.3,.48),new T.MeshBasicMaterial({map:texture}));
    const [x,z]=at(.1,4.01);sign.position.set(x,level+4.05,z);sign.rotation.y=yaw;scene.add(sign);
  }
  const shrubPositions=[];
  for(let u=-37;u<=6.9;u+=1.18){
    if(u>-11.1&&u<4.95)continue;
    const [x,z]=at(u,roadEdge(u)-1.35);
    shrubPositions.push([x,surface.heightAt(x,z)+.42,z]);
  }
  const hedge=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({roughness:1}),shrubPositions.length);
  const shape=new T.Object3D();
  shrubPositions.forEach(([x,y,z],i)=>{
    shape.position.set(x,y,z);shape.rotation.y=yaw+i*.12;shape.scale.set(.81,.47+(i%3)*.04,.6);shape.updateMatrix();
    hedge.setMatrixAt(i,shape.matrix);hedge.setColorAt(i,new T.Color(['#477042','#618549','#4c7840'][i%3]));
  });
  hedge.name='Medical frontage shrubs';hedge.receiveShadow=true;scene.add(hedge);
  const [x,z]=at(parked.u,parked.v);
  addAmbulance(scene,x,surface.heightAt(x,z)+.177,z,Math.atan2(entry.right[0],entry.right[1]));
}

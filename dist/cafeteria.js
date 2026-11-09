import * as T from './vendor/three.module.js';
import {distSegment} from './geometry.js?v=6';

export function planCafeteria(entry,umbrellas=[]){
  const {door,n,right,level}=entry;
  const at=(u,v)=>[door[0]+u*right[0]+v*n[0],door[1]+u*right[1]+v*n[1]];
  const local=(x,z)=>[(x-door[0])*right[0]+(z-door[1])*right[1],(x-door[0])*n[0]+(z-door[1])*n[1]];
  const posts=[at(-5.5,3.4),at(5.5,3.4),at(4,5),at(8,5),at(4,12.3),at(8,12.3)];
  const fences=[[-8.2,13.3,-2.4,13.3],[2.4,13.3,8.2,13.3],[-21.3,9,-8.3,9],[-8.3,9,-8.3,13.3],[-21.3,0,-21.3,9],[-3.18,1.45,-3.18,7.4],[-1.42,2.7,-1.42,7.4]];
  const rails=fences.map(([u,v,x,z])=>[at(u,v),at(x,z)]);
  function heightAt(x,z){
    const [u,v]=local(x,z);
    if(u>=-3.2&&u<=2.7&&v>=.65&&v<=1.5)return level+.68;
    if(u>=-3.2&&u<=-1.4&&v>=1.5&&v<=7.5)return level+.14+.54*(7.5-v)/6;
    if(u>=-1.35&&u<=2.7&&v>1.5&&v<2.58)return level+.14+.18*(3-Math.floor((v-1.5)/.36));
    if((u>=-21.3&&u<=-8.25&&v>=0&&v<=9)||(Math.abs(u)<=8.3&&v>=0&&v<=13.3))return level+.14;
    return null;
  }
  function blocked(x,z){return umbrellas.some(p=>Math.hypot(x-p[0],z-p[1])<.9)||rails.some(([a,b])=>distSegment(x,z,a,b)<.18);}
  function cameraBlocked(x,y,z){
    const [u,v]=local(x,z);
    return u>3.8&&u<8.3&&v>4.8&&v<12.6&&Math.abs(y-level-3.15)<.2 || Math.abs(u)<7.5&&v>-2.5&&v<5.1&&Math.abs(y-level-4.65-Math.sin(.1)*(v-1.3))<.2 || Math.abs(u)<6.5&&v>-.15&&v<4&&y>level+3.25&&y<level+3.7 || y<level+1.6&&blocked(x,z);
  }
  return {entry,at,local,level,posts,rails,heightAt,blocked,cameraBlocked,
    noPlants:(x,z,margin=0)=>{const [u,v]=local(x,z);return Math.hypot(x-at(0,18)[0],z-at(0,18)[1])<2+margin || u>-21.8-margin&&u<8.8+margin&&v>-.1-margin&&v<13.8+margin;},
    spawn:at(0,18),aim:at(-5,3)};
}

export function addCafeteria({scene,cafe,box,m,mesh,polygon}){
  const {at,level,entry,posts}=cafe,yaw=Math.atan2(entry.n[0],entry.n[1]);
  const timber=new T.MeshStandardMaterial({color:'#aa8b53',roughness:.9});
  const dark=new T.MeshStandardMaterial({color:'#272c2b',roughness:.7});
  const rails=new T.MeshStandardMaterial({color:'#718c98',roughness:.5,metalness:.4});
  const red=new T.MeshStandardMaterial({color:'#794c43',roughness:.9});
  const cream=new T.MeshStandardMaterial({color:'#ddd7c9',roughness:.9});
  const part=(mat,u,y,v,w,h,d)=>{const p=at(u,v);box(mat,p[0],level+y,p[1],w,h,d,yaw);};
  polygon([at(-8.3,0),at(8.3,0),at(8.3,13.3),at(-8.3,13.3)],.14,cream,level);
  polygon([at(-21.3,0),at(-8.3,0),at(-8.3,9),at(-21.3,9)],.14,cream,level);
  part(cream,6,3.15,8.65,4.5,.18,8);
  part(rails,6,3.3,8.65,4.7,.12,8.2);
  for(const v of [7,10]){part(m.roof,6,.8,v,1.6,.12,1);for(const u of [4.8,7.2])part(m.roof,u,.45,v,.45,.12,1.8); }
  // Alternating paving bands keep the entrance forecourt legible at walking scale.
  for(let v=.4;v<13.2;v+=.8)part(m.roof,0,.146,v,16.4,.012,.045);
  for(let u=-8;u<8;u+=.8)part(m.roof,u,.147,5.3,.035,.012,10.4);
  for(let v=.4;v<9;v+=.8)part(m.roof,-14.8,.146,v,13,.012,.045);
  part(red,-.25,.34,1.05,5.9,.68,.9);
  for(let i=0;i<3;i++)part(red,.675,(.14+.18*(3-i))/2,1.5+(i+.5)*.36,4.05,.14+.18*(3-i),.36);
  const ramp=[[-3.2,1.5,.68],[-1.4,1.5,.68],[-1.4,7.5,.14],[-3.2,7.5,.14]];
  const vertices=[];
  for(const i of [0,3,1,1,3,2]){const [u,v,h]=ramp[i],p=at(u,v);vertices.push(p[0],level+h,p[1]);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();mesh(geometry,rails);
  for(const [i,[x,z]] of posts.entries()){const h=i<2?3.46:3.15;box(dark,x,level+h/2,z,.13,h,.13,yaw); }
  part(cream,0,3.46,1.9,13,.24,4.2);
  part(cream,0,3.29,1.9,12.8,.10,4.0);
  // Broad red tiled roof with a white soffit, slender posts and warm pendant fittings.
  const roofPoint=at(0,1.3),roof=mesh(new T.BoxGeometry(14.8,.18,7.5),red,roofPoint[0],level+4.65,roofPoint[1]);
  roof.rotation.order='YXZ';roof.rotation.set(-.10,yaw,0);
  for(let u=-7.2;u<7.3;u+=.32){const p=at(u,1.3),rib=mesh(new T.BoxGeometry(.035,.035,7.5),red,p[0],level+4.76,p[1]);rib.rotation.order='YXZ';rib.rotation.set(-.10,yaw,0);}
  for(const u of [-5.5,5.5])part(dark,u,3.9,3.4,.13,.9,.13);
  for(const u of [-3.7,0,3.7]){
    part(dark,u,3.02,2.4,.035,.6,.035);
    part(cream,u,2.7,2.4,.18,.28,.18);
    part(cream,u,3.27,2,1.7,.035,.08);
  }
  // Thin vertical bars complete the front fence while keeping its opening clear.
  for(const side of [-1,1])for(let u=2.65;u<8.2;u+=.42)part(dark,u*side,.68,13.3,.025,1.04,.025);
  // Bamboo facing and a broad counter opening follow the supplied entrance photo.
  part(timber,0,.76,.09,13.8,1.52,.12);
  for(let u=-6.8;u<6.9;u+=.19)part(red,u,.76,.16,.035,1.48,.025);
  part(dark,0,1.95,.19,5.25,2.42,.07);
  part(timber,0,.89,.29,5.25,1.30,.18);
  part(dark,0,1.58,.43,5.6,.12,.60);
  part(cream,0,3.08,.2,5.65,.15,.30);
  for(const u of [-2.72,2.72])part(timber,u,2.0,.22,.18,2.36,.20);
  for(let u=-6.8;u<6.9;u+=.24)part(timber,u,2.93,.10,.17,.34,.15);
  function bar(a,b,r){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start);
    const rod=mesh(new T.CylinderGeometry(r,r,axis.length(),6),rails);
    rod.position.copy(start).lerp(end,.5);rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
  }
  for(let j=0;j<cafe.rails.length;j++){
    const [a,b]=cafe.rails[j],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/1.2),rampRail=j>=cafe.rails.length-2;
    const h=p=>rampRail?Math.max(.14,.68-.09*(cafe.local(...p)[1]-1.5)):.14;
    for(let i=0;i<=n;i++){
      const p=a.map((v,k)=>v+(b[k]-v)*i/n),base=h(p);
      bar([p[0],level+base,p[1]],[p[0],level+base+1.05,p[1]],.035);
    }
    for(const lift of [.5,1.05])bar([a[0],level+h(a)+lift,a[1]],[b[0],level+h(b)+lift,b[1]],.03);
  }
}

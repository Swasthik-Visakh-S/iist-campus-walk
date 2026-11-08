import * as T from './vendor/three.module.js';
import {inside} from './geometry.js?v=6';

export function perimeterRails(ponds, fences) {
  const chains = ponds.map(pond => {
    const ring = pond.points.slice(0, -1);
    const corners = ring.map((p, i) => {
      const prev = ring[(i + ring.length - 1) % ring.length], next = ring[(i + 1) % ring.length];
      const dx = next[0] - prev[0], dz = next[1] - prev[1], length = Math.hypot(dx,dz);
      let nx = -dz / length, nz = dx / length;
      if (inside(p[0]+nx*.1,p[1]+nz*.1,pond.points)) { nx *= -1; nz *= -1; }
      return [p[0]+nx*1.1,p[1]+nz*1.1];
    });
    return {points:[...corners,corners[0]],fence:false};
  });
  chains.push(...fences.map(points=>({points,fence:true})));
  return chains.flatMap(({points,fence})=>points.slice(1).map((b,i)=>({a:points[i],b,fence})));
}

export function addSurveyDetails({scene,rails,sites,surface,mesh,box,m}){
  const steel = new T.MeshStandardMaterial({color:'#83949b',metalness:.5,roughness:.45});
  const ground = ([x,z])=>surface.heightAt(x,z)-.04;
  const transforms=[], up=new T.Vector3(0,1,0), transform=new T.Object3D();
  function bar(a,b,width) {
    const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start);
    transform.position.copy(start).lerp(end,.5);
    transform.scale.set(width,axis.length(),width);
    transform.quaternion.setFromUnitVectors(up,axis.normalize());
    transform.updateMatrix();transforms.push(transform.matrix.clone());
  }
  for(const {a,b,fence} of rails){
    const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2.4),height=fence?1.85:1.15;
    let last;
    for(let i=0;i<=n;i++){
      const p=[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n],y=ground(p);
      bar([p[0],y-.12,p[1]],[p[0],y+height+.04,p[1]],.10);
      if(last)for(const level of (fence?[.18,.42,.66,.9,1.14,1.38,1.62,1.85]:[.53,1.1]))
        bar([last[0],last[1]+level,last[2]],[p[0],y+level,p[1]],fence?.045:.085);
      last=[p[0],y,p[1]];
    }
  }
  const railing=new T.InstancedMesh(new T.BoxGeometry(),steel,transforms.length);
  transforms.forEach((matrix,i)=>railing.setMatrixAt(i,matrix));railing.name='Pond rails and checkpoint fence';scene.add(railing);
  for(const p of sites.umbrellaCentres){
    const [x,z]=p,y=ground(p);
    mesh(new T.ConeGeometry(1.9,.58,10),steel,x,y+2.65,z);
    box(steel,x,y+1.2,z,.10,2.5,.10);
    mesh(new T.CylinderGeometry(.82,.82,.10,12),m.roof,x,y+.82,z);
    for(const side of [-1,1]){
      box(m.roof,x,y+.45,z+side*1.05,1.45,.12,.38);
      for(const leg of [-.49,.49])box(steel,x+leg,y+.21,z+side*1.05,.10,.42,.1);
    }
  }
  const [x,z]=sites.shrine,y=ground(sites.shrine);
  mesh(new T.CylinderGeometry(1.2,1.3,.22,12),m.roof,x,y+.11,z);
  mesh(new T.IcosahedronGeometry(.52,1),m.glass,x,y+.63,z).scale.set(.73,1.35,.62);
  const brass=new T.MeshStandardMaterial({color:'#ba924b',metalness:.55,roughness:.44});
  for(const side of [-1,1]){
    box(brass,x+side*.8,y+.45,z+.65,.07,.77,.07);
    mesh(new T.CylinderGeometry(.18,.07,.12,10),brass,x+side*.8,y+.85,z+.65);
  }
}

export {addTurf} from './pitch.js?v=12';

import * as T from './vendor/three.module.js';
import {edgeDistance, distSegment} from './geometry.js?v=6';

export function addAvenueShrubs({scene, config, routes, buildings, surface, noPlants}){
  const avenue=config.landscape.hostelAvenue;
  const shrubs=[],along=routes.filter(r=>r.id===avenue.id);
  let distance=0,station=0;
  for(const r of along){
    for(;station<distance+r.length;station+=avenue.shrubSpacing){
      if(r.y0!==avenue.level||r.y1!==avenue.level)continue;
      const t=(station-distance)/r.length;
      for(const side of [-1,1]){
        const offset=(r.width/2+1.15)*side;
        const x=r.a[0]+r.dx*t-r.dz/r.length*offset,z=r.a[1]+r.dz*t+r.dx/r.length*offset;
        if(noPlants(x,z,1.15)||buildings.some(b=>edgeDistance(x,z,b.points)<1.4))continue;
        if(routes.some(s=>s.id!==r.id&&distSegment(x,z,s.a,s.b)<s.width/2+1.2))continue;
        shrubs.push({x,z,side});
      }
    }
    distance+=r.length;
  }
  const mat=new T.MeshStandardMaterial({roughness:.95});
  const hedge=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),mat,shrubs.length);
  const transform=new T.Object3D();
  shrubs.forEach(({x,z},i)=>{
    transform.position.set(x,surface.heightAt(x,z)+.34,z);
    transform.rotation.y=i*1.8;
    transform.scale.set(.82,.41+(i%3)*.04,.86);
    transform.updateMatrix();hedge.setMatrixAt(i,transform.matrix);
    hedge.setColorAt(i,new T.Color(['#557843','#668b48','#466d3e'][i%3]));
  });
  hedge.name='Hostel avenue shrubs';hedge.receiveShadow=true;scene.add(hedge);
  return shrubs;
}

// A single spreading crown with several trunks and aerial roots shelters the open shrine.
export function addBanyan({site,surface,mesh}){
  const [x,z]=site,y=surface.heightAt(x,z),cx=x-2.4,cz=z+.8;
  const bark=new T.MeshStandardMaterial({color:'#71604a',roughness:1});
  const leaf=new T.MeshStandardMaterial({color:'#416a46',roughness:1});
  const stem=(a,b,bottom,top)=>{
    const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start);
    const tree=mesh(new T.CylinderGeometry(top,bottom,axis.length(),7),bark,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
    tree.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
  };
  stem([cx,surface.heightAt(cx,cz)-.2,cz],[cx,y+6.2,cz],.85,.46);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9,dx=Math.cos(a),dz=Math.sin(a);
    const tx=cx+dx*3.9,tz=cz+dz*3.9,h=y+6.8+Math.sin(i*2)*.65;
    stem([cx,y+3.6,cz],[tx,h,tz],.29,.11);
    mesh(new T.IcosahedronGeometry(1,1),leaf,tx,h+.95,tz).scale.set(3.1,2.2,3.3);
    // Leave the stone and its lamps accessible from the path.
    if(Math.hypot(tx-x,tz-z)>2.2)stem([tx,surface.heightAt(tx,tz)-.06,tz],[tx+.18,h,tz-.12],.08,.12);
  }
  mesh(new T.IcosahedronGeometry(1,1),leaf,cx,y+9.1,cz).scale.set(3.7,2.1,3.7);
}

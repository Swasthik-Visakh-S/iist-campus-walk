import * as T from './vendor/three.module.js';
import {inside,distSegment,edgeDistance,center} from './geometry.js';
export function wallSegments(boundary,routes,spec){
  const walls=[];
  for(let i=1;i<boundary.length;i++){
    const a=boundary[i-1],b=boundary[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);
    for(let k=0;k<n;k++){
      const p=[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n],q=[a[0]+(b[0]-a[0])*(k+1)/n,a[1]+(b[1]-a[1])*(k+1)/n];
      const x=(p[0]+q[0])/2,z=(p[1]+q[1])/2;
      // Gates only where mapped vehicle approaches cross the perimeter.
      if(routes.some(r=>r.width>4&&distSegment(x,z,r.a,r.b)<spec.gateWidth/2))continue;
      walls.push({a:p,b:q});
    }
  }
  return walls;
}
export function addCampusDetails(o){
  const {scene,data,config,buildings,ponds,roads,terrainModel,groundAt,walkHeight,blocked,mesh,polygon,box,m,walls}=o;
  const spec=config.landscape,material=color=>new T.MeshStandardMaterial({color,roughness:.9});
  const wallMat=material('#c0b8a3'),bambooMat=material('#66854a'),leafMat=material('#3b693a'),grassMat=material('#628649');
  for(const w of walls){const x=(w.a[0]+w.b[0])/2,z=(w.a[1]+w.b[1])/2,len=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),y=Math.min(groundAt(...w.a),groundAt(...w.b)),h=spec.boundaryWall.height+Math.abs(groundAt(...w.a)-groundAt(...w.b));box(wallMat,x,y+h/2,z,spec.boundaryWall.thickness,h,len+.1,Math.atan2(w.b[0]-w.a[0],w.b[1]-w.a[1]));}
  // Grass verges are laid on the same terrain as the asphalt, stopping at buildings and water.
  const verge=[];
  for(const r of roads.filter(r=>r.width>4)){
    const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
    for(const side of [-1,1]){
      const points=[r.a,r.b].flatMap(p=>[r.width/2+.2,r.width/2+spec.vergeWidth].map(d=>[p[0]+side*nx*d,p[1]+side*nz*d]));
      if(points.some(p=>!inside(...p,data.features.find(f=>f.tags.amenity==='university').points)||buildings.some(b=>edgeDistance(...p,b.points)<1)||ponds.some(q=>edgeDistance(...p,q.points)<2)))continue;
      for(const i of [0,2,1,1,2,3])verge.push(points[i][0],groundAt(...points[i])+.13,points[i][1]);
    }
  }
  const vg=new T.BufferGeometry();vg.setAttribute('position',new T.Float32BufferAttribute(verge,3));vg.computeVertexNormals();const lawn=mesh(vg,m.lawn);lawn.material.side=T.DoubleSide;lawn.castShadow=false;
  // Red dotted markup: separate roofs supported along both sides of the paths.
  let roofSegments=0,stairCount=0;
  for(const r of terrainModel.routes){
    const angle=Math.atan2(r.dx,r.dz);
    if(r.covered){const n=Math.ceil(r.length/4);for(let k=0;k<n;k++){
      const t=(k+.5)/n,x=r.a[0]+r.dx*t,z=r.a[1]+r.dz*t,y=groundAt(x,z)+3.4;
      box(m.roof,x,y,z,r.width+1,.2,r.length/n+.15,angle);roofSegments++;
      for(const side of [-1,1]){const px=x-side*r.dz/r.length*(r.width/2+.25),pz=z+side*r.dx/r.length*(r.width/2+.25);box(m.white,px,(groundAt(px,pz)+y)/2,pz,.13,y-groundAt(px,pz),.13);}
    }}
    if(r.steps){const n=Math.max(1,Math.ceil(Math.abs(r.y1-r.y0)/.18));for(let k=0;k<=n;k++){
      const t=k/n,x=r.a[0]+r.dx*t,z=r.a[1]+r.dz*t,y=r.y0+(r.y1-r.y0)*t+.12;
      const bottom=Math.min(groundAt(x,z),y)-.25;box(m.white,x,(y+bottom)/2,z,r.width,y-bottom,r.length/n+.035,angle);stairCount++;
    }}
  }
  // Tall bamboo in the road-enclosed central hostel space, with a grass understory.
  let seed=974;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stems=[],leaves=[],grasses=[];
  const grove=spec.bamboo.points,xs=grove.map(p=>p[0]),zs=grove.map(p=>p[1]);
  for(let i=0;i<260;i++){
    const x=Math.min(...xs)+rand()*(Math.max(...xs)-Math.min(...xs)),z=Math.min(...zs)+rand()*(Math.max(...zs)-Math.min(...zs));
    if(!inside(x,z,grove)||blocked(x,z)||roads.some(r=>distSegment(x,z,r.a,r.b)<r.width/2+1))continue;
    const y=groundAt(x,z),h=10+rand()*7;stems.push({x,y:y+h/2,z,sx:.11,sy:h,sz:.11});
    for(let j=0;j<6;j++)leaves.push({x:x+(rand()-.5)*3,y:y+h*(.55+rand()*.42),z:z+(rand()-.5)*3,sx:1+rand(),sy:.22,sz:.4+rand()*.6,angle:rand()*6.28});
    for(let j=0;j<3;j++)grasses.push({x:x+(rand()-.5),y:y+.6,z:z+(rand()-.5),sx:.2,sy:1.2,sz:.2});
  }
  function instances(geo,mat,list){const inst=new T.InstancedMesh(geo,mat,list.length),d=new T.Object3D();list.forEach((p,i)=>{d.position.set(p.x,p.y,p.z);d.scale.set(p.sx,p.sy,p.sz);d.rotation.set(0,p.angle||0,0);d.updateMatrix();inst.setMatrixAt(i,d.matrix)});inst.castShadow=true;scene.add(inst);}
  instances(new T.CylinderGeometry(1,1,1,5),bambooMat,stems);instances(new T.IcosahedronGeometry(1,1),leafMat,leaves);instances(new T.ConeGeometry(1,1,4),grassMat,grasses);
  // Round garden inside the roundabout, with a single high-mast luminaire.
  const rb=data.features.find(f=>f.tags.junction==='roundabout'),c=center(rb.points),y=groundAt(...c),radius=spec.roundabout.gardenRadius;
  const disc=new T.CircleGeometry(radius,64);disc.rotateX(-Math.PI/2);mesh(disc,m.lawn,c[0],y+.17,c[1]);
  const kerb=new T.RingGeometry(radius,radius+.5,64);kerb.rotateX(-Math.PI/2);mesh(kerb,m.white,c[0],y+.25,c[1]);
  for(let i=0;i<28;i++){const a=i*Math.PI/14;mesh(new T.IcosahedronGeometry(.9,1),leafMat,c[0]+Math.cos(a)*10,y+.9,c[1]+Math.sin(a)*10);}
  const h=spec.roundabout.mastHeight;mesh(new T.CylinderGeometry(.18,.45,h,10),m.white,c[0],y+h/2,c[1]);
  mesh(new T.CylinderGeometry(1.9,1.9,.2,16),m.roof,c[0],y+h,c[1]);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const lamp=mesh(new T.BoxGeometry(.75,.18,.5),m.white,c[0]+Math.cos(a)*1.6,y+h-.3,c[1]+Math.sin(a)*1.6);lamp.rotation.y=-a;}
  return {roundabout:c,roofSegments,stairCount,bambooStems:stems.length,mastHeight:h,wallCount:walls.length};
}

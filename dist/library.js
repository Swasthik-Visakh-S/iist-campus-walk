import * as T from './vendor/three.module.js';
// Simplified architecture derived from the supplied front-elevation photograph.
export function addLibraryFacade(scene, library, garden, materials) {
  const n=garden.front, right=garden.right, c=library.center, h=library.height, y=library.level;
  const frontDepth=Math.max(...library.points.map(p=>(p[0]-c[0])*n[0]+(p[1]-c[1])*n[1]))*.45;
  // Choose a frontage that stays within the traced footprint.
  const hits=[];
  for(let i=1;i<library.points.length;i++){
    const a=library.points[i-1], b=library.points[i];
    const za=(a[0]-c[0])*n[0]+(a[1]-c[1])*n[1],zb=(b[0]-c[0])*n[0]+(b[1]-c[1])*n[1];
    if((za>frontDepth)!=(zb>frontDepth)){
      const t=(frontDepth-za)/(zb-za), x=a[0]+t*(b[0]-a[0]),z=a[1]+t*(b[1]-a[1]);
      hits.push((x-c[0])*right[0]+(z-c[1])*right[1]);
    }
  }
  hits.sort((a,b)=>a-b);let left=hits[0]??-16,rightEdge=hits.at(-1)??16;
  const width=Math.min(34,(rightEdge-left)*.92),mid=(left+rightEdge)/2;
  const group=new T.Group();group.position.set(c[0]+n[0]*frontDepth+right[0]*mid,y,c[1]+n[1]*frontDepth+right[1]*mid);group.rotation.y=Math.atan2(n[0],n[1]);scene.add(group);
  function block(mat,x,yy,z,w,hh,d){const mesh=new T.Mesh(new T.BoxGeometry(w,hh,d),mat);mesh.position.set(x,yy,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
  const glassWidth=width*.33,wingWidth=(width-glassWidth)/2;
  for(const sign of [-1,1]){
    block(materials.brick,sign*(glassWidth/2+wingWidth/2),h*.5,0,wingWidth,h,.8);
    block(materials.white,sign*(width/2),h*.52,.3,.65,h*1.04,1.1);
    block(materials.white,sign*glassWidth/2,h*.57,.45,.8,h*1.14,1);
    const roof=block(materials.white,sign*glassWidth*.28,h*1.14,0,glassWidth*.6,.6,5);roof.rotation.z=sign*.15;
    for(let j=0;j<5;j++)block(materials.glass,sign*(glassWidth/2+1.3+j*(wingWidth-2.6)/4),h*.85,.47,.5,.7,.1);
  }
  block(materials.glass,0,h*.57,.25,glassWidth,h*1.1,.65);
  block(materials.white,0,h*.57,.7,1.1,h*1.14,.4);
  for(let yy=4.5;yy<h*1.08;yy+=1.7)block(materials.white,0,yy,.75,glassWidth,.09,.1);
  for(const sign of [-1,1])block(materials.white,sign*glassWidth*.26,h*.57,.65,.12,h*1.08,.1);
  block(materials.glass,0,1.9,1.2,5.5,3.8,1.3);
  block(materials.white,0,4.2,2.8,width*.84,.5,5);
  for(const sign of [-1,1])block(materials.white,sign*width*.32,2,4,.35,4,.35);
  return group;
}
export function addLibraryGarden(scene, garden, level, materials, groundAt) {
  const make=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;scene.add(o);return o;};
  const green=new T.MeshStandardMaterial({color:'#608c36',roughness:1});
  const stone=new T.MeshStandardMaterial({color:'#d4d1bd',roughness:1});
  const gravel=new T.MeshStandardMaterial({color:'#b69261',roughness:1});
  const water=new T.MeshStandardMaterial({color:'#409aa6',roughness:.25,metalness:.15});
  const points=Array.from({length:65},(_,i)=>garden.point(Math.cos(i*Math.PI/32)*garden.halfWidth,Math.sin(i*Math.PI/32)*garden.halfLength));
  const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1]))),lawn=new T.ShapeGeometry(shape);lawn.rotateX(-Math.PI/2);make(lawn,green,0,level+.08,0);
  const [fx,fz]=garden.fountain;
  const ring=(inner,outer,mat,y)=>{const g=new T.RingGeometry(inner,outer,64);g.rotateX(-Math.PI/2);return make(g,mat,fx,y,fz)};
  ring(garden.basinRadius,garden.outerRadius-1,gravel,level+.13);ring(garden.outerRadius-1,garden.outerRadius,stone,level+.15);
  make(new T.CylinderGeometry(garden.basinRadius,garden.basinRadius,.7,64),materials.roof,fx,level+.45,fz);
  make(new T.CylinderGeometry(garden.basinRadius-.5,garden.basinRadius-.5,.04,64),water,fx,level+.82,fz);
  ring(garden.basinRadius-.5,garden.basinRadius,materials.white,level+.82);
  // Three radial paths stop at the rim; the pool remains solid to the player.
  for(const [u,v] of [[-garden.halfWidth,0],[garden.halfWidth,0],[0,-garden.halfLength]]){
    const end=garden.point(u,v),dx=end[0]-fx,dz=end[1]-fz,len=Math.hypot(dx,dz),a=garden.outerRadius/len;
    if(a>=1)continue;
    const x0=fx+dx*a,z0=fz+dz*a;
    const path=make(new T.BoxGeometry(1.7,.09,len-garden.outerRadius),stone,(x0+end[0])/2,level+.15,(z0+end[1])/2);path.rotation.y=Math.atan2(dx,dz);
  }
  // Raised shrubs frame the lawn; leave entrance paths open.
  const shrubs=[];
  for(let i=0;i<52;i++){
    const theta=i*Math.PI*2/52;if(Math.abs(Math.sin(theta))<.12)continue;
    const p=garden.point(Math.cos(theta)*(garden.halfWidth-.8),Math.sin(theta)*(garden.halfLength-.8));
    if(Math.hypot(p[0]-fx,p[1]-fz)<garden.outerRadius+1)continue;shrubs.push(p);
  }
  const bush=new T.InstancedMesh(new T.SphereGeometry(1,8,5),materials.leaf,shrubs.length),dummy=new T.Object3D();shrubs.forEach((p,i)=>{dummy.position.set(p[0],level+.7,p[1]);dummy.scale.set(.9,.65,.9);dummy.updateMatrix();bush.setMatrixAt(i,dummy.matrix)});bush.castShadow=true;scene.add(bush);
  const jetMat=new T.LineBasicMaterial({color:'#d1f3f3',transparent:true,opacity:.8});
  make(new T.CylinderGeometry(.08,.12,3.8,8),materials.roof,fx,level+2.5,fz);
  for(let i=0;i<20;i++){
    const angle=i*Math.PI*2/20,points=[];
    for(let j=0;j<=24;j++){const t=j/24,r=(garden.basinRadius-.9)*t;points.push(new T.Vector3(fx+Math.cos(angle)*r,level+.85+3.5*(1-t)+3.4*Math.sin(Math.PI*t),fz+Math.sin(angle)*r));}
    scene.add(new T.Line(new T.BufferGeometry().setFromPoints(points),jetMat));
  }
  // Palms along the perimeter road, with curved, narrow fronds.
  for(const sign of [-1,1])for(const v of [-14,-4,7,17]){
    const p=garden.point(sign*(garden.halfWidth+10),v),y=groundAt(...p),h=7.5;
    make(new T.CylinderGeometry(.17,.27,h,8),materials.trunk,p[0],y+h/2,p[1]);
    for(let i=0;i<9;i++){
      const a=i*Math.PI*2/9,vertices=[];
      for(let j=0;j<7;j++){
        const t0=j/7,t1=(j+1)/7;
        const sample=(t,side)=>{const r=4.4*t,w=.45*Math.sin(Math.PI*t)*side;return[p[0]+Math.cos(a)*r+Math.sin(a)*w,y+h+1.5*Math.sin(t*Math.PI)-1.4*t,p[1]+Math.sin(a)*r-Math.cos(a)*w]};
        const aa=sample(t0,-1),bb=sample(t0,1),cc=sample(t1,-1),dd=sample(t1,1);vertices.push(...aa,...cc,...bb,...bb,...cc,...dd);
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const frond=make(g,materials.leaf,0,0,0);frond.material.side=T.DoubleSide;
    }
  }
}

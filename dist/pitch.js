import * as T from './vendor/three.module.js';
import {distSegment, inside} from './geometry.js?v=6';

const turfOffset = .16;
const ballRadius = .225;
// The short baseline facing Crystal Jubilee is v=0. Keep the opening clear of the goal.
const entranceU = .25;

function pitchFrame(points) {
  const [a,b,c,d] = points;
  const at = (u,v) => [
    (a[0]*(1-u)+b[0]*u)*(1-v)+(d[0]*(1-u)+c[0]*u)*v,
    (a[1]*(1-u)+b[1]*u)*(1-v)+(d[1]*(1-u)+c[1]*u)*v
  ];
  return {at, width: Math.hypot(b[0]-a[0],b[1]-a[1]), length: Math.hypot(d[0]-a[0],d[1]-a[1])};
}

function addCarpet(scene, surface, {at,width,length}) {
  const buffers = [[],[],[]];
  function rect(u,v,U,V,layer=2) {
    surface.project([at(u,v),at(U,v),at(U,V),at(u,V)], layer===2?turfOffset+.025:turfOffset, buffers[layer]);
  }
  for(let i=0;i<10;i++) rect(0,i/10,1,(i+1)/10,i%2);
  const side=.035, end=.07, du=.14/width, dv=.14/length;
  for(const u of [side,1-side]) rect(u-du/2,end,u+du/2,1-end);
  for(const v of [end,.5,1-end]) rect(side,v-dv/2,1-side,v+dv/2);
  for(const sign of [1,-1]) {
    const goalLine=sign===1?end:1-end, boxLine=goalLine+sign*4.5/length;
    rect(.31,boxLine-dv/2,.69,boxLine+dv/2);
    for(const u of [.31,.69]) rect(u,Math.min(boxLine,goalLine),u+du,Math.max(boxLine,goalLine));
  }
  for(let i=0;i<40;i++) {
    const p=(angle,r)=>at(.5+Math.cos(angle)*r/width,.5+Math.sin(angle)*r/length);
    const t=i*Math.PI/20, next=t+Math.PI/20;
    surface.project([p(t,3.6),p(next,3.6),p(next,3.47),p(t,3.47)],turfOffset+.025,buffers[2]);
  }
  const colors=['#164b35','#205c40','#f5f3de'];
  buffers.forEach((vertices,i)=>{
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    g.computeVertexNormals();
    const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:colors[i],roughness:1}));
    mesh.name=i===2?'Football pitch markings':'Dark green football turf';
    mesh.receiveShadow=true;
    scene.add(mesh);
  });
}

// A repeating alpha grid gives each net one draw call even at full pitch size.
function netTexture() {
  const size=32, pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const offset=(y*size+x)*4;
    pixels.fill(255,offset,offset+3);
    pixels[offset+3]=(x<2||y<2)?255:0;
  }
  const tex=new T.DataTexture(pixels,size,size);
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.magFilter=T.LinearFilter;
  tex.minFilter=T.LinearMipmapLinearFilter;
  tex.generateMipmaps=true;
  tex.anisotropy=4;
  tex.needsUpdate=true;
  return tex;
}

function addStructure(scene,surface,frame) {
  const {at,width,length}=frame;
  const height=7, gateHeight=2.65, opening=1.75/width;
  const walls=[],goalBacks=[],bars=[[],[]],nets=[[],[]],uvs=[[],[]],texture=netTexture();
  const up=new T.Vector3(0,1,0), transform=new T.Object3D();
  const point=(p,h)=>new T.Vector3(p[0],surface.heightAt(...p)+turfOffset+h,p[1]);
  function bar(a,b,r,layer=0) {
    const axis=b.clone().sub(a);
    transform.position.copy(a).lerp(b,.5);
    transform.scale.set(r,axis.length(),r);
    transform.quaternion.setFromUnitVectors(up,axis.normalize());
    transform.updateMatrix();
    bars[layer].push(transform.matrix.clone());
  }
  function panel(A,B,C,D,layer) {
    const scale=layer===0?.39:.24;
    const w=A.distanceTo(B)/scale,h=A.distanceTo(D)/scale;
    for(const v of [A,B,D,B,C,D]) nets[layer].push(v.x,v.y,v.z);
    uvs[layer].push(0,0,w,0,0,h,w,0,w,h,0,h);
  }
  function fence(a,b,bottom=0) {
    const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4.5);
    let last=null;
    for(let i=0;i<=n;i++) {
      const p=[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n];
      const low=point(p,bottom),high=point(p,height);
      bar(low,high,.065);
      if(last) {
        bar(last.high,high,.046);
        panel(last.low,low,high,last.high,0);
      }
      last={low,high};
    }
    if(bottom===0) walls.push([a,b]);
  }
  fence(at(0,0),at(entranceU-opening,0));
  fence(at(entranceU-opening,0),at(entranceU+opening,0),gateHeight);
  fence(at(entranceU+opening,0),at(1,0));
  fence(at(1,0),at(1,1));
  fence(at(1,1),at(0,1));
  fence(at(0,1),at(0,0));

  for(const sign of [1,-1]) {
    const v=sign===1?.07:.93;
    const back=v-sign*1.55/length;
    const left=.5-2.6/width,right=.5+2.6/width;
    const [a,b,c,d]=[at(left,v),at(right,v),at(right,back),at(left,back)];
    const A=point(a,2.15), B=point(b,2.15), C=point(c,1.7), D=point(d,1.7);
    bar(point(a,0),A,.065,1);bar(A,B,.065,1);bar(B,point(b,0),.065,1);
    bar(A,D,.035,1);bar(B,C,.035,1);bar(D,C,.035,1);
    bar(D,point(d,0),.035,1);bar(C,point(c,0),.035,1);
    panel(point(a,0),point(d,0),D,A,1);
    panel(point(d,0),point(c,0),C,D,1);
    panel(point(c,0),point(b,0),B,C,1);
    panel(A,B,C,D,1);
    goalBacks.push([a,d],[d,c],[c,b]);
  }
  for(let i=0;i<2;i++) {
    const mat=new T.MeshStandardMaterial({color:i===0?'#23513d':'#eeebe0',roughness:.72});
    const posts=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,7),mat,bars[i].length);
    bars[i].forEach((matrix,index)=>posts.setMatrixAt(index,matrix));
    posts.name=i===0?'High pitch fence posts':'Two football goals';
    posts.castShadow=true;scene.add(posts);
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(nets[i],3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs[i],2));
    const net=new T.Mesh(geometry,new T.MeshBasicMaterial({
      color:i===0?'#123d2e':'#e4e6d8',map:texture,transparent:true,
      opacity:i===0?.82:.95,side:T.DoubleSide,depthWrite:false
    }));
    net.name=i===0?'Open-top enclosure net':'Goal nets';
    scene.add(net);
  }
  return {walls,goalBacks};
}

// One mesh with white hexagons and black pentagons from a truncated icosahedron.
function footballMesh() {
  const ico=new T.IcosahedronGeometry(1,0);
  const attr=ico.getAttribute('position'),pentagons=new Map(),positions=[],colors=[];
  const cream=new T.Color('#fcf8e8'),ink=new T.Color('#1c2330');
  function polygon(center,ring,color) {
    for(let i=0;i<ring.length;i++) {
      const a=ring[i],b=ring[(i+1)%ring.length];
      const outward=a.clone().sub(center).cross(b.clone().sub(center)).dot(center)>0;
      for(const point of outward?[center,a,b]:[center,b,a]) {
        positions.push(point.x*ballRadius,point.y*ballRadius,point.z*ballRadius);
        colors.push(color.r,color.g,color.b);
      }
    }
  }
  for(let i=0;i<attr.count;i+=3) {
    const corners=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(attr,i+k)),ring=[];
    for(let j=0;j<3;j++) {
      const a=corners[j],b=corners[(j+1)%3];
      for(const [c,q] of [[a,b],[b,a]]) {
        const t=c.clone().lerp(q,1/3).normalize();
        ring.push(t);
        const key=c.toArray().join(',');
        if(!pentagons.has(key)) pentagons.set(key,{center:c,ends:new Map()});
        pentagons.get(key).ends.set(q.toArray().join(','),t);
      }
    }
    polygon(corners[0].clone().add(corners[1]).add(corners[2]).normalize(),ring,cream);
  }
  for(const {center,ends} of pentagons.values()) {
    const ring=[...ends.values()],axis=ring[0].clone().addScaledVector(center,-ring[0].dot(center)).normalize();
    const other=center.clone().cross(axis);
    ring.sort((a,b)=>Math.atan2(a.dot(other),a.dot(axis))-Math.atan2(b.dot(other),b.dot(axis)));
    polygon(center,ring,ink);
  }
  ico.dispose();
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();
  const ball=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.8}));
  ball.name='Football';ball.userData.dynamic=true;ball.castShadow=true;
  return ball;
}

export function addTurf(scene,points,surface) {
  const frame=pitchFrame(points),{at}=frame;
  addCarpet(scene,surface,frame);
  const {walls,goalBacks}=addStructure(scene,surface,frame);
  const center=at(.5,.5), ball=footballMesh();
  const ballFloor=()=>surface.heightAt(ball.position.x,ball.position.z)+turfOffset+ballRadius;
  ball.position.set(center[0],0,center[1]);ball.position.y=ballFloor();
  scene.add(ball);
  const velocity=new T.Vector2(),edges=points.slice(1).map((b,i)=>[points[i],b]);
  const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
  const xmin=Math.min(...xs)-1,xmax=Math.max(...xs)+1,zmin=Math.min(...zs)-1,zmax=Math.max(...zs)+1;
  const nearby=(x,z)=>x>=xmin&&x<=xmax&&z>=zmin&&z<=zmax;
  const contains=(x,z)=>nearby(x,z)&&inside(x,z,points);
  function blocked(x,z) {
    return nearby(x,z)&&(walls.some(([a,b])=>distSegment(x,z,a,b)<.40)
      ||goalBacks.some(([a,b])=>distSegment(x,z,a,b)<.28));
  }

  function collide(a,b) {
    const pos=ball.position,dx=b[0]-a[0],dz=b[1]-a[1],length2=dx*dx+dz*dz;
    const t=Math.max(0,Math.min(1,((pos.x-a[0])*dx+(pos.z-a[1])*dz)/length2));
    const x=pos.x-a[0]-t*dx,z=pos.z-a[1]-t*dz,d=Math.hypot(x,z);
    if(d>=ballRadius||d<1e-8)return;
    const nx=x/d,nz=z/d,normalSpeed=velocity.x*nx+velocity.y*nz;
    pos.x+=nx*(ballRadius-d);pos.z+=nz*(ballRadius-d);
    if(normalSpeed<0){velocity.x-=1.46*normalSpeed*nx;velocity.y-=1.46*normalSpeed*nz;}
  }

  function update(dt,player,dx=0,dz=0) {
    if(!(dt>0))return;
    const pos=ball.position,step=Math.hypot(dx,dz);
    if(player&&step>1e-4&&nearby(player.x,player.z)&&Math.abs(player.y+ballRadius-pos.y)<.8) {
      // Test the swept footstep so a boosted board cannot skip the ball between frames.
      const startX=player.x-dx,startZ=player.z-dz;
      const t=Math.max(0,Math.min(1,((pos.x-startX)*dx+(pos.z-startZ)*dz)/(step*step)));
      if(Math.hypot(pos.x-startX-t*dx,pos.z-startZ-t*dz)<.7&&((pos.x-startX)*dx+(pos.z-startZ)*dz)>0) {
        const speed=Math.min(15,2.8+step/dt*1.3);
        velocity.set(dx/step*speed,dz/step*speed);
      }
    }
    if(velocity.lengthSq()<.025){velocity.set(0,0);return;}
    const duration=Math.min(dt,.10),substeps=Math.max(1,Math.ceil(velocity.length()*duration/(ballRadius*.65)));
    for(let i=0;i<substeps;i++){
      const x=pos.x,z=pos.z;
      pos.x+=velocity.x*duration/substeps;pos.z+=velocity.y*duration/substeps;
      for(const [a,b] of edges)collide(a,b);
      for(const [a,b] of goalBacks)collide(a,b);
      ball.rotation.z-=(pos.x-x)/ballRadius;ball.rotation.x+=(pos.z-z)/ballRadius;
      velocity.multiplyScalar(Math.exp(-.64*duration/substeps));
    }
    pos.y=ballFloor();
  }
  return {spawn:at(.43,.30),aim:at(.5,.94),gate:at(entranceU,0),ball,blocked,contains,update};
}

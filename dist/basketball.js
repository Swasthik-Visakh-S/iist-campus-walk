import * as T from './vendor/three.module.js';

// Use the mapped apron and fit the proportions of a full court inside it.
export function addBasketballCourt(scene, points, surface) {
  const [a,b,c,d] = points;
  const mid = (p,q) => [(p[0]+q[0])/2,(p[1]+q[1])/2];
  const start=mid(a,b), end=mid(d,c), origin=mid(start,end);
  const length=Math.hypot(end[0]-start[0],end[1]-start[1]);
  const width=Math.min(Math.hypot(b[0]-a[0],b[1]-a[1]),Math.hypot(c[0]-d[0],c[1]-d[1]));
  const along=[(end[0]-start[0])/length,(end[1]-start[1])/length];
  const right=[along[1],-along[0]];
  if((b[0]-a[0])*right[0]+(b[1]-a[1])*right[1]<0)right.forEach((v,i)=>right[i]=-v);
  const at=(x,z)=>[origin[0]+right[0]*x+along[0]*z,origin[1]+right[1]*x+along[1]*z];
  const deckHeight=(x,z)=>surface.heightAt(...at(x,z))+.16;
  const scale=Math.min(1,(length-3)/28,(width-3)/15);
  const courtPoint=(u,v)=>at(u*scale,v*scale);
  const layers=new Map();
  function paint(color,polygon,height) {
    if(!layers.has(color))layers.set(color,[]);
    surface.project(polygon,height,layers.get(color));
  }
  const ink='#f8f2de', keyed='#bb7651';
  paint('#416467',points.slice(0,4),.16);
  function patch(color,x0,z0,x1,z1,height) {
    paint(color,[courtPoint(x0,z0),courtPoint(x1,z0),courtPoint(x1,z1),courtPoint(x0,z1)],height);
  }
  function line(x0,z0,x1,z1) {
    const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz);
    const nx=-dz/len*.046,nz=dx/len*.046;
    paint(ink,[courtPoint(x0+nx,z0+nz),courtPoint(x1+nx,z1+nz),courtPoint(x1-nx,z1-nz),courtPoint(x0-nx,z0-nz)],.194);
  }
  function arc(x,z,r,startAngle,endAngle,direction=1,dashed=false) {
    const n=Math.ceil((endAngle-startAngle)*r/.33);
    for(let i=0;i<n;i++){
      if(dashed&&i%4>1)continue;
      const t=startAngle+(endAngle-startAngle)*i/n,s=startAngle+(endAngle-startAngle)*(i+1)/n;
      line(x+r*Math.cos(t),z+direction*r*Math.sin(t),x+r*Math.cos(s),z+direction*r*Math.sin(s));
    }
  }
  patch('#4d8684',-7.5,-14,7.5,14,.172);
  line(-7.5,-14,-7.5,14);line(7.5,-14,7.5,14);
  line(-7.5,0,7.5,0);arc(0,0,1.8,0,2*Math.PI);
  for(const dir of [1,-1]){
    const baseline=-dir*14,free=baseline+dir*5.8,hoop=baseline+dir*1.575;
    patch(keyed,-2.45,baseline,2.45,free,.182);
    line(-7.5,baseline,7.5,baseline);line(-2.45,free,2.45,free);
    for(const s of [-1,1])line(s*2.45,baseline,s*2.45,free);
    arc(0,free,1.8,0,Math.PI,dir);
    arc(0,free,1.8,Math.PI,Math.PI*2,dir,true);
    arc(0,hoop,1.25,0,Math.PI,dir);
    const radius=6.75,corner=6.6,angle=Math.acos(corner/radius);
    const tangent=hoop+dir*radius*Math.sin(angle);
    for(const s of [-1,1])line(s*corner,baseline,s*corner,tangent);
    arc(0,hoop,radius,angle,Math.PI-angle,dir);
  }
  for(const [color,vertices] of layers){
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.93}));
    mesh.name=color===ink?'Basketball court markings':'Basketball court surface';
    mesh.receiveShadow=true;scene.add(mesh);
  }

  // Batch all the stanchions, board frames, seats and light standards by primitive.
  const cases=[],rods=[],lenses=[],boards=[],rims=[],net=[],obstacles=[];
  const turn=Math.atan2(along[0],along[1]);
  const quat=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),turn);
  const up=new T.Vector3(0,1,0);
  const coord=(x,y,z)=>{const [wx,wz]=at(x,z);return new T.Vector3(wx,y,wz);};
  function box(list,x,y,z,w,h,depth,color) {
    const matrix=new T.Matrix4().compose(coord(x,y,z),quat,new T.Vector3(w,h,depth));
    list.push({matrix,color});
  }
  function rod(p,q,r,color) {
    const axis=q.clone().sub(p);
    const rotation=new T.Quaternion().setFromUnitVectors(up,axis.clone().normalize());
    const matrix=new T.Matrix4().compose(p.clone().lerp(q,.5),rotation,new T.Vector3(r,axis.length(),r));
    rods.push({matrix,color});
  }
  function collider(x,z,halfX,halfZ,bottom,top){
    obstacles.push({x,z,halfX,halfZ,bottom,top});
  }
  const dark='#344954',pad='#234750',white='#f2eadd',orange='#dc582b';
  for(const dir of [1,-1]){
    const base=-dir*14*scale,post=base-dir*.78,hoop=base+dir*1.575*scale;
    const board=hoop-dir*.38,ground=deckHeight(0,hoop),foot=deckHeight(0,post),rimY=ground+3.05;
    const bottom=rimY-.15,top=bottom+1.05,front=board+dir*.05;
    box(cases,0,foot+.11,post,.70,.22,.82,dark);
    rod(coord(0,foot+.14,post),coord(0,ground+2.72,post),.11,dark);
    box(cases,0,foot+.93,post,.40,1.63,.42,pad);
    rod(coord(0,ground+2.65,post),coord(0,rimY+.25,board),.09,dark);
    rod(coord(0,ground+2.05,post),coord(0,rimY+.22,board-dir*.22),.055,dark);
    collider(0,post,.35,.41,foot,ground+2.8);
    collider(0,board,.9,.07,bottom,top);
    box(boards,0,(bottom+top)/2,board,1.8,1.05,.06,'#bbdfe3');
    for(const x of [-.89,.89])box(cases,x,(bottom+top)/2,front,.045,1.05,.045,white);
    for(const y of [bottom,top])box(cases,0,y,front,1.8,.045,.045,white);
    for(const x of [-.295,.295])box(cases,x,rimY+.225,front,.035,.45,.025,white);
    for(const y of [rimY,rimY+.45])box(cases,0,y,front,.59,.035,.025,white);
    rod(coord(0,rimY,board),coord(0,rimY,hoop-dir*.22),.034,orange);
    const ringMatrix=new T.Matrix4().makeRotationX(Math.PI/2).setPosition(coord(0,rimY,hoop));
    rims.push({matrix:ringMatrix,color:orange});
    // The net has staggered knots and narrows toward the open bottom.
    const knot=(row,i)=>{
      const angle=(i+(row%2)*.5)*2*Math.PI/12,r=.22-.020*row;
      return coord(r*Math.cos(angle),rimY-row*.105,hoop+r*Math.sin(angle));
    };
    for(let row=0;row<4;row++)for(let i=0;i<12;i++){
      const p=knot(row,i);
      for(const j of [i,i+(row%2?1:-1)])net.push(...p.toArray(),...knot(row+1,j).toArray());
    }
  }

  const seats=7.5*scale+.90;
  for(const side of [-1,1]){
    const z=side*4.15,ground=deckHeight(seats,z);
    box(cases,seats,ground+.49,z,.50,.095,2.70,'#d79c6c');
    box(cases,seats+.22,ground+.77,z,.07,.33,2.70,'#bb8056');
    for(const foot of [-1,1])box(cases,seats,ground+.22,z+foot*.99,.43,.45,.09,dark);
    collider(seats,z,.25,1.35,ground,ground+.95);
  }
  for(const side of [-1,1])for(const end of [-1,1]){
    const x=side*(7.5*scale+1.45),z=end*9.6*scale,level=deckHeight(x,z);
    rod(coord(x,level,z),coord(x,level+6.15,z),.083,dark);
    box(cases,x,level+6.16,z,.92,.16,.56,dark);
    box(lenses,x,level+6.065,z,.78,.045,.47,'#f7eddc');
    collider(x,z,.12,.12,level,level+6.3);
  }
  function batch(name,geometry,material,list) {
    const mesh=new T.InstancedMesh(geometry,material,list.length);
    list.forEach(({matrix,color},i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new T.Color(color));});
    mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=!material.transparent;
    mesh.computeBoundingSphere();scene.add(mesh);
  }
  const hardware=new T.MeshStandardMaterial({roughness:.68,metalness:.15});
  batch('Basketball court hardware',new T.BoxGeometry(),hardware,cases);
  batch('Basketball supports',new T.CylinderGeometry(1,1,1,8),hardware,rods);
  batch('Basketball hoops',new T.TorusGeometry(.234,.012,8,40),hardware,rims);
  batch('Basketball backboards',new T.BoxGeometry(),new T.MeshStandardMaterial({transparent:true,opacity:.57,depthWrite:false}),boards);
  batch('Basketball floodlights',new T.BoxGeometry(),new T.MeshStandardMaterial({emissive:'#c3b795',emissiveIntensity:.35}),lenses);
  const strings=new T.BufferGeometry();
  strings.setAttribute('position',new T.Float32BufferAttribute(net,3));
  const nets=new T.LineSegments(strings,new T.LineBasicMaterial({color:'#fff4da'}));
  nets.name='Basketball nets';scene.add(nets);

  function collides(x,y,z,margin){
    const dx=x-origin[0],dz=z-origin[1],u=dx*right[0]+dz*right[1],v=dx*along[0]+dz*along[1];
    if(Math.abs(u)>width/2+margin||Math.abs(v)>length/2+margin)return false;
    return obstacles.some(o=>
      Math.abs(u-o.x)<o.halfX+margin && Math.abs(v-o.z)<o.halfZ+margin &&
      y>=o.bottom-.16 && y<o.top+.10
    );
  }
  return {
    spawn:at(-3.6*scale,-2*scale), aim:at(0,12.425*scale),
    blocked:(x,z)=>collides(x,surface.heightAt(x,z)+.8,z,.27),
    cameraBlocked:(x,y,z)=>collides(x,y,z,.14)
  };
}

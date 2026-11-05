import * as T from './vendor/three.module.js';
export function planGates(config,groundAt){return config.layout.gates.map(g=>{const len=Math.hypot(...g.direction),n=g.direction.map(v=>v/len),right=[n[1],-n[0]],point=(u,v)=>[g.point[0]+right[0]*u+n[0]*v,g.point[1]+right[1]*u+n[1]*v];return {...g,center:g.point,n,right,point,level:groundAt(...g.point),obstacles:[{p:point(-g.width/2,0),r:.95},{p:point(g.width/2,0),r:.95},{p:point(g.width/2+2.8,3),r:2.3}]};});}
export function addGates(gates,scene,box,m,groundAt){
 const uniform=new T.MeshStandardMaterial({color:'#b4a07a',roughness:1}),skin=new T.MeshStandardMaterial({color:'#b77c57',roughness:.85}),cap=new T.MeshStandardMaterial({color:'#274237',roughness:1}),boot=new T.MeshStandardMaterial({color:'#303033',roughness:1});
 const head=new T.SphereGeometry(.18,10,8);let officers=0;
 for(const g of gates){
  g.muzzles=[];
  const angle=Math.atan2(g.n[0],g.n[1]),part=(mat,u,y,v,w,h,d)=>{const p=g.point(u,v);box(mat,p[0],g.level+y,p[1],w,h,d,angle);};
  for(const side of [-1,1]){
   const post=g.point(side*g.width/2,0),base=groundAt(...post),height=Math.max(1,g.level+4.4-base);box(m.brick,post[0],base+height/2,post[1],1.2,height,1.3,angle);part(m.white,side*g.width/2,4.5,0,1.5,.25,1.6);
   // Gate leaves slide to the sides, keeping the walking/vehicle lane open.
   part(m.glass,side*(g.width/2+2),1.4,0,3.2,.15,.15);
   part(m.glass,side*(g.width/2+2),.25,0,3.2,.15,.15);
   for(let i=0;i<9;i++)part(m.glass,side*(g.width/2+.5+i*.36),.85,0,.06,1.25,.08);
   const p=g.point(side*(g.width/2-1.7),2),y=groundAt(...p);
   const person=new T.Group();person.name='CISF officer';person.position.set(p[0],y-.025,p[1]);person.rotation.y=angle+Math.PI;scene.add(person);officers++;
   function piece(geo,mat,x,yy,z){const mesh=new T.Mesh(geo,mat);mesh.position.set(x,yy,z);mesh.castShadow=true;person.add(mesh);return mesh;}
   const cube=(mat,x,yy,z,w,h,d)=>piece(new T.BoxGeometry(w,h,d),mat,x,yy,z);
   cube(uniform,0,1.05,0,.44,.57,.27);cube(boot,0,.82,0,.45,.07,.28);
   for(const s of [-1,1]){cube(uniform,s*.13,.46,0,.17,.65,.2);cube(boot,s*.13,.12,.05,.19,.16,.31);cube(uniform,s*.26,1.13,.09,.14,.32,.16).rotation.x=-.55;cube(uniform,s*.20,1.00,.20,.14,.14,.25);piece(new T.SphereGeometry(.075,8,6),skin,s*.17,1.01,.31);cube(cap,s*.16,1.35,0,.13,.03,.27);}
   // Both hands meet the stock and fore-end of a low-detail carried rifle.
   cube(boot,-.17,1.04,.23,.13,.13,.27);cube(boot,-.04,1.06,.35,.33,.12,.13);
   cube(cap,.10,1.06,.39,.24,.085,.11);cube(boot,.24,1.06,.42,.22,.045,.045);
   cube(boot,-.02,.96,.32,.075,.15,.07);
   const muzzle=person.localToWorld(new T.Vector3(.35,1.06,.42));g.muzzles.push(muzzle);
   piece(head,skin,0,1.52,0);piece(new T.SphereGeometry(.20,10,6),cap,0,1.68,-.01).scale.set(1,.35,1.1);cube(m.white,.11,1.17,.145,.12,.045,.015);
  }
  part(m.white,0,4.35,0,g.width+1,.45,1);part(cap,0,4.35,.54,Math.min(9,g.width-1),.34,.06);
  const u=g.width/2+2.8;part(m.white,u,1.4,3,3.5,2.8,3.2);part(m.roof,u,2.9,3,4,.2,3.7);part(m.glass,u,1.85,1.35,2.5,.9,.06);
  g.sign={p:g.point(0,.6),y:g.level+4.35,angle};g.guardSign={p:g.point(u,1.3),y:g.level+2.55,angle};
 }
 return {officers};
}

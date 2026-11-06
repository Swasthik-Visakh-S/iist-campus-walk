import * as T from './vendor/three.module.js';

// Traveller N 3350WB B-Type. The body dimensions and wheelbase follow the
// manufacturer's specification. Local +Z points towards the short bonnet.
export function addAmbulance(scene,x,y,z,yaw=0){
  const positions=[],normals=[],colors=[];
  const white='#f5f3e8', grey='#acb6b5', black='#27313a', glass='#325263';
  const red='#c63136', blue='#276fa6', amber='#e99433';
  const part=new T.Object3D();
  function append(geometry,color,px=0,py=0,pz=0,rx=0,ry=0,rz=0){
    part.position.set(px,py,pz);part.rotation.set(rx,ry,rz);part.updateMatrix();
    const triangles=geometry.index?geometry.toNonIndexed():geometry;
    triangles.applyMatrix4(part.matrix);
    positions.push(...triangles.attributes.position.array);
    normals.push(...triangles.attributes.normal.array);
    const tint=new T.Color(color);
    for(let i=0;i<triangles.attributes.position.count;i++)colors.push(tint.r,tint.g,tint.b);
    triangles.dispose();if(triangles!==geometry)geometry.dispose();
  }
  function box(color,px,py,pz,w,h,d,rx=0,ry=0,rz=0){
    append(new T.BoxGeometry(w,h,d),color,px,py,pz,rx,ry,rz);
  }
  function quad(color,a,b,c,d){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));
    g.computeVertexNormals();append(g,color);
  }
  function prism(profile,width,color){
    const shape=new T.Shape(profile.map(([z,y])=>new T.Vector2(-z,y)));
    append(new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false}),color,-width/2,0,0,0,Math.PI/2);
  }
  // Side silhouette with the two wheel arches cut directly into the body.
  const shell=[[-2.73,.49]];
  for(const axle of [-1.69,1.66]){
    for(let i=0;i<=14;i++){
      const a=Math.PI-i*Math.PI/14;
      shell.push([axle+.407*Math.cos(a),.45+.407*Math.sin(a)]);
    }
  }
  shell.push([2.70,.46],[2.72,.89],[2.62,1.20],[2.23,1.39],[1.62,2.21],[1.34,2.38],[-2.55,2.38],[-2.73,2.22]);
  prism(shell,1.925,white);
  prism([[-2.65,2.31],[1.45,2.31],[1.29,2.49],[.91,2.615],[-2.31,2.615],[-2.59,2.52]],1.84,white);
  box(black,0,.42,0,1.53,.28,4.84);
  box(black,0,.54,2.675,1.87,.18,.235);
  box(black,0,.52,-2.70,1.86,.19,.185);
  for(const side of [-1,1]){
    for(const axle of [-1.69,1.66]){
      const wheel=(rad,thick,offset,color)=>append(new T.CylinderGeometry(rad,rad,thick,20),color,side*offset,.355,axle,0,0,Math.PI/2);
      wheel(.355,.212,.839,'#25282a');wheel(.203,.025,.951,grey);wheel(.091,.038,.96,'#61717a');
    }
    const panel=(points,color,offset)=>{
      const ps=points.map(([z,y])=>[side*offset,y,z]);
      quad(color,...(side===1?ps.reverse():ps));
    };
    const cab=[[.53,1.39],[2.13,1.39],[1.54,2.17],[.53,2.17]];
    panel(cab,glass,.966);
    for(const end of [-2.49,-1.03]){
      const start=end+1.32;
      panel([[end,1.51],[start,1.51],[start,2.17],[end,2.17]],glass,.966);
      panel([[end,1.51],[start,1.51],[start,1.80],[end,1.80]],'#b6c9cb',.971);
    }
    box(red,side*.966,1.12,-.06,.013,.15,5.08);
    box(blue,side*.966,.994,-.06,.013,.043,5.08);
    box(black,side*.967,1.29,.66,.024,.045,.19);
    box(grey,side*.965,1.42,.455,.009,1.7,.015);
    box(black,side*.951,.43,-.02,.105,.09,2.27);
    box(black,side*1.01,1.56,1.81,.155,.044,.05);
    box(black,side*1.085,1.66,1.82,.1,.262,.131);
  }
  quad(glass,[-.865,1.423,2.22],[.865,1.423,2.22],[.835,2.178,1.66],[-.835,2.178,1.66]);
  box(black,0,.94,2.713,1.29,.28,.047);
  for(const level of [.87,.94,1.01])box(grey,0,level,2.74,1.23,.018,.014);
  for(const side of [-1,1]){
    box('#edf5ee',side*.767,1.011,2.687,.296,.181,.067);
    box(amber,side*.901,.97,2.682,.05,.105,.066);
    box(black,side*.46,1.59,-2.736,.758,.73,.017);
    box(glass,side*.46,1.59,-2.749,.716,.676,.015);
    box(red,side*.846,1.08,-2.746,.13,.31,.037);
    box(amber,side*.846,1.025,-2.768,.115,.071,.013);
    box(red,side*.45,1.15,-2.744,.893,.113,.012);
  }
  box(grey,0,1.44,-2.744,.018,1.77,.012);
  box('#e5c176',0,.665,2.755,.42,.11,.018);
  box('#e5c176',0,.69,-2.748,.42,.11,.018);
  box(black,0,2.643,.49,1.39,.055,.205);
  for(const side of [-1,1])box(side<0?blue:red,side*.41,2.716,.49,.51,.117,.186);
  box('#d3e0e0',0,2.712,.49,.289,.11,.185);

  // Lettering is baked into the same mesh as the body, including in offline mode.
  const letters={
    A:['01110','10001','11111','10001','10001'],M:['10001','11011','10101','10001','10001'],
    B:['11110','10001','11110','10001','11110'],U:['10001','10001','10001','10001','01110'],
    L:['10000','10000','10000','10000','11111'],N:['10001','11001','10101','10011','10001'],
    C:['01111','10000','10000','10000','01111'],E:['11111','10000','11110','10000','11111'],
    F:['11111','10000','11110','10000','10000'],O:['01110','10001','10001','10001','01110'],
    R:['11110','10001','11110','10100','10010']
  };
  function lettering(word,pixel,color,point){
    const left=-(6*word.length-1)*pixel/2;
    [...word].forEach((letter,k)=>letters[letter].forEach((row,j)=>{
      for(const match of row.matchAll(/1+/g)){
        const a=left+(6*k+match.index)*pixel,b=a+match[0].length*pixel;
        const hi=(2.5-j)*pixel,lo=hi-pixel;
        quad(color,point(a,lo),point(b,lo),point(b,hi),point(a,hi));
      }
    }));
  }
  for(const side of [-1,1]){
    lettering('AMBULANCE',.044,red,(u,v)=>[side*.97,1.354+v,-.97-side*u]);
    for(const roll of [0,Math.PI/3,-Math.PI/3]){
      box(blue,side*.978,1.82,-1.83,.012,.437,.124,roll);
    }
  }
  lettering('FORCE',.021,'#e9ede9',(u,v)=>[u,.96+v,2.757]);
  const g=new T.BufferGeometry();
  for(const [name,list] of [['position',positions],['normal',normals],['color',colors]])g.setAttribute(name,new T.Float32BufferAttribute(list,3));
  g.computeBoundingSphere();
  const van=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.61}));
  van.name='Force Traveller N ambulance';van.castShadow=true;van.receiveShadow=true;
  van.position.set(x,y,z);van.rotation.y=yaw;scene.add(van);
  return van;
}

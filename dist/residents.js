import * as T from './vendor/three.module.js';

const residents = [
  {kind:'student', near:'Roundabout', shirt:'#6d9da5', trousers:'#344454', skin:'#b17c59', bag:'#bd704d'},
  {kind:'student', near:'Library', shirt:'#c07b68', trousers:'#454861', skin:'#976245', bag:'#71865e', bun:true},
  {kind:'student', near:'Student Activity Centre', shirt:'#bd9d63', trousers:'#3d4b54', skin:'#c59473', bag:'#657b9c'},
  {kind:'student', near:'Dhruva', shirt:'#739174', trousers:'#3e4659', skin:'#96654d', bag:'#b69362', bun:true},
  {kind:'student', near:'Cafeteria', shirt:'#909bc3', trousers:'#374a49', skin:'#b97e59', bag:'#846556'},
  {kind:'student', near:'Aerospace Block', shirt:'#e0b791', trousers:'#425566', skin:'#9d6d54', bag:'#68989a', bun:true},
  {kind:'cat', near:'Roundabout', coat:'#242328'},
  {kind:'cat', near:'Phalguni', coat:'#272429'},
  {kind:'cat', near:'Cafeteria', coat:'#29282d', bib:true},
  {kind:'husky', near:'Library fountain & garden', coat:'#68727d'},
  {kind:'street dog', near:'Dhanishta', coat:'#b37944'},
  {kind:'street dog', near:'Ardra', coat:'#d4b38c'},
  {kind:'street dog', near:'Basketball court', coat:'#795940'},
  {kind:'street dog', near:'Crystal Jubilee Hostel', coat:'#bb8c67'}
];

const white='#f0e9da', dark='#2c252a';
function joint(parent,x,y,z){
  const node=new T.Group();
  node.position.set(x,y,z);
  parent.add(node);
  return node;
}

function makeStudent(rig, style, add){
  const body=joint(rig,0,0,0);
  const oval=(parent,x,y,z,w,h,d,c)=>add('oval',parent,x,y,z,w,h,d,c);
  oval(body,0,1.01,0,.24,.33,.16,style.shirt);
  oval(body,0,1.01,-.16,.2,.25,.12,style.bag);
  oval(body,0,1.5,.02,.261,.28,.245,style.skin);
  oval(body,0,1.66,-.015,.272,.163,.25,dark);
  if(style.bun)oval(body,0,1.75,-.20,.127,.13,.125,dark);
  oval(body,0,1.17,.144,.08,.037,.03,white);
  oval(body,0,.97,.164,.043,.065,.015,white);
  const limbs=[];
  for(const sign of [-1,1]){
    oval(body,sign*.093,1.52,.246,.026,.037,.014,dark);
    oval(body,sign*.151,1.09,.111,.026,.177,.03,style.bag);
    const leg=joint(rig,sign*.113,.765,0);
    oval(leg,0,-.31,0,.101,.36,.105,style.trousers);
    oval(leg,0,-.676,.036,.108,.085,.15,'#444247');
    const arm=joint(body,sign*.251,1.215,0);
    oval(arm,sign*.017,-.10,0,.082,.147,.082,style.shirt);
    oval(arm,sign*.019,-.277,.016,.061,.129,.065,style.skin);
    limbs.push({leg,arm,sign});
  }
  return (phase,stride)=>{
    body.position.y=.018*Math.abs(Math.sin(phase))*stride;
    for(const {leg,arm,sign} of limbs){
      leg.rotation.x=style.seated?-1.05:sign*Math.sin(phase)*.41*stride;
      arm.rotation.x=style.seated?-.55:-leg.rotation.x*.85;
    }
  };
}

function makeAnimal(rig, style, add){
  const cat=style.kind==='cat', husky=style.kind==='husky';
  const torso=joint(rig,0,0,0);
  const oval=(parent,x,y,z,w,h,d,c)=>add('oval',parent,x,y,z,w,h,d,c);
  const flank=cat?.15:husky?.22:.163, top=cat?.285:.53, front=cat?.24:.39;
  oval(torso,0,top,0,flank,cat?.14:husky?.24:.18,cat?.29:.43,style.coat);
  oval(torso,0,top+.033,front*.67,flank*1.08,cat?.135:husky?.255:.205,cat?.145:.20,style.coat);
  const head=joint(torso,0,top+(cat?.14:.23),front);
  oval(head,0,0,.018,cat?.161:.193,cat?.145:.198,cat?.139:.177,style.coat);
  const muzzle=(style.bib||husky)?white:style.coat;
  oval(head,0,-.05,cat?.104:.175,cat?.095:.112,cat?.059:.081,cat?.069:.147,muzzle);
  oval(head,0,-.03,cat?.168:.309,cat?.026:.042,cat?.017:.029,cat?.020:.03,dark);
  if(style.bib||husky)oval(torso,0,top+.025,front*.94,flank*.80,cat?.107:.174,cat?.060:.079,white);
  for(const sign of [-1,1]){
    const ear=add('ear',head,sign*(cat?.105:.128),cat?.125:.175,-.018,
      cat?.075:.087,cat?.081:.115,cat?.052:.066,style.coat);
    ear.rotation.z=-sign*.15;
    add('ear',head,sign*(cat?.105:.128),cat?.122:.167,.019,
      cat?.043:.051,cat?.048:.064,.017,cat?'#9b777e':husky?white:'#8a6450');
    if(husky)oval(head,sign*.085,.018,.151,.076,.082,.030,white);
    oval(head,sign*(cat?.071:.087),.022,cat?.141:.18,
      cat?.029:.023,cat?.023:.025,.014,cat?'#c7b966':husky?'#739ba5':dark);
    if(cat)oval(head,sign*.071,.022,.153,.008,.017,.005,dark);
  }
  const legs=[];
  const legLength=cat?.208:.39;
  for(const side of [-1,1]){
    for(const end of [-1,1]){
      const leg=joint(rig,side*flank*.65,legLength+.033,end*front*.65);
      oval(leg,0,-legLength*.44,0,cat?.041:.059,legLength*.6,cat?.052:.071,style.coat);
      oval(leg,0,-legLength,.019,cat?.043:.058,.034,cat?.062:.09,muzzle);
      legs.push({leg,sign:side*end});
    }
  }
  const tail=joint(torso,0,top+(cat?.032:.095),cat?-.239:-.343);
  // Multiple overlapping tapered segments keep the cat's raised tail, the husky's
  // curled plume and the lean, arched street-dog tail distinct from a distance.
  const points=cat?[[0,0],[.07,-.13],[.20,-.18],[.33,-.16],[.36,-.10]]
    :husky?[[0,0],[.06,-.14],[.20,-.22],[.33,-.16],[.38,-.04],[.35,.05]]
      :[[0,0],[.073,-.13],[.15,-.24],[.218,-.28],[.258,-.24]];
  points.slice(1).forEach(([y,z],i)=>{
    const [a,b]=points[i], width=(cat?.034:husky?.088:.043)*(1-.09*i);
    const segment=oval(tail,0,(a+y)/2,(b+z)/2,width,Math.hypot(y-a,z-b)*.67,width,
      husky&&i>=3?white:style.coat);
    segment.rotation.x=Math.atan2(z-b,y-a);
  });
  return (phase,stride)=>{
    torso.position.y=.011*Math.abs(Math.sin(phase))*stride;
    for(const {leg,sign} of legs)leg.rotation.x=sign*Math.sin(phase)*.46*stride;
    tail.rotation.z=Math.sin(phase*.65)*.16;
    head.rotation.y=Math.sin(phase*.30)*.09;
  };
}

// Select a short lane near each home, and sample both walkability and elevation
// once. The render loop only interpolates those heights, including on slopes.
function findPath(world,home,used,index){
  const routes=(world.terrainModel?.routes||[]).filter(r=>r.width>4&&r.length>=12&&!used.has(r));
  const score=r=>Math.hypot((r.a[0]+r.b[0])*.5-home[0],(r.a[1]+r.b[1])*.5-home[1]);
  routes.sort((a,b)=>score(a)-score(b));
  for(const r of routes){
    const length=Math.min(r.length-4,38),offset=(index%2===0?1:-1)*r.width*.28;
    const start=(r.length-length)/2,dx=r.dx/r.length,dz=r.dz/r.length;
    const x=r.a[0]+dx*start-dz*offset,z=r.a[1]+dz*start+dx*offset;
    const count=Math.ceil(length/.65),heights=[];
    for(let i=0;i<=count;i++){
      const along=length*i/count,px=x+dx*along,pz=z+dz*along;
      if(world.blocked(px,pz)||world.exteriorGate?.(px,pz))break;
      const y=world.walkHeight(px,pz);
      if(i&&Math.abs(y-heights[i-1])>.36)break;
      heights.push(y);
    }
    if(heights.length===count+1){
      used.add(r);
      return {x,z,dx,dz,length,heights};
    }
  }
  return null;
}

export function createResidents(scene,world){
  const group=new T.Group();
  group.name='Campus residents';
  group.userData.dynamic=true;
  scene.add(group);
  const actors=[],used=new Set(),parts={oval:[],ear:[]};
  function add(kind,parent,x,y,z,w,h,d,color){
    const node=joint(parent,x,y,z);
    node.scale.set(w,h,d);
    parts[kind].push({node,color});
    return node;
  }
  residents.forEach((style,i)=>{
    const home=world.places.find(p=>p.name===style.near)?.p||world.spawn;
    const path=findPath(world,home,used,i);
    if(!path)return;
    const rig=new T.Group();
    rig.name=style.kind;
    // The skeleton stays off the rendered scene graph; its parts feed two GPU batches.
    const animate=style.kind==='student'?makeStudent(rig,style,add):makeAnimal(rig,style,add);
    const distance=path.length*(.18+((i*7)%11)/18);
    const direction=i%2===0?1:-1;
    rig.rotation.y=Math.atan2(path.dx*direction,path.dz*direction);
    const speed=style.kind==='student'?1.2:style.kind==='cat'?.59:.98;
    actors.push({kind:style.kind,rig,animate,path,distance,direction,speed,phase:i,pause:0});
  });
  // Cafe patrons share the same two GPU batches as the walking residents.
  if(world.cafe){
  const cafe=world.cafe,frontAngle=Math.atan2(cafe.entry.n[0],cafe.entry.n[1]);
  const spots=world.cafeUmbrellas.map((p,i)=>({p:[p[0]+cafe.entry.right[0]*1.18,p[1]+cafe.entry.right[1]*1.18],angle:frontAngle-Math.PI/2,seated:true}));
  spots.push({p:cafe.at(5,8.4),angle:frontAngle,seated:false},{p:cafe.at(-7.2,11),angle:frontAngle+.7,seated:false});
  spots.push({p:cafe.at(3.6,1.1),angle:frontAngle,seated:false,vendor:true});
  spots.forEach((spot,i)=>{
    const style={shirt:spot.vendor?'#eee8d3':['#af7364','#6f9b93','#8b8ab4'][i%3],bag:spot.vendor?'#eee8d3':'#806950',skin:'#ab7758',trousers:'#35434b',bun:i%3===0,seated:spot.seated};
    const rig=new T.Group(),animate=makeStudent(rig,style,add);
    rig.position.set(spot.p[0],cafe.level+(spot.vendor?.68:.14)-(spot.seated?.20:0),spot.p[1]);rig.rotation.y=spot.angle;
    if(spot.vendor){add('oval',rig,0,1.79,0,.28,.065,.25,'#eee8d3');add('oval',rig,0,.95,.15,.18,.29,.025,'#fcf5e1');}
    actors.push({kind:spot.vendor?'tea vendor':'cafe student',rig,animate,fixed:true,phase:i,pause:0});
  });
  }
  const geometries={oval:new T.SphereGeometry(1,8,6),ear:new T.ConeGeometry(1,2,4)};
  const material=new T.MeshStandardMaterial({roughness:.92});
  const batches=Object.entries(parts).map(([key,list])=>{
    const mesh=new T.InstancedMesh(geometries[key],material,list.length);
    mesh.name=key==='oval'?'Resident figures':'Animal ears';
    mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    list.forEach((part,i)=>mesh.setColorAt(i,new T.Color(part.color)));
    group.add(mesh);
    return {mesh,list};
  });
  function pose(dt){
    for(const actor of actors){
      const {rig,path,direction}=actor;
      if(actor.fixed){actor.phase+=dt;actor.animate(actor.phase,0);rig.updateMatrixWorld(true);continue;}
      const walking=actor.pause<=0;
      if(walking){
        actor.distance+=dt*actor.speed*direction;
        if(actor.distance>=path.length||actor.distance<=0){
          actor.distance=T.MathUtils.clamp(actor.distance,0,path.length);
          actor.direction=-direction;
          actor.pause=actor.kind==='student'?1.8:3.5;
        }
      }else actor.pause-=dt;
      const sample=actor.distance/path.length*(path.heights.length-1);
      const n=Math.min(path.heights.length-2,Math.floor(sample));
      const ground=T.MathUtils.lerp(path.heights[n],path.heights[n+1],sample-n);
      rig.position.set(path.x+path.dx*actor.distance,ground+.012,path.z+path.dz*actor.distance);
      const facing=Math.atan2(path.dx*actor.direction,path.dz*actor.direction);
      const turn=Math.atan2(Math.sin(facing-rig.rotation.y),Math.cos(facing-rig.rotation.y));
      rig.rotation.y+=turn*Math.min(1,dt*3.1);
      actor.phase+=dt*(walking?actor.speed*(actor.kind==='cat'?10:6):1.15);
      actor.animate(actor.phase,walking?1:0);
      rig.updateMatrixWorld(true);
    }
    for(const {mesh,list} of batches){
      list.forEach(({node},i)=>mesh.setMatrixAt(i,node.matrixWorld));
      mesh.instanceMatrix.needsUpdate=true;
    }
  }
  pose(0);
  let elapsed=0;
  function update(dt){
    elapsed+=dt;
    if(elapsed<1/24)return;
    pose(elapsed);
    elapsed=0;
  }
  return {group,actors,update};
}

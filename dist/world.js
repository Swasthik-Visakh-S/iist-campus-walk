import {applyReferenceLayout,libraryGarden} from './layout.js';
import {addLibraryFacade,addLibraryGarden} from './library.js';
import * as T from './vendor/three.module.js';
import {inside,distSegment,center,edgeDistance} from './geometry.js';
export {inside,distSegment,center} from './geometry.js';
import {makeTerrain} from './terrain.js';
import {addCampusDetails,wallSegments} from './campus-details.js';
export function buildWorld(scene,data,config){
 data=applyReferenceLayout(data,config);
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.9,...extra});
 const m={brick:material('#8e4435'),white:material('#dadbd2'),roof:material('#9c998c'),glass:material('#344c50',{roughness:.3,metalness:.25}),road:material('#343738'),path:material('#a29880'),soil:material('#816b48'),leaf:material('#244d30'),trunk:material('#655744'),water:material('#516b46',{roughness:.24,metalness:.2}),panel:material('#273744',{roughness:.35}),lawn:material('#547241')};
 const buildings=data.features.filter(f=>f.tags.building).map(f=>({...f,center:center(f.points)}));
 const boundary=data.features.find(f=>f.tags.amenity==='university').points;
 const ponds=[...data.features.filter(f=>f.tags.natural==='water').map(f=>({...f,name:'South pond',source:'OpenStreetMap'})),...config.extraPonds];
 const sac=buildings.find(b=>b.id==='618490372'),oat=config.layout?.oat||{};const amph={x:oat.center?.[0]??sac.center[0],z:oat.center?.[1]??sac.center[1]-2,r:oat.radius||17,inner:oat.innerRadius||6,steps:oat.steps||12,rise:oat.rise||.34};
 const garden=libraryGarden(data.features,config),lib=buildings.find(b=>b.tags.amenity==='library');


 const terrainModel=makeTerrain(data,config,buildings,ponds);
 const {groundAt}=terrainModel;
 const gardenLevel=lib.level+.02;
 const walls=wallSegments(boundary,terrainModel.routes,config.landscape.boundaryWall);
 function amphHeight(x,z){const r=Math.hypot(x-amph.x,z-amph.z);if(r<=amph.r){const theta=(Math.atan2(x-amph.x,z-amph.z)+Math.PI*.13+Math.PI*4)%(Math.PI*2);if(theta>Math.PI*1.72)return sac.level+.16;if(r<amph.inner)return sac.level+.16;return sac.level+.16+Math.ceil((r-amph.inner)/(amph.r-amph.inner)*amph.steps)*amph.rise;}return null;}
 function walkHeight(x,z){return terrainModel.stairHeight(x,z)??amphHeight(x,z)??groundAt(x,z);}
 function blocked(x,z){if(!inside(x,z,boundary)||walls.some(w=>distSegment(x,z,w.a,w.b)<config.landscape.boundaryWall.thickness/2+.35))return true;if(garden&&Math.hypot(x-garden.fountain[0],z-garden.fountain[1])<garden.basinRadius+.6)return true;if(ponds.some(p=>edgeDistance(x,z,p.points)<.8))return true;return buildings.some(b=>{if(b===sac)return false;return edgeDistance(x,z,b.points)<.65;});}
 function safePoint(p){for(let r=0;r<100;r+=2)for(let a=0;a<6.29;a+=.25){const x=p[0]+Math.cos(a)*r,z=p[1]+Math.sin(a)*r;if(inside(x,z,boundary)&&!blocked(x,z))return[x,z];}throw new Error('No walkable point near destination');}
 function mesh(g,mat,x=0,y=0,z=0){const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;scene.add(o);return o;}
 function polygon(p,h,mat,y){const s=new T.Shape(p.map(v=>new T.Vector2(v[0],-v[1])));const g=h?new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false}):new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);return mesh(g,mat,0,y,0);}
 const batches=new Map();function box(mat,x,y,z,sx,sy,sz,angle=0){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({x,y,z,sx,sy,sz,angle});}
 const terrain=new T.PlaneGeometry(1600,1600,320,320);terrain.rotateX(-Math.PI/2);const pos=terrain.attributes.position,colors=[];for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,groundAt(x,z)-.04);const v=.26+.045*Math.sin(x*.041)*Math.cos(z*.031);const color=inside(x,z,config.landscape.soilGround.points)?new T.Color('#a4865c'):new T.Color().setHSL(.27,.36,v);colors.push(color.r,color.g,color.b);}terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();const terr=mesh(terrain,material('#ffffff',{vertexColors:true}));terr.castShadow=false;
 // Terrain-following ribbons use the same height function as the player.
 const roads=[];const roadVertices=[[],[]];
 for(const f of data.features.filter(f=>f.tags.highway)){const narrow=['footway','steps','path'].includes(f.tags.highway),width=f.width??(narrow?2.4:6.5);for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;for(let k=0,n=Math.ceil(len/2);k<n;k++){const p=[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n],q=[a[0]+(b[0]-a[0])*(k+1)/n,a[1]+(b[1]-a[1])*(k+1)/n];if(!inside((p[0]+q[0])/2,(p[1]+q[1])/2,boundary))continue;if(narrow&&blocked((p[0]+q[0])/2,(p[1]+q[1])/2))continue;roads.push({a:p,b:q,width,id:f.id,covered:f.tags.covered==='yes',steps:f.tags.highway==='steps'});const nx=-(b[1]-a[1])/len*width/2,nz=(b[0]-a[0])/len*width/2;const corners=[[p[0]+nx,p[1]+nz],[p[0]-nx,p[1]-nz],[q[0]+nx,q[1]+nz],[q[0]-nx,q[1]-nz]].map(([x,z])=>[x,groundAt(x,z)+.1,z]);for(const j of [0,2,1,1,2,3])roadVertices[+narrow].push(...corners[j]);}}}
 roadVertices.forEach((v,i)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();const o=mesh(g,i?m.path:m.road);o.castShadow=false;o.material.side=T.DoubleSide;});
 const landmarks=[];
 for(const b of buildings){const t=b.tags,h=b.height,y=b.level,[cx,cz]=b.center;const isSac=b===sac;
 if(!isSac){polygon(b.points,h,m.brick,y);polygon(b.points,.32,m.white,y+h);polygon(b.points,.3,m.roof,y+h+.33);}
 if(isSac){landmarks.push({name:'Open Air Theatre',shortName:'OAT',p:[amph.x,amph.z],label:b.center,height:y+8});continue;}
 // Recessed dark openings, white floor bands and regular white vertical framing.
 for(let i=1;i<b.points.length;i++){const a=b.points[i-1],p=b.points[i],len=Math.hypot(p[0]-a[0],p[1]-a[1]),angle=Math.atan2(p[0]-a[0],p[1]-a[1]);if(len<1)continue;

 for(let level=3.4;level<h;level+=3.4)box(m.white,(a[0]+p[0])/2,y+level,(a[1]+p[1])/2,.35,.3,len,angle);
 for(let d=1.8;d<len-1;d+=3.5){const x=a[0]+(p[0]-a[0])*d/len,z=a[1]+(p[1]-a[1])*d/len;for(let level=2;level<h-1;level+=3.4)box(m.glass,x,y+level,z,.22,1.75,1.55,angle);if(d%7<3.6)box(m.white,x,y+h/2,z,.38,h,.3,angle);}}
 if(!isSac&&t.man_made!=='storage_tank'&&b.id!=='user-mph'){
 // Solar panels follow mapped roof polygons and leave an edge margin.
 const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);for(let x=Math.min(...xs)+4;x<Math.max(...xs)-3;x+=5)for(let z=Math.min(...zs)+4;z<Math.max(...zs)-3;z+=6){if([[x-1.6,z-2],[x+1.6,z+2],[x-1.6,z+2],[x+1.6,z-2]].every(p=>inside(...p,b.points)))box(m.panel,x,y+h+.9,z,3.2,.16,4.2);}
 }
 if(t.amenity==='library'){
 addLibraryFacade(scene,b,garden,m);
 landmarks.push({name:'Library',p:safePoint(b.center),label:b.center,height:y+h});
 }else if(t.name)landmarks.push({name:t.name,p:safePoint(b.center),label:b.center,height:y+h});

 }
 // Separate open stepped amphitheatre. A radial opening faces the roundabout.
 const arcStart=-Math.PI*.13,arcLength=Math.PI*1.72;
 for(let i=0;i<amph.steps;i++){const r=amph.inner+(i+1)*(amph.r-amph.inner)/amph.steps;const g=new T.CylinderGeometry(r,r,amph.rise,64,1,true,arcStart,arcLength);mesh(g,m.brick,amph.x,sac.level+.16+(i+.5)*amph.rise,amph.z);const ring=new T.RingGeometry(r-(amph.r-amph.inner)/amph.steps,r,64,1,arcStart-Math.PI/2,arcLength);ring.rotateX(-Math.PI/2);mesh(ring,m.white,amph.x,sac.level+.16+(i+1)*amph.rise,amph.z);}
 const rearWall=mesh(new T.CylinderGeometry(amph.r+1,amph.r+1,1.2,64,1,true,arcStart,arcLength),m.white,amph.x,sac.level+amph.steps*amph.rise+.75,amph.z);rearWall.material.side=T.DoubleSide;
 const stage=new T.CircleGeometry(amph.inner,48);stage.rotateX(-Math.PI/2);mesh(stage,m.white,amph.x,sac.level+.17,amph.z);
 // A few dark floor squares echo the paved amphitheatre stage.
 for(let x=-4;x<=4;x+=2)for(let z=-4;z<=4;z+=2)if(Math.hypot(x,z)<5&&((x+z)/2)%2===0)box(m.roof,amph.x+x,sac.level+.2,amph.z+z,1.8,.04,1.8);
 for(const p of ponds){polygon(p.points,0,m.water,p.level);landmarks.push({name:p.name,p:safePoint(center(p.points)),label:center(p.points),height:p.level});}
 // Ground covers and sports surfaces retain map locations.
 const sports=data.features.filter(f=>f.tags.sport);for(const f of sports){const c=center(f.points),h=groundAt(...c)+.2;polygon(f.points,0,material(f.tags.sport==='basketball'?'#9d7052':'#718052'),h);landmarks.push({name:f.tags.sport+' ground',p:safePoint(c),label:c,height:h});}
 const details=addCampusDetails({scene,data,config,buildings,ponds,roads,terrainModel,groundAt,walkHeight,blocked,mesh,polygon,box,m,walls});
 const rb=data.features.find(f=>f.tags.junction==='roundabout'),spawn=safePoint(rb.points[0]);landmarks.unshift({name:'Roundabout',p:spawn,label:center(rb.points),height:groundAt(...center(rb.points))});
 // Dense irregular broadleaf crowns; palms around the Library garden.
 let seed=3954;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trees=[];
 function plantable(x,z){return inside(x,z,boundary)&&!(garden&&Math.hypot(x-garden.center[0],z-garden.center[1])<34)&&!inside(x,z,config.landscape.soilGround.points)&&!inside(x,z,config.landscape.bamboo.points)&&Math.hypot(x-details.roundabout[0],z-details.roundabout[1])>16&&!buildings.some(b=>edgeDistance(x,z,b.points)<5)&&!ponds.some(p=>edgeDistance(x,z,p.points)<5)&&!roads.some(r=>distSegment(x,z,r.a,r.b)<r.width/2+3)&&!sports.some(f=>inside(x,z,f.points))&&Math.hypot(x-amph.x,z-amph.z)>amph.r+2;}
 for(let i=0;i<40000&&trees.length<1900;i++){const x=(random()-.5)*700,z=(random()-.5)*800;if(!plantable(x,z))continue;const slope=inside(x,z,config.landscape.woodedSlope.points);if(!slope&&random()>.6)continue;trees.push([x,z,8+random()*10]);}
 // Closely spaced trees on the steep hostel bank and regular shade trees beside roads.
 for(let i=0;i<900;i++){const x=65+random()*100,z=-240+random()*110;if(inside(x,z,config.landscape.woodedSlope.points)&&plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>3))trees.push([x,z,13+random()*7]);}
 for(const r of terrainModel.routes.filter(r=>r.width>4)){for(let d=8;d<r.length;d+=17)for(const side of [-1,1]){const x=r.a[0]+r.dx*d/r.length-side*r.dz/r.length*9,z=r.a[1]+r.dz*d/r.length+side*r.dx/r.length*9;if(plantable(x,z)&&trees.every(p=>Math.hypot(x-p[0],z-p[1])>5))trees.push([x,z,9+random()*5]);}}

 const dummy=new T.Object3D(),trunks=new T.InstancedMesh(new T.CylinderGeometry(.3,.65,1,6),m.trunk,trees.length),crowns=new T.InstancedMesh(new T.IcosahedronGeometry(1,2),m.leaf,trees.length*3);
 trees.forEach(([x,z,h],i)=>{const y=groundAt(x,z);dummy.position.set(x,y+h*.4,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,h*.8,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<3;j++){dummy.position.set(x+(random()-.5)*h*.4,y+h*(.7+random()*.24),z+(random()-.5)*h*.4);dummy.scale.set(h*(.25+random()*.12),h*(.23+random()*.1),h*(.26+random()*.12));dummy.updateMatrix();crowns.setMatrixAt(i*3+j,dummy.matrix);crowns.setColorAt(i*3+j,new T.Color().setHSL(.27+random()*.08,.22+random()*.2,.16+random()*.13));}});crowns.castShadow=true;scene.add(trunks,crowns);
 if(garden){addLibraryGarden(scene,garden,gardenLevel,m,groundAt);landmarks.push({name:'Library fountain & garden',shortName:'Library garden',p:safePoint(garden.fountain),label:garden.fountain,height:gardenLevel+4});}
 for(const [mat,list] of batches){const inst=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,list.length);list.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.angle,0);dummy.scale.set(b.sx,b.sy,b.sz);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
 return {buildings,boundary,ponds,roads,places:landmarks,spawn,groundAt,walkHeight,blocked,safePoint,amph,garden,treeCount:trees.length,trees,walls,details,terrainModel,data};
}

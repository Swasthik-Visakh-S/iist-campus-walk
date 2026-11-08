import {roadWidth} from './road-width.js?v=14';
import * as T from './vendor/three.module.js';
import {inside,distSegment} from './geometry.js?v=6';
// Continuous mitered ribbons prevent the gaps left by separate road rectangles.
export function addRoads(scene,data,boundary,groundAt,blocked,materials,terrainSurface,exteriorRoad=()=>false,inDriveway=()=>false){
  const features=data.features.filter(f=>f.tags.highway),roads=[],surface=[[],[]],soil=[],paint=[],kerbs=[];
  const obstacles=data.features.filter(f=>f.tags.building||f.tags.natural==='water').flatMap(f=>
    f.points.slice(1).map((b,i)=>({a:f.points[i],b})));
  // Measure the room on each side independently where a mapped facade borders a lane.
  function clearance(p,nx,nz,reach){
    let clear=reach;
    for(const {a,b} of obstacles){
      if(p[0]<Math.min(a[0],b[0])-reach-2||p[0]>Math.max(a[0],b[0])+reach+2||
         p[1]<Math.min(a[1],b[1])-reach-2||p[1]>Math.max(a[1],b[1])+reach+2)continue;
      const dx=b[0]-a[0],dz=b[1]-a[1],det=nx*dz-nz*dx;
      if(Math.abs(det)<1e-8)continue;
      const x=a[0]-p[0],z=a[1]-p[1],along=(x*dz-z*dx)/det,u=(x*nz-z*nx)/det;
      if(along>=0&&u>=0&&u<=1)clear=Math.min(clear,Math.max(0,along-.38));
    }
    return clear;
  }
  const majors=features.filter(f=>roadWidth(f)>4);
  function otherRoad(x,z,f,margin=0){return majors.some(g=>g.id!==f.id&&g.points.slice(1).some((b,i)=>distSegment(x,z,g.points[i],b)<roadWidth(g)/2+margin));}
  function quad(list,a,b,c,d,h){terrainSurface.project([a,b,d,c],h,list);}
  let edgePieces=0,dashPieces=0;
  for(const f of features){
    const unpaved=f.tags.surface==='compacted';
    const w=roadWidth(f),narrow=['footway','steps','path'].includes(f.tags.highway),samples=[];let distance=0;
    for(let i=1;i<f.points.length;i++){
      const a=f.points[i-1],b=f.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;
      const n=Math.ceil(len);
      for(let k=0;k<n;k++)samples.push({p:[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n],d:distance+len*k/n});
      distance+=len;
    }
    samples.push({p:f.points.at(-1),d:distance});
    const closed=distSegment(...samples[0].p,samples.at(-1).p,samples.at(-1).p)<.01;
    for(let i=0;i<samples.length;i++){
      const prev=samples[i-1]??(closed?samples.at(-2):samples[i]),next=samples[i+1]??(closed?samples[1]:samples[i]);
      const norm=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;return[-dz/l,dx/l];};
      let a=norm(prev.p,samples[i].p),b=norm(samples[i].p,next.p);if(i===0&&!closed)a=b;if(i===samples.length-1&&!closed)b=a;
      let nx=a[0]+b[0],nz=a[1]+b[1],l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;
      const factor=1/Math.max(.65,nx*b[0]+nz*b[1]);const sample=samples[i];
      const lateralX=nx*factor,lateralZ=nz*factor;
      sample.half=[-1,1].map(side=>narrow?w/2:clearance(sample.p,side*lateralX,side*lateralZ,w/2));
      sample.offset=d=>{
        const actual=d*sample.half[Number(d>0)]/(w/2);
        return [sample.p[0]+lateralX*actual,sample.p[1]+lateralZ*actual];
      };
    }
    // Taper back to full width over several metres instead of kinking at a corner.
    for(const direction of [1,-1]){
      for(let k=1;k<samples.length;k++){
        const i=direction===1?k:samples.length-1-k,previous=samples[i-direction],current=samples[i];
        const change=.32*Math.abs(current.d-previous.d);
        for(let side=0;side<2;side++)current.half[side]=Math.min(current.half[side],previous.half[side]+change);
      }
    }
    for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i],p=[(a.p[0]+b.p[0])/2,(a.p[1]+b.p[1])/2];
      if((!inside(...p,boundary)&&!exteriorRoad(...p))||(narrow&&blocked(...p)))continue;
      roads.push({a:a.p,b:b.p,width:w,id:f.id,covered:f.tags.covered==='yes',steps:f.tags.highway==='steps',unpaved});
      if(f.tags.highway==='steps')continue;
      // Cross-sections keep broad surfaces attached to the terrain on sloping bends.
      quad(unpaved?soil:surface[+narrow],a.offset(-w/2),a.offset(w/2),b.offset(-w/2),b.offset(w/2),narrow?.12:.14);
      if(narrow)continue;
      for(const side of [-1,1]){
        const edge=a.offset(side*(w/2-.22));
        if(otherRoad(...edge,f,.35))continue;
        // Low pale kerbs; no kerbs across road junctions or pedestrian crossings.
        const outside=a.offset(side*(w/2+.14));
        const crossing=inDriveway(...outside)||features.some(g=>roadWidth(g)<=4&&g.points.slice(1).some((q,j)=>distSegment(...outside,g.points[j],q)<roadWidth(g)/2+.5));
        if(!crossing)quad(paint,a.offset(side*(w/2-.30)),a.offset(side*(w/2-.14)),b.offset(side*(w/2-.30)),b.offset(side*(w/2-.14)),.17);
        if(!crossing&&!blocked(...outside)&&inside(...outside,boundary)){
          quad(kerbs,a.offset(side*w/2),a.offset(side*(w/2+.28)),b.offset(side*w/2),b.offset(side*(w/2+.28)),.23);edgePieces++;
        }
      }
      if(f.tags.oneway!=='yes'&&f.tags.junction!=='roundabout'&&a.d%9<3.6&&!otherRoad(...p,f,2)){
        quad(paint,a.offset(-.075),a.offset(.075),b.offset(-.075),b.offset(.075),.17);dashPieces++;
      }
    }
  }
  function batch(vertices,material,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const m=new T.Mesh(g,material);m.name=name;m.receiveShadow=true;m.material.side=T.DoubleSide;scene.add(m);}
  const markings=new T.MeshStandardMaterial({color:'#eee8d7',roughness:1});
  if(soil.length)batch(soil,materials.soil,'Compacted soil access road');
  batch(surface[0],materials.road,'Continuous asphalt');batch(surface[1],materials.path,'Pedestrian surfaces');batch(paint,markings,'Road edge and centre paint');batch(kerbs,materials.white,'Road kerbs');
  return {roads,edgePieces,dashPieces};
}

import * as T from './vendor/three.module.js';
import {inside,distSegment} from './geometry.js';
// Continuous mitered ribbons prevent the gaps left by separate road rectangles.
export function addRoads(scene,data,boundary,groundAt,blocked,materials,terrainSurface){
  const features=data.features.filter(f=>f.tags.highway),roads=[],surface=[[],[]],paint=[],kerbs=[];
  const width=f=>f.width??(['footway','steps','path'].includes(f.tags.highway)?2.4:6.5);
  const majors=features.filter(f=>width(f)>4);
  function otherRoad(x,z,f,margin=0){return majors.some(g=>g.id!==f.id&&g.points.slice(1).some((b,i)=>distSegment(x,z,g.points[i],b)<width(g)/2+margin));}
  function quad(list,a,b,c,d,h){terrainSurface.project([a,b,d,c],h,list);}
  let edgePieces=0,dashPieces=0;
  for(const f of features){
    const w=width(f),narrow=['footway','steps','path'].includes(f.tags.highway),samples=[];let distance=0;
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
      const factor=1/Math.max(.65,nx*b[0]+nz*b[1]);samples[i].offset=d=>[samples[i].p[0]+nx*d*factor,samples[i].p[1]+nz*d*factor];
    }
    for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i],p=[(a.p[0]+b.p[0])/2,(a.p[1]+b.p[1])/2];
      if(!inside(...p,boundary)||(narrow&&blocked(...p)))continue;
      roads.push({a:a.p,b:b.p,width:w,id:f.id,covered:f.tags.covered==='yes',steps:f.tags.highway==='steps'});
      // Cross-sections keep broad surfaces attached to the terrain on sloping bends.
      quad(surface[+narrow],a.offset(-w/2),a.offset(w/2),b.offset(-w/2),b.offset(w/2),.14);
      if(narrow)continue;
      for(const side of [-1,1]){
        const edge=a.offset(side*(w/2-.22));
        if(otherRoad(...edge,f,.35))continue;
        quad(paint,a.offset(side*(w/2-.30)),a.offset(side*(w/2-.14)),b.offset(side*(w/2-.30)),b.offset(side*(w/2-.14)),.17);
        // Low pale kerbs; no kerbs across road junctions or pedestrian crossings.
        const outside=a.offset(side*(w/2+.14));
        const crossing=features.some(g=>width(g)<=4&&g.points.slice(1).some((q,j)=>distSegment(...outside,g.points[j],q)<width(g)/2+.5));
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
  batch(surface[0],materials.road,'Continuous asphalt');batch(surface[1],materials.path,'Pedestrian surfaces');batch(paint,markings,'Road edge and centre paint');batch(kerbs,materials.white,'Road kerbs');
  return {roads,edgePieces,dashPieces};
}

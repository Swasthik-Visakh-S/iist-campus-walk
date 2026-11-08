import * as T from './vendor/three.module.js';
import {distSegment,inside} from './geometry.js?v=6';

export const academicIds=new Set(['618490371','618501273','618501279']);

// The photograph shows cream-edged red soffits and a black frame under the
// projecting canopy. Its support piers use the same coordinates as collisions.
export function addAcademicEntrances(scene,entries,buildings,m){
  const steel=new T.MeshStandardMaterial({color:'#262d2b',roughness:.74});
  const brickScreen=new T.MeshStandardMaterial({color:'#ad6350',roughness:.95});
  const yellow=new T.MeshStandardMaterial({color:'#dca32d',roughness:.8});
  const unit=new T.BoxGeometry(),parts=[];
  function part(parent,mat,x,y,z,w,h,d,tilt=0){
    const object=new T.Mesh(unit,mat);
    object.position.set(x,y,z);object.scale.set(w,h,d);object.rotation.x=tilt;
    object.castShadow=true;object.receiveShadow=true;parent.add(object);parts.push(object);
    return object;
  }
  for(const e of entries.filter(e=>academicIds.has(e.buildingId))){
    const b=buildings.find(b=>b.id===e.buildingId);
    const group=new T.Group();group.name=e.name+' photo-inspired entrance';
    group.position.set(e.door[0],e.level,e.door[1]);
    group.rotation.y=Math.atan2(e.n[0],e.n[1]);scene.add(group);
    const span=e.span||2.55,depth=e.postDepth||2.4;
    const halfWidth=span+1.05,roofDepth=depth+2.7,roofCentre=depth/2+.25,slope=.12;
    // Red piers stand clear of the doorway, supporting the deep cream lintel.
    for(const side of [-1,1]){
      part(group,m.brick,side*span,1.82,depth,.84,3.64,.90);
      part(group,m.white,side*span,3.57,depth,1.02,.20,1.04);
      part(group,yellow,side*span,.70,depth+.472,.24,.61,.035);
      for(const y of [.51,.72,.93]){
        const stripe=part(group,steel,side*span,y,depth+.496,.26,.075,.025);
        stripe.rotation.z=-.5;
      }
    }
    part(group,m.white,0,3.79,depth/2,span*2+.88,.37,depth+1.3);
    // Sloped soffit rises towards the street. Red inset panels remain visible
    // between cream cross-members when the student looks up under the porch.
    const roofY=4.39;
    part(group,m.white,0,roofY,roofCentre,halfWidth*2,.17,roofDepth,-slope);
    const panelWidth=(halfWidth*2-.36)/4;
    for(let col=0;col<4;col++){
      const x=-halfWidth+.18+(col+.5)*panelWidth;
      part(group,m.brick,x,roofY-.103,roofCentre,panelWidth-.12,.035,roofDepth-.32,-slope);
    }
    for(const side of [-1,1]){
      const z=roofCentre+side*(roofDepth/2-.10),y=roofY+Math.sin(slope)*(z-roofCentre)-.26;
      part(group,steel,0,y,z,halfWidth*2-.30,.065,.065);
    }
    for(let x=-halfWidth+.35;x<halfWidth;x+=.94){
      part(group,steel,x,roofY-.34,roofCentre,.055,.055,roofDepth-.35,-slope);
    }
    part(group,m.glass,0,1.46,.12,2.60,2.88,.16);
    for(const x of [-1.34,0,1.34])part(group,m.white,x,1.48,.23,.085,2.94,.08);
    part(group,m.white,0,2.98,.23,2.77,.10,.10);
    for(const side of [-1,1])part(group,m.white,side*.15,1.28,.30,.035,.38,.06);

    // Put the ventilated red screen on a real long wall beside the entrance.
    // Its narrow slots and cream floor bands follow the D3 reference facade.
    let face=null;
    for(let i=1;i<b.points.length;i++){
      const a=b.points[i-1],q=b.points[i],length=Math.hypot(q[0]-a[0],q[1]-a[1]);
      if(length<5.8)continue;
      const distance=distSegment(...e.door,a,q);
      if(!face||distance<face.distance)face={a,q,length,distance};
    }
    if(!face)continue;
    const {a,q,length}=face;
    const width=Math.min(6.4,length-.7),dx=(q[0]-a[0])/length,dz=(q[1]-a[1])/length;
    const along=Math.max(width/2+.25,Math.min(length-width/2-.25,(e.door[0]-a[0])*dx+(e.door[1]-a[1])*dz));
    const c=[a[0]+along*dx,a[1]+along*dz];let n=[-dz,dx];
    if(inside(c[0]+n[0]*.05,c[1]+n[1]*.05,b.points))n=n.map(v=>-v);
    const faceGroup=new T.Group();faceGroup.position.set(c[0]+n[0]*.24,e.level,c[1]+n[1]*.24);
    faceGroup.rotation.y=Math.atan2(n[0],n[1]);scene.add(faceGroup);
    const bottom=4.7,height=Math.max(3,b.height-bottom-.35);
    part(faceGroup,brickScreen,0,bottom+height/2,.04,width,height,.16);
    for(let y=bottom+.65;y<bottom+height-.35;y+=1.18){
      for(let col=0;col<7;col++){
        const x=(col-3)*width/8;
        part(faceGroup,m.glass,x,y,.133,.16,.48,.035);
        part(faceGroup,m.white,x+.1,y,.15,.045,.49,.045);
      }
    }
    for(const side of [-1,1])part(faceGroup,m.white,side*(width/2+.16),bottom+height/2,.1,.31,height+.45,.35);
    for(let y=bottom;y<bottom+height;y+=3.35)part(faceGroup,m.white,0,y,.15,width+.64,.25,.35);
    part(faceGroup,m.white,0,b.height+.45,.15,width+1.7,.18,1.8,-.12);
    part(faceGroup,m.brick,0,b.height+.32,.15,width+1.4,.045,1.5,-.12);
    for(let x=-width/2;x<=width/2;x+=1.18)part(faceGroup,m.white,x,b.height+.29,.15,.10,.08,1.7,-.12);
  }
  // Keep the entire collection to one static draw without repeated materials.
  scene.updateMatrixWorld(true);
  const positions=[],normals=[],colours=[];
  for(const part of parts){
    const geometry=unit.toNonIndexed().applyMatrix4(part.matrixWorld);
    const position=geometry.attributes.position,normal=geometry.attributes.normal;
    const color=part.material.color;
    for(let i=0;i<position.count;i++){
      positions.push(position.getX(i),position.getY(i),position.getZ(i));
      normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));
      colours.push(color.r,color.g,color.b);
    }
    geometry.dispose();part.removeFromParent();
  }
  const combined=new T.BufferGeometry();
  combined.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  combined.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  combined.setAttribute('color',new T.Float32BufferAttribute(colours,3));
  const result=new T.Mesh(combined,new T.MeshStandardMaterial({vertexColors:true,roughness:.88}));
  result.name='Academic entrances and ventilated facades';result.castShadow=true;result.receiveShadow=true;scene.add(result);
  unit.dispose();steel.dispose();brickScreen.dispose();yellow.dispose();
}

export function academicCanopyBlocked(x,y,z,entry){
  const dx=x-entry.door[0],dz=z-entry.door[1];
  const u=dx*entry.right[0]+dz*entry.right[1],v=dx*entry.n[0]+dz*entry.n[1];
  const span=entry.span||2.55,depth=entry.postDepth||2.4,roofCentre=depth/2+.25;
  const roof=entry.level+4.39+Math.sin(.12)*(v-roofCentre);
  if(Math.abs(u)>span+1.15)return false;
  return v>roofCentre-(depth+2.7)/2-.1&&v<roofCentre+(depth+2.7)/2+.1&&Math.abs(y-roof)<.27 ||
    Math.abs(u)<span+.55&&v>-.7&&v<depth+1&&y>entry.level+3.55&&y<entry.level+4.05;
}

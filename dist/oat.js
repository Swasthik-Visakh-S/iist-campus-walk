import * as T from './vendor/three.module.js';
import {distSegment,inside} from './geometry.js?v=6';

// The photo shows a fan of pale tiled benches facing a low, clipped-corner
// stage. Each sector below is a closed prism, including the faces at the aisles.
export function createOat(amph,level,aisles){
  const {x:cx,z:cz,r:outer,inner,steps,rise}=amph;
  const floor=level+.17,half=Math.PI*.54,sectors=96,stepAngle=2*half/sectors;
  const facet=stepAngle*12,rows=[],obstacles=[],railPanels=[];
  const apron=inner+1.35,tread=(outer-apron)/steps;
  const angleAt=i=>-half+i*stepAngle;
  function radiusFactor(a){
    const mid=-half+(Math.floor((a+half)/facet)+.5)*facet;
    return Math.cos(facet*.5)/Math.cos(a-mid);
  }
  function point(r,a){const d=r*radiusFactor(a);return [cx+d*Math.sin(a),cz-d*Math.cos(a)];}
  const inWalk=(x,z)=>aisles.some(r=>distSegment(x,z,r.a,r.b)<r.width*.5+.75);
  for(let i=0;i<steps;i++){
    const row=[];
    for(let j=0;j<sectors;j++){
      const mid=angleAt(j+.5),p=point(apron+(i+.5)*tread,mid);
      const stair=[0,-.86,.86].some(a=>Math.abs(Math.sin(mid-a))*(apron+(i+.5)*tread)<.78);
      row.push(inWalk(...p)?0:stair?2:1);
    }
    rows.push(row);
  }
  const stage=[[-3.35,-.85],[3.35,-.85],[4.2,.05],[4.2,3.55],[3.55,4.15],[-3.55,4.15],[-4.2,3.55],[-4.2,.05]];
  const stageOutline=stage.map(([x,z])=>[cx+x,cz+z]);
  const stageTop=floor+.42;
  function heightAt(x,z){
    const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);
    if(d>outer+.3)return null;
    if(inside(x,z,stageOutline))return stageTop;
    const a=Math.atan2(dx,-dz);
    if(Math.abs(a)>=half)return floor;
    const radius=d/radiusFactor(a),row=Math.floor((radius-apron)/tread);
    if(row<0||row>=steps)return floor;
    const kind=rows[row][Math.floor((a+half)/stepAngle)];
    if(!kind)return floor;
    const part=(radius-apron)/tread-row;
    return floor+rise*(row+(kind===2&&part<.5?.5:1));
  }
  function block(x,z,w,d,height){
    obstacles.push({x:cx+x,z:cz+z,w,d,height});
  }
  block(0,5.75,6.55,.55,5.75);
  for(const x of [-10.4,-7.6,9.6])block(x,6.7,.54,.6,4.2);
  const nearSolid=(x,z,margin,y)=>obstacles.some(b=>Math.abs(x-b.x)<b.w/2+margin&&Math.abs(z-b.z)<b.d/2+margin&&y<floor+b.height+.1);
  const view=point(apron+tread*(steps-4.5),-.16);
  function draw({mesh,polygon,box,m,outline}){
    const stone=new T.MeshStandardMaterial({color:'#e2d9c4',roughness:.92});
    const dark=new T.MeshStandardMaterial({color:'#686258',roughness:.88});
    const steel=new T.MeshStandardMaterial({color:'#818987',metalness:.32,roughness:.5});
    polygon(outline,.40,stone,floor-.42);
    const colors=new Map();
    function quad(mat,a,b,c,d){
      if(!colors.has(mat))colors.set(mat,[]);
      const buf=colors.get(mat);
      for(const p of [a,b,c,a,c,d])buf.push(...p);
    }
    function prism(inner,outer,angle,end,top,topMat,sideMat){
      const corners=[point(inner,angle),point(outer,angle),point(outer,end),point(inner,end)];
      const ring=h=>corners.map(([x,z])=>[x,h,z]);
      const b=ring(floor-.10),u=ring(top);
      quad(topMat,u[3],u[2],u[1],u[0]);
      quad(sideMat,b[0],b[1],b[2],b[3]);
      for(let i=0;i<4;i++){const k=(i+1)%4;quad(sideMat,u[i],u[k],b[k],b[i]);}
    }
    for(let i=0;i<steps;i++){
      const r=apron+i*tread;
      for(let j=0;j<sectors;j++){
        const kind=rows[i][j];if(!kind)continue;
        const a=angleAt(j),b=angleAt(j+1),top=floor+(i+1)*rise;
        if(kind===2){
          prism(r,r+tread*.5,a,b,top-rise*.5,dark,m.white);
          prism(r+tread*.5,r+tread,a,b,top,dark,m.white);
        }else prism(r,r+tread,a,b,top,stone,(j%16===0&&i%4===1)?m.white:m.brick);
      }
    }
    for(const [mat,positions] of colors){
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      geometry.computeVertexNormals();mesh(geometry,mat);
    }
    const loop=(s)=>stage.map(([x,z])=>[cx+x*s,cz+1.65+(z-1.65)*s]);
    polygon(loop(1.025),.16,dark,floor-.02);
    polygon(stageOutline,.21,m.brick,floor+.14);
    polygon(stageOutline,.07,stone,floor+.35);
    for(const side of [-1,1]){
      box(dark,cx+side*3.63,stageTop+.007,cz+1.65,.18,.014,2.75);
      box(dark,cx,stageTop+.007,cz+1.65+side*1.89,6.75,.014,.18);
    }
    for(const x of [-2.4,-1.6,0,1.6,2.4]){
      const pattern=x===0?[0]:Math.abs(x)>2?[0]:[-.8,.8];
      for(const z of pattern)box(dark,cx+x,stageTop+.008,cz+1.65+z,.78,.016,.78);
    }
    for(const o of obstacles)box(m.white,o.x,floor+o.height/2,o.z,o.w,o.height,o.d);
    // Concrete lintels and open side bays frame the tall wall behind the stage.
    for(const sign of [-1,1]){
      box(m.white,cx+sign*6.98,floor+4.32,cz+6.6,7.4,.40,2.25);
      for(const x of [4,6.5,9.5])box(steel,cx+sign*x,floor+4.89,cz+5.57,.055,.74,.055);
      for(const h of [4.84,5.21])box(steel,cx+sign*6.98,floor+h,cz+5.57,7.4,.045,.045);
    }
    box(m.white,cx,floor+5.8,cz+5.9,6.85,.18,1.15);
    // Solid rear parapet follows the faceted top row. Gaps align with aisles.
    for(let j=0;j<sectors;j++){
      if(!rows[steps-1][j])continue;
      const a=point(outer,angleAt(j)),b=point(outer,angleAt(j+1));
      const len=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
      const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,base=floor+steps*rise;
      box(m.white,x,base+.35,z,.22,.70,len+.01,yaw);
      if(j%3!==0)box(m.brick,x,base+.36,z,.24,.40,len+.005,yaw);
      railPanels.push([a,b]);
    }
  }
  function blocked(x,z){
    if(Math.abs(x-cx)>outer+1||Math.abs(z-cz)>outer+1)return false;
    return nearSolid(x,z,.20,floor)||railPanels.some(([a,b])=>distSegment(x,z,a,b)<.25);
  }
  function cameraBlocked(x,y,z){
    if(Math.abs(x-cx)>outer+1||Math.abs(z-cz)>outer+1)return false;
    if(nearSolid(x,z,.12,y)||y<(heightAt(x,z)??-Infinity)+.05)return true;
    if(Math.abs(x-cx)>3.25&&Math.abs(x-cx)<10.8&&Math.abs(z-cz-6.6)<1.22&&Math.abs(y-floor-4.32)<.28)return true;
    return y<floor+steps*rise+.8&&railPanels.some(([a,b])=>distSegment(x,z,a,b)<.25);
  }
  return {draw,heightAt,blocked,cameraBlocked,view,aim:[cx,cz+2]};
}

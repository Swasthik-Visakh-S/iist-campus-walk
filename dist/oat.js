import * as T from './vendor/three.module.js';
import {distSegment,inside} from './geometry.js?v=6';

// The photo shows a fan of pale tiled benches facing a low, clipped-corner
// stage. Each sector below is a closed prism, including the faces at the aisles.
export function createOat(amph,level,aisles,mph){
  const {x:cx,z:cz,r:outer,inner,steps,rise}=amph;
  const floor=level+.17,half=Math.PI*.54,sectors=96,stepAngle=2*half/sectors;
  const facet=stepAngle*12,rows=[],obstacles=[],railPanels=[];
  const apron=inner+1.35,tread=(outer-apron)/steps;
  // Stage shares the north-west wall of MPH. Its back edge is exactly on
  // that wall, and its front projects into the auditorium.
  const wall=mph ? [mph.groundPoints[1],mph.groundPoints[2]] : [[cx+11,cz+16],[cx+21,cz+6]];
  const back=wall[0].map((v,i)=>(v+wall[1][i])/2),length=Math.hypot(wall[1][0]-wall[0][0],wall[1][1]-wall[0][1]);
  const right=[(wall[1][0]-wall[0][0])/length,(wall[1][1]-wall[0][1])/length];
  let front=[-right[1],right[0]];
  if((cx-back[0])*front[0]+(cz-back[1])*front[1]<0)front=front.map(v=>-v);
  const at=(u,v)=>[back[0]+right[0]*u+front[0]*v,back[1]+right[1]*u+front[1]*v];
  const local=(x,z)=>[(x-back[0])*right[0]+(z-back[1])*right[1],(x-back[0])*front[0]+(z-back[1])*front[1]];
  const rotation=Math.atan2(-front[0],-front[1]);
  const angleAt=i=>-half+i*stepAngle;
  function radiusFactor(a){
    const mid=-half+(Math.floor((a+half)/facet)+.5)*facet;
    return Math.cos(facet*.5)/Math.cos(a-mid);
  }
  function point(r,a){const d=r*radiusFactor(a);return [cx+d*Math.sin(a-rotation),cz-d*Math.cos(a-rotation)];}
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
  const stage=[[-5.2,0],[5.2,0],[5.2,5.2],[4.5,6],[-4.5,6],[-5.2,5.2]];
  const stageOutline=stage.map(([u,v])=>at(u,v));
  const stageTop=floor+.90;
  function heightAt(x,z){
    const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);
    if(inside(x,z,stageOutline))return stageTop;
    const [u,v]=local(x,z);
    if(Math.abs(u)<1.9&&v>=6&&v<7.8)return floor+.15*(6-Math.floor((v-6)/.30));
    if(d>outer+.3)return null;
    const raw=Math.atan2(dx,-dz)+rotation,a=Math.atan2(Math.sin(raw),Math.cos(raw));
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
    // A solid raised platform abuts MPH, with six low access treads.
    polygon(stageOutline,.83,m.brick,floor);
    polygon(stageOutline,.07,stone,floor+.83);
    for(let i=0;i<6;i++){
      const p=at(0,6+(i+.5)*.3),h=.15*(6-i);
      box(stone,p[0],floor+h/2,p[1],3.8,h,.301,Math.atan2(front[0],front[1]));
    }
    const slab=[at(-5.6,0),at(5.6,0),at(5.6,8.4),at(-5.6,8.4)];
    polygon(slab,.15,stone,floor-.15);
    for(const u of [-3,-1.5,0,1.5,3]){
      const p=at(u,3);box(dark,p[0],stageTop+.008,p[1],.7,.016,.7,Math.atan2(front[0],front[1]));
    }
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

    return y<floor+steps*rise+.8&&railPanels.some(([a,b])=>distSegment(x,z,a,b)<.25);
  }
  return {draw,heightAt,blocked,cameraBlocked,view,aim:at(0,3),stageOutline,stageTop,stageBack:back,stageAt:at,wall};
}

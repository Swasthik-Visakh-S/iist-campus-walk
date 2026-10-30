import * as T from './vendor/three.module.js';
import {inside,distSegment} from './geometry.js';
// Refine the terrain only where a road crosses curved ground. Road paint and
// asphalt are clipped to these same triangles, so hills cannot hide them.
export function createTerrainSurface(groundAt,routes,soil){
  const extent=800,step=5,count=320,heights=new Map(),fine=new Set(),candidates=new Set(),tiles=new Map();
  const key=(i,j)=>i+count*j;
  function height(x,z){const k=x+','+z;if(!heights.has(k))heights.set(k,groundAt(x,z));return heights.get(k);}
  const vertex=(x,z)=>[x,height(x,z),z];
  for(const r of routes){
    const margin=r.width/2+5;
    for(let j=Math.max(0,Math.floor((Math.min(r.a[1],r.b[1])-margin+extent)/step));j<=Math.min(count-1,Math.floor((Math.max(r.a[1],r.b[1])+margin+extent)/step));j++)
    for(let i=Math.max(0,Math.floor((Math.min(r.a[0],r.b[0])-margin+extent)/step));i<=Math.min(count-1,Math.floor((Math.max(r.a[0],r.b[0])+margin+extent)/step));i++){
      if(distSegment(i*step-extent+2.5,j*step-extent+2.5,r.a,r.b)<margin)candidates.add(key(i,j));
    }
  }
  for(const k of candidates){
    const i=k%count,j=Math.floor(k/count),x=i*step-extent,z=j*step-extent;
    const a=height(x,z),b=height(x+step,z),c=height(x,z+step),d=height(x+step,z+step);
    for(const u of [.25,.5,.75])for(const v of [.25,.5,.75]){
      const linear=u+v<=1?a*(1-u-v)+b*u+c*v:d*(u+v-1)+c*(1-u)+b*(1-v);
      if(Math.abs(height(x+step*u,z+step*v)-linear)>.045)fine.add(k);
    }
  }
  function tile(i,j){
    const k=key(i,j);if(tiles.has(k))return tiles.get(k);
    const x=i*step-extent,z=j*step-extent,tris=[];
    if(fine.has(k)){
      const s=step/8;
      for(let v=0;v<8;v++)for(let u=0;u<8;u++){
        const a=vertex(x+u*s,z+v*s),b=vertex(x+(u+1)*s,z+v*s),c=vertex(x+u*s,z+(v+1)*s),d=vertex(x+(u+1)*s,z+(v+1)*s);tris.push([a,c,b],[b,c,d]);
      }
    }else{
      const adjacent=[fine.has(key(i,j-1)),fine.has(key(i+1,j)),fine.has(key(i,j+1)),fine.has(key(i-1,j))];
      if(adjacent.some(Boolean)){
        const corners=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]],ring=[];
        for(let side=0;side<4;side++){
          const a=corners[side],b=corners[(side+1)%4],n=adjacent[side]?8:1;
          for(let s=0;s<n;s++)ring.push(vertex(a[0]+(b[0]-a[0])*s/n,a[1]+(b[1]-a[1])*s/n));
        }
        const mid=vertex(x+2.5,z+2.5);ring.forEach((p,n)=>tris.push([mid,ring[(n+1)%ring.length],p]));
      }else{const a=vertex(x,z),b=vertex(x+step,z),c=vertex(x,z+step),d=vertex(x+step,z+step);tris.push([a,c,b],[b,c,d]);}
    }
    if(candidates.has(k))tiles.set(k,tris);return tris;
  }
  const positions=[],colours=[],indices=[],verts=new Map();
  function add(p){const k=p[0]+','+p[2];if(verts.has(k))return verts.get(k);const n=positions.length/3;verts.set(k,n);positions.push(p[0],p[1]-.04,p[2]);const color=inside(p[0],p[2],soil)?new T.Color('#a4865c'):new T.Color().setHSL(.27,.36,.26+.045*Math.sin(p[0]*.041)*Math.cos(p[2]*.031));colours.push(color.r,color.g,color.b);return n;}
  for(let j=0;j<count;j++)for(let i=0;i<count;i++)for(const tri of tile(i,j))indices.push(...tri.map(add));
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  positions.length=0;colours.length=0;indices.length=0;verts.clear();
  function bary(x,z,t){const [a,b,c]=t,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]),u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;return[u,v,1-u-v];}
  function heightAt(x,z){
    const i=Math.max(0,Math.min(count-1,Math.floor((x+extent)/step))),j=Math.max(0,Math.min(count-1,Math.floor((z+extent)/step)));
    for(const tri of tile(i,j)){const b=bary(x,z,tri);if(b.every(v=>v>=-1e-7))return b.reduce((sum,w,n)=>sum+w*tri[n][1],0);}
    return groundAt(x,z);
  }
  // Clip a convex road polygon to each terrain triangle it overlaps.
  function project(polygon,offset,list){
    const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]);
    const imin=Math.max(0,Math.floor((Math.min(...xs)+extent)/step)),imax=Math.min(count-1,Math.floor((Math.max(...xs)+extent)/step));
    const jmin=Math.max(0,Math.floor((Math.min(...zs)+extent)/step)),jmax=Math.min(count-1,Math.floor((Math.max(...zs)+extent)/step));
    for(let j=jmin;j<=jmax;j++)for(let i=imin;i<=imax;i++)for(const tri of tile(i,j)){
      let clipped=polygon;
      for(let edge=0;edge<3&&clipped.length;edge++){
        const a=tri[edge],b=tri[(edge+1)%3],side=p=>(b[0]-a[0])*(p[1]-a[2])-(b[2]-a[2])*(p[0]-a[0]),next=[];
        for(let n=0;n<clipped.length;n++){
          const p=clipped[n],q=clipped[(n+1)%clipped.length],dp=side(p),dq=side(q),ip=dp<=1e-8,iq=dq<=1e-8;
          if(ip)next.push(p);if(ip!==iq){const t=dp/(dp-dq);next.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
        }
        clipped=next;
      }
      for(let n=1;n<clipped.length-1;n++)for(const p of [clipped[0],clipped[n+1],clipped[n]]){
        const weights=bary(...p,tri);list.push(p[0],weights.reduce((s,w,k)=>s+w*tri[k][1],0)+offset,p[1]);
      }
    }
  }
  return {geometry,heightAt,project,refinedCells:fine.size};
}

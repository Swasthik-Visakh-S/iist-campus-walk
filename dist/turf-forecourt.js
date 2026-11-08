import {inside,edgeDistance} from './geometry.js?v=6';
export function planForecourt(config){
 const spec=config.landscape.turfForecourt;
 return {...spec,contains:(x,z)=>inside(x,z,spec.points),clear:(x,z,margin)=>edgeDistance(x,z,spec.points)<margin};
}
export function addForecourt(forecourt,box,polygon,m){
 const {points,level,contains}=forecourt;
 polygon(points,.13,m.roof,level);
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
 // Staggered interlocking blocks, batched with the other static campus boxes.
 for(let row=0,z=Math.min(...zs)+.3;z<Math.max(...zs);row++,z+=.6){
  for(let x=Math.min(...xs)+(row%2)*.6;x<Math.max(...xs);x+=1.2){
   if([[-.57,-.27],[-.57,.27],[.57,-.27],[.57,.27]].every(([u,v])=>contains(x+u,z+v)))
    box(row%3===0?m.path:m.white,x,level+.145,z,1.14,.03,.54);
  }
 }
}

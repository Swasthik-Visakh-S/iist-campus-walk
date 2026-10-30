// Foot position and vertical velocity; shared by the browser and regression checks.
export function resetMotion(state,x,z,world){state.x=x;state.z=z;state.y=world.walkHeight(x,z)+.14;state.vy=0;state.grounded=true;}
export function stepMotion(state,dx,dz,dt,jump,world){
  const ox=state.x,oz=state.z;
  if(jump&&state.grounded){state.vy=6.8;state.grounded=false;}
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));
  function tryMove(x,z){
    if(world.blocked(x,z))return;
    const floor=world.walkHeight(x,z)+.14;
    // No climbing vertical banks or jumping through buildings/ponds.
    if(floor>state.y+.55)return;
    state.x=x;state.z=z;
    if(state.grounded&&Math.abs(floor-state.y)<.55)state.y=floor;
  }
  for(let i=0;i<n;i++){tryMove(state.x+dx/n,state.z);tryMove(state.x,state.z+dz/n);}
  const floor=world.walkHeight(state.x,state.z)+.14;
  if(state.grounded&&state.y-floor>.55)state.grounded=false;
  if(!state.grounded){state.vy-=18*dt;state.y+=state.vy*dt;if(state.y<=floor){state.y=floor;state.vy=0;state.grounded=true;}}
  else state.y=floor;
  return Math.hypot(state.x-ox,state.z-oz);
}
export function followCamera(state,yaw,pitch,distance,world){
  const target={x:state.x,y:state.y+1.25,z:state.z};
  const desired={x:target.x+Math.sin(yaw)*Math.cos(pitch)*distance,y:target.y+Math.sin(pitch)*distance,z:target.z+Math.cos(yaw)*Math.cos(pitch)*distance};
  let position={...target};
  const n=Math.ceil(distance/.15);
  for(let i=1;i<=n;i++){
    const t=i/n,p={x:target.x+(desired.x-target.x)*t,y:target.y+(desired.y-target.y)*t,z:target.z+(desired.z-target.z)*t};
    if(p.y<world.walkHeight(p.x,p.z)+.3||world.cameraBlocked(p.x,p.y,p.z))break;
    position=p;
  }
  return {position,target};
}

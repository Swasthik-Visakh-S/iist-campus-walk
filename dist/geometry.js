export function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
export function distSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
export function center(p){const q=p.slice(0,-1);return q.reduce((a,b)=>[a[0]+b[0]/q.length,a[1]+b[1]/q.length],[0,0]);}
export function edgeDistance(x,z,p){if(inside(x,z,p))return 0;let d=Infinity;for(let i=1;i<p.length;i++)d=Math.min(d,distSegment(x,z,p[i-1],p[i]));return d;}

export function addCrystalFacade(entry,building,box,m){
 const e=entry,angle=Math.atan2(e.n[0],e.n[1]);
 const part=(mat,u,y,v,w,h,d)=>box(mat,e.door[0]+e.right[0]*u+e.n[0]*v,e.level+y,e.door[1]+e.right[1]*u+e.n[1]*v,w,h,d,angle);
 part(m.glass,0,1.4,.18,2.4,2.8,.14);
 for(const u of [-1.24,0,1.24])part(m.white,u,1.4,.28,.07,2.8,.1);
 // Tall cream entrance frame and glazed stairwell seen in the supplied photograph.
 for(const side of [-1,1])part(m.white,side*2.35,4,.30,.55,8,.55);
 part(m.white,0,8,.3,5.25,.50,.6);
 part(m.glass,0,4.7,.12,3.9,5.3,.12);
 for(let y=2.4;y<7.5;y+=1.5)part(m.white,0,y,.21,3.95,.1,.13);
 for(const u of [-1.3,0,1.3])part(m.white,u,4.8,.22,.08,5.3,.13);
 for(const side of [-1,1]){
  part(m.white,side*5.2,2.4,.18,3.4,4.8,.26);
  part(m.glass,side*5.2,2.4,.34,2.8,4.1,.12);
  for(let y=6;y<building.height-1;y+=3.2){part(m.white,side*5.2,y,.2,3.4,.2,.35);part(m.glass,side*5.2,y+1.4,.25,2.7,2.3,.15);}
 }
 part(m.white,0,building.height+.15,.2,14,.35,1.15);
}

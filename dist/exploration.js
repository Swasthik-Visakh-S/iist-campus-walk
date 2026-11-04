// A small optional campus trail. No map geometry, accounts or network saves.
export const SAVE_KEY='iist-discovery-v1';
export const STOP_DEFINITIONS=[
 {id:'roundabout',name:'Roundabout',title:'Begin at the garden',note:'The roundabout has a circular garden and a high-mast light. Your campus trail starts here.'},
 {id:'library',name:'Library',title:'Find the library',note:'The library, fountain, roundabout and building 2 share the same terrace. Look for the garden beside the library.'},
 {id:'sac',name:'Student Activity Centre',title:'Discover student life',note:'SAC is building 8. Its covered walking connection leads into OAT, which also connects to MPH.'},
 {id:'oat',name:'Open Air Theatre',title:'Step into OAT',note:'OAT is building 7. SAC, OAT and MPH form one connected area; the route passes through the theatre.'},
 {id:'canteen',name:'Tripthi canteen',title:'Finish at Tripthi',note:'Tripthi is building 23, on the lower terrace with Rohini, Revati and Vishaka. The road toward Dhruva climbs uphill.'}
];
export function createTour(places,storage){
 const stops=STOP_DEFINITIONS.map(s=>({...s,place:places.find(p=>p.name===s.name)})).filter(s=>s.place);
 let visited=new Set(),active=false,persisted=!!storage;
 try{const saved=JSON.parse(storage?.getItem(SAVE_KEY)||'null');if(saved?.version===1){visited=new Set((Array.isArray(saved.visited)?saved.visited:[]).filter(id=>stops.some(s=>s.id===id)));active=saved.active===true;}}catch{persisted=false;}
 function save(){try{if(!storage)throw Error('Storage unavailable');storage.setItem(SAVE_KEY,JSON.stringify({version:1,visited:[...visited],active}));persisted=true;}catch{persisted=false;}}
 function current(){return active?stops.find(s=>!visited.has(s.id))||null:null;}
 return {
  stops,get active(){return active;},get count(){return visited.size;},get complete(){return stops.length>0&&visited.size===stops.length;},get persisted(){return persisted;},current,
  start(){active=true;save();},stop(){active=false;save();},restart(){visited.clear();active=true;save();},
  status(player,yaw=0){const stop=current();if(!stop)return null;const dx=stop.place.p[0]-player.x,dz=stop.place.p[1]-player.z;return {stop,distance:Math.hypot(dx,dz),bearing:Math.atan2(dx,-dz)+yaw};},
  visit(player,walkHeight){const state=this.status(player);if(!state||state.distance>9||!player.grounded||Math.abs(player.y-walkHeight)>1)return null;visited.add(state.stop.id);save();return state.stop;}
 };
}

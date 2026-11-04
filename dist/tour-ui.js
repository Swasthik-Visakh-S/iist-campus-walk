import {createTour} from './exploration.js?v=7';
export function createTourUI({places,player,world,onWalk,onPause}){
 const $=id=>document.getElementById(id);let storage;
 try{storage=localStorage;}catch{}
 const tour=createTour(places,storage);let walking=false;
 function start(){tour.start();onWalk();refresh();}
 $('startTour').onclick=start;$('tourStart').onclick=start;
 $('tourToggle').onclick=()=>{document.activeElement?.blur();tour.active?tour.stop():tour.start();refresh();};
 $('interact').onclick=interact;
 $('closeDiscovery').onclick=()=>$('discovery').close();
 $('restartTour').onclick=()=>{tour.restart();$('pauseMenu').close();onWalk();refresh();};
 function interact(){if(!walking||$('pauseMenu').open||$('info').open||$('discovery').open)return;const stop=tour.visit(player,world.walkHeight(player.x,player.z));if(!stop)return;onPause();$('discoveryTitle').textContent=stop.name;$('discoveryText').textContent=stop.note;$('discoveryProgress').textContent=tour.complete?'Trail complete · All five places discovered':`${tour.count} / ${tour.stops.length} places discovered`;$('closeDiscovery').textContent=tour.complete?'Keep exploring':'Next stop →';$('discovery').showModal();refresh();}
 function refresh(yaw=0){
  $('tourHud').hidden=!walking;
  const status=tour.status(player,yaw),complete=tour.complete;
  $('tourToggle').textContent=tour.active?'Free roam':complete?'Trail complete':'Resume trail';
  $('tourToggle').hidden=!tour.active;
  $('tourProgress').textContent=`${tour.count} / ${tour.stops.length} DISCOVERED`;
  $('tourBar').style.width=`${tour.stops.length?tour.count/tour.stops.length*100:0}%`;
  $('tourTitle').textContent=status?status.stop.title:complete?'Campus explorer!':'Your campus. Your pace.';
  $('tourPlace').textContent=status?status.stop.name:complete?'All five stops discovered. Keep exploring.':'Follow the roads, or try the discovery trail.';
  $('tourDistance').textContent=status?`${Math.round(status.distance)} m direct · Follow the paths`:tour.persisted?'Progress saved in this browser':'Progress lasts for this visit only';
  $('tourArrow').hidden=!status;$('tourArrow').style.transform=`rotate(${status?.bearing||0}rad)`;
  const ready=!!status&&status.distance<=9&&player.grounded&&Math.abs(player.y-world.walkHeight(player.x,player.z))<=1;
  $('interact').hidden=!status;$('interact').disabled=!ready;$('interact').textContent=ready?'Discover this place · E':'Walk closer to discover';
  $('tourStart').hidden=tour.active||complete;
  $('startTour').textContent=complete?'Explore discovered campus →':tour.count?'Continue discovery trail →':'Start discovery trail →';
  $('saveStatus').textContent=tour.persisted?'Discovery progress saves automatically on this browser.':'Browser storage is unavailable. Progress will last for this visit only.';
 }
 refresh();
 return {tour,interact,refresh,setWalking(value){walking=value;refresh();}};
}

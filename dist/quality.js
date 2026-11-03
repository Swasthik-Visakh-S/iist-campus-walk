export function chooseQuality(value,device={}){
 if(['low','balanced','high'].includes(value))return value;
 return device.coarse||device.width<760||(device.cores&&device.cores<=4)?'low':'balanced';
}
export function qualitySettings(value){return value==='low'?{pixelRatio:1,shadows:false,foliage:.6}:value==='high'?{pixelRatio:1.75,shadows:true,foliage:1}:{pixelRatio:1.25,shadows:true,foliage:.85};}
export function applyQuality(renderer,sun,world,quality,pixelRatio=1){
 const q=qualitySettings(quality);renderer.setPixelRatio(Math.min(pixelRatio,q.pixelRatio));renderer.shadowMap.enabled=q.shadows;renderer.shadowMap.autoUpdate=false;
 renderer.shadowMap.needsUpdate=q.shadows;sun.shadow.needsUpdate=q.shadows;
 for(const group of world?.foliage||[]){const n=Math.max(1,Math.round(group.count*q.foliage));group.trunks.count=n;group.crowns.count=n*3;}
 return q;
}

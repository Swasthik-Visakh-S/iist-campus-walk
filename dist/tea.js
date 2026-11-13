// Entirely fictional purchases: no payments, accounts or external requests.
export function createTeaCounter(cafe){
 let balance=50,cups=0,cooldown=0;
 const point=cafe.at(3.6,3.35);
 function nearby(player){return Math.hypot(player.x-point[0],player.z-point[1])<2.3&&Math.abs(player.y-cafe.level)<2;}
 function buy(player,now){
  if(!nearby(player))return {ok:false,message:'Walk up to the tea counter.'};
  if(now<cooldown)return {ok:false,message:'Enjoy your tea first.'};
  if(balance<5)return {ok:false,message:'No campus coins left. Reset your walk to start again.'};
  balance-=5;cups++;cooldown=now+4000;return {ok:true,message:`Tea served! ${balance} campus coins left.`,cups};
 }
 return {point,nearby,buy,get balance(){return balance},get cups(){return cups},reset(){balance=50;cups=0;cooldown=0;}};
}

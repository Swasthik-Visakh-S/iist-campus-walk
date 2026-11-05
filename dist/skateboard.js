import * as T from './vendor/three.module.js';

export function createSkateboard() {
  const root = new T.Group(), wheels=[];
  const paint=new T.MeshStandardMaterial({color:'#3c8683',roughness:.7});
  const grip=new T.MeshStandardMaterial({color:'#31383a'});
  const silver=new T.MeshStandardMaterial({color:'#9da9aa',metalness:.45});
  const rubber=new T.MeshStandardMaterial({color:'#f2c677'});
  function part(geometry, material, x,y,z) {
    const piece=new T.Mesh(geometry,material);piece.position.set(x,y,z);root.add(piece);return piece;
  }
  part(new T.BoxGeometry(.46,.07,.95),paint,0,.16,0);
  part(new T.BoxGeometry(.43,.018,.92),grip,0,.2,0);
  for(const end of [-1,1]){
    const tip=part(new T.SphereGeometry(1,10,6),paint,0,.18,end*.46);
    tip.scale.set(.23,.046,.23);tip.rotation.x=-end*.17;
    part(new T.BoxGeometry(.47,.07,.10),silver,0,.096,end*.37);
    for(const side of [-1,1]){
      const wheel=part(new T.CylinderGeometry(.085,.085,.09,10),rubber,side*.235,.087,end*.37);
      wheel.rotation.z=Math.PI/2;wheels.push(wheel);
    }
  }
  const glow=part(new T.ConeGeometry(.10,.45,8),new T.MeshBasicMaterial({color:'#8be2f1'}),0,.15,-.78);
  glow.rotation.x=-Math.PI/2;glow.visible=false;root.visible=false;
  return {root,update(distance,boost){glow.visible=boost&&distance>.001;for(const wheel of wheels)wheel.rotateY(distance/.085);}};
}

import * as T from './vendor/three.module.js';
// Original articulated chibi model; faces local +Z, feet at Y=0.
export function createCharacter() {
  const root=new T.Group(),rig=new T.Group();root.name='Chibi campus explorer';root.add(rig);
  const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.8});
  const skin=mat('#d89e79'),hair=mat('#34242b'),cloth=mat('#b4a3dd'),cream=mat('#fff2dc'),shoe=mat('#615974'),eye=mat('#302830'),blush=mat('#db8586');
  const sphere=new T.SphereGeometry(1,24,16);
  function oval(parent,m,p,s){const o=new T.Mesh(sphere,m);o.position.set(...p);o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function part(parent,g,m,p){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;parent.add(o);return o;}
  const body=new T.Group();rig.add(body);
  oval(body,cloth,[0,.92,0],[.28,.36,.19]);
  part(body,new T.CylinderGeometry(.22,.39,.38,24),cloth,[0,.69,0]);
  part(body,new T.CylinderGeometry(.38,.4,.045,24),cream,[0,.50,0]);
  oval(body,cream,[0,1.13,.13],[.22,.06,.10]);
  // Small backpack and straps read clearly from the following camera.
  oval(body,shoe,[0,.94,-.23],[.23,.26,.11]);
  for(const side of [-1,1])oval(body,cream,[side*.19,1.01,.17],[.028,.20,.025]);
  const head=new T.Group();head.position.y=1.43;body.add(head);
  oval(head,hair,[0,.04,-.05],[.46,.45,.40]);
  oval(head,skin,[0,-.01,.08],[.405,.38,.35]);
  oval(head,hair,[0,.24,.09],[.43,.21,.34]);
  for(const side of [-1,1]){
    const fringe=oval(head,hair,[side*.21,.14,.31],[.20,.17,.095]);fringe.rotation.z=side*.28;
    oval(head,skin,[side*.40,-.025,.08],[.07,.105,.075]);
    oval(head,blush,[side*.25,-.12,.357],[.075,.035,.012]);
  }
  const eyes=[];
  for(const side of [-1,1]){
    eyes.push(oval(head,eye,[side*.145,-.025,.399],[.058,.085,.025]));
    oval(head,cream,[side*.145-.015,.003,.422],[.017,.024,.008]);
  }
  oval(head,skin,[0,-.095,.429],[.032,.032,.024]);
  const smile=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.065,-.178,.397),new T.Vector3(0,-.195,.407),new T.Vector3(.065,-.178,.397)]),12,.009,5,false);part(head,smile,eye,[0,0,0]);
  const tails=[];
  for(const side of [-1,1]){
    const tail=new T.Group();tail.position.set(side*.40,.12,-.08);head.add(tail);tails.push(tail);
    oval(tail,hair,[side*.06,-.13,-.025],[.18,.30,.17]);
    oval(tail,cloth,[0,0,0],[.13,.075,.14]);
    oval(tail,cloth,[side*.07,.03,.05],[.09,.07,.045]);
  }
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.29,1.10,0);body.add(arm);arms.push(arm);
    oval(arm,cloth,[side*.025,-.13,0],[.10,.20,.10]);oval(arm,skin,[side*.035,-.32,.015],[.083,.10,.085]);
    const leg=new T.Group();leg.position.set(side*.145,.52,0);rig.add(leg);legs.push(leg);
    oval(leg,skin,[0,-.19,0],[.09,.21,.09]);oval(leg,cream,[0,-.33,0],[.095,.10,.095]);oval(leg,shoe,[0,-.44,.055],[.12,.085,.19]);
  }
  let phase=0,blend=0;
  function animate(dt,travel,speed,grounded,time){
    blend=T.MathUtils.damp(blend,grounded&&speed>.05?1:0,12,dt);
    phase+=travel*4.8;
    const swing=Math.sin(phase)*.66*blend;
    legs[0].rotation.x=grounded?swing:-.42;legs[1].rotation.x=grounded?-swing:.25;
    arms[0].rotation.x=grounded?-swing*.8:-.65;arms[1].rotation.x=grounded?swing*.8:-.65;
    arms[0].rotation.z=grounded?.08:.35;arms[1].rotation.z=grounded?-.08:-.35;
    body.position.y=grounded?Math.abs(Math.sin(phase))*.035*blend:0;
    body.rotation.z=Math.sin(phase)*.025*blend;
    tails.forEach((tail,i)=>tail.rotation.x=Math.sin(phase+i*.5)*.13*blend);
    const blink=time%4.1<.13;
    eyes.forEach(e=>e.scale.y=blink?.012:.085);
    head.rotation.y=grounded?Math.sin(time*.7)*.045*(1-blend):0;
  }
  return {root,animate,legs,arms,eyes};
}

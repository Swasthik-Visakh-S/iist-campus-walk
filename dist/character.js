import {createSkateboard} from './skateboard.js?v=10';
import * as T from './vendor/three.module.js';
// Original articulated chibi model; faces local +Z, feet at Y=0.
export function createCharacter() {
  const root=new T.Group(),rig=new T.Group();root.name='Chibi student';root.userData.dynamic=true;root.add(rig);
  const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.8});
  const skin=mat('#d89e79'),hair=mat('#34242b'),cloth=mat('#314965'),shirt=mat('#c1dfeb'),ribbon=mat('#dd9eac'),cream=mat('#fff2dc'),shoe=mat('#615974'),eye=mat('#302830'),blush=mat('#db8586');
  const sphere=new T.SphereGeometry(1,18,12);
  function oval(parent,m,p,s){const o=new T.Mesh(sphere,m);o.position.set(...p);o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function part(parent,g,m,p){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;parent.add(o);return o;}
  const body=new T.Group();rig.add(body);
  // In campus metres the other students have a .48 m torso and stand about 1.85 m tall.
  // Fit the uniform to the same frame while keeping the original accessories.
  const uniform=new T.Group();uniform.position.y=.09;uniform.scale.set(.86,1,.86);body.add(uniform);
  oval(uniform,shirt,[0,.92,0],[.28,.36,.19]);
  part(uniform,new T.CylinderGeometry(.22,.39,.38,12),cloth,[0,.69,0]).scale.z=.78;
  part(uniform,new T.CylinderGeometry(.38,.4,.045,24),cream,[0,.50,0]).scale.z=.78;
  oval(uniform,cream,[0,1.13,.13],[.22,.06,.10]);
  // Student clothes: collared blue shirt, navy pleated skirt and ID lanyard.
  for(const side of [-1,1]){const collar=oval(uniform,cream,[side*.09,1.12,.19],[.08,.09,.025]);collar.rotation.z=side*.4;}
  oval(uniform,ribbon,[0,1.08,.215],[.045,.065,.025]);
  for(const side of [-1,1]){const lace=part(uniform,new T.BoxGeometry(.018,.30,.018),cloth,[side*.06,.98,.198]);lace.rotation.z=side*.23;}
  part(uniform,new T.BoxGeometry(.12,.15,.025),cream,[0,.80,.223]);part(uniform,new T.BoxGeometry(.075,.035,.027),shirt,[0,.835,.228]);

  // Small backpack and straps read clearly from the following camera.
  oval(uniform,shoe,[0,.94,-.23],[.23,.26,.11]);
  for(const side of [-1,1])oval(uniform,cream,[side*.19,1.01,.17],[.028,.20,.025]);
  const head=new T.Group();head.position.y=1.55;head.scale.set(.60,.60,.60);body.add(head);
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
    const tail=new T.Group();tail.position.set(side*.38,.12,-.08);head.add(tail);tails.push(tail);
    oval(tail,hair,[side*.045,-.13,-.025],[.145,.30,.17]);
    oval(tail,ribbon,[0,0,0],[.13,.075,.14]);
    oval(tail,ribbon,[side*.07,.03,.05],[.09,.07,.045]);
  }
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.248,1.21,0);body.add(arm);arms.push(arm);
    oval(arm,shirt,[side*.017,-.11,0],[.081,.17,.082]);oval(arm,skin,[side*.020,-.295,.016],[.064,.123,.067]);
    const leg=new T.Group();leg.position.set(side*.115,.70,0);rig.add(leg);legs.push(leg);
    oval(leg,skin,[0,-.27,0],[.091,.29,.091]);oval(leg,cream,[0,-.48,0],[.093,.12,.092]);oval(leg,shoe,[0,-.615,.045],[.109,.085,.152]);
  }
  const board=createSkateboard();root.add(board.root);
  let phase=0,blend=0;
  function animate(dt,travel,speed,grounded,time,skating=false,boost=false){
    board.root.visible=skating;
    rig.position.y=skating?.212:0;
    rig.rotation.y=skating?.85:0;
    board.update(skating?travel:0,boost);
    if(skating){
      legs[0].rotation.x=-.12;legs[1].rotation.x=.15;
      arms[0].rotation.x=arms[1].rotation.x=-.13;
      arms[0].rotation.z=-.60;arms[1].rotation.z=.60;
      body.rotation.z=boost&&speed>1?.10:.03;body.position.y=-.015;
      head.rotation.y=-.65;eyes.forEach(e=>e.scale.y=time%4.1<.13?.012:.085);
      return;
    }
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
  return {root,animate,legs,arms,eyes,board:board.root};
}

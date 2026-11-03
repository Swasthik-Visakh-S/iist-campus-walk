import * as T from './vendor/three.module.js';
// Merge compatible static meshes. Keep terrain/roads named for regression tests,
// and retain instanced foliage so it can be culled and thinned independently.
export function mergeStaticMeshes(root){
 root.updateMatrixWorld(true);const groups=new Map(),skip=new Set(['Continuous asphalt','Pedestrian surfaces','Road edge and centre paint','Road kerbs']);
 root.traverse(o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamic)return;if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.map||skip.has(o.name)||o.geometry.attributes.color)return;
  const center=new T.Vector3();o.getWorldPosition(center);const key=[o.material.uuid,o.castShadow,o.receiveShadow,Math.floor(center.x/100),Math.floor(center.z/100)].join(':');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
 });
 let saved=0;
 for(const list of groups.values()){
  if(list.length<2)continue;const positions=[],normals=[];
  for(const o of list){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);positions.push(g.attributes.position.array);normals.push(g.attributes.normal.array);g.dispose();}
  const join=arrays=>{const out=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){out.set(a,offset);offset+=a.length;}return out;};
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(join(positions),3));g.setAttribute('normal',new T.BufferAttribute(join(normals),3));g.computeBoundingSphere();
  const merged=new T.Mesh(g,list[0].material);merged.castShadow=list[0].castShadow;merged.receiveShadow=list[0].receiveShadow;merged.name='Static campus details';root.add(merged);
  for(const o of list)o.removeFromParent();saved+=list.length-1;
 }
 return saved;
}
export function foliageChunks(scene,trees,groundAt,materials){
 const cells=new Map(),groups=[],dummy=new T.Object3D();let seed=174;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trunkGeo=new T.CylinderGeometry(.3,.65,1,5),crownGeo=new T.IcosahedronGeometry(1,1);
 for(const t of trees){const k=Math.floor(t[0]/80)+','+Math.floor(t[1]/80);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(t);}
 for(const list of cells.values()){
  const trunks=new T.InstancedMesh(trunkGeo,materials.trunk,list.length),crowns=new T.InstancedMesh(crownGeo,materials.leaf,list.length*3);
  list.forEach(([x,z,h],i)=>{const y=groundAt(x,z);dummy.position.set(x,y+h*.4,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,h*.8,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   for(let j=0;j<3;j++){dummy.position.set(x+(rand()-.5)*h*.4,y+h*(.7+rand()*.24),z+(rand()-.5)*h*.4);dummy.scale.set(h*(.25+rand()*.12),h*(.23+rand()*.1),h*(.26+rand()*.12));dummy.updateMatrix();crowns.setMatrixAt(i*3+j,dummy.matrix);crowns.setColorAt(i*3+j,new T.Color().setHSL(.27+rand()*.08,.22+rand()*.2,.16+rand()*.13));}
  });crowns.castShadow=true;trunks.computeBoundingSphere();crowns.computeBoundingSphere();scene.add(trunks,crowns);groups.push({trunks,crowns,count:list.length});
 }
 return groups;
}

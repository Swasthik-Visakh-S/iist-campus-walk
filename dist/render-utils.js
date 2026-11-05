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
 const leaf=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 // Crown proportions and hues distinguish mango, rain tree and upright jackfruit.
 const species=[{w:.31,h:.30,spread:.28,tint:'#437442'},{w:.39,h:.17,spread:.48,tint:'#507f4e'},{w:.20,h:.36,spread:.20,tint:'#547d39'}];
 const cells=new Map(),groups=[],dummy=new T.Object3D();let seed=174;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trunkGeo=new T.CylinderGeometry(.3,.65,1,5),crownGeo=new T.IcosahedronGeometry(1,1);
 for(const t of trees){const k=Math.floor(t[0]/80)+','+Math.floor(t[1]/80);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(t);}
 for(const list of cells.values()){
  const trunks=new T.InstancedMesh(trunkGeo,materials.trunk,list.length),crowns=new T.InstancedMesh(crownGeo,leaf,list.length*3);
  list.forEach(([x,z,h],i)=>{const y=groundAt(x,z);dummy.position.set(x,y+h*.4,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,h*.8,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   const tree=species[Math.floor(rand()*species.length)];
   for(let j=0;j<3;j++){
     const angle=i*2.3+j*Math.PI*2/3;
     dummy.position.set(x+Math.cos(angle)*h*tree.spread*.48,y+h*(.72+rand()*.13),z+Math.sin(angle)*h*tree.spread*.48);
     dummy.rotation.y=angle;dummy.scale.set(h*tree.w,h*tree.h,h*tree.w*(.88+rand()*.16));dummy.updateMatrix();
     crowns.setMatrixAt(i*3+j,dummy.matrix);crowns.setColorAt(i*3+j,new T.Color(tree.tint).multiplyScalar(.83+rand()*.28));
   }
  });crowns.castShadow=true;trunks.computeBoundingSphere();crowns.computeBoundingSphere();scene.add(trunks,crowns);groups.push({trunks,crowns,count:list.length});
 }
 return groups;
}

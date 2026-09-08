import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// The town draws ten thousand little meshes. Most of them never move relative
// to their joint: bricks in a wall, plates on a torso. optimize() watches a
// model animate for a few simulated seconds, finds every node whose local
// matrix actually changes, and then bakes all meshes that stay rigid under the
// same moving ancestor into one mesh per material. Materials are reused, so
// emissive flicker written by tick() keeps working on the merged surfaces.
export function optimize(root,animate,skip){
 const snap=new Map();
 root.updateMatrixWorld(true);
 root.traverse(o=>snap.set(o,o.matrix.clone()));
 const dyn=new Set([root]);
 for(let i=1;i<=24;i++){
  animate(i*.21);
  root.updateMatrixWorld(true);// recompose local matrices; the mixer only writes position/quaternion
  root.traverse(o=>{if(dyn.has(o))return;const sn=snap.get(o);if(!sn||!sn.equals(o.matrix))dyn.add(o);});
 }
 root.updateMatrixWorld(true);
 // Models here often clone a material per brick just to nudge its colour, so
 // grouping by material identity merges nothing. Materials that differ only in
 // colour share a bucket instead: the colour is baked into vertex colours and
 // one white-tinted material draws the whole run. Emissive materials keep
 // their identity — tick() and tinting write to those at runtime.
 function matKey(m){
  if(!m.color||m.isShaderMaterial)return m.uuid;// exotic materials merge only with themselves
  if(m.emissive&&m.emissive.getHex())return m.uuid;
  return [m.type,m.map?.uuid,m.bumpMap?.uuid,m.roughnessMap?.uuid,m.normalMap?.uuid,
   m.transparent,m.opacity,m.side,m.metalness?.toFixed(2),m.roughness?.toFixed(2)].join('/');
 }
 const groups=new Map(),removable=[];
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||dyn.has(o))return;
  if(skip&&skip(o))return;// e.g. flames animated by rewriting vertices, invisible to matrix diffing
  if(o.geometry.morphAttributes&&Object.keys(o.geometry.morphAttributes).length)return;
  let anc=o.parent;while(anc&&anc!==root&&!dyn.has(anc))anc=anc.parent;if(!anc)anc=root;
  const sig=Object.keys(o.geometry.attributes).sort().join(',')+(o.geometry.index?'+i':'');
  const key=anc.uuid+'|'+matKey(o.material)+'|'+sig+'|'+o.castShadow;
  if(!groups.has(key))groups.set(key,{anc,castShadow:o.castShadow,items:[]});
  groups.get(key).items.push(o);
 });
 const inv=new T.Matrix4(),rel=new T.Matrix4();
 let before=0,after=0;
 for(const {anc,castShadow,items} of groups.values()){
  before+=items.length;
  if(items.length<2){after+=items.length;continue;}
  const tinted=items.some(o=>o.material.color&&items[0].material.color&&!o.material.color.equals(items[0].material.color));
  inv.copy(anc.matrixWorld).invert();
  const parts=items.map(o=>{
   rel.multiplyMatrices(inv,o.matrixWorld);
   const g=o.geometry.clone().applyMatrix4(rel);
   if(tinted){
    const n=g.attributes.position.count,arr=new Float32Array(n*3),c=o.material.color;
    for(let i=0;i<n;i++){arr[i*3]=c.r;arr[i*3+1]=c.g;arr[i*3+2]=c.b;}
    g.setAttribute('color',new T.BufferAttribute(arr,3));
   }
   return g;
  });
  const merged=mergeGeometries(parts,false);
  if(!merged){after+=items.length;for(const g of parts)g.dispose();continue;}
  let material=items[0].material;
  if(tinted){material=material.clone();material.color.set(0xffffff);material.vertexColors=true;}
  const mesh=new T.Mesh(merged,material);
  mesh.castShadow=castShadow;mesh.receiveShadow=castShadow;
  anc.add(mesh);after++;
  for(const o of items){o.removeFromParent();o.geometry.dispose();removable.push(o);}
  for(const g of parts)g.dispose();
 }
 return {before,after,dynamic:dyn.size};
}

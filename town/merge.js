import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// The town draws ten thousand little meshes. Most of them never move relative
// to their joint: bricks in a wall, plates on a torso. optimize() watches a
// model animate for a few simulated seconds, finds every node whose local
// matrix actually changes, and then bakes all meshes that stay rigid under the
// same moving ancestor into one mesh per material. Materials are reused, so
// emissive flicker written by tick() keeps working on the merged surfaces.
export function optimize(root,animate){
 const snap=new Map();
 root.updateMatrixWorld(true);
 root.traverse(o=>snap.set(o,o.matrix.clone()));
 const dyn=new Set([root]);
 for(let i=1;i<=50;i++){
  animate(i*.1);
  root.traverse(o=>{if(!dyn.has(o)&&!snap.get(o).equals(o.matrix))dyn.add(o);});
 }
 root.updateMatrixWorld(true);
 const groups=new Map(),removable=[];
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||dyn.has(o))return;
  if(o.geometry.morphAttributes&&Object.keys(o.geometry.morphAttributes).length)return;
  let anc=o.parent;while(anc&&anc!==root&&!dyn.has(anc))anc=anc.parent;if(!anc)anc=root;
  const sig=Object.keys(o.geometry.attributes).sort().join(',')+(o.geometry.index?'+i':'');
  const key=anc.uuid+'|'+o.material.uuid+'|'+sig+'|'+o.castShadow;
  if(!groups.has(key))groups.set(key,{anc,material:o.material,castShadow:o.castShadow,items:[]});
  groups.get(key).items.push(o);
 });
 const inv=new T.Matrix4(),rel=new T.Matrix4();
 let before=0,after=0;
 for(const {anc,material,castShadow,items} of groups.values()){
  before+=items.length;
  if(items.length<2){after+=items.length;continue;}
  inv.copy(anc.matrixWorld).invert();
  const parts=items.map(o=>{
   rel.multiplyMatrices(inv,o.matrixWorld);
   return o.geometry.clone().applyMatrix4(rel);
  });
  const merged=mergeGeometries(parts,false);
  if(!merged){after+=items.length;continue;}
  const mesh=new T.Mesh(merged,material);
  mesh.castShadow=castShadow;mesh.receiveShadow=castShadow;
  anc.add(mesh);after++;
  for(const o of items){o.removeFromParent();o.geometry.dispose();removable.push(o);}
  for(const g of parts)g.dispose();
 }
 return {before,after,dynamic:dyn.size};
}

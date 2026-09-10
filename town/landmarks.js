import * as T from 'three';
import {buildAssembly} from '../assembly/model.js';
import {buildVault} from '../vault/model.js';
import {buildDepot} from '../depot/model.js';
import {buildArchive} from '../archive/model.js';
import {buildArcade} from '../arcade/model.js';

// Town landmarks are the authored buildings themselves, not substitute
// primitives. Their placement is the only thing the overview changes.
export function placeLandmark(model,{name,x,z,width,height,angle=0,keepScale=false}){
 const initial=new T.Box3().setFromObject(model.root),size=initial.getSize(new T.Vector3());
 const scale=keepScale?1:height?height/size.y:width/Math.max(size.x,size.z);
 model.root.scale.setScalar(scale);model.root.rotation.y=angle;
 model.root.position.set(x,-initial.min.y*scale+.1,z);model.root.name=name;
 model.root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model.root);
 // The service planner consumes a local footprint and transforms it with the
 // root matrix. Preserve an authored footprint when one exists (the arcade),
 // otherwise derive it from the real model's unscaled bounds.
 model.root.userData={...model.root.userData,fullModel:true,footprint:model.root.userData.footprint||{width:size.x,depth:size.z}};
 const entry=new T.Vector3(0,initial.min.y,initial.max.z).applyMatrix4(model.root.matrixWorld);
 model.root.userData.entry={position:entry.toArray(),width:Math.min(12,size.x*scale*.45),angle};
 model.root.userData.placement={scale,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
 model.maxHeight=model.maxHeight??initial.max.y;
 return model;
}

export const LOTS=[
 {x:-52,z:-64,r:22},{x:52,z:-64,r:23},{x:72,z:0,r:17},
 {x:0,z:0,r:22},{x:-73,z:16,r:18},
];
export const createAssembly=()=>placeLandmark(buildAssembly(),{name:'DRepAssembly',x:-52,z:-64,width:38,angle:.48});
export const createVault=()=>placeLandmark(buildVault(),{name:'TreasuryVault',x:52,z:-64,width:40,angle:-.48});
export const createDepot=()=>placeLandmark(buildDepot(),{name:'CourierDepot',x:72,z:0,width:29,angle:-Math.PI/2});
export const createArchive=()=>placeLandmark(buildArchive(),{name:'ConstitutionalArchive',x:0,z:0,height:98});
export const createArcade=()=>placeLandmark(buildArcade(),{name:'ClockworkArcade',x:-73,z:16,angle:Math.PI/2,keepScale:true});

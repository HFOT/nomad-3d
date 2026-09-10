import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import validator from 'gltf-validator';
import {buildArcade} from '../arcade/model.js';
import {planNetwork} from '../residences/network.js';
await import('./canvas-png.mjs');
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result='data:application/octet-stream;base64,'+Buffer.from(v).toString('base64');this.onloadend?.();});}};
const a=buildArcade();assert.equal(a.machines.length,3);assert.equal(a.ports.length,2);assert.ok(a.motions.length>=30);a.tick(1);const first=a.root.getObjectByName('MainFlywheel').quaternion.clone();a.tick(2);assert.ok(!first.equals(a.root.getObjectByName('MainFlywheel').quaternion));a.setCutaway(true);assert.equal(a.layers.front.visible,false);a.setCutaway(false);
const output=new URL('../world/arcade/',import.meta.url);await mkdir(output,{recursive:true});const files=[];
let networkCases=0;for(const x of [0,40])for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){a.root.position.set(x,0,0);a.root.rotation.y=angle;const plan=planNetwork([a],[0,7.8,-45]);assert.equal(plan.connected,2);assert.ok(plan.height>a.maxHeight);networkCases++;}a.root.position.set(0,0,0);a.root.rotation.y=0;
for(const [id,object] of [['building',a.root],...a.machines.map((m,i)=>[`machine-${i+1}`,m])]){
 a.tick(0);const pos=object.position.clone();if(object!==a.root)object.position.set(0,0,0);const names=new Set();object.traverse(o=>names.add(o.name));const clips=a.root.animations.map(c=>new T.AnimationClip(c.name,c.duration,c.tracks.filter(t=>names.has(t.name.slice(0,t.name.lastIndexOf('.'))))));
 const glb=await new GLTFExporter().parseAsync(object,{binary:true,animations:clips,onlyVisible:false});object.position.copy(pos);const result=await validator.validateBytes(new Uint8Array(glb));assert.equal(result.issues.numErrors,0,JSON.stringify(result.issues));const name=`CORN-arcade-${id}.glb`;await writeFile(new URL(name,output),Buffer.from(glb));files.push({name,bytes:glb.byteLength,errors:result.issues.numErrors,warnings:result.issues.numWarnings,issues:result.issues.messages.slice(0,8)});
}
await writeFile(new URL('manifest.json',output),JSON.stringify({author:'CORN',units:'metres',files,movingParts:a.motions.length,networkCases,ports:a.ports.map(p=>({name:p.name,position:p.position.toArray(),...p.userData})),scope:'Standalone visual reconstruction; not yet installed in town; rear architecture is inferred; animation is a kinematic demonstration, not physical simulation.'},null,2));console.log(JSON.stringify(files.map(({issues,...f})=>f),null,2));

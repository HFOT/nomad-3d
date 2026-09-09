import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import validator from 'gltf-validator';
import {buildResidence} from '../residences/model.js';
import {planNetwork,buildNetwork} from '../residences/network.js';
await import('./canvas-png.mjs');

// GLTFExporter requires FileReader even for a texture-free GLB in Node.
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result='data:application/octet-stream;base64,'+Buffer.from(v).toString('base64');this.onloadend?.();});}};
const homes=[0,1,2,3].map(buildResidence);homes.forEach((h,i)=>h.root.position.x=[-20,-11,1,19][i]);const sink=[9.4,7.8,-32.7],initial=planNetwork(homes,sink,{spineZ:8});assert.equal(initial.connected,6);
let cases=0;for(let i=0;i<4;i++)for(let q=0;q<4;q++){const h=homes[i];h.root.position.z=17;h.root.rotation.y=q*Math.PI/2;const plan=planNetwork(homes,sink);assert.equal(plan.connected,6);assert.ok(plan.height>Math.max(...plan.sources.map(s=>s.position[1])));cases++;h.root.position.z=0;h.root.rotation.y=0;}
const extra=buildResidence(0);extra.root.position.set(38,0,14);assert.equal(planNetwork([...homes,extra],sink).connected,7);cases++;
const saved=homes[1].root.position.clone();homes[1].root.position.copy(homes[0].root.position);assert.throws(()=>planNetwork(homes,sink),/重なって/);homes[1].root.position.copy(saved);cases++;
const wall={min:[-2,initial.height-1,-15],max:[2,initial.height+1,-10]};const detour=planNetwork(homes,sink,{obstacles:[wall]});assert.ok(detour.nodes.every(n=>!(n.position[0]>=-2.5&&n.position[0]<=2.5&&n.position[2]>=-15.5&&n.position[2]<=-9.5)));cases++;
assert.throws(()=>planNetwork(homes,sink,{obstacles:[{min:[-100,0,-100],max:[100,50,100]}]}));cases++;
const output=new URL('../world/residence-kit/',import.meta.url);await mkdir(output,{recursive:true});const results=[];
for(const h of homes){h.root.position.set(0,0,0);h.tick(0);const glb=await new GLTFExporter().parseAsync(h.root,{binary:true,animations:h.root.animations});const validation=await validator.validateBytes(new Uint8Array(glb));assert.equal(validation.issues.numErrors,0,JSON.stringify(validation.issues));const name=`CORN-residence-${h.spec.id}.glb`;await writeFile(new URL(name,output),Buffer.from(glb));results.push({name,bytes:glb.byteLength,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings,ports:h.ports.map(p=>({name:p.name,position:p.position.toArray(),...p.userData}))});}
const network=buildNetwork(initial);const glb=await new GLTFExporter().parseAsync(network.root,{binary:true});await writeFile(new URL('CORN-aerial-network.glb',output),Buffer.from(glb));const validation=await validator.validateBytes(new Uint8Array(glb));assert.equal(validation.issues.numErrors,0);await writeFile(new URL('connections.json',output),JSON.stringify(initial,null,2));await writeFile(new URL('validation.json',output),JSON.stringify({cases,homes:results,network:{bytes:glb.byteLength,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings}},null,2));console.log(JSON.stringify({cases,homes:results.map(({ports,...r})=>r),networkErrors:validation.issues.numErrors},null,2));

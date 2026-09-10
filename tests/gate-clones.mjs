import assert from 'node:assert/strict';
import './canvas-png.mjs';
import {buildGate,cloneGate} from '../gate/model.js';
import {optimize} from '../town/merge.js';
const master=buildGate();optimize(master.root,t=>master.tick(t,.016),o=>o.userData.base);
const a=cloneGate(master),b=cloneGate(master);assert.equal(a.lights.length,3);assert.equal(b.doors.length,2);
a.setOpen(true);b.setOpen(false);a.setHealth(1);b.setHealth(3);
for(let i=0;i<80;i++){a.tick(i*.1,.1);b.tick(i*.1,.1);}
assert.ok(a.state.openness>.99);assert.ok(b.state.openness<.01);assert.equal(a.lights.filter(l=>l.intensity>0).length,1);assert.equal(b.lights.filter(l=>l.intensity>0).length,3);
const meshes=g=>{const m=[];g.root.traverse(o=>{if(o.isMesh)m.push(o);});return m;};const ma=meshes(a),mb=meshes(b);assert.equal(ma.length,mb.length);
for(let i=0;i<ma.length;i++){if(ma[i].userData.base)assert.notEqual(ma[i].geometry,mb[i].geometry);else assert.equal(ma[i].geometry,mb[i].geometry);if(ma[i].material.emissive?.getHex())assert.notEqual(ma[i].material,mb[i].material);}
console.log('Gate clones: shared static geometry, independent door controls, lights and flame geometry PASS');

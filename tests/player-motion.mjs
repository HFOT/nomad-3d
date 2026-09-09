import assert from 'node:assert/strict';
import {PlayerMotion} from '../town/player-motion.js';
const world={canMove:()=>true,ground:()=>.19};
function travel(sprint){const p={x:0,y:.19,z:0},m=new PlayerMotion(p);for(let i=0;i<120;i++)m.update(p,{moving:true,sprint,x:0,z:1},1/60,world);return p.z;}
assert.ok(travel(true)>travel(false)*1.8);
const p={x:0,y:.19,z:0},m=new PlayerMotion(p);assert.equal(m.jump(),true);assert.equal(m.jump(),false);let peak=0;
for(let i=0;i<120;i++){m.update(p,{moving:false,x:0,z:0},1/60,world);peak=Math.max(peak,p.y);}
assert.ok(peak>1.4);assert.equal(m.grounded,true);assert.equal(p.y,.19);assert.equal(m.jump(),true);
const blocked={x:0,y:.19,z:0},b=new PlayerMotion(blocked);b.update(blocked,{moving:true,sprint:true,x:1,z:0},.05,{...world,canMove:()=>false});assert.equal(blocked.x,0);
console.log('Sprint ratio, jump height, landing, double-jump prevention and collision passed');

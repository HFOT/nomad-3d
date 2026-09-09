import * as T from 'three';
import {buildMouse} from '../pip/model.js';
import * as Nomad from '../nomad/model.js';
import * as Ward from '../ward/model.js';
import * as Quorum from '../quorum/model.js';
import * as Lex from '../lex/model.js';
import * as Catalyst from '../catalyst/model.js';
import * as Treasury from '../treasury/model.js';
import * as Forge from '../forge/model.js';

// Who is driving. The seven robots share one builder shape and PIP has its own,
// so each entry hands back the same three things: a root to put on the road, the
// clips it can play, and a tick for whatever it animates by hand.
//
// Only one racer is ever built (two, counting the ghost), so having eight to
// choose from costs nothing until one is chosen.

// The figures are drawn at wildly different sizes — PIP is knee-high to NOMAD —
// so each is scaled to sit the same height on the road.
const TARGET_H=1.35;

function fit(root){
 const box=new T.Box3().setFromObject(root);
 const h=box.max.y-box.min.y;
 if(h>0.01){
  const s=TARGET_H/h;
  const holder=new T.Group();
  holder.add(root);root.scale.setScalar(s);
  // Stand it on the road rather than through it.
  root.position.y=-box.min.y*s;
  return holder;
 }
 return root;
}

function robot(mod){
 const M=mod.createMaterials(256);
 const r=mod.buildRobot(M);
 return {
  root:fit(r.root),
  clips:r.clips,
  tick(t,motion,dt){ if(r.ward&&r.ward.tick)r.ward.tick(t,dt,motion==='Idle'?'Idle':'Walk'); },
 };
}

export const RACERS=[
 {id:'pip',     name:'PIP',     note:'光の、はこび屋',   build(){
  const f=buildMouse();
  // PIP is the one figure whose shoulder thrusters answer to steering.
  return {root:fit(f.root),clips:f.clips,tick(t,motion,dt,lean){f.tick(t,motion,lean||0);}};
 }},
 {id:'nomad',   name:'NOMAD',   note:'灯りを運ぶ旅人',   build:()=>robot(Nomad)},
 {id:'ward',    name:'WARD',    note:'リレーの番人',     build:()=>robot(Ward)},
 {id:'quorum',  name:'QUORUM',  note:'委任の書記官',     build:()=>robot(Quorum)},
 {id:'lex',     name:'LEX',     note:'知識の灯守',       build:()=>robot(Lex)},
 {id:'catalyst',name:'CATALYST',note:'築く者',           build:()=>robot(Catalyst)},
 {id:'treasury',name:'TREASURY',note:'国庫の器',         build:()=>robot(Treasury)},
 {id:'forge',   name:'FORGE',   note:'まとめて、刻む者', build:()=>robot(Forge)},
];

export const racerById=id=>RACERS.find(r=>r.id===id)||RACERS[0];

// What to play, given what this figure actually has. Not every one of them can
// run, and none of them should be asked for a clip that is not there.
export function pickClip(clips,want){
 const order=want==='Dash'?['Dash','Run','Walk','Idle']
            :want==='Run' ?['Run','Walk','Idle']
            :               ['Idle','Walk'];
 for(const name of order){
  const c=clips.find(k=>k.name===name);
  if(c)return c;
 }
 return clips[0];
}

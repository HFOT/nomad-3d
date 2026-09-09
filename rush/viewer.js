import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildMouse} from '../pip/model.js';
import {buildArena,buildBlobShadow,buildSwarmer,SWARM,buildPellet,buildBarrierBlock,buildBarrierLink,buildGiantBlock,buildShock,buildLaser,tuneLaser,buildItem,ITEMS,ARENA,SPAWN_R} from './model.js';

const $=s=>document.querySelector(s);

// One run is sixty seconds. Every number below is tuned to that: the curve has
// to go from "a few" to "you cannot clear them" inside a minute.
const RUN=60;
const SPEED=9.2;             // PIP, units per second
const FIRE=.42;              // seconds between throws at level 1
const PELLET_SPEED=26,PELLET_LIFE=1.5;
const HP_MAX=3,INVULN=.75;
const ORBIT_R=2.35,ORBIT_SPEED=2.1;
const DROP_R=9;              // giant block clears this radius
const LASER_LEN=26,LASER_HALF=.9;
const TEMP={laser:3.8,gear:4.5}; // the two timed items
const DROP_KILL=.15,DROP_BARRIER=.11,DROP_LASER=.05,DROP_GIANT=.14;
const ITEM_LIFE=11,SEED_EVERY=5.5; // and one is laid out on the floor this often
const MAX_SWARM=150,MAX_ITEMS=9;  // past these the yard only looks busier, not harder

const renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
$('#stage').appendChild(renderer.domElement);

const scene=new T.Scene();
scene.background=new T.Color(0x0f1618);
scene.fog=new T.Fog(0x0f1618,44,86);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,220);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;
scene.add(new T.HemisphereLight(0xa8c6d4,0x141a16,1.1));
const key=new T.DirectionalLight(0xffe0b2,1.6);
key.position.set(-8,16,6);scene.add(key);
scene.add(buildArena());

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.5,.7,.88);
composer.addPass(bloom);composer.addPass(new OutputPass());

const pip=buildMouse();scene.add(pip.root);
// PIP is several hundred meshes; a shadow map would have drawn every one of
// them again each frame. A blob under the feet says the same thing for free.
pip.root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
const blob=buildBlobShadow();scene.add(blob);
const mixer=new T.AnimationMixer(pip.root);
let action=mixer.clipAction(pip.clips.find(c=>c.name==='Idle'));action.play();
let motion='Idle';
function setMotion(name){
 if(name===motion)return;
 const next=mixer.clipAction(pip.clips.find(c=>c.name===name));
 next.reset().play();action.crossFadeTo(next,.15,true);action=next;motion=name;
}

// Pools. Nothing on the field is allocated during a run.
function pool(build){
 const free=[],live=[];
 return {
  live,
  take(){const o=free.pop()||build();o.visible=true;scene.add(o);live.push(o);return o;},
  give(o){const i=live.indexOf(o);if(i>=0)live.splice(i,1);o.visible=false;scene.remove(o);free.push(o);},
  clear(){for(const o of live.slice())this.give(o);},
 };
}
const pellets=pool(buildPellet),shocks=pool(buildShock);
const swarmPools={};
function takeSwarm(kind){(swarmPools[kind]??=pool(()=>buildSwarmer(kind)));return swarmPools[kind].take();}
function giveSwarm(kind,obj){swarmPools[kind].give(obj);}
// Items differ by kind, so they get their own per-kind pools behind one face.
const itemPools={};
function takeItem(kind){(itemPools[kind]??=pool(()=>buildItem(kind)));return itemPools[kind].take();}
function giveItem(kind,obj){itemPools[kind].give(obj);}

const barrier=[],links=[];
for(let i=0;i<6;i++){
 const b=buildBarrierBlock();b.visible=false;scene.add(b);barrier.push(b);
 const l=buildBarrierLink();l.visible=false;scene.add(l);links.push(l);
}
const giant=buildGiantBlock();giant.visible=false;scene.add(giant);
const laser=buildLaser();laser.visible=false;scene.add(laser);

const S={phase:'ready',t:0,left:RUN,x:0,z:0,hp:HP_MAX,invuln:0,
 fan:1,shields:0,fire:FIRE,cool:0,laser:0,gear:0,
 kills:0,picked:0,drop:null,shake:0,orbit:0};
const swarm=[],shots=[],drops=[],rings=[];

// The curve. At t=0 a swarmer arrives roughly every second; by the last ten
// seconds they arrive in bunches, faster than PIP can clear them.
const progress=()=>1-S.left/RUN;
const spawnGap=()=>.95*Math.pow(.11,progress());
const swarmSpeed=()=>3.1+progress()*2.9;
const swarmPerWave=()=>1+Math.floor(progress()*4);

// Which kind arrives is a weighted draw over the kinds the run has unlocked,
// so the yard fills with rocks first and gets its variety as the minute runs.
function pickKind(){
 const p=progress(),open=Object.keys(SWARM).filter(k=>p>=SWARM[k].from);
 let total=0;for(const k of open)total+=SWARM[k].weight;
 let r=Math.random()*total;
 for(const k of open){r-=SWARM[k].weight;if(r<=0)return k;}
 return 'rock';
}
function spawnSwarm(kind,x,z){
 kind=kind||pickKind();
 const o=takeSwarm(kind);
 if(swarm.length>=MAX_SWARM)return;
 if(x===undefined){
  const a=Math.random()*Math.PI*2;
  x=S.x+Math.cos(a)*SPAWN_R;z=S.z+Math.sin(a)*SPAWN_R;
 }
 o.position.set(x,.5,z);
 o.scale.setScalar(.9+Math.random()*.28);
 swarm.push({o,kind,hp:SWARM[kind].hp,seed:Math.random()*9});
}

const ITEM_TABLE=['fan','shield','fan','shield','drop','laser','gear','fan','shield','mend'];
function dropItem(x,z,kind){
 kind=kind||ITEM_TABLE[Math.floor(Math.random()*ITEM_TABLE.length)];
 const o=takeItem(kind);o.position.set(x,.75,z);
 drops.push({kind,o,life:ITEM_LIFE});
 // Oldest off the floor first, so a long run never carries a field of them.
 while(drops.length>MAX_ITEMS){const old=drops.shift();giveItem(old.kind,old.o);}
}

function killSwarm(i,dropChance){
 const s=swarm[i];
 const x=s.o.position.x,z=s.o.position.z;
 giveSwarm(s.kind,s.o);swarm.splice(i,1);S.kills++;
 if(s.kind==='split')for(const d of [-1,1])spawnSwarm('dart',x+d*.7,z+d*.5);
 if(Math.random()<dropChance)dropItem(x,z);
}
// One thrown transaction is one point of damage; what does not go down keeps
// coming, which is the whole difference between a rock and a hulk.
function hitSwarm(i,dropChance,damage){
 const s=swarm[i];
 s.hp-=(damage||1);
 if(s.hp>0)return false;
 killSwarm(i,dropChance);return true;
}

function pickUp(kind){
 S.picked++;
 if(kind==='fan')S.fan=Math.min(9,S.fan+1);
 if(kind==='shield')S.shields=Math.min(6,S.shields+1);
 if(kind==='mend')S.hp=Math.min(HP_MAX,S.hp+1);
 if(kind==='laser')S.laser=TEMP.laser;
 if(kind==='gear')S.gear=TEMP.gear;
 if(kind==='drop')giantDrop();
 flash(ITEMS[kind].label,ITEMS[kind].note,ITEMS[kind].color);
 hud();
}
function flash(label,note,color){
 const el=$('#pickup');
 el.style.setProperty('--c','#'+color.toString(16).padStart(6,'0'));
 el.innerHTML='<b></b><span></span>';
 el.firstChild.textContent=label;el.lastChild.textContent=note;
 el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
}

function giantDrop(){
 S.drop={t:0,x:S.x,z:S.z};
 giant.position.set(S.x,26,S.z);giant.visible=true;
}
function giantLand(){
 const {x,z}=S.drop;
 for(let i=swarm.length-1;i>=0;i--){
  const s=swarm[i];
  if(Math.hypot(s.o.position.x-x,s.o.position.z-z)<DROP_R)killSwarm(i,DROP_GIANT);
 }
 const ring=shocks.take();ring.position.set(x,.06,z);ring.scale.setScalar(1);
 ring.material=ring.material.clone();ring.material.opacity=.9;
 rings.push({o:ring,t:0});
 S.shake=.9;S.drop=null;giant.visible=false;
}

function hurt(){
 if(S.invuln>0)return;
 S.hp--;S.invuln=INVULN;S.shake=Math.max(S.shake,.45);
 hud();
 if(S.hp<=0)finish(false);
}

// --- input: one verb. Touch drags anywhere; the mouse is simply followed. ---
const aim={x:0,z:0,power:0};
let dragId=null,dragX=0,dragY=0;
const ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3(),ndc=new T.Vector2();
let mouseActive=false;

renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'){mouseActive=true;return;}
 dragId=e.pointerId;dragX=e.clientX;dragY=e.clientY;aim.power=0;
 renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(e.pointerType==='mouse'){
  mouseActive=true;
  ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight*2-1));
  ray.setFromCamera(ndc,camera);
  if(ray.ray.intersectPlane(ground,hit)){
   const dx=hit.x-S.x,dz=hit.z-S.z,d=Math.hypot(dx,dz);
   // A deadzone, or PIP shivers on the spot under the cursor.
   aim.power=d<1.1?0:Math.min(1,(d-1.1)/4);
   if(d>0){aim.x=dx/d;aim.z=dz/d;}
  }
  return;
 }
 if(e.pointerId!==dragId)return;
 const dx=e.clientX-dragX,dy=e.clientY-dragY,d=Math.hypot(dx,dy);
 aim.power=Math.min(1,d/58);
 if(d>0){aim.x=dx/d;aim.z=dy/d;}
});
for(const ev of ['pointerup','pointercancel']) renderer.domElement.addEventListener(ev,e=>{
 if(e.pointerId===dragId){dragId=null;aim.power=0;}
});
addEventListener('blur',()=>{dragId=null;aim.power=0;});
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if((k==='enter'||k==='r')&&S.phase!=='run')start();
});
$('#start').onclick=start;

// --- run control ---
function chain(){
 try{return JSON.parse(localStorage.getItem('pip-rush-chain')||'[]')}catch{return[]}
}
function renderChain(){
 const c=chain().slice(-14);
 $('#chain').innerHTML=c.map(b=>'<i class="'+(b?'full':'empty')+'"></i>').join('');
 $('#minted').textContent=chain().filter(Boolean).length;
}
function pushChain(ok){
 const c=chain();c.push(ok);
 try{localStorage.setItem('pip-rush-chain',JSON.stringify(c.slice(-200)))}catch{}
 renderChain();
}

function clearField(){
 for(const s of swarm)giveSwarm(s.kind,s.o);swarm.length=0;
 for(const p of shots)pellets.give(p.o);shots.length=0;
 for(const d of drops)giveItem(d.kind,d.o);drops.length=0;
 for(const r of rings)shocks.give(r.o);rings.length=0;
 giant.visible=false;laser.visible=false;
 for(const b of barrier)b.visible=false;
 for(const l of links)l.visible=false;
}
let nextSpawn=0,nextSeed=0;
function start(){
 clearField();
 Object.assign(S,{phase:'run',left:RUN,x:0,z:0,hp:HP_MAX,invuln:0,
  fan:1,shields:0,fire:FIRE,cool:0,laser:0,gear:0,kills:0,picked:0,
  drop:null,shake:0,orbit:0});
 nextSpawn=.6;nextSeed=2.2;
 pip.root.position.set(0,0,0);
 $('#overlay').hidden=true;
 setMotion('Run');hud();
}
function finish(survived){
 S.phase='over';setMotion('Idle');
 pushChain(survived);
 $('#o-title').textContent=survived?'ブロックが刻まれた':'ギアボックス停止';
 $('#o-lead').textContent=survived
  ?'60秒を走り切った。FORGEがこのランを1ブロックとして刻む。'
  :'ヒビが入りきった。このスロットは空のブロックになる。';
 $('#o-score').innerHTML='<b></b><span></span>';
 $('#o-score').firstChild.textContent=S.kills;
 $('#o-score').lastChild.textContent='捌いた滞留 · 拾ったアイテム '+S.picked+' · 残り '+Math.max(0,Math.ceil(S.left))+'秒';
 $('#o-score').hidden=false;$('.rules').hidden=true;
 $('#start').textContent='もう一度';
 $('#overlay').hidden=false;
}

function hud(){
 $('#hp').textContent='●'.repeat(Math.max(0,S.hp))+'○'.repeat(HP_MAX-Math.max(0,S.hp));
 $('#kills').textContent=S.kills;
 $('#fan').textContent=S.fan;
 $('#shield').textContent=S.shields;
}

// --- loop ---
const clock=new T.Clock();
const tmp=new T.Vector3();
renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);
 S.t+=dt;

 if(S.phase==='run'){
  S.left-=dt;
  if(S.left<=0){S.left=0;finish(true);}
 }

 if(S.phase==='run'){
  if(S.invuln>0)S.invuln-=dt;
  if(S.laser>0)S.laser-=dt;
  if(S.gear>0)S.gear-=dt;

  // move
  const sp=SPEED*aim.power;
  S.x+=aim.x*sp*dt;S.z+=aim.z*sp*dt;
  const r=Math.hypot(S.x,S.z);
  if(r>ARENA){S.x=S.x/r*ARENA;S.z=S.z/r*ARENA;}
  pip.root.position.set(S.x,0,S.z);
  blob.position.set(S.x,.24,S.z);
  if(aim.power>.05)pip.root.rotation.y=Math.atan2(aim.x,aim.z);
  setMotion(aim.power>.6?'Dash':aim.power>.05?'Run':'Idle');

  // spawn
  nextSpawn-=dt;
  if(nextSpawn<=0){nextSpawn=spawnGap();for(let i=0;i<swarmPerWave();i++)spawnSwarm();}
  nextSeed-=dt;
  if(nextSeed<=0){
   nextSeed=SEED_EVERY;
   const a=Math.random()*Math.PI*2,r=7+Math.random()*7;
   const x=S.x+Math.cos(a)*r,z=S.z+Math.sin(a)*r,d=Math.hypot(x,z);
   dropItem(d>ARENA?x/d*ARENA:x,d>ARENA?z/d*ARENA:z);
  }

  // swarm walks straight at PIP; they do not avoid each other, the press is
  // the point
  const speed=swarmSpeed();
  for(let i=swarm.length-1;i>=0;i--){
   const s=swarm[i],p=s.o.position;
   // n only guards the divide; d is the real distance, so standing exactly on
   // PIP still counts as a touch.
   const dx=S.x-p.x,dz=S.z-p.z,d=Math.hypot(dx,dz),n=d||1;
   const v=speed*SWARM[s.kind].speed;
   p.x+=dx/n*v*dt;p.z+=dz/n*v*dt;
   p.y=.5+Math.sin(S.t*6+s.seed)*.09;
   s.o.rotation.y+=dt*1.6;s.o.rotation.x+=dt*.9;
   if(d<.5+SWARM[s.kind].size){hurt();killSwarm(i,0);continue;}
  }

  // throw: always at the nearest, fanned out when multi is stacked
  S.cool-=dt;
  if(S.cool<=0&&swarm.length){
   S.cool=(S.gear>0?FIRE*.5:FIRE);
   let best=null,bd=1e9;
   for(const s of swarm){
    const d=Math.hypot(s.o.position.x-S.x,s.o.position.z-S.z);
    if(d<bd){bd=d;best=s;}
   }
   const base=Math.atan2(best.o.position.x-S.x,best.o.position.z-S.z);
   const spread=.20;
   for(let i=0;i<S.fan;i++){
    const a=base+(i-(S.fan-1)/2)*spread;
    const o=pellets.take();o.position.set(S.x,.85,S.z);
    shots.push({o,vx:Math.sin(a)*PELLET_SPEED,vz:Math.cos(a)*PELLET_SPEED,life:PELLET_LIFE});
   }
   pip.root.rotation.y=base;
  }
  for(let i=shots.length-1;i>=0;i--){
   const p=shots[i];
   p.o.position.x+=p.vx*dt;p.o.position.z+=p.vz*dt;
   p.o.rotation.x+=dt*9;p.o.rotation.y+=dt*7;
   p.life-=dt;
   let done=p.life<=0;
   if(!done)for(let j=swarm.length-1;j>=0;j--){
    const s=swarm[j].o.position;
    if(Math.hypot(s.x-p.o.position.x,s.z-p.o.position.z)<.3+SWARM[swarm[j].kind].size){hitSwarm(j,DROP_KILL,1);done=true;break;}
   }
   if(done){pellets.give(p.o);shots.splice(i,1);}
  }

  // barrier: blocks on a ring, joined into a chain
  S.orbit+=dt*ORBIT_SPEED;
  for(let i=0;i<barrier.length;i++){
   const on=i<S.shields;barrier[i].visible=on;links[i].visible=on&&S.shields>1;
   if(!on)continue;
   const a=S.orbit+i*Math.PI*2/S.shields;
   barrier[i].position.set(S.x+Math.cos(a)*ORBIT_R,.85,S.z+Math.sin(a)*ORBIT_R);
   barrier[i].rotation.y=a;
   if(S.shields>1){
    const b=S.orbit+((i+1)%S.shields)*Math.PI*2/S.shields;
    const x2=S.x+Math.cos(b)*ORBIT_R,z2=S.z+Math.sin(b)*ORBIT_R;
    const l=links[i],mx=(barrier[i].position.x+x2)/2,mz=(barrier[i].position.z+z2)/2;
    l.position.set(mx,.85,mz);
    l.scale.x=Math.hypot(x2-barrier[i].position.x,z2-barrier[i].position.z);
    l.rotation.y=Math.atan2(x2-barrier[i].position.x,z2-barrier[i].position.z)+Math.PI/2;
   }
   for(let j=swarm.length-1;j>=0;j--){
    const s=swarm[j].o.position;
    if(Math.hypot(s.x-barrier[i].position.x,s.z-barrier[i].position.z)<.35+SWARM[swarm[j].kind].size)hitSwarm(j,DROP_BARRIER,2);
   }
  }

  // laser: a line held on the nearest, burning whatever stands in it
  laser.visible=S.laser>0&&swarm.length>0;
  if(laser.visible){
   let best=null,bd=1e9;
   for(const s of swarm){
    const d=Math.hypot(s.o.position.x-S.x,s.o.position.z-S.z);
    if(d<bd){bd=d;best=s;}
   }
   const a=Math.atan2(best.o.position.x-S.x,best.o.position.z-S.z);
   const dx=Math.sin(a),dz=Math.cos(a);
   // The group runs along its own +x, so the heading is a quarter turn back.
   laser.position.set(S.x,.9,S.z);
   laser.rotation.y=a-Math.PI/2;
   tuneLaser(laser,LASER_LEN,S.t);
   for(let j=swarm.length-1;j>=0;j--){
    const s=swarm[j].o.position;
    const ox=s.x-S.x,oz=s.z-S.z;
    const along=ox*dx+oz*dz;
    if(along<0||along>LASER_LEN)continue;
    if(Math.abs(ox*dz-oz*dx)<LASER_HALF)hitSwarm(j,DROP_LASER,1);
   }
  }

  // the giant block: a shadow, then the landing
  if(S.drop){
   S.drop.t+=dt;
   const f=Math.min(1,S.drop.t/.55);
   giant.position.y=26-f*f*23.3;
   giant.rotation.y=S.drop.t*1.4;
   if(f===1)giantLand();
  }
  for(let i=rings.length-1;i>=0;i--){
   const r=rings[i];r.t+=dt;
   const f=r.t/.5;
   r.o.scale.setScalar(DROP_R*Math.min(1,f));
   r.o.material.opacity=.9*(1-Math.min(1,f));
   if(f>=1){shocks.give(r.o);rings.splice(i,1);}
  }

  // items lying on the floor, taken by running over them
  for(let i=drops.length-1;i>=0;i--){
   const d=drops[i];
   d.life-=dt;d.o.rotation.y+=dt*2.2;
   d.o.position.y=.75+Math.sin(S.t*3.4)*.12;
   if(Math.hypot(d.o.position.x-S.x,d.o.position.z-S.z)<1.15){
    pickUp(d.kind);giveItem(d.kind,d.o);drops.splice(i,1);continue;
   }
   if(d.life<=0){giveItem(d.kind,d.o);drops.splice(i,1);}
  }

  // PIP shows the damage: the porcelain flashes while it is still ringing
  const lit=S.invuln>0&&Math.sin(S.t*40)>0;
  pip.root.visible=!lit;

  $('#bar').style.transform='scaleX('+(1-S.left/RUN)+')';
  $('#time').textContent=Math.ceil(S.left);
  $('#kills').textContent=S.kills;
 }

 mixer.update(dt);
 pip.tick(S.t,motion,0);

 if(S.shake>0)S.shake=Math.max(0,S.shake-dt*1.8);
 const jolt=S.shake*S.shake*1.4;
 tmp.set(S.x+(Math.random()-.5)*jolt,20+(Math.random()-.5)*jolt,S.z-12);
 camera.position.lerp(tmp,Math.min(1,dt*7));
 camera.lookAt(S.x,0,S.z+1.5);

 composer.render();
});

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 bloom.setSize(innerWidth,innerHeight);
});

camera.position.set(0,20,-12);camera.lookAt(0,0,1.5);
renderChain();hud();
$('#loading').classList.add('done');
window.pipRush={S,swarm,shots,drops,barrier,scene,camera,start,pickUp,spawnSwarm,dropItem};

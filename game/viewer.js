import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildMouse} from '../pip/model.js';
import {buildRoad,buildLampRow,buildMarker,buildObstacle,buildPickup,buildGate,buildDropped,LIMIT,SPAWN_Z} from './model.js';

const $=s=>document.querySelector(s);

// The rules of the run.
const BASE=15,PER_SLOT=1.15,DASH_MUL=1.7,STUMBLE_MUL=.5;
// A slot is measured in distance, not seconds: running faster brings the gate
// sooner, which is what makes the dash a decision rather than a free bonus.
const GATE_STEP=250;
const ROW=11,PICKUP=37,LAMP=13,MARKER=6.5;
const DASH_HEAT=1/2.1,COOL=.34; // full heat after ~2.1s of dash, ~3s to clear
// A hop of about 1.2m over ~0.7s: enough to clear a crate, never a relay pylon.
const JUMP=7,GRAVITY=20;
const LIVES=3;

const renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
$('#stage').appendChild(renderer.domElement);

const scene=new T.Scene();
scene.background=new T.Color(0x111a1d);
scene.fog=new T.Fog(0x111a1d,34,112);
const camera=new T.PerspectiveCamera(46,innerWidth/innerHeight,.1,320);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;
scene.add(new T.HemisphereLight(0xa8c6d4,0x141a16,1.15));
const key=new T.DirectionalLight(0xffe0b2,1.7);
key.position.set(-5,9,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
const sc=key.shadow.camera;sc.left=-9;sc.right=9;sc.top=12;sc.bottom=-6;sc.near=.5;sc.far=40;
key.shadow.bias=-.0012;scene.add(key);
scene.add(buildRoad());

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.42,.7,.9);
composer.addPass(bloom);composer.addPass(new OutputPass());

// The courier.
const pip=buildMouse();scene.add(pip.root);
const packet=pip.root.getObjectByName('TransactionPacket'); // hidden while PIP runs empty
const mixer=new T.AnimationMixer(pip.root);
let action=mixer.clipAction(pip.clips.find(c=>c.name==='Idle'));action.play();
let motion='Idle';
function setMotion(name){
 if(name===motion)return;
 const next=mixer.clipAction(pip.clips.find(c=>c.name===name));
 next.reset().play();action.crossFadeTo(next,.16,true);action=next;motion=name;
}

const S={phase:'ready',t:0,dist:0,x:0,vx:0,y:0,vy:0,grounded:true,slot:1,hits:0,carrying:false,
 heat:0,locked:false,dash:false,stumble:0,shake:0,flash:0,blocks:[],
 nextRow:60,nextPickup:34,nextLamp:0,nextMarker:0,nextGate:GATE_STEP};
const props=[]; // everything that travels down the road towards PIP

function add(kind,obj,z,extra={}){
 obj.position.z=z;scene.add(obj);props.push(Object.assign({kind,obj},extra));return obj;
}
function clearProps(){for(const p of props)scene.remove(p.obj);props.length=0;}

function speed(){
 let v=BASE+(S.slot-1)*PER_SLOT;
 if(S.dash)v*=DASH_MUL;
 if(S.stumble>0)v*=STUMBLE_MUL;
 return v;
}

const KINDS=['crate','pylon','barrier'];
function spawnRowAt(z){
 // The approach to a gate is left clear, so the delivery is never a coin flip.
 if(S.nextGate-S.dist<22)return;
 const place=avoid=>{
  const kind=KINDS[Math.floor(Math.random()*KINDS.length)];
  const built=buildObstacle(kind),halfWidth=built.halfWidth;
  const span=LIMIT-halfWidth;
  let x=null;
  for(let tries=0;tries<12;tries++){
   const c=-span+Math.random()*span*2;
   // Always leave a corridor PIP can fit through beside what is already there.
   if(!avoid||Math.abs(c-avoid.x)>halfWidth+avoid.halfWidth+1.5){x=c;break;}
  }
  if(x===null)return null;
  built.group.position.x=x;
  add('obstacle',built.group,z,{halfWidth,x,clear:built.clear});
  return {x,halfWidth};
 };
 const first=place(null);
 if(first&&S.slot>=3&&Math.random()<.3)place(first);
}
function spawnPickupAt(z){
 const near=props.filter(p=>p.kind==='obstacle'&&Math.abs(p.obj.position.z-z)<3.5);
 let x=null;
 for(let tries=0;tries<14;tries++){
  const c=-LIMIT+Math.random()*LIMIT*2;
  if(near.every(p=>Math.abs(c-p.x)>p.halfWidth+1.2)){x=c;break;}
 }
 if(x===null)return;
 const obj=buildPickup();obj.position.x=x;add('pickup',obj,z);
}

function renderBlocks(){
 // The last dozen slots as a chain of blocks: a filled one carried something.
 $('#blocks').innerHTML=S.blocks.slice(-12).map(b=>'<i class="'+(b?'full':'empty')+'"></i>').join('');
}
function hud(){
 $('#slot').textContent=String(S.slot).padStart(2,'0');
 $('#minted').textContent=S.blocks.filter(Boolean).length;
 $('#empty').textContent=S.blocks.filter(b=>!b).length;
 $('#bar').style.transform='scaleX('+(1-(S.nextGate-S.dist)/GATE_STEP)+')';
 $('#heat').style.transform='scaleX('+S.heat+')';
 $('#heat').classList.toggle('locked',S.locked);
 $('#carry').classList.toggle('on',S.carrying);
 $('#carry').textContent=S.carrying?'TRANSACTION 保持中':'手ぶら · 拾ってください';
 $('#lives').textContent='●'.repeat(LIVES-S.hits)+'○'.repeat(S.hits);
 $('#pace').textContent=speed().toFixed(0);
}

// A prop spawned at distance D sits at z = SPAWN_Z-(dist-D), so seeding the road
// with the same cadence run backwards from SPAWN_Z leaves the counters correct
// and the first eight seconds of the run are not an empty corridor.
function seedRoad(){
 for(let z=SPAWN_Z;z>0;z-=MARKER)add('deco',buildMarker(),z);
 for(let z=SPAWN_Z;z>0;z-=LAMP)add('deco',buildLampRow(),z);
 for(let z=SPAWN_Z;z>44;z-=ROW){const s=S.dist;S.dist=SPAWN_Z-z;spawnRowAt(z);S.dist=s;}
 for(let z=SPAWN_Z;z>30;z-=PICKUP)spawnPickupAt(z);
}

function start(){
 clearProps();
 Object.assign(S,{phase:'run',dist:0,x:0,vx:0,y:0,vy:0,grounded:true,slot:1,hits:0,carrying:true,
  heat:0,locked:false,dash:false,stumble:0,shake:0,flash:0,blocks:[],
  nextRow:0,nextPickup:0,nextLamp:0,nextMarker:0,nextGate:GATE_STEP});
 seedRoad();
 packet.visible=true;pip.root.position.set(0,0,0);
 renderBlocks();hud();
 $('#overlay').hidden=true;$('#o-score').hidden=true;$('.rules').hidden=false;
 setMotion('Run');
}
function finish(){
 S.phase='over';setMotion('Idle');
 $('#o-title').textContent='ギアボックス停止';
 $('#o-lead').textContent='SLOT '+S.slot+' まで走りました。';
 $('#o-score').innerHTML='<b>'+S.blocks.filter(Boolean).length+'</b> ブロックに刻まれた<span>空ブロック '+S.blocks.filter(b=>!b).length+'</span>';
 $('#o-hint').textContent='R または START でもう一度';
 $('#o-score').hidden=false;$('.rules').hidden=true;
 $('#start').textContent='もう一度走る';
 $('#overlay').hidden=false;
}

function hit(){
 S.hits++;S.stumble=.7;S.shake=.4;S.y=0;S.vy=0;S.grounded=true;
 if(S.carrying){
  S.carrying=false;packet.visible=false;
  const drop=buildDropped();drop.position.set(pip.root.position.x,.9,.4);
  add('drop',drop,.4,{life:1.6,spin:new T.Vector3(Math.random()*7-3.5,Math.random()*7-3.5,Math.random()*7-3.5)});
 }
 if(S.hits>=LIVES)finish();
}
function resolveGate(){
 S.blocks.push(S.carrying);
 if(S.carrying){S.carrying=false;packet.visible=false;S.flash=.55;}
 S.slot++;S.nextGate+=GATE_STEP;
 renderBlocks();
}

const held={left:false,right:false};
// The camera sits behind PIP looking up +z, which puts world +x on the left of
// the screen. steer() converts what the player pressed into where PIP goes.
const steer=()=>(held.left?1:0)-(held.right?1:0);
function dashOn(v){
 if(v&&(S.locked||S.heat>=1))return;
 S.dash=v&&S.phase==='run';
}
function jump(){
 if(S.phase!=='run'||!S.grounded)return;
 S.grounded=false;S.vy=JUMP;
}
addEventListener('keydown',e=>{
 if(e.repeat)return;
 const k=e.key.toLowerCase();
 if(k==='arrowleft'||k==='a')held.left=true;
 if(k==='arrowright'||k==='d')held.right=true;
 if(k===' '||k==='arrowup'||k==='w'){jump();e.preventDefault();}
 if(k==='shift'||k==='arrowdown'||k==='s'){dashOn(true);e.preventDefault();}
 if(k==='enter'&&S.phase!=='run')start();
 if(k==='r'&&S.phase==='over')start();
});
addEventListener('keyup',e=>{
 const k=e.key.toLowerCase();
 if(k==='arrowleft'||k==='a')held.left=false;
 if(k==='arrowright'||k==='d')held.right=false;
 if(k==='shift'||k==='arrowdown'||k==='s')dashOn(false);
});
// Touch: the two halves of the screen steer, the third button burns the gearbox.
for(const el of $('#touch').querySelectorAll('[data-hold]')){
 const set=v=>e=>{
  if(e)e.preventDefault();
  const h=el.dataset.hold;
  if(h==='dash')dashOn(v);else if(h==='jump'){if(v)jump();}else held[h]=v;
  el.classList.toggle('down',v);
 };
 el.addEventListener('pointerdown',set(true));
 for(const ev of ['pointerup','pointercancel','pointerleave'])el.addEventListener(ev,set(false));
}
$('#start').onclick=start;

const clock=new T.Clock();
renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);
 S.t+=dt;
 if(S.phase==='run'){
  // Heat first: a dash that has run the gearbox to its limit cuts itself off.
  if(S.dash){S.heat=Math.min(1,S.heat+dt*DASH_HEAT);if(S.heat>=1){S.locked=true;S.dash=false;}}
  else{S.heat=Math.max(0,S.heat-dt*COOL);if(S.locked&&S.heat<.3)S.locked=false;}
  if(S.stumble>0)S.stumble=Math.max(0,S.stumble-dt);

  const v=speed();
  S.dist+=v*dt;

  // Sideways: the jets accelerate, they do not teleport.
  const dir=steer();
  S.vx+=dir*26*dt;S.vx*=Math.pow(.0022,dt);
  S.vx=T.MathUtils.clamp(S.vx,-9,9);
  S.x=T.MathUtils.clamp(S.x+S.vx*dt,-LIMIT,LIMIT);
  if(Math.abs(S.x)>=LIMIT)S.vx*=-.15; // the kerb pushes back a little

  if(!S.grounded){
   S.vy-=GRAVITY*dt;S.y+=S.vy*dt;
   if(S.y<=0){S.y=0;S.vy=0;S.grounded=true;}
  }

  pip.root.position.x=S.x;
  pip.root.position.y=S.y;
  pip.root.rotation.z=-S.vx*.035;
  pip.root.rotation.y=S.vx*.026;
  pip.root.rotation.x=-S.vy*.028; // nose up on the way out, down on the way in
  setMotion(S.stumble>0?'Idle':S.dash?'Dash':'Run');

  while(S.dist>=S.nextRow){S.nextRow+=ROW;spawnRowAt(SPAWN_Z);}
  while(S.dist>=S.nextPickup){S.nextPickup+=PICKUP;spawnPickupAt(SPAWN_Z);}
  while(S.dist>=S.nextLamp){S.nextLamp+=LAMP;add('deco',buildLampRow(),SPAWN_Z);}
  while(S.dist>=S.nextMarker){S.nextMarker+=MARKER;add('deco',buildMarker(),SPAWN_Z);}
  // The gate is placed once its own position comes inside the visible road.
  if(S.nextGate-S.dist<=SPAWN_Z&&!props.some(p=>p.kind==='gate'))add('gate',buildGate(),S.nextGate-S.dist);

  for(let i=props.length-1;i>=0;i--){
   const p=props[i];
   if(p.kind==='drop'){
    // A dropped transaction falls behind faster than the road: it is gone.
    p.obj.position.z-=(v+8)*dt;p.obj.position.y=Math.max(.17,p.obj.position.y-2.4*dt);
    p.obj.rotation.x+=p.spin.x*dt;p.obj.rotation.y+=p.spin.y*dt;p.obj.rotation.z+=p.spin.z*dt;
    p.life-=dt;if(p.life<=0){scene.remove(p.obj);props.splice(i,1);}
    continue;
   }
   p.obj.position.z-=v*dt;
   const z=p.obj.position.z;
   if(p.kind==='obstacle'&&!p.done&&Math.abs(z)<.82&&Math.abs(S.x-p.x)<p.halfWidth+.3&&S.y<p.clear){p.done=true;hit();}
   if(p.kind==='pickup'){
    p.obj.rotation.y+=dt*1.9;p.obj.rotation.x+=dt*.8;
    p.obj.position.y=.85+Math.sin(S.t*3+z)*.09;
    if(!p.done&&!S.carrying&&Math.abs(z)<.75&&Math.abs(S.x-p.obj.position.x)<.8){
     S.carrying=true;packet.visible=true;scene.remove(p.obj);props.splice(i,1);continue;
    }
   }
   if(p.kind==='gate'&&!p.done&&z<0){p.done=true;resolveGate();}
   if(z<-16){scene.remove(p.obj);props.splice(i,1);}
  }
  hud();
 }

 mixer.update(dt);
 pip.tick(S.t,motion,steer());

 // Camera: locked behind, pushed back by the dash, jolted by a hit.
 const fov=S.dash?54:46;
 camera.fov+=(fov-camera.fov)*Math.min(1,dt*5);camera.updateProjectionMatrix();
 if(S.shake>0)S.shake=Math.max(0,S.shake-dt*1.6);
 const jolt=S.shake*S.shake*.5;
 camera.position.set(S.x*.42+(Math.random()-.5)*jolt,2.62+S.y*.25+(Math.random()-.5)*jolt,-6.3);
 camera.lookAt(S.x*.6,1.15+S.y*.35,7);

 if(S.flash>0)S.flash=Math.max(0,S.flash-dt*2);
 $('#mint').style.opacity=S.flash;
 composer.render();
});

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 bloom.setSize(innerWidth,innerHeight);
});

packet.visible=true;hud();renderBlocks();
$('#loading').classList.add('done');
window.pipRun={S,props,scene,camera,start,get score(){return S.blocks.filter(Boolean).length}};

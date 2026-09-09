import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildMouse} from '../pip/model.js';
import {makeCurve,makeHeight,at,buildRoad,buildGround,buildVerge,buildStartGate,buildBoostPad,
        buildCrate,buildJam,buildRamp,buildBarrierBlock,buildGiantBlock,buildShock,buildBlob,
        buildDriftSpark,buildLaser,tuneLaser,buildScenery,ITEMS,HALF_W} from './model.js';
import {COURSES,courseById} from './courses.js';

const $=s=>document.querySelector(s);

// How near a thing came to the line the machine travelled this frame. At full
// boost PIP covers nearly two units between frames, which is wider than most of
// what it is meant to hit: testing the endpoint alone lets it pass straight
// through a queue.
function sweep(px,pz,ax,az,bx,bz){
 const vx=bx-ax,vz=bz-az,len=vx*vx+vz*vz;
 const t=len?Math.max(0,Math.min(1,((px-ax)*vx+(pz-az)*vz)/len)):0;
 return Math.hypot(px-(ax+vx*t),pz-(az+vz*t));
}

// Driving. Arcade numbers, not a simulation: the whole feel lives here.
const LAPS=3;
// The machine only ever gains: it leaves the line already moving and reaches
// its pace inside a second. There is no throttle to feather and no brake, so
// the whole feel has to be acceleration.
const TOP=32,ACCEL=44,BRAKE=26;      // units per second, and per second squared
const LAUNCH=.58;                    // and it starts at this much of its pace
const TURN=2.2;                     // radians per second at full lock
const GRIP_OFF=.6;                   // how much of that is left off the road
const WALL=2.6;                      // how far past the kerb the course lets you go
const OFF_TOP=.62;                    // and how fast you may go out there
const DRIFT_HOLD=.28;                // steering held this long at speed starts a slide
const DRIFT_TURN=3.05,DRIFT_SLIDE=1.6;
const SHARP=.34;                     // a bend this hard takes the drift by itself
const CHARGE=[[.55,.85,1.25],[3.2,4.4,5.6]]; // charge seconds, and the boost seconds they buy
const BOOST_MUL=1.42,PAD_BOOST=1.1;
const JAM_SLOW=.42,JAM_SPIN=.55;     // what running into a queue costs
const ITEM_TIME={gear:3.2,shield:6,laser:2.6};
const GHOST_HZ=20;
const GRAVITY=23,LAUNCH_V=5.4,LAUNCH_K=.17; // what a ramp gives, per unit of pace
const LAND_BOOST=.75;                       // and what landing it back cleanly returns

const renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
$('#stage').appendChild(renderer.domElement);

const scene=new T.Scene();
scene.background=new T.Color(0x0f1618);
scene.fog=new T.Fog(0x0f1618,55,155);
const camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,420);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;
const hemi=new T.HemisphereLight(0xa8c6d4,0x141a16,.85);scene.add(hemi);
const key=new T.DirectionalLight(0xffe0b2,1.15);key.position.set(-9,18,7);scene.add(key);

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.32,.7,.92);
composer.addPass(bloom);composer.addPass(new OutputPass());

// --- the course ---
// A course is data. Loading one throws away the last and builds the new one in
// its place, so switching costs a rebuild and nothing else.
const RES=600;
let course=null,curve=null,hy=null,samples=[],courseGroup=null;
let pads=[],crates=[],jams=[],ramps=[];

function disposeGroup(g){
 g.traverse(o=>{
  if(o.isMesh||o.isInstancedMesh){
   o.geometry?.dispose?.();
   for(const m of [].concat(o.material||[]))m.dispose?.();
  }
 });
}

function loadCourse(id){
 const def=courseById(id);
 course=def;
 if(courseGroup){scene.remove(courseGroup);disposeGroup(courseGroup);}
 curve=makeCurve(def.control);
 hy=makeHeight(def.height);

 scene.background=new T.Color(def.theme.background);
 scene.fog=new T.Fog(def.theme.background,def.theme.fog[0],def.theme.fog[1]);
 hemi.color.setHex(def.theme.hemi[0]);hemi.groundColor.setHex(def.theme.hemi[1]);hemi.intensity=def.theme.hemi[2];
 key.color.setHex(def.theme.key[0]);key.intensity=def.theme.key[1];

 courseGroup=new T.Group();
 courseGroup.add(buildGround(def.theme),buildVerge(curve,hy,def.theme),buildRoad(curve,hy,def.theme));
 courseGroup.add(buildScenery(def.scenery,curve,hy));
 const gate=buildStartGate(def.theme);
 {
  const p=curve.getPointAt(0),tan=curve.getTangentAt(0);
  gate.position.set(p.x,hy(0),p.z);gate.rotation.y=Math.atan2(tan.x,tan.z);
  courseGroup.add(gate);
 }

 // The furniture, all placed by (t, lateral): how far round, how far off centre.
 pads=[];crates=[];jams=[];ramps=[];
 for(const t of def.ramps){
  const o=buildRamp();at(curve,hy,t,0,o.position);
  const tan=curve.getTangentAt(t);o.rotation.y=Math.atan2(tan.x,tan.z);
  courseGroup.add(o);ramps.push({o,t});
 }
 for(const [t,lat] of def.pads){
  const o=buildBoostPad();at(curve,hy,t,lat,o.position);
  const tan=curve.getTangentAt(t);o.rotation.y=Math.atan2(tan.x,tan.z);
  courseGroup.add(o);pads.push({o,t,lat});
 }
 for(const t of def.crates)for(const lat of [-3,0,3]){
  const o=buildCrate();at(curve,hy,t,lat,o.position);o.position.y+=1.1;
  courseGroup.add(o);crates.push({o,t,lat,back:0});
 }
 // The queues are laid out from the course's own numbers, never over a kicker
 // or across the start line, and never so wide that there is no way past.
 {
  let seed=(def.id.charCodeAt(0)*7919+def.jams*13)>>>0;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  let placed=0,guard=0;
  while(placed<def.jams&&guard++<400){
   const t=.06+rnd()*.88;
   if(def.ramps.some(r=>Math.abs(r-t)<.035))continue;
   if(crates.some(c=>Math.abs(c.t-t)<.02))continue;
   const lat=(rnd()<.5?-1:1)*(1.4+rnd()*3.1);
   const big=rnd()<.28;
   const o=buildJam(big);at(curve,hy,t,lat,o.position);o.position.y+=big?1.05:.7;
   courseGroup.add(o);jams.push({o,t,lat,big,down:0});
   placed++;
  }
 }
 scene.add(courseGroup);

 samples=[];
 for(let i=0;i<RES;i++){const p=curve.getPointAt(i/RES);samples.push(p.x,p.z);}

 S.best=bestTime();
 renderCourseButtons();
}

function nearest(x,z,from){
 // Search a window around where we were: the machine cannot teleport, and this
 // keeps the lookup O(1) instead of O(course).
 let best=from,bd=1e9;
 for(let k=-24;k<=60;k++){
  const i=((from+k)%RES+RES)%RES;
  const dx=x-samples[i*2],dz=z-samples[i*2+1],d=dx*dx+dz*dz;
  if(d<bd){bd=d;best=i;}
 }
 return {i:best,dist:Math.sqrt(bd)};
}

// --- the machines ---
const pip=buildMouse();scene.add(pip.root);
pip.root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
const blob=buildBlob();scene.add(blob);
const mixer=new T.AnimationMixer(pip.root);
let action=mixer.clipAction(pip.clips.find(c=>c.name==='Run'));action.play();
let motion='Run';
function setMotion(name){
 if(name===motion)return;
 const next=mixer.clipAction(pip.clips.find(c=>c.name===name));
 next.reset().play();action.crossFadeTo(next,.15,true);action=next;motion=name;
}

// The ghost is the same machine wearing one flat material, so it is a second
// courier for the price of one shader.
const ghost=buildMouse();
const ghostMat=new T.MeshBasicMaterial({color:0x7fd8f0,transparent:true,opacity:.3,depthWrite:false});
ghost.root.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=o.receiveShadow=false;}});
ghost.root.visible=false;scene.add(ghost.root);
const ghostBlob=buildBlob();ghostBlob.material.opacity=.35;ghostBlob.visible=false;scene.add(ghostBlob);

const barrier=[];
for(let i=0;i<3;i++){const b=buildBarrierBlock();b.visible=false;scene.add(b);barrier.push(b);}
const giant=buildGiantBlock();giant.visible=false;scene.add(giant);
const shock=buildShock();shock.visible=false;scene.add(shock);
const sparks=[];
for(let i=0;i<14;i++){const s=buildDriftSpark();s.visible=false;scene.add(s);sparks.push(s);}
const laserBeam=buildLaser();
laserBeam.visible=false;scene.add(laserBeam);

// --- state ---
let steerNow=0;   // what the player is asking for this frame, for the jets
const S={phase:'ready',t:0,x:0,z:0,y:0,vy:0,air:false,head:0,speed:0,lap:0,seg:0,time:0,best:null,
 drift:0,driftDir:0,charge:0,boost:0,spin:0,item:null,itemLeft:0,shield:0,
 count:3,record:[],ghostRun:null,finished:[]};

function resetToStart(){
 const p=curve.getPointAt(0),tan=curve.getTangentAt(0);
 S.x=p.x;S.z=p.z;S.head=Math.atan2(tan.x,tan.z);
 S.speed=TOP*LAUNCH;S.seg=0;S.y=hy(0);S.vy=0;S.air=false;
}

function bestTime(){
 try{const v=localStorage.getItem('pip-racer-best-'+course.id);return v?JSON.parse(v):null}catch{return null}
}
function bestGhost(){
 try{const v=localStorage.getItem('pip-racer-ghost-'+course.id);return v?JSON.parse(v):null}catch{return null}
}
function fmt(s){
 const m=Math.floor(s/60),r=s-m*60;
 return m+"'"+String(Math.floor(r)).padStart(2,'0')+'"'+String(Math.floor((r%1)*100)).padStart(2,'0');
}

// --- input: steer only. The throttle is always open. ---
const steer={v:0};
let dragId=null,dragX=0;
const keys={left:false,right:false};
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse')return;
 dragId=e.pointerId;dragX=e.clientX;
 renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(e.pointerType==='mouse'){
  // The cursor's side of the screen is the direction, its distance the amount.
  steer.v=T.MathUtils.clamp((e.clientX/innerWidth-.5)*2.6,-1,1);
  return;
 }
 if(e.pointerId!==dragId)return;
 steer.v=T.MathUtils.clamp((e.clientX-dragX)/90,-1,1);
});
for(const ev of ['pointerup','pointercancel'])renderer.domElement.addEventListener(ev,e=>{
 if(e.pointerId===dragId){dragId=null;steer.v=0;}
});
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(k==='arrowleft'||k==='a')keys.left=true;
 if(k==='arrowright'||k==='d')keys.right=true;
 if((k==='enter'||k==='r')&&S.phase!=='race'&&S.phase!=='count')start();
});
addEventListener('keyup',e=>{
 const k=e.key.toLowerCase();
 if(k==='arrowleft'||k==='a')keys.left=false;
 if(k==='arrowright'||k==='d')keys.right=false;
});
addEventListener('blur',()=>{keys.left=keys.right=false;steer.v=0;dragId=null;});
$('#start').onclick=start;

// --- items ---
function flash(label,note,color){
 const el=$('#pickup');
 el.style.setProperty('--c','#'+color.toString(16).padStart(6,'0'));
 el.innerHTML='<b></b><span></span>';
 el.firstChild.textContent=label;el.lastChild.textContent=note;
 el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
}
const ITEM_BAG=['gear','gear','shield','drop','laser','gear','drop','shield'];
function giveItem(){
 const kind=ITEM_BAG[Math.floor(Math.random()*ITEM_BAG.length)];
 flash(ITEMS[kind].label,ITEMS[kind].note,ITEMS[kind].color);
 if(kind==='gear')S.boost=Math.max(S.boost,ITEM_TIME.gear);
 if(kind==='shield')S.shield=ITEM_TIME.shield;
 if(kind==='laser'){S.item='laser';S.itemLeft=ITEM_TIME.laser;}
 if(kind==='drop')giantAhead();
}
function giantAhead(){
 // Dropped a little way in front, so it clears the road you are about to use.
 const gx=S.x+Math.sin(S.head)*16,gz=S.z+Math.cos(S.head)*16;
 giant.visible=true;giant.position.set(gx,22,gz);
 S.giant={t:0,x:gx,z:gz};
}
function clearJams(x,z,r){
 for(const j of jams){
  if(j.down>0)continue;
  if(Math.hypot(j.o.position.x-x,j.o.position.z-z)<r){j.down=7;j.o.visible=false;}
 }
}

// --- run control ---
function start(){
 resetToStart();
 Object.assign(S,{phase:'count',t:S.t,lap:0,time:0,drift:0,driftDir:0,charge:0,boost:0,vy:0,air:false,
  spin:0,item:null,itemLeft:0,shield:0,count:3,record:[],finished:[],giant:null});
 for(const c of crates){c.back=0;c.o.visible=true;}
 for(const j of jams){j.down=0;j.o.visible=true;}
 S.ghostRun=bestGhost();
 // A ghost recorded before the course had height is three numbers a frame, not
 // four. Rather than guess at its heights, it is dropped.
 if(S.ghostRun&&S.ghostRun.length%4)S.ghostRun=null;
 ghost.root.visible=!!S.ghostRun;ghostBlob.visible=!!S.ghostRun;
 S.best=bestTime();
 $('#overlay').hidden=true;
 hud();
}
function finish(){
 S.phase='done';
 const total=S.time;
 const prev=bestTime();
 const record=!prev||total<prev;
 if(record){
  try{
   localStorage.setItem('pip-racer-best-'+course.id,JSON.stringify(total));
   localStorage.setItem('pip-racer-ghost-'+course.id,JSON.stringify(S.record));
  }catch{}
 }
 $('#o-title').textContent=record?'コースレコード':'ゴール';
 $('#o-lead').textContent=record?'この走りがゴーストとして残ります。':'ベストには届きませんでした。';
 $('#o-score').innerHTML='<b></b><span></span>';
 $('#o-score').firstChild.textContent=fmt(total);
 $('#o-score').lastChild.textContent='ラップ '+S.finished.map(fmt).join(' · ');
 $('#o-score').hidden=false;$('.rules').hidden=true;
 $('#start').textContent='もう一度走る';
 $('#overlay').hidden=false;
 renderCourseButtons();
 hud();
}

function hud(){
 $('#lap').textContent=Math.min(S.lap+1,LAPS)+'/'+LAPS;
 $('#time').textContent=fmt(S.time);
 $('#best').textContent=S.best?fmt(S.best):"--'--";
 $('#speed').textContent=Math.round(S.speed*4);
 $('#charge').style.transform='scaleX('+Math.min(1,S.charge/CHARGE[0][2])+')';
 $('#boost').classList.toggle('on',S.boost>0);
 $('#shield').classList.toggle('on',S.shield>0);
}

// --- loop ---
const clock=new T.Clock();
const camPos=new T.Vector3(),camAim=new T.Vector3(),tmp=new T.Vector3();
// The picker on the start card. Switching a course rebuilds it and puts the
// machine back on its line; the best time and the ghost are kept per course, so
// each one keeps its own record.
function renderCourseButtons(){
 const host=$('#courses');
 if(!host)return;
 host.innerHTML='';
 for(const c of COURSES){
  const b=document.createElement('button');
  b.type='button';b.dataset.course=c.id;
  b.className=c.id===course.id?'on':'';
  const best=(()=>{try{const v=localStorage.getItem('pip-racer-best-'+c.id);return v?JSON.parse(v):null}catch{return null}})();
  const n=document.createElement('b');n.textContent=c.name;
  const note=document.createElement('span');note.textContent=c.note;
  const rec=document.createElement('i');rec.textContent=best?fmt(best):'記録なし';
  b.append(n,note,rec);
  b.onclick=()=>{
   if(c.id===course.id)return;
   try{localStorage.setItem('pip-racer-course',c.id)}catch{}
   loadCourse(c.id);
   resetToStart();
   S.phase='ready';S.time=0;S.lap=0;
   $('#o-lead').textContent=c.note;
   hud();
  };
  host.append(b);
 }
}

let opening=null;
try{opening=localStorage.getItem('pip-racer-course')}catch{}
loadCourse(opening||COURSES[0].id);
resetToStart();
$('#o-lead').textContent=course.note;

renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);
 S.t+=dt;

 if(S.phase==='count'){
  S.count-=dt;
  $('#count').textContent=S.count>0?Math.ceil(S.count):'GO';
  $('#count').hidden=false;
  if(S.count<=-.55){S.phase='race';$('#count').hidden=true;}
 }

 if(S.phase==='race'){
  S.time+=dt;

  const input=keys.left?-1:keys.right?1:steer.v;
  steerNow=input;

  // Where on the course we are decides grip and lap, so it comes first.
  const near=nearest(S.x,S.z,S.seg);
  S.seg=near.i;
  const off=near.dist>HALF_W+.8;

  // How hard the course bends just ahead. A corner this sharp takes the drift
  // on its own: the machine cannot be asked to hold a line it has no grip for,
  // and the player should not have to know that in advance.
  let bend=0;
  {
   const i=S.seg,j=(S.seg+20)%RES;
   const want=Math.atan2(samples[j*2]-samples[i*2],samples[j*2+1]-samples[i*2+1]);
   bend=want-S.head;
   while(bend>Math.PI)bend-=Math.PI*2;
   while(bend<-Math.PI)bend+=Math.PI*2;
  }
  const sharp=!off&&Math.abs(bend)>SHARP&&S.speed>TOP*.5;

  // Drift: held steering at speed slides the machine, and a sharp bend starts
  // it whether or not the player asked. No button either way.
  if(!off&&S.speed>TOP*.45&&(Math.abs(input)>.55||sharp)){
   S.drift+=dt;
   if(S.drift>(sharp?0:DRIFT_HOLD)){
    if(!S.driftDir)S.driftDir=Math.abs(input)>.3?Math.sign(input):-Math.sign(bend);
    S.charge+=dt;
   }
  }else{
   if(S.driftDir&&S.charge>CHARGE[0][0]){
    let tier=0;
    for(let i=CHARGE[0].length-1;i>=0;i--)if(S.charge>=CHARGE[0][i]){tier=i;break;}
    S.boost=Math.max(S.boost,CHARGE[1][tier]/3.4);
    for(const s of sparks)if(!s.visible){s.visible=true;s.userData.life=.4;
     s.position.set(S.x,.6,S.z);
     s.userData.v=[(Math.random()-.5)*7,3+Math.random()*3,(Math.random()-.5)*7];break;}
   }
   S.drift=0;S.driftDir=0;S.charge=0;
  }

  if(S.boost>0)S.boost-=dt;
  if(S.itemLeft>0){S.itemLeft-=dt;if(S.itemLeft<=0)S.item=null;}
  if(S.shield>0)S.shield-=dt;
  if(S.spin>0)S.spin-=dt;

  // Speed: the throttle is always open, the world takes it away.
  const cap=(off?TOP*OFF_TOP:TOP)*(S.boost>0?BOOST_MUL:1)*(S.spin>0?.45:1);
  S.speed+=(S.speed<cap?ACCEL:-BRAKE)*dt;
  S.speed=T.MathUtils.clamp(S.speed,0,cap);

  // Steering falls off with speed, so the machine settles on a straight.
  const grip=off?GRIP_OFF:1;
  const rate=(S.driftDir?DRIFT_TURN:TURN)*grip*(1-Math.min(.3,S.speed/TOP*.3));
  // The camera looks along the machine's forward, which puts the screen's right
  // at -head. Steering right has to decrease it.
  S.head-=input*rate*dt;

  const fx=Math.sin(S.head),fz=Math.cos(S.head);
  const wasX=S.x,wasZ=S.z;
  S.x+=fx*S.speed*dt;S.z+=fz*S.speed*dt;
  if(S.driftDir){
   // The slide runs wide, out of the corner: the tail steps out and the machine
   // carries further than the steering asked for.
   S.x+=fz*S.driftDir*DRIFT_SLIDE*dt;S.z+=-fx*S.driftDir*DRIFT_SLIDE*dt;
  }

  // Up and down. The plan is flat as far as the rules are concerned; height is
  // laid over it, and a ramp is the one thing that takes the machine off it.
  const ground=hy(S.seg/RES);
  if(!S.air){
   for(const r of ramps){
    if(sweep(r.o.position.x,r.o.position.z,wasX,wasZ,S.x,S.z)<3.2&&S.speed>TOP*.45){
     S.air=true;S.vy=LAUNCH_V+S.speed*LAUNCH_K;break;
    }
   }
  }
  if(S.air){
   S.vy-=GRAVITY*dt;S.y+=S.vy*dt;
   if(S.y<=ground){
    S.y=ground;S.air=false;
    // Come down with the course still falling away and the machine takes the
    // landing as speed rather than as a stumble.
    if(S.vy<-6)S.boost=Math.max(S.boost,LAND_BOOST);
    S.shake=Math.max(S.shake,.35);
    S.vy=0;
   }
  }else{
   S.y+=(ground-S.y)*Math.min(1,dt*14);
  }

  // The course keeps you: past the verge there is a wall, and it costs speed
  // rather than the run. Without it a missed corner ends in open ground with no
  // way back.
  {
   const edge=nearest(S.x,S.z,S.seg);
   const limit=HALF_W+WALL;
   if(edge.dist>limit){
    const cx=samples[edge.i*2],cz=samples[edge.i*2+1];
    const dx=S.x-cx,dz=S.z-cz,d=Math.hypot(dx,dz)||1;
    S.x=cx+dx/d*limit;S.z=cz+dz/d*limit;
    S.speed*=.94;
    S.drift=0;S.driftDir=0;S.charge=0;
    // Scrape along it rather than stick to it: pushing the machine back while
    // it still points at the wall pins it there with nowhere to go.
    const j=(edge.i+2)%RES;
    const want=Math.atan2(samples[j*2]-cx,samples[j*2+1]-cz);
    let turn=want-S.head;
    while(turn>Math.PI)turn-=Math.PI*2;
    while(turn<-Math.PI)turn+=Math.PI*2;
    S.head+=turn*Math.min(1,dt*4.5);
   }
  }

  // Lap: crossing the first sample forwards. The window keeps a car that
  // wanders backwards over the line from banking a lap.
  const prev=near.i;
  const after=nearest(S.x,S.z,S.seg);
  if(prev>RES-40&&after.i<40){
   S.finished.push(S.time-(S.finished.reduce((a,c)=>a+c,0)));
   S.lap++;
   if(S.lap>=LAPS){finish();}
  }else if(prev<40&&after.i>RES-40&&S.lap>0){
   S.lap--;S.finished.pop();
  }
  S.seg=after.i;

  // pads, crates, queues
  for(const p of pads){
   if(sweep(p.o.position.x,p.o.position.z,wasX,wasZ,S.x,S.z)<2.4)S.boost=Math.max(S.boost,PAD_BOOST);
  }
  for(const c of crates){
   if(c.back>0){c.back-=dt;if(c.back<=0)c.o.visible=true;continue;}
   c.o.rotation.y+=dt*1.4;c.o.position.y=1.1+Math.sin(S.t*2.6+c.t*30)*.16;
   if(sweep(c.o.position.x,c.o.position.z,wasX,wasZ,S.x,S.z)<1.9){
    c.o.visible=false;c.back=6;giveItem();
   }
  }
  for(const j of jams){
   if(j.down>0){j.down-=dt;if(j.down<=0){j.o.visible=true;}continue;}
   if(S.y>ground+1.4)continue;   // flying over it
   j.o.rotation.y+=dt*.7;
   const d=sweep(j.o.position.x,j.o.position.z,wasX,wasZ,S.x,S.z);
   if(d<(j.big?1.7:1.3)){
    if(S.shield>0||S.boost>0){j.down=7;j.o.visible=false;}
    else{S.spin=JAM_SPIN;S.speed*=JAM_SLOW;j.down=3;j.o.visible=false;}
   }
  }

  // laser: burns the road ahead clear for as long as it lasts
  laserBeam.visible=S.item==='laser';
  if(laserBeam.visible){
   const L=34;
   // The group runs along its own +x, so the heading is a quarter turn back.
   laserBeam.position.set(S.x,.85,S.z);
   laserBeam.rotation.y=S.head-Math.PI/2;
   tuneLaser(laserBeam,L,S.t);
   for(const j of jams){
    if(j.down>0)continue;
    const ox=j.o.position.x-S.x,oz=j.o.position.z-S.z;
    const along=ox*fx+oz*fz;
    if(along<0||along>L+2)continue;
    if(Math.abs(ox*fz-oz*fx)<2.2){j.down=7;j.o.visible=false;}
   }
  }

  // the giant block, dropped ahead
  if(S.giant){
   S.giant.t+=dt;
   const f=Math.min(1,S.giant.t/.5);
   giant.position.y=22-f*f*19.7;
   giant.rotation.y=S.giant.t*1.6;
   if(f===1){
    clearJams(S.giant.x,S.giant.z,9);
    shock.visible=true;shock.position.set(S.giant.x,.08,S.giant.z);shock.scale.setScalar(1);
    shock.material.opacity=.9;S.shockT=0;
    giant.visible=false;S.giant=null;
   }
  }
  if(shock.visible){
   S.shockT+=dt;const f=S.shockT/.45;
   shock.scale.setScalar(9*Math.min(1,f));
   shock.material.opacity=.9*(1-Math.min(1,f));
   if(f>=1)shock.visible=false;
  }

  // the ghost of the best run so far
  if(S.ghostRun){
   const k=S.time*GHOST_HZ;
   const i=Math.min(S.ghostRun.length/4-1,Math.floor(k));
   const g=i*4;
   if(g+3<S.ghostRun.length){
    ghost.root.position.set(S.ghostRun[g],S.ghostRun[g+3],S.ghostRun[g+1]);
    ghost.root.rotation.y=S.ghostRun[g+2];
    ghostBlob.position.set(S.ghostRun[g],S.ghostRun[g+3]+.06,S.ghostRun[g+1]);
   }
  }
  // and the record of this one
  if(S.record.length/4<S.time*GHOST_HZ){
   S.record.push(+S.x.toFixed(2),+S.z.toFixed(2),+S.head.toFixed(3),+S.y.toFixed(2));
  }

  pip.root.position.set(S.x,S.y,S.z);
  // A drift leans the machine into the slide; the lean is most of what the
  // player sees of it.
  pip.root.rotation.y=S.head+(S.driftDir?S.driftDir*.38:0);
  pip.root.rotation.z=input*.12+(S.driftDir?S.driftDir*.1:0);
  blob.position.set(S.x,ground+.06,S.z);
  // The mark shrinks as the machine climbs away from it.
  blob.scale.setScalar(Math.max(.35,1-(S.y-ground)*.09));
  // Nose up while climbing, down while falling.
  pip.root.rotation.x=S.air?T.MathUtils.clamp(-S.vy*.035,-.5,.5):0;
  setMotion(S.boost>0?'Dash':'Run');

  // barrier blocks when the shield item is up
  for(let i=0;i<barrier.length;i++){
   barrier[i].visible=S.shield>0;
   if(!barrier[i].visible)continue;
   const a=S.t*2.4+i*Math.PI*2/barrier.length;
   barrier[i].position.set(S.x+Math.cos(a)*1.9,.8,S.z+Math.sin(a)*1.9);
   barrier[i].rotation.y=a;
  }
  hud();
 }

 for(const s of sparks){
  if(!s.visible)continue;
  s.userData.life-=dt;
  s.position.x+=s.userData.v[0]*dt;s.position.y+=s.userData.v[1]*dt;s.position.z+=s.userData.v[2]*dt;
  s.userData.v[1]-=14*dt;
  s.scale.setScalar(Math.max(.05,s.userData.life*2.4));
  if(s.userData.life<=0)s.visible=false;
 }

 mixer.update(dt);
 // Which shoulder fires. PIP's local +x is the screen's left (the camera looks
 // along its forward), and the model lights the thruster whose side opposes the
 // value it is given: so turning right must be passed as negative, and the left
 // shoulder pushes the machine to the right. It also fires on plain steering,
 // not only in a drift.
 {
  const lean=Math.abs(steerNow)>.15?-Math.sign(steerNow):(S.driftDir?-S.driftDir:0);
  pip.tick(S.t,motion,lean);
 }

 // chase camera, pulled back by speed
 const back=7.4+S.speed*.09,high=3.9+S.speed*.02;
 camPos.set(S.x-Math.sin(S.head)*back,S.y+high,S.z-Math.cos(S.head)*back);
 camera.position.lerp(camPos,Math.min(1,dt*11));
 camAim.set(S.x+Math.sin(S.head)*5,S.y+1.5,S.z+Math.cos(S.head)*5);
 tmp.copy(camAim);camera.lookAt(tmp);
 const want=56+S.speed/TOP*9+(S.boost>0?7:0);
 camera.fov+=(want-camera.fov)*Math.min(1,dt*5);
 camera.updateProjectionMatrix();

 composer.render();
});

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 bloom.setSize(innerWidth,innerHeight);
});

hud();
$('#loading').classList.add('done');
window.pipRacer={S,scene,camera,start,giveItem,nearest,loadCourse,COURSES,samples:RES,HALF_W,WALL,
 get course(){return course},get curve(){return curve},get hy(){return hy},
 get jams(){return jams},get crates(){return crates},get pads(){return pads},get ramps(){return ramps}};

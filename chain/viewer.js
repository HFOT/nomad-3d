import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RACERS,racerById,pickClip} from '../racer/racers.js';
import {buildField,buildBody,buildLoose,buildBlobShadow,buildBurst,buildGear,buildShield,FIELD,SEG_GAP,HEAD_GAP,HUES,KINDS} from './model.js?v=4';

const $=s=>document.querySelector(s);

// A run has no clock. It lasts as long as the player's head stays off every
// other chain and off the wall, and the only number that matters is how long
// the chain behind it got.
const MAX_LEN=240, START_LEN=6;
const STEP=.30, CAP=700;      // the path is kept at a fixed spacing, so "one
                              // block back" is an index rather than a search
const SPEED=11.5, BOOST_SPEED=19.5;
const TURN=3.0, AI_TURN=2.45; // the player turns tighter, which is what makes
                              // cutting another chain off something a player can do
const BURN_EVERY=.17, MIN_BOOST=5;
const EAT_R=1.7, HIT_R=.85;
const LOOSE_MAX=680, SEED_TARGET=300, SEED_RATE=7;
const AI_COUNT=3, AI_LOOK=10.5, RESPAWN=2.6;
const GEAR_TIME=4.5, GEAR_EVERY=9, GEAR_LIFE=12, GEAR_MAX=2;
// What each kind of block does when it is picked up. Bitcoin is worth two but
// sits heavy on the turn for a moment; Ethereum pulls the floor in around the
// head and makes burning dearer while it does; Cardano leaves a shield that
// takes the next hit for one block; Solana is just plentiful.
const BTC=0,ETH=1,ADA=2,SOL=3;
const SLOW_TIME=3.2, SLOW_TURN=.7;
const MAGNET_TIME=3.0, MAGNET_R=8, MAGNET_PULL=13, MAGNET_BURN=.55;
// A shield is not one block's worth: it takes SHIELD_ADA Cardano blocks to
// raise one, or with a quarter of the floor being Cardano nothing ever dies.
const SHIELD_MAX=1, SHIELD_ADA=6, SHIELD_GRACE=.4;
const LETHAL=FIELD-.5;

const renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
$('#stage').appendChild(renderer.domElement);

const scene=new T.Scene();
scene.background=new T.Color(0x0f1618);
scene.fog=new T.Fog(0x0f1618,72,215);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,420);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;
scene.add(new T.HemisphereLight(0xa8c6d4,0x141a16,.85));
const key=new T.DirectionalLight(0xffe0b2,1.25);
key.position.set(-10,20,8);scene.add(key);
scene.add(buildField());

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.30,.72,.90);
composer.addPass(bloom);composer.addPass(new OutputPass());

// --- loose transactions: flat arrays, swapped in from the end when one is taken ---
const loose={n:0,x:new Float32Array(LOOSE_MAX),z:new Float32Array(LOOSE_MAX),r:new Float32Array(LOOSE_MAX),k:new Uint8Array(LOOSE_MAX)};
const looseMeshes=buildLoose(LOOSE_MAX);for(const m of looseMeshes)scene.add(m);
// The floor deals kinds by weight: Solana most, Bitcoin least.
const KW=KINDS.map(k=>k.weight),KW_SUM=KW.reduce((a,b)=>a+b,0);
function dealKind(){
 let r=Math.random()*KW_SUM;
 for(let i=0;i<KW.length;i++){r-=KW[i];if(r<=0)return i;}
 return KW.length-1;
}
function addLoose(x,z,kind){
 if(loose.n>=LOOSE_MAX)return;
 const i=loose.n++;loose.x[i]=x;loose.z[i]=z;loose.r[i]=Math.random()*9;
 loose.k[i]=kind===undefined?dealKind():kind;
}
function takeLoose(i){
 const j=--loose.n;
 loose.x[i]=loose.x[j];loose.z[i]=loose.z[j];loose.r[i]=loose.r[j];loose.k[i]=loose.k[j];
}
function scatter(n){
 for(let k=0;k<n;k++){
  const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(FIELD-4);
  addLoose(Math.cos(a)*r,Math.sin(a)*r);
 }
}

// --- the coarse map the other chains read the field through ---
// One byte per cell holding whose block is standing in it, rebuilt at the end
// of every frame. The heads collide exactly, against the blocks themselves;
// this is only for the three chains that have to decide where to go.
const CELL=1.6, GN=Math.ceil(FIELD*2/CELL)+2, GH=GN/2;
const occ=new Uint8Array(GN*GN);
function cell(x,z){
 const cx=(x/CELL+GH)|0,cz=(z/CELL+GH)|0;
 if(cx<0||cz<0||cx>=GN||cz>=GN)return -1;
 return cz*GN+cx;
}
function blockedFor(x,z,self){
 if(x*x+z*z>(LETHAL-1)*(LETHAL-1))return true;
 const i=cell(x,z);
 if(i<0)return true;
 const v=occ[i];
 return v!==0&&v!==self+1; // a chain passes through its own body unharmed
}

// --- chains ---
const chains=[];
const bursts=[];for(let i=0;i<6;i++){const b=buildBurst();scene.add(b);bursts.push({o:b,t:1});}
// Gears wait on the floor for whoever gets there first, the other chains too.
const gears=[];for(let i=0;i<GEAR_MAX;i++){const o=buildGear();o.visible=false;scene.add(o);gears.push({o,live:false,life:0});}
function burst(x,z,color){
 const b=bursts.find(k=>k.t>=1)||bursts[0];
 b.o.position.set(x,.09,z);b.o.material.color.setHex(color);
 b.o.visible=true;b.t=0;
}

function makeChain(i,entry){
 const fig=entry.build();
 fig.root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 scene.add(fig.root);
 const mixer=new T.AnimationMixer(fig.root);
 const action=mixer.clipAction(pickClip(fig.clips,'Idle'));action.play();
 const mesh=buildBody(HUES[i],MAX_LEN);scene.add(mesh);
 const blob=buildBlobShadow();scene.add(blob);
 const halo=buildShield();scene.add(halo);
 const seg=[];for(let k=0;k<MAX_LEN;k++)seg.push({x:0,z:0,a:0});
 return {
  i,entry,fig,mixer,action,motion:'Idle',mesh,blob,halo,seg,
  hue:HUES[i],name:i===0?'あなた':entry.name,
  px:new Float32Array(CAP),pz:new Float32Array(CAP),n:0,
  x:0,z:0,a:0,len:START_LEN,alive:false,wait:0,
  boost:false,burn:0,gear:0,hunt:0,huntIn:4+Math.random()*7,cut:0,peak:START_LEN,
  slow:0,magnet:0,shield:0,charge:0,grace:0,pop:1,got:[0,0,0,0],
 };
}
function setMotion(ch,name){
 if(name===ch.motion)return;
 const clip=pickClip(ch.fig.clips,name);
 // Not every figure has a clip for every pace. Where two paces land on the
 // same clip there is nothing to fade between, and fading an action to itself
 // leaves it weighted at nothing.
 if(!clip)return;
 if(ch.action&&ch.action.getClip()===clip){ch.motion=name;return;}
 const next=ch.mixer.clipAction(clip);
 next.reset().play();ch.action.crossFadeTo(next,.15,true);
 ch.action=next;ch.motion=name;
}

function seed(ch,x,z,a){
 ch.x=x;ch.z=z;ch.a=a;ch.n=0;
 // Lay a straight path out behind it, or the whole chain starts in a heap on
 // the spawn point and unfolds as it moves.
 const dx=Math.sin(a),dz=Math.cos(a);
 for(let k=140;k>=1;k--){
  ch.px[ch.n%CAP]=x-dx*k*STEP;ch.pz[ch.n%CAP]=z-dz*k*STEP;ch.n++;
 }
 ch.len=START_LEN;ch.peak=START_LEN;ch.alive=true;ch.wait=0;ch.boost=false;ch.burn=0;ch.gear=0;
 ch.slow=0;ch.magnet=0;ch.shield=0;ch.charge=0;ch.grace=0;ch.pop=1;ch.got=[0,0,0,0];
 ch.fig.root.visible=true;
 layout(ch);
}
// Somewhere with room: away from the player, and off everyone's body.
function freeSpot(){
 const you=chains[0];
 for(let tries=0;tries<60;tries++){
  const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(FIELD-12);
  const x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(you&&you.alive&&Math.hypot(x-you.x,z-you.z)<34)continue;
  let clash=false;
  for(const o of chains){
   if(!o.alive)continue;
   for(let k=0;k<o.len;k+=2)if(Math.hypot(o.seg[k].x-x,o.seg[k].z-z)<6){clash=true;break;}
   if(clash)break;
  }
  if(!clash)return {x,z,a:Math.random()*Math.PI*2};
 }
 return {x:0,z:0,a:Math.random()*Math.PI*2};
}

// The path is stored newest-last at a fixed spacing, so a point "d back along
// the chain" is found by index and one lerp.
const P0={x:0,z:0},P1={x:0,z:0};
function sample(ch,back,out){
 const f=back/STEP;
 let k=f|0;const t=f-k;
 const avail=Math.min(ch.n,CAP)-2;
 if(k>=avail){const i=(ch.n-1-avail)%CAP;out.x=ch.px[i];out.z=ch.pz[i];return;}
 const i0=(ch.n-1-k)%CAP,i1=(ch.n-2-k)%CAP;
 out.x=ch.px[i0]+(ch.px[i1]-ch.px[i0])*t;
 out.z=ch.pz[i0]+(ch.pz[i1]-ch.pz[i0])*t;
}
function layout(ch){
 for(let k=0;k<ch.len;k++){
  const back=HEAD_GAP+k*SEG_GAP;
  sample(ch,back,P0);sample(ch,back+.34,P1);
  const s=ch.seg[k];
  s.x=P0.x;s.z=P0.z;
  s.a=Math.atan2(P0.x-P1.x,P0.z-P1.z);
 }
}
function advance(ch,dist){
 ch.x+=Math.sin(ch.a)*dist;ch.z+=Math.cos(ch.a)*dist;
 let lx=ch.px[(ch.n-1)%CAP],lz=ch.pz[(ch.n-1)%CAP];
 let ax=ch.x-lx,az=ch.z-lz,d=Math.hypot(ax,az);
 while(d>=STEP){
  const t=STEP/d;
  lx+=ax*t;lz+=az*t;
  ch.px[ch.n%CAP]=lx;ch.pz[ch.n%CAP]=lz;ch.n++;
  ax=ch.x-lx;az=ch.z-lz;d=Math.hypot(ax,az);
 }
}
const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
// How stout this chain's blocks are: the length shows on the body itself, and
// on what the body can catch.
// Logarithmic, so a long chain is visibly stout without filling the field by
// the middle of a run the way a straight ratio did.
function scaleOf(ch){return 1+Math.log1p(ch.len/40)*.38;}
// How wide the head catches: a stout head gathers more, and cannot slip past.
function eatR(ch){return EAT_R+(scaleOf(ch)-1)*.9;}
function steer(ch,want,rate,dt){
 const d=wrap(want-ch.a),m=rate*dt;
 ch.a=wrap(ch.a+(Math.abs(d)<m?d:Math.sign(d)*m));
}

// --- what the other chains do. Three rules, and nothing else. ---
const PROBE=[0,-.3,.3,-.65,.65,-1.05,1.05];
function drive(ch,dt){
 // 1. head for the nearest light
 let want=ch.a,bd=40*40;
 for(let i=0;i<loose.n;i++){
  const dx=loose.x[i]-ch.x,dz=loose.z[i]-ch.z,d2=dx*dx+dz*dz;
  if(d2<bd){bd=d2;want=Math.atan2(dx,dz);}
 }
 // 3. and every so often, go and stand in front of the player instead
 ch.huntIn-=dt;
 if(ch.huntIn<=0){ch.huntIn=9+Math.random()*9;ch.hunt=3+Math.random()*2.5;}
 if(ch.hunt>0){
  ch.hunt-=dt;
  const you=chains[0];
  if(you&&you.alive&&ch.len>12){
   const tx=you.x+Math.sin(you.a)*13,tz=you.z+Math.cos(you.a)*13;
   want=Math.atan2(tx-ch.x,tz-ch.z);
  }
 }
 // 2. and above all, do not run into anything. Whatever the wish was, it is
 //    only taken as far as the clearest heading allows.
 let bestA=ch.a,bestScore=-1e9;
 for(const off of PROBE){
  const a=ch.a+off,sx=Math.sin(a),sz=Math.cos(a);
  let reach=AI_LOOK;
  for(let d=1.6;d<=AI_LOOK;d+=1.6){
   if(blockedFor(ch.x+sx*d,ch.z+sz*d,ch.i)){reach=d;break;}
  }
  const score=reach*1.6-Math.abs(wrap(a-want))*2.4;
  if(score>bestScore){bestScore=score;bestA=a;}
 }
 steer(ch,bestA,AI_TURN*(ch.slow>0?SLOW_TURN:1)/Math.sqrt(scaleOf(ch)),dt);
 ch.boost=ch.hunt>0&&ch.len>24;
}

function kill(ch,by){
 ch.alive=false;ch.wait=RESPAWN;ch.mesh.count=0;
 ch.fig.root.visible=false;ch.blob.visible=false;ch.halo.visible=false;
 burst(ch.x,ch.z,ch.hue.color);
 if(ch.i===0)sfx.down();else if(by&&by.i===0)sfx.cut();
 // What it was carrying goes back on the floor. Every other block, so one very
 // long chain does not bury the field it fell on.
 for(let k=0;k<ch.len;k+=2)addLoose(ch.seg[k].x,ch.seg[k].z);
 if(by)by.cut++;
 if(ch.i===0)finish();
 else if(by&&by.i===0)flash(ch.name+' の鎖が切れた','落ちた光は拾える');
}

// --- sound: synthesized on the spot, so nothing is loaded and nothing is
// fetched. Only what happens to the player's own chain makes a noise. ---
let AC=null;
function audio(){
 if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch{return null}}
 if(AC.state==='suspended')AC.resume().catch(()=>{});
 return AC;
}
function tone(freq,dur,type,vol,slide,delay){
 const ac=audio();if(!ac||ac.state!=='running')return;
 const t0=ac.currentTime+(delay||0);
 const o=ac.createOscillator(),g=ac.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,t0);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t0+dur);
 g.gain.setValueAtTime(vol,t0);
 g.gain.exponentialRampToValueAtTime(.001,t0+dur);
 o.connect(g);g.connect(ac.destination);
 o.start(t0);o.stop(t0+dur+.03);
}
const sfx={
 // Every block picked up climbs a step; the ladder starts over as it wraps.
 pick(len){tone(500+(len%12)*30,.09,'triangle',.1,1.4);},
 gear(){tone(880,.08,'triangle',.1);tone(1320,.1,'triangle',.1,1,.07);},
 shield(){tone(420,.16,'triangle',.12,1.6);tone(640,.18,'sine',.1,1.2,.06);},
 burn(){tone(230,.05,'square',.05,.75);},
 cut(){tone(340,.26,'sawtooth',.13,.45);tone(1100,.14,'triangle',.09,.6,.03);},
 down(){tone(160,.55,'sawtooth',.16,.4);tone(90,.6,'sine',.14,.6,.08);},
};

// --- input: steer, and hold to burn ---
// The camera watches from -z looking up the field, which mirrors x on screen:
// screen right is world -x. The mouse is immune (it aims at a ground point),
// but finger and key steering are relative, so both have to flip with it.
const stickDir=(dx,dy)=>Math.atan2(-dx,-dy);
const ctl={mode:'point',tx:0,tz:26,dir:0,boost:false,left:false,right:false};
let dragId=null,dragX=0,dragY=0,boostId=null;
const ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3(),ndc=new T.Vector2();

renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'){ctl.mode='point';ctl.boost=true;return;}
 if(dragId===null){
  dragId=e.pointerId;dragX=e.clientX;dragY=e.clientY;ctl.mode='stick';
  renderer.domElement.setPointerCapture(e.pointerId);
 }else if(boostId===null){boostId=e.pointerId;ctl.boost=true;} // a second finger burns
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(e.pointerType==='mouse'){
  ctl.mode='point';
  ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight*2-1));
  ray.setFromCamera(ndc,camera);
  if(ray.ray.intersectPlane(ground,hit)){ctl.tx=hit.x;ctl.tz=hit.z;}
  return;
 }
 if(e.pointerId!==dragId)return;
 const dx=e.clientX-dragX,dy=e.clientY-dragY;
 if(Math.hypot(dx,dy)>14)ctl.dir=stickDir(dx,dy); // up the screen is away
});
for(const ev of ['pointerup','pointercancel'])renderer.domElement.addEventListener(ev,e=>{
 if(e.pointerType==='mouse')ctl.boost=false;
 if(e.pointerId===dragId)dragId=null;
 if(e.pointerId===boostId){boostId=null;ctl.boost=false;}
});
addEventListener('blur',()=>{dragId=boostId=null;ctl.boost=ctl.left=ctl.right=false;});
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(k==='arrowleft'||k==='a'){ctl.left=true;ctl.mode='keys';}
 if(k==='arrowright'||k==='d'){ctl.right=true;ctl.mode='keys';}
 if(k===' '||k==='shift'){ctl.boost=true;e.preventDefault();}
 if((k==='enter'||k==='r')&&S.phase!=='run')start();
});
addEventListener('keyup',e=>{
 const k=e.key.toLowerCase();
 if(k==='arrowleft'||k==='a')ctl.left=false;
 if(k==='arrowright'||k==='d')ctl.right=false;
 if(k===' '||k==='shift')ctl.boost=false;
});
const boostBtn=$('#boost');
boostBtn.addEventListener('pointerdown',e=>{ctl.boost=true;e.preventDefault();});
for(const ev of ['pointerup','pointercancel','pointerleave'])boostBtn.addEventListener(ev,()=>{ctl.boost=false;});

// --- run control ---
const S={phase:'ready',t:0,seedDebt:0,seedTarget:SEED_TARGET};
function best(){try{return JSON.parse(localStorage.getItem('pip-chain-best')||'null')}catch{return null}}
function saveBest(h,c){
 const b=best();
 if(b&&b.height>=h)return;
 try{localStorage.setItem('pip-chain-best',JSON.stringify({height:h,cut:c}))}catch{}
}
function flash(label,note){
 const el=$('#pickup');
 el.innerHTML='<b></b><span></span>';
 el.firstChild.textContent=label;el.lastChild.textContent=note||'';
 el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
}
function start(){
 audio(); // woken by the press itself, which is what the browser asks of it
 S.seedTarget=SEED_TARGET;
 loose.n=0;scatter(S.seedTarget);
 const you=chains[0];
 seed(you,0,0,0);you.cut=0;you.blob.visible=true;
 ctl.tx=0;ctl.tz=26;ctl.dir=0;ctl.boost=false;
 for(let i=1;i<chains.length;i++){
  const spot=freeSpot();
  seed(chains[i],spot.x,spot.z,spot.a);
  chains[i].cut=0;chains[i].blob.visible=true;
  chains[i].len=14+Math.floor(Math.random()*14);
  layout(chains[i]);
 }
 S.phase='run';S.seedDebt=0;S.nextGear=GEAR_EVERY*.5;
 for(const g of gears){g.live=false;g.o.visible=false;}
 $('#overlay').hidden=true;
 hud();
}
function finish(){
 S.phase='over';
 const you=chains[0],b=best();
 saveBest(you.peak,you.cut);
 $('#o-title').textContent='この分岐は捨てられた';
 $('#o-lead').textContent='頭がぶつかったところで鎖は途切れる。抱えていた分は光に戻り、残った一番長い鎖が続きを刻む。';
 $('#o-score').innerHTML='<b></b><span></span>';
 $('#o-score').firstChild.textContent=you.peak;
 $('#o-score').lastChild.textContent='到達した高さ · 切った鎖 '+you.cut+' 本'+(b?' · これまでの最高 '+b.height:'');
 $('#o-score').hidden=false;$('.rules').hidden=true;
 $('#start').textContent='もう一度';
 $('#overlay').hidden=false;
}

let hudAt=0;
function hud(){
 const you=chains[0];
 $('#height').textContent=you.len;
 $('#cut').textContent=you.cut;
 const b=best();
 $('#best').textContent=b?b.height:'—';
 const rank=chains.slice().sort((p,q)=>q.len-p.len);
 const board=$('#board');
 if(board.children.length!==rank.length)
  board.innerHTML=rank.map(()=>'<li><i></i><span></span><em class="mix">'+KINDS.map(k=>'<u style="--k:#'+k.color.toString(16).padStart(6,'0')+'"></u>').join('')+'</em><b></b></li>').join('');
 [...board.children].forEach((li,k)=>{
  const c=rank[k];
  li.className=c.i===0?'you':'';
  li.querySelector('i').style.background='#'+c.hue.color.toString(16).padStart(6,'0');
  li.querySelector('span').textContent=c.name+(c.shield>0?' ◈':(c.charge>0?' ◇'+c.charge:''));
  // The mix: one dot per kind, carrying how many of it this chain has taken.
  const dots=li.querySelectorAll('.mix u');
  for(let j=0;j<4;j++){
   const n=c.got[j];
   dots[j].textContent=n>0?n:'';
   dots[j].classList.toggle('on',n>0);
  }
  li.querySelector('b').textContent=c.alive?c.len:'—';
 });
}

// --- loop ---
const clock=new T.Clock();
const M4=new T.Matrix4(),QT=new T.Quaternion(),EU=new T.Euler(),V3=new T.Vector3(),SC=new T.Vector3(1,1,1),tmp=new T.Vector3();

function step(dt){
 for(const ch of chains){
  if(!ch.alive){
   if(ch.i>0){ch.wait-=dt;if(ch.wait<=0){const s=freeSpot();seed(ch,s.x,s.z,s.a);ch.blob.visible=true;}}
   continue;
  }
  if(ch.i===0){
   // The price of length: a stout chain turns like one. Bitcoin sits on the
   // turn as well for a moment after it is taken.
   const turn=TURN*(ch.slow>0?SLOW_TURN:1)/scaleOf(ch);
   if(ctl.mode==='keys'&&(ctl.left||ctl.right))ch.a=wrap(ch.a+((ctl.left?1:0)-(ctl.right?1:0))*turn*dt);
   else{
    const want=ctl.mode==='stick'?ctl.dir:Math.atan2(ctl.tx-ch.x,ctl.tz-ch.z);
    // A gentle wish gets the gentle circle; a wish for the opposite direction
    // is answered hard, so a reversal is a snap rather than a wide arc.
    const rate=turn*(1+1.7*Math.min(1,Math.abs(wrap(want-ch.a))/Math.PI));
    steer(ch,want,rate,dt);
   }
   ch.boost=ctl.boost;
  }else drive(ch,dt);

  if(ch.gear>0)ch.gear-=dt;
  if(ch.slow>0)ch.slow-=dt;
  if(ch.magnet>0)ch.magnet-=dt;
  if(ch.grace>0)ch.grace-=dt;
  const burning=ch.boost&&ch.len>MIN_BOOST&&ch.gear<=0; // a turning gear pays instead
  const fast=burning||ch.gear>0;
  advance(ch,(fast?BOOST_SPEED:SPEED)*dt);
  if(burning){
   ch.burn+=dt;
   const every=BURN_EVERY*(ch.magnet>0?MAGNET_BURN:1); // dearer while the magnet runs
   while(ch.burn>=every&&ch.len>MIN_BOOST){
    ch.burn-=every;
    const tail=ch.seg[ch.len-1];
    addLoose(tail.x,tail.z);ch.len--;
    if(ch.i===0)sfx.burn();
   }
  }else ch.burn=0;
  layout(ch);
  ch.fig.root.position.set(ch.x,0,ch.z);
  ch.fig.root.rotation.y=ch.a;
  ch.blob.position.set(ch.x,.2,ch.z);
  setMotion(ch,fast?'Dash':'Run');
  if(ch.len>ch.peak)ch.peak=ch.len;
 }

 // heads: against the wall, and against everyone else's body
 for(const ch of chains){
  if(!ch.alive)continue;
  if(ch.x*ch.x+ch.z*ch.z>LETHAL*LETHAL){kill(ch,null);continue;}
  let hitBy=null;
  for(const o of chains){
   if(o===ch||!o.alive)continue;
   const hr=HIT_R+(scaleOf(o)-1)*.33,hr2=hr*hr;
   for(let k=0;k<o.len;k++){
    const s=o.seg[k],dx=s.x-ch.x,dz=s.z-ch.z;
    if(dx*dx+dz*dz<hr2){hitBy=o;break;}
   }
   if(hitBy)break;
  }
  if(hitBy){
   if(ch.grace>0)continue;
   if(ch.shield>0&&ch.len>MIN_BOOST){
    // The shield takes it: one block gone from the tail, and a breath of grace
    // so the same body does not take the head again on the next frame.
    ch.shield--;ch.grace=SHIELD_GRACE;ch.pop=0;
    const tail=ch.seg[ch.len-1];addLoose(tail.x,tail.z,ADA);ch.len--;
    burst(ch.x,ch.z,0x1a4dff);
    if(ch.i===0){flash('盾が受けた','ブロック1つで耐えた');sfx.shield();}
    continue;
   }
   kill(ch,hitBy);
  }
 }

 // light off the floor: what it is decides what it does
 for(const ch of chains){
  if(!ch.alive)continue;
  const er=eatR(ch),er2=er*er,pulling=ch.magnet>0;
  for(let i=loose.n-1;i>=0;i--){
   let dx=loose.x[i]-ch.x,dz=loose.z[i]-ch.z,d2=dx*dx+dz*dz;
   if(pulling&&d2<MAGNET_R*MAGNET_R&&d2>er2*.5){
    const d=Math.sqrt(d2),m=Math.min(d,MAGNET_PULL*dt)/d;
    loose.x[i]-=dx*m;loose.z[i]-=dz*m;
    dx=loose.x[i]-ch.x;dz=loose.z[i]-ch.z;d2=dx*dx+dz*dz;
   }
   if(d2<er2){
    const kind=loose.k[i];
    takeLoose(i);
    ch.got[kind]++;
    let gain=1;
    if(kind===BTC){gain=2;ch.slow=SLOW_TIME;}
    else if(kind===ETH){ch.magnet=MAGNET_TIME;}
    else if(kind===ADA&&ch.shield<SHIELD_MAX){ch.charge++;if(ch.charge>=SHIELD_ADA){ch.charge=0;ch.shield++;if(ch.i===0)flash('盾ができた','次の一撃をブロック1つで耐える');}}
    ch.len=Math.min(MAX_LEN,ch.len+gain);
    if(ch.i===0){
     sfx.pick(ch.len);
     if(kind===BTC)flash('Bitcoin +2','数秒、曲がりが重い');
     else if(kind===ETH)flash('Ethereum','周りの光を引き寄せる · 燃やすと高くつく');
    }
   }
  }
 }
 // the field is never allowed to run dry
 if(loose.n<S.seedTarget){
  S.seedDebt+=SEED_RATE*dt;
  while(S.seedDebt>=1&&loose.n<S.seedTarget){S.seedDebt--;scatter(1);}
 }

 // a gear now and then: speed for a while without paying blocks for it
 S.nextGear-=dt;
 if(S.nextGear<=0){
  S.nextGear=GEAR_EVERY;
  const slot=gears.find(g=>!g.live);
  if(slot){
   const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(FIELD-8);
   slot.o.position.set(Math.cos(a)*r,.75,Math.sin(a)*r);
   slot.live=true;slot.life=GEAR_LIFE;slot.o.visible=true;
  }
 }
 for(const g of gears){
  if(!g.live)continue;
  g.life-=dt;g.o.rotation.y+=dt*2.4;
  let taken=false;
  for(const ch of chains){
   if(!ch.alive)continue;
   if(Math.hypot(g.o.position.x-ch.x,g.o.position.z-ch.z)<1.5){
    ch.gear=GEAR_TIME;taken=true;
    if(ch.i===0){flash('ギア加速','しばらく燃やさずに速い');sfx.gear();}
    break;
   }
  }
  if(taken||g.life<=0){g.live=false;g.o.visible=false;}
 }

 // and the map the other chains read, rebuilt from where everything ended up
 occ.fill(0);
 for(const ch of chains){
  if(!ch.alive)continue;
  for(let k=0;k<ch.len;k++){
   const i=cell(ch.seg[k].x,ch.seg[k].z);
   if(i>=0)occ[i]=ch.i+1;
  }
 }
}

function draw(dt){
 for(const ch of chains){
  if(!ch.alive){ch.mesh.count=0;continue;}
  const base=scaleOf(ch);
  for(let k=0;k<ch.len;k++){
   const s=ch.seg[k];
   // The last few taper, so the end of a chain reads as an end.
   const t=ch.len-k,sc=(t<4?.55+t*.115:1)*base;
   EU.set(0,s.a,0);QT.setFromEuler(EU);
   V3.set(s.x,.12+.33*sc,s.z);SC.set(sc,sc,sc);
   M4.compose(V3,QT,SC);
   ch.mesh.setMatrixAt(k,M4);
  }
  ch.mesh.count=ch.len;ch.mesh.instanceMatrix.needsUpdate=true;
  ch.mixer.update(dt);
  ch.fig.tick(S.t,ch.motion,dt,0);
  // The shield: a ring that breathes around the head while it is held, and
  // on the hit it takes, blows out to three times its size and is gone.
  const h=ch.halo;
  if(ch.shield>0){
   h.visible=true;h.position.set(ch.x,.9,ch.z);
   const pulse=1+Math.sin(S.t*5)*.06;h.scale.setScalar(pulse);
   h.rotation.y+=dt*1.6;h.children[0].material.opacity=.85;h.children[3].material.opacity=.12;
  }else if(ch.pop<1){
   ch.pop=Math.min(1,ch.pop+dt/.45);
   h.visible=true;h.position.set(ch.x,.9,ch.z);
   h.scale.setScalar(1+ch.pop*2.2);
   h.children[0].material.opacity=.85*(1-ch.pop);h.children[3].material.opacity=.12*(1-ch.pop);
   if(ch.pop>=1)h.visible=false;
  }else h.visible=false;
 }
 SC.set(1,1,1);
 // Each kind is its own mesh, so the floor is walked once and every block is
 // filed under the mesh that draws its shape.
 const kn=[0,0,0,0];
 for(let i=0;i<loose.n;i++){
  const k=loose.k[i];
  EU.set(S.t*1.2+loose.r[i],S.t*1.6+loose.r[i]*2,0);QT.setFromEuler(EU);
  V3.set(loose.x[i],.5+Math.sin(S.t*2.4+loose.r[i])*.11,loose.z[i]);
  M4.compose(V3,QT,SC);
  looseMeshes[k].setMatrixAt(kn[k]++,M4);
 }
 for(let k=0;k<4;k++){looseMeshes[k].count=kn[k];looseMeshes[k].instanceMatrix.needsUpdate=true;}

 for(const b of bursts){
  if(b.t>=1){b.o.visible=false;continue;}
  b.t+=dt/.6;
  const f=Math.min(1,b.t);
  b.o.scale.setScalar(1+f*13);
  b.o.material.opacity=.9*(1-f);
 }
}

renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);
 S.t+=dt;
 if(S.phase==='run')step(dt);
 draw(dt);

 const you=chains[0];
 if(you){
  // The camera climbs with the chain: what you need to see is not PIP, it is
  // how much of the field your own body has started to take up.
  const grow=Math.min(1,you.len/150);
  tmp.set(you.x,30+grow*22,you.z-(16+grow*12));
  camera.position.lerp(tmp,Math.min(1,dt*3.2));
  camera.lookAt(you.x,0,you.z+2);
 }

 if(S.phase==='run'&&S.t-hudAt>.18){hudAt=S.t;hud();}
 composer.render();
});

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 bloom.setSize(innerWidth,innerHeight);
});

// --- boot: four figures is a second or two of building, so the loader stays up
// and the page is given a frame between each one ---
// A timeout rather than a frame: a tab that is not on screen is given no
// frames at all, and the run has to be built and ready whether anyone is
// looking at it yet or not.
const frame=()=>new Promise(r=>setTimeout(r,0));
(async()=>{
 chains.push(makeChain(0,racerById('pip')));
 const rest=RACERS.filter(r=>r.id!=='pip').sort(()=>Math.random()-.5).slice(0,AI_COUNT);
 for(let i=0;i<rest.length;i++){await frame();chains.push(makeChain(i+1,rest[i]));}
 for(const ch of chains){ch.fig.root.visible=false;ch.blob.visible=false;ch.mesh.count=0;}
 camera.position.set(0,26,-15);camera.lookAt(0,0,2);
 scatter(SEED_TARGET);draw(0);hud();
 $('#loading').classList.add('done');
 $('#start').onclick=start;
 window.pipChain={S,chains,loose,looseMeshes,KINDS,gears,scene,camera,start,kill,addLoose,scatter,ctl,best,stickDir,scaleOf,eatR};
})();

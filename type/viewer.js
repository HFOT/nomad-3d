import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildMouse} from '../pip/model.js';
import {buildBlobShadow,buildSwarmer,SWARM,SPAWN_R} from '../rush/model.js';
import {makeLabel,buildStreak,buildStage} from './model.js';
import {WORDS_JP,WORDS_EN,BAND} from './words.js';
import {makeMatcher,minLen} from './romaji.js';

const $=s=>document.querySelector(s);

// Sixty seconds, and the only verb is typing. PIP stands still; the words walk
// in; finishing one is the throw. Everything else is the rush yard as it was.
const RUN=60;
const HP_MAX=3,INVULN=.75;
const MAX_ENEMIES=8;
const TOUCH_R=1.1;           // reaching PIP costs a crack
const STREAKS=3;

const renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
$('#stage').appendChild(renderer.domElement);

const scene=new T.Scene();
scene.background=new T.Color(0x0f1618);
scene.fog=new T.Fog(0x0f1618,62,125); // the camera reads the whole yard now
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,220);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;
scene.add(new T.HemisphereLight(0xa8c6d4,0x141a16,1.1));
const key=new T.DirectionalLight(0xffe0b2,1.6);
key.position.set(-8,16,6);scene.add(key);
scene.add(buildStage());

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.5,.7,.88);
composer.addPass(bloom);composer.addPass(new OutputPass());

const pip=buildMouse();scene.add(pip.root);
pip.root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
// Knee-high in the courier yard, but this is PIP's own stage: half again the
// size, up on the dais, where the whole-yard camera can still read it.
pip.root.scale.setScalar(1.9);
pip.root.position.y=.3;
const blob=buildBlobShadow();blob.scale.setScalar(1.9);blob.position.y=.32;scene.add(blob);
const mixer=new T.AnimationMixer(pip.root);
let action=mixer.clipAction(pip.clips.find(c=>c.name==='Idle'));action.play();
let motion='Idle';
function setMotion(name){
 if(name===motion)return;
 const next=mixer.clipAction(pip.clips.find(c=>c.name===name));
 next.reset().play();action.crossFadeTo(next,.15,true);action=next;motion=name;
}

// Swarmer meshes are pooled per kind, as in the rush; labels are made and
// disposed per word, since every word paints its own canvas anyway.
function pool(build){
 const free=[],live=[];
 return {
  live,
  take(){const o=free.pop()||build();o.visible=true;scene.add(o);live.push(o);return o;},
  give(o){const i=live.indexOf(o);if(i>=0)live.splice(i,1);o.visible=false;scene.remove(o);free.push(o);},
 };
}
const swarmPools={};
function takeSwarm(kind){(swarmPools[kind]??=pool(()=>buildSwarmer(kind)));return swarmPools[kind].take();}
function giveSwarm(kind,obj){swarmPools[kind].give(obj);}
const streaks=[];for(let i=0;i<STREAKS;i++){const m=buildStreak();scene.add(m);streaks.push({o:m,t:1});}

// --- sound: synthesized on the spot, nothing loaded ---
let AC=null;
function audio(){
 if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch{return null}}
 if(AC.state==='suspended')AC.resume().catch(()=>{});
 return AC;
}
function toneAt(freq,dur,type,vol,slide,delay){
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
 hit(n){toneAt(620+n*36,.05,'triangle',.07);},           // one letter landed
 word(){toneAt(760,.09,'triangle',.11,1.5);toneAt(1140,.12,'triangle',.09,1.2,.06);},
 miss(){toneAt(170,.09,'square',.08,.8);},
 kill(){toneAt(300,.2,'sawtooth',.11,.5);},
 hurt(){toneAt(150,.4,'sawtooth',.15,.45);},
 mint(){toneAt(660,.12,'triangle',.1);toneAt(990,.16,'triangle',.1,1,.09);},
};

const S={phase:'ready',t:0,left:RUN,hp:HP_MAX,invuln:0,
 kills:0,hits:0,miss:0,shake:0};
const enemies=[];
let target=null;

const progress=()=>1-S.left/RUN;
const spawnGap=()=>2.3-progress()*1.35;
const walkSpeed=()=>2.1+progress()*1.6;

// The lists shelved by how many keystrokes the shortest spelling needs, so
// the quick arrivals carry little and the heavy ones carry a lot.
function shelve(list){
 const out={short:[],mid:[],long:[]};
 for(const w of list){
  const n=minLen(w.k);
  out[n<=5?'short':n<=8?'mid':'long'].push({...w,f0:makeMatcher(w.k).guide().rest[0]});
 }
 return out;
}
const LEX={jp:shelve(WORDS_JP),en:shelve(WORDS_EN)};
let lang='jp';
try{lang=localStorage.getItem('pip-type-lang')==='en'?'en':'jp'}catch{}
// A word whose first keystroke no walking word already answers to, so the
// first key always names exactly one of them. In a crowd a duplicate is
// allowed, and the nearest one answers.
function pickWord(kind){
 const band=LEX[lang][BAND[kind]];
 const used=new Set(enemies.map(e=>e.f0));
 for(let i=0;i<14;i++){
  const w=band[Math.floor(Math.random()*band.length)];
  if(!used.has(w.f0)||i===13)return w;
 }
 return band[0];
}
function pickKind(){
 const p=progress();
 const open=[['rock',5],['dart',p>.18?4:0],['split',p>.35?2:0],['hulk',p>.3?2:0]].filter(k=>k[1]>0);
 let total=0;for(const k of open)total+=k[1];
 let r=Math.random()*total;
 for(const k of open){r-=k[1];if(r<=0)return k[0];}
 return 'rock';
}
function spawnEnemy(kind,word,x,z){
 if(enemies.length>=MAX_ENEMIES)return null;
 kind=kind||pickKind();word=word||pickWord(kind);
 if(x===undefined){
  const a=Math.random()*Math.PI*2;
  x=Math.cos(a)*SPAWN_R;z=Math.sin(a)*SPAWN_R;
 }
 if(typeof word==='string')word={d:word,k:word};
 const m=makeMatcher(word.k);
 const o=takeSwarm(kind);
 o.position.set(x,.5,z);
 o.scale.setScalar(.9+Math.random()*.28);
 const label=makeLabel();
 const g0=m.guide();label.paint(word.d,word.k,'',g0.rest,false);
 scene.add(label.sprite);
 const e={o,kind,d:word.d,k:word.k,m,f0:word.f0||g0.rest[0],first:m.first(),label,seed:Math.random()*9,dying:0,mad:0};
 enemies.push(e);
 return e;
}
function removeEnemy(e){
 const i=enemies.indexOf(e);if(i>=0)enemies.splice(i,1);
 giveSwarm(e.kind,e.o);
 scene.remove(e.label.sprite);e.label.dispose();
 if(target===e)target=null;
}
function killEnemy(e){
 const x=e.o.position.x,z=e.o.position.z;
 removeEnemy(e);
 S.kills++;sfx.kill();
 // The splitter's answer to being read: two quick short words where it fell.
 if(e.kind==='split')for(const d of [-1,1])spawnEnemy('dart',undefined,x+d*1.2,z+d*.8);
 hud();
}

// --- typing. The one verb. ---
function repaint(e,mad){
 const g=e.m.guide();
 e.label.paint(e.d,e.k,g.typed,g.rest,mad);
}
function keyChar(ch){
 if(S.phase!=='run')return;
 ch=ch.toLowerCase();
 if(!/^[a-z]$/.test(ch))return;
 if(target&&target.dying===0){
  if(target.m.tryChar(ch)){
   S.hits++;sfx.hit(target.m.guide().typed.length);
   if(target.m.done())fire(target);
   else repaint(target,false);
  }else{
   S.miss++;target.mad=.22;sfx.miss();
   repaint(target,true);
  }
  hud();return;
 }
 // no lock yet: the first key chooses the nearest word that answers to it
 let best=null,bd=1e9;
 for(const e of enemies){
  if(e.dying>0||!e.first.has(ch))continue;
  const d=Math.hypot(e.o.position.x,e.o.position.z);
  if(d<bd){bd=d;best=e;}
 }
 if(best){
  best.m.tryChar(ch);
  target=best;S.hits++;sfx.hit(1);
  if(target.m.done())fire(target);
  else repaint(target,false);
 }else{S.miss++;sfx.miss();}
 hud();
}
function fire(e){
 e.dying=.13;sfx.word();
 const s=streaks.find(k=>k.t>=1)||streaks[0];
 const p=e.o.position;
 const d=Math.hypot(p.x,p.z);
 s.o.visible=true;s.t=0;
 s.o.position.set(p.x/2,1,p.z/2);
 s.o.scale.set(Math.max(.1,d),1,1);
 s.o.rotation.y=Math.atan2(p.x,p.z)+Math.PI/2;
 pip.root.rotation.y=Math.atan2(p.x,p.z);
 if(target===e)target=null;
}

function hurt(){
 if(S.invuln>0)return;
 S.hp--;S.invuln=INVULN;S.shake=Math.max(S.shake,.45);
 sfx.hurt();hud();
 if(S.hp<=0)finish(false);
}

// --- input: hardware keys, and a soft keyboard coaxed out on touch ---
addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(S.phase!=='run'&&(e.key==='Enter'||e.key==='r'))return start();
 if(S.phase==='run'&&e.key.length===1){keyChar(e.key);e.preventDefault();}
});
const kb=$('#kb');
const coarse=matchMedia('(pointer:coarse)').matches;
kb.addEventListener('beforeinput',e=>{
 if(e.data)for(const ch of e.data)keyChar(ch);
 e.preventDefault();
});
kb.addEventListener('input',()=>{kb.value='';});
function summonKeyboard(){
 if(!coarse)return;
 kb.focus({preventScroll:true});
}
renderer.domElement.addEventListener('pointerdown',()=>{if(S.phase==='run')summonKeyboard();});

// --- run control (the minted chain works as it does in the rush) ---
function chain(){try{return JSON.parse(localStorage.getItem('pip-type-chain')||'[]')}catch{return[]}}
function renderChain(){
 const c=chain().slice(-14);
 $('#chain').innerHTML=c.map(b=>'<i class="'+(b?'full':'empty')+'"></i>').join('');
 $('#minted').textContent=chain().filter(Boolean).length;
}
function pushChain(ok){
 const c=chain();c.push(ok);
 try{localStorage.setItem('pip-type-chain',JSON.stringify(c.slice(-200)))}catch{}
 renderChain();
}
function clearField(){
 for(const e of enemies.slice())removeEnemy(e);
 for(const s of streaks){s.t=1;s.o.visible=false;}
 target=null;
}
let nextSpawn=0;
function start(){
 audio();
 clearField();
 Object.assign(S,{phase:'run',t:0,left:RUN,hp:HP_MAX,invuln:0,kills:0,hits:0,miss:0,shake:0});
 nextSpawn=.7;
 $('#overlay').hidden=true;
 setMotion('Run');hud();
 summonKeyboard();
}
function finish(survived){
 S.phase='over';setMotion('Idle');
 pushChain(survived);
 if(survived)sfx.mint();
 const typed=S.hits+S.miss;
 const acc=typed?Math.round(S.hits/typed*100):100;
 const mins=Math.max(.05,(RUN-S.left)/60);
 const wpm=Math.round(S.hits/5/mins);
 $('#o-title').textContent=survived?'ブロックが刻まれた':'ギアボックス停止';
 $('#o-lead').textContent=survived
  ?'60秒を打ち切った。FORGEがこのランを1ブロックとして刻む。'
  :'ヒビが入りきった。このスロットは空のブロックになる。';
 $('#o-score').innerHTML='<b></b><span></span>';
 $('#o-score').firstChild.textContent=S.kills;
 $('#o-score').lastChild.textContent='捌いた滞留 · 正確さ '+acc+'% · '+wpm+' WPM · ミス '+S.miss;
 $('#o-score').hidden=false;$('.rules').hidden=true;
 $('#start').textContent='もう一度';
 $('#overlay').hidden=false;
 if(coarse)kb.blur();
}
function hud(){
 $('#hp').textContent='●'.repeat(Math.max(0,S.hp))+'○'.repeat(HP_MAX-Math.max(0,S.hp));
 $('#kills').textContent=S.kills;
 const typed=S.hits+S.miss;
 $('#acc').textContent=(typed?Math.round(S.hits/typed*100):100)+'%';
}
$('#start').onclick=start;
function setLang(l){
 lang=l;
 try{localStorage.setItem('pip-type-lang',l)}catch{}
 $('#lang-jp').classList.toggle('on',l==='jp');
 $('#lang-en').classList.toggle('on',l==='en');
}
$('#lang-jp').onclick=()=>setLang('jp');
$('#lang-en').onclick=()=>setLang('en');
setLang(lang);

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

  nextSpawn-=dt;
  if(nextSpawn<=0){nextSpawn=spawnGap();spawnEnemy();}

  const speed=walkSpeed();
  for(let i=enemies.length-1;i>=0;i--){
   const e=enemies[i],p=e.o.position;
   if(e.dying>0){
    e.dying-=dt;
    if(e.dying<=0){killEnemy(e);continue;}
   }else{
    const d=Math.hypot(p.x,p.z),n=d||1;
    const v=speed*SWARM[e.kind].speed*.62;
    p.x-=p.x/n*v*dt;p.z-=p.z/n*v*dt;
    if(d<TOUCH_R+SWARM[e.kind].size){hurt();removeEnemy(e);continue;}
   }
   p.y=.5+Math.sin(S.t*6+e.seed)*.09;
   e.o.rotation.y+=dt*1.6;e.o.rotation.x+=dt*.9;
   if(e.mad>0){e.mad-=dt;if(e.mad<=0)repaint(e,false);}
   e.label.sprite.position.set(p.x,p.y+SWARM[e.kind].size+.55,p.z);
  }

  // PIP watches whoever is being read, or whoever is closest
  let face=target;
  if(!face){
   let bd=1e9;
   for(const e of enemies){const d=Math.hypot(e.o.position.x,e.o.position.z);if(d<bd){bd=d;face=e;}}
  }
  if(face){
   const want=Math.atan2(face.o.position.x,face.o.position.z);
   let d=want-pip.root.rotation.y;
   while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
   pip.root.rotation.y+=d*Math.min(1,dt*9);
  }

  const lit=S.invuln>0&&Math.sin(S.t*40)>0;
  pip.root.visible=!lit;
  $('#bar').style.transform='scaleX('+(1-S.left/RUN)+')';
  $('#time').textContent=Math.ceil(S.left);
 }

 for(const s of streaks){
  if(s.t>=1){s.o.visible=false;continue;}
  s.t+=dt/.16;
  s.o.material.opacity=.9*(1-Math.min(1,s.t));
 }

 mixer.update(dt);
 pip.tick(S.t,motion,0);
 if(S.shake>0)S.shake=Math.max(0,S.shake-dt*1.8);
 const jolt=S.shake*S.shake*1.4;
 tmp.set((Math.random()-.5)*jolt,52+(Math.random()-.5)*jolt,-24);
 camera.position.lerp(tmp,Math.min(1,dt*7));
 camera.lookAt(0,0,0);
 composer.render();
});

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 bloom.setSize(innerWidth,innerHeight);
});

camera.position.set(0,52,-24);camera.lookAt(0,0,0);
renderChain();hud();
$('#loading').classList.add('done');
window.pipType={S,enemies,scene,camera,start,spawnEnemy,keyChar,chain,setLang,getTarget:()=>target};

import * as T from 'three';import{OrbitControls}from'three/addons/controls/OrbitControls.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';import{RenderPass}from'three/addons/postprocessing/RenderPass.js';import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';import{OutputPass}from'three/addons/postprocessing/OutputPass.js';
import{materials as gateMaterials}from'../gate/materials.js';import{makeBuilders}from'./buildings.js';import{optimize}from'./merge.js';
// Structure-grammar lab: one generator, four operator profiles, side by side.
// The question on trial: can you tell them apart by silhouette alone?
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.3));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#2b2030');scene.fog=new T.FogExp2('#2b2030',.0016);
const camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,600);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.5;controls.minDistance=10;controls.maxDistance=340;
camera.position.set(0,40,238);controls.target.set(0,7,0);controls.update();
const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.22;
scene.add(new T.HemisphereLight(0xe8a06a,0x2a2026,.6));
const sun=new T.DirectionalLight(0xffb36b,1.9);sun.position.set(-40,20,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-190,right:190,top:80,bottom:-80});scene.add(sun);
scene.add(new T.DirectionalLight(0x5a6bd8,.7)).position.set(10,14,-30);
const ground=new T.Mesh(new T.PlaneGeometry(560,280),new T.MeshStandardMaterial({color:0x3a3433,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const M=gateMaterials(),B=makeBuilders(M);
const ticks=[];
function seedRand(s){s=s>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function mesh(p,geo,mat,x,y,z){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
// A curtain wall around a hexagon: health drives brick rows and missing bricks.
function wallHex(p,R,healths,depth,skipEdge){
 const rand=seedRand(R*97+13);
 for(let k=0;k<6;k++){
  if(skipEdge&&skipEdge(k))continue;
  const h=healths[k%healths.length];
  const a1=Math.PI-k*Math.PI/3,a2=Math.PI-(k+1)*Math.PI/3;
  const x1=Math.sin(a1)*R,z1=Math.cos(a1)*R,x2=Math.sin(a2)*R,z2=Math.cos(a2)*R;
  const len=Math.hypot(x2-x1,z2-z1),ry=Math.atan2(x2-x1,z2-z1)-Math.PI/2;
  const seg=new T.Group();seg.position.set((x1+x2)/2,0,(z1+z2)/2);seg.rotation.y=-ry;p.add(seg);
  const rows=2+Math.round(h*4),bh=.75;
  for(let r=0;r<rows;r++){
   let x=-len/2+(r%2)*.8;
   while(x<len/2-.3){
    const bw=Math.min(1.5+rand()*.5,len/2-x);
    if(rand()>(1-h)*.45){
     const b=mesh(seg,new T.BoxGeometry(bw-.12,bh-.08,depth),M.stone.clone(),x+bw/2,bh/2+r*bh,0);
     b.material.color.offsetHSL(0,0,(rand()-.5)*.07);
    }
    x+=bw;
   }
  }
 }
}
// A small gatehouse: two towers, an arch, one lantern flame scaled by strength.
function miniGate(p,x,z,ry,strength){
 const gg=new T.Group();gg.position.set(x,0,z);gg.rotation.y=ry;p.add(gg);
 for(const s of [-1,1]){mesh(gg,new T.CylinderGeometry(1.5,1.7,7.5,12),M.stone,s*3.1,3.75,0);mesh(gg,new T.ConeGeometry(1.9,1.9,12),M.slate,s*3.1,8.4,0);}
 mesh(gg,new T.BoxGeometry(4.6,5.4,2),M.stone,0,2.7,0);
 mesh(gg,new T.CylinderGeometry(1.5,1.5,2.2,16,1,false,0,Math.PI),M.dark,0,2.6,0).rotation.z=Math.PI/2;
 const fl=new T.MeshStandardMaterial({color:0xfff1d8,emissive:0xffa324,emissiveIntensity:.4+strength*2.6});
 mesh(gg,new T.SphereGeometry(.5,12,10),fl,0,6.4,0).castShadow=false;
 if(strength>.3){const l=new T.PointLight(0xffa324,.4+strength*1.2,16);l.position.set(0,6.4,.6);gg.add(l);}
 return gg;
}
// The pool lighthouse, scaled by output; a weak one keeps its scaffolding on.
function miniLighthouse(p,x,z,power,scaffolded){
 const g=new T.Group();g.position.set(x,0,z);p.add(g);
 const h=7+power*15;
 mesh(g,new T.CylinderGeometry(1.6,2.4,h,16),M.stone,0,h/2,0);
 mesh(g,new T.CylinderGeometry(1.9,1.9,.5,16),M.brass,0,h,0);
 const fl=new T.MeshStandardMaterial({color:0xfff1d8,emissive:0xffa324,emissiveIntensity:.25+power*2.8});
 const flame=mesh(g,new T.SphereGeometry(.9,14,10),fl,0,h+1.1,0);flame.scale.set(1,1.4,1);flame.castShadow=false;
 mesh(g,new T.ConeGeometry(2,1.6,14),M.slate,0,h+2.6,0);
 const l=new T.PointLight(0xffa324,.3+power*2.4,40);l.position.set(0,h+1,0);g.add(l);
 ticks.push(t=>{fl.emissiveIntensity=(.25+power*2.8)*(1+.18*Math.sin(t*11+x));});
 if(scaffolded){
  for(const s of [-1,1]){mesh(g,new T.BoxGeometry(.22,h+3,.22),M.wood,s*2.9,(h+3)/2,2.6);mesh(g,new T.BoxGeometry(.22,h+3,.22),M.wood,s*2.9,(h+3)/2,-2.6);}
  for(let y=2;y<h+2;y+=2.4){mesh(g,new T.BoxGeometry(6.2,.16,.2),M.wood,0,y,2.6);mesh(g,new T.BoxGeometry(6.2,.16,.2),M.wood,0,y,-2.6);}
 }
 return h;
}
function cratePile(p,x,z,seed,big){
 const rand=seedRand(seed);const n=big?5+Math.floor(rand()*4):2+Math.floor(rand()*2);
 for(let i=0;i<n;i++){
  const s=.9+rand()*.9;
  mesh(p,new T.BoxGeometry(s,s,s),rand()<.75?M.wood:M.brass,x+(rand()-.5)*3,s/2+(i>2?s*(i-2)*.5:0),z+(rand()-.5)*3).rotation.y=rand()*.8;
 }
}
function scaffoldFrame(p,x,z,ry){
 const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;p.add(g);
 for(const sx of [-2,2])for(const sz of [-1.5,1.5])mesh(g,new T.BoxGeometry(.24,4.6,.24),M.wood,sx,2.3,sz);
 for(const y of [2,4.4]){mesh(g,new T.BoxGeometry(4.5,.2,.2),M.wood,0,y,1.5);mesh(g,new T.BoxGeometry(4.5,.2,.2),M.wood,0,y,-1.5);}
 mesh(g,new T.BoxGeometry(.2,.2,3.2),M.wood,-2,4.4,0);mesh(g,new T.BoxGeometry(.2,.2,3.2),M.wood,2,4.4,0);
}
// ---- The generator. One profile in, one town out.
function buildOperatorTown(p){
 const town=new T.Group();
 const rand=seedRand(p.seed||7);
 if(p.pools>1){
  // Row-house pools: several enclosures, a single shared gate, one relay for all.
  const R=11;
  for(let i=0;i<p.pools;i++){
   const cx=(i-(p.pools-1)/2)*R*1.9;
   const enc=new T.Group();enc.position.set(cx,0,0);town.add(enc);
   wallHex(enc,R,p.poolHealth,.6,k=>i>0&&k===4||i<p.pools-1&&k===1);
   miniLighthouse(enc,0,-2,p.lighthouse,p.lighthouse<.4);
  }
  miniGate(town,0,R+1.5,0,p.poolHealth[0]);
 }else{
  const R=p.stake?18+p.stake*14:24;
  wallHex(town,R,p.poolHealth,p.relays>1?1.3:.6);
  const gateCount=Math.max(1,Math.round(p.gates??6));
  for(let k=0;k<6&&k<gateCount;k++){
   const a=Math.PI-k*Math.PI/3;
   miniGate(town,Math.sin(a)*R,Math.cos(a)*R,a,p.poolHealth[k%p.poolHealth.length]);
  }
  const lh=miniLighthouse(town,0,0,p.lighthouse,p.lighthouse<.4);
  // The assembly hall: DRep power sets its scale. Past ~.6 it out-grows the lighthouse.
  if(p.drep>0){
   const hall=B.buildHall('assembly');const s=.5+p.drep*1.8;
   hall.root.scale.setScalar(s);hall.root.position.set(0,0,-R*.45);town.add(hall.root);
  }
  // Catalyst yard: intake becomes crates and scaffolds; delivery becomes houses.
  const built=Math.round((p.catalystBuilt??0)*5),intake=Math.round((p.catalystIn??0)*8);
  for(let i=0;i<intake-built;i++)cratePile(town,R*.45+(rand()-.5)*10,4+(rand()-.5)*14,p.seed+i*31,true);
  for(let i=0;i<Math.max(0,Math.round((p.catalystIn??0)*4-built));i++)scaffoldFrame(town,-R*.45+(rand()-.5)*8,6+(rand()-.5)*10,rand()*3);
  for(let i=0;i<built;i++){const h=B.buildHouse(p.seed+i*53);h.root.position.set(R*.4+(rand()-.5)*9,0,-6+(rand()-.5)*10);h.root.rotation.y=rand()*6.3;town.add(h.root);}
  // Delegator homes.
  const homes=Math.round((p.delegators??0)*9);
  for(let i=0;i<homes;i++){
   const a=rand()*Math.PI*2,r=R*.45+rand()*R*.35;
   const h=B.buildHouse(p.seed+900+i*17);h.root.position.set(Math.sin(a)*r*-1,0,Math.cos(a)*r);h.root.rotation.y=rand()*6.3;
   if(Math.abs(h.root.position.x)<R*.3&&h.root.position.z<0)h.root.position.x-=R*.35;
   town.add(h.root);
  }
 }
 return town;
}
const PROFILES=[
 {seed:11,pools:1,relays:3,gates:6,poolHealth:[.9,.85,.9,.8,.9,.85],lighthouse:.8,drep:.3,catalystIn:.2,catalystBuilt:.2,delegators:.7,stake:.35},
 {seed:23,pools:1,relays:1,gates:2,poolHealth:[.35,.3,.4,.25,.3,.35],lighthouse:.25,drep:1,catalystIn:.15,catalystBuilt:.05,delegators:.5,stake:.8},
 {seed:37,pools:1,relays:2,gates:3,poolHealth:[.55,.5,.6,.5,.55,.5],lighthouse:.4,drep:.35,catalystIn:1,catalystBuilt:.1,delegators:.3,stake:.5},
 {seed:53,pools:3,relays:1,poolHealth:[.3,.25,.35,.3,.25,.3],lighthouse:.3,drep:.2},
];
const X=[-150,-50,50,150];
PROFILES.forEach((p,i)=>{const t=buildOperatorTown(p);t.position.x=X[i];scene.add(t);optimize(t,()=>{});});
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.4,.4,1.15));composer.addPass(new OutputPass());
const clock=new T.Clock();let elapsed=0;
function frame(){const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;for(const f of ticks)f(elapsed);controls.update();composer.render();}
renderer.setAnimationLoop(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
window.lab={scene,camera,controls,step:frame};

import * as T from 'three';import{OrbitControls}from'three/addons/controls/OrbitControls.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';import{RenderPass}from'three/addons/postprocessing/RenderPass.js';import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';import{OutputPass}from'three/addons/postprocessing/OutputPass.js';
import{buildGate}from'../gate/model.js';import{materials as gateMaterials}from'../gate/materials.js';import{buildDepot}from'../depot/model.js';import{buildAssembly}from'../assembly/model.js';import{buildVault}from'../vault/model.js';import{loadCast}from'./cast.js';import{optimize}from'./merge.js?v=2';import{makeBuilders}from'./buildings.js';
const $=s=>document.querySelector(s);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
// If the browser hands us a software rasterizer, say so: the fix lives in the
// browser's hardware-acceleration setting, not in this page.
{const gl=renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');
 const gpu=info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'';
 console.log('[TOWN] renderer:',gpu||'(masked)');
 if(/swiftshader|software|llvmpipe/i.test(gpu)){
  const note=document.createElement('p');
  note.textContent='⚠ ソフトウェア描画で動いています。ブラウザの「グラフィック アクセラレーション」を有効にすると滑らかになります。';
  note.style.cssText='position:fixed;top:12px;right:12px;max-width:260px;background:#4a1d26ee;border:1px solid #e8384f55;border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.6;color:#ffd3d8;z-index:9';
  document.body.append(note);setTimeout(()=>note.remove(),12000);
 }}renderer.setPixelRatio(Math.min(devicePixelRatio,1.3));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.prepend(renderer.domElement);
const phase=m=>{const el=document.querySelector('#loading span');if(el)el.textContent=m;return new Promise(r=>setTimeout(r,0));};
const scene=new T.Scene();scene.background=new T.Color('#2b2030');scene.fog=new T.FogExp2('#2b2030',.0038);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,900);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.5;controls.minDistance=4;controls.maxDistance=430;
function front(){camera.position.set(0,74,224);controls.target.set(0,2,-10);controls.update();}front();
// Dusk: a low amber sun in the west, indigo rim from the east, warm hemisphere.
const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.24;
scene.add(new T.HemisphereLight(0xe8a06a,0x2a2026,.68));
const sun=new T.DirectionalLight(0xffb36b,2.0);sun.position.set(-30,12,8);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-155,right:155,top:155,bottom:-155});scene.add(sun);
const rim=new T.DirectionalLight(0x5a6bd8,.8);rim.position.set(3,10,-20);scene.add(rim);
// Ground, road and plaza.
const ground=new T.Mesh(new T.PlaneGeometry(560,560),new T.MeshStandardMaterial({color:0x3a3433,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
// Brick floor fills the whole walled hexagon; the dark earth stays outside.
function brickTexture(){
 const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');
 g.fillStyle='#6b6154';g.fillRect(0,0,1024,1024);
 const bw=64,bh=30;let seed=7;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let row=0;row*bh<1024;row++){const off=(row%2)*bw/2;
  for(let x=-bw;x<1024;x+=bw){const v=125+rand()*40;
   g.fillStyle=`rgb(${v|0},${v*.90|0},${v*.76|0})`;
   g.fillRect(x+off+2,row*bh+2,bw-4,bh-4);}}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;
 return tex;
}
const floorTex=brickTexture();floorTex.repeat.set(36,36);
const floor=new T.Mesh(new T.CircleGeometry(131.5,6,Math.PI/2),new T.MeshStandardMaterial({color:0xcabc9f,map:floorTex,bumpMap:floorTex,bumpScale:.05,roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=.04;floor.receiveShadow=true;scene.add(floor);
// Streets: lighter paving over the brick ground. Main street runs in from the
// south gate, the civic approach out to the north; a crooked, darker back
// alley shadows the main street one block west; a ring road ties it together.
const paveMat=new T.MeshStandardMaterial({color:0xd8c7a4,roughness:.92});
const alleyMat=new T.MeshStandardMaterial({color:0x84786c,roughness:.98});
function pave(mat,x,z,w,len,ry=0,y=.07){const p=new T.Mesh(new T.BoxGeometry(w,.06,len),mat);p.position.set(x,y,z);p.rotation.y=ry;p.receiveShadow=true;scene.add(p);return p;}
pave(paveMat,0,70,8,116);
pave(paveMat,0,-70,7,116);
const ringRoad=new T.Mesh(new T.RingGeometry(38,42,64),paveMat);ringRoad.rotation.x=-Math.PI/2;ringRoad.position.y=.065;ringRoad.receiveShadow=true;scene.add(ringRoad);
const plazaPave=new T.Mesh(new T.CircleGeometry(13,40),paveMat);plazaPave.rotation.x=-Math.PI/2;plazaPave.position.y=.075;plazaPave.receiveShadow=true;scene.add(plazaPave);
pave(alleyMat,-10.5,51,2.8,16,.22,.08);
pave(alleyMat,-12.5,36,2.8,16,-.14,.08);
pave(alleyMat,-11,23,2.8,12,.1,.08);
pave(alleyMat,-6.5,56,7,2.2,0,.08);
pave(alleyMat,-6.5,30,7,2.2,0,.08);
// Canal on the east side, same procedural normals the depot page uses.
const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=128;const nc=normalCanvas.getContext('2d'),ni=nc.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;ni.data[i]=128+Math.sin(x*.25+y*.18)*30;ni.data[i+1]=128+Math.cos(y*.31-x*.13)*30;ni.data[i+2]=245;ni.data[i+3]=255;}nc.putImageData(ni,0,0);const normal=new T.CanvasTexture(normalCanvas);normal.wrapS=normal.wrapT=T.RepeatWrapping;
// A reflective Water pass would render the whole town twice; a normal-mapped
// dark plane with a drifting texture reads as canal at this distance for free.
const waterMat=new T.MeshStandardMaterial({color:0x0a1a22,metalness:.75,roughness:.28,normalMap:normal,normalScale:new T.Vector2(.6,.6)});
normal.repeat.set(6,36);
const water=new T.Mesh(new T.PlaneGeometry(24,400),waterMat);water.rotation.x=-Math.PI/2;water.position.set(128,-.05,0);scene.add(water);
// Street lamps along the road: brass poles, amber heads already lit for dusk.
const lampMat=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});
const lampGlow=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.8});
for(let j=0;j<10;j++){
 const x=(j%2?4:-4),z=120-j*11;
 const pole=new T.Mesh(new T.CylinderGeometry(.06,.08,2.6,10),lampMat);pole.position.set(x,1.3,z);pole.castShadow=true;scene.add(pole);
 const head=new T.Mesh(new T.SphereGeometry(.16,16,12),lampGlow);head.position.set(x,2.7,z);head.castShadow=false;scene.add(head);
 const light=new T.PointLight(0xffa324,.35,6);light.position.set(x,2.6,z);scene.add(light);
}
// Six watch gates ring the town, one per relay-health signal, each burning in
// that signal's colour. Fronts face outward: the wall greets whoever arrives.
const SIGNALS=[
 {name:'到達不足',    color:0xe8384f},
 {name:'IP共有',      color:0xf0a848},
 {name:'KES同期',     color:0xffe14a},
 {name:'Tip未同期',   color:0x4ae08a},
 {name:'endpoint共有',color:0x4ad8f0},
 {name:'冗長性不足',  color:0xb48af0},
];
function tintGate(g,signal){
 const base=new T.Color(signal.color);
 g.root.traverse(o=>{
  if(!o.isMesh||!o.material.emissive||!o.material.emissive.getHex())return;
  const m=o.material;// flame clones: the translucent shell and the bright core
  if(m.transparent){m.color.copy(base).lerp(new T.Color(0xffffff),.35);m.emissive.copy(base);}
  else{m.color.copy(base).lerp(new T.Color(0xffffff),.65);m.emissive.copy(base).lerp(new T.Color(0xffffff),.25);}
 });
 for(const l of g.lights)l.color.set(signal.color);
}
// One shared material set for the six gates and every wall: the procedural
// stone textures are expensive, so they are generated exactly once.
const WM=gateMaterials();
const B=makeBuilders(WM);
const lighthouse=B.buildLighthouse(SIGNALS.map(s=>s.color));scene.add(lighthouse.root);
await phase('城門を建てています…');
const RING=132,gates=[],gatePos=[];
for(let k=0;k<6;k++){
 const g=buildGate(WM);
 const a=Math.PI-k*Math.PI/3;// north gate first, then clockwise like the radar chart
 const p=new T.Vector3(Math.sin(a)*RING,0,Math.cos(a)*RING);
 g.root.position.copy(p);
 g.root.rotation.y=a;
 g.root.scale.setScalar(2);
 tintGate(g,SIGNALS[k]);
 scene.add(g.root);gates.push(g);gatePos.push(p);
}
// Curtain walls close the ring: brick courses and merlons in the gate's stone,
// spanning each hexagon edge between neighbouring gatehouses.
// Master-plan view: structures that exist as real deployed pages stand solid;
// everything still to be built renders as a pale ghost, so the remaining work
// can be read at a glance.
const ghostMat=new T.MeshStandardMaterial({color:0x9fc6e8,transparent:true,opacity:.15,roughness:.6,metalness:0,depthWrite:false});
function ghost(root){root.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=o.receiveShadow=false;}if(o.isLight)o.intensity=0;});return root;}
// Floating name labels: warm fire for the real, cold ghost-light for the planned.
const labelTicks=[];
function label(text,x,y,z,real,size=1){
 const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');
 g.font='500 52px "Segoe UI","Yu Gothic UI",sans-serif';g.textAlign='center';g.textBaseline='middle';
 g.shadowColor=real?'#ff8c28':'#4ab6ff';g.shadowBlur=26;
 g.fillStyle=real?'#ffe2b0':'#cfeaff';g.fillText(text,256,64);g.fillText(text,256,64);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const mat=new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
 const sp=new T.Sprite(mat);sp.position.set(x,y,z);sp.scale.set(12*size,3*size,1);scene.add(sp);
 labelTicks.push(t=>{mat.opacity=.82+.18*Math.sin(t*(real?7:3)+x);});
}
// Civic quarter: the REAL delegates assembly at the head of the approach;
// vault and archive are still plans, so they stand as ghosts.
const civic=new T.Group();scene.add(civic);
const assemblyB=buildAssembly();
{const assembly=assemblyB;assembly.root.scale.setScalar(3.2);assembly.root.position.set(-44,0,-26);assembly.root.rotation.y=.7;civic.add(assembly.root);
 const vaultB=buildVault();window.__vaultB=vaultB;vaultB.root.scale.setScalar(2.2);vaultB.root.position.set(0,0,-52);civic.add(vaultB.root);
 const archive=ghost(B.buildHall('archive').root);archive.position.set(40,0,-22);archive.rotation.y=-.7;civic.add(archive);}
// Main-street shops face the paving; shady fronts face the back alley instead.
const shops=new T.Group();scene.add(shops);
{let n=0;
 for(const z of [22,32,42,52]){const sh=B.buildShop(100+n++,false);sh.root.position.set(6.8,0,z);sh.root.rotation.y=-Math.PI/2;shops.add(sh.root);}
 for(const z of [26,38,50]){const sh=B.buildShop(200+n++,false);sh.root.position.set(-6.8,0,z);sh.root.rotation.y=Math.PI/2;shops.add(sh.root);}
 for(const z of [30,44,54]){const sh=B.buildShop(300+n++,true);sh.root.position.set(-15.8,0,z);sh.root.rotation.y=Math.PI/2;shops.add(sh.root);}
 for(const [x,z] of [[2.6,28],[-2.6,34],[2.6,40]]){const st=B.buildStall(400+n++);st.root.position.set(x,0,z);st.root.rotation.y=(n%2?.4:-.5);shops.add(st.root);}}
// House clusters fill the residential wedges; the smithy works the west side.
const houses=new T.Group();scene.add(houses);
{let n=0;
 const clusters=[
  [[-30,26],[-24,32],[-34,34],[-26,42],[-36,20]],
  [[26,30],[33,24],[30,38],[38,32],[24,44]],
  [[30,-34],[37,-28],[33,-42],[41,-38]],
  [[-26,-38],[-33,-32],[-30,-46]],
 ];
 for(const cluster of clusters)for(const [x,z] of cluster){
  const h=B.buildHouse(500+n*37);h.root.position.set(x,0,z);h.root.rotation.y=(n*2.4)%(Math.PI*2);houses.add(h.root);n++;
 }}
const forgeWorks=B.buildForgeWorks();forgeWorks.root.position.set(-34,0,-14);forgeWorks.root.rotation.y=1.1;scene.add(forgeWorks.root);
// Everything not yet deployed as a real page becomes a ghost of the plan.
ghost(lighthouse.root);ghost(shops);ghost(houses);ghost(forgeWorks.root);
// Names float over each structure — fire for the built, ghost-light for the planned.
label('大灯台(仮)',0,40,0,false,1.4);
label('議事堂',-44,30,-26,true,1.4);
label('大金庫',0,26,-52,true,1.2);
label('憲法堂(仮)',40,13,-22,false);
label('商店街(仮)',7,9,38,false);
label('裏街道(仮)',-14,7,44,false,.85);
label('民家(仮)',-30,7,32,false,.85);
label('民家(仮)',31,7,32,false,.85);
label('民家(仮)',34,7,-36,false,.85);
label('鍛冶場(仮)',-34,8,-14,false,.85);
label('配送所',26,11,-20,true);
for(let k=0;k<6;k++)label(SIGNALS[k].name+'の門',gatePos[k].x,24,gatePos[k].z,true,1.1);
function buildWallSegment(len){
 const wall=new T.Group();
 const bh=.8,bd=1.6,rows=12;let seed=13;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function brick(x,y,w,h,d){
  const b=new T.Mesh(new T.BoxGeometry(w-.11,h-.07,d),WM.stone.clone());
  b.material.color.offsetHSL(0,0,(rand()-.5)*.07);
  b.position.set(x,y,0);b.castShadow=b.receiveShadow=true;wall.add(b);
 }
 for(let r=0;r<rows;r++){
  let x=-len/2+(r%2)*.95;
  while(x<len/2-0.4){
   const bw=Math.min(1.7+rand()*.6,len/2-x);
   brick(x+bw/2,bh/2+r*bh,bw,bh,bd);x+=bw;
  }
 }
 for(let x=-len/2+1;x<len/2-1.8;x+=3.5)brick(x+.9,rows*bh+.46,1.8,1,bd+.15);
 return wall;
}
const GATE_SPAN=9;// the gatehouse is asymmetric (round vs square tower), so both wall ends bury deep in the flanks
console.log('[T] walls start',performance.now()|0);await phase('城壁を積んでいます…');
const wallRing=new T.Group();scene.add(wallRing);
for(let k=0;k<6;k++){
 const p1=gatePos[k],p2=gatePos[(k+1)%6];
 const v=new T.Vector3().subVectors(p2,p1),len=v.length(),dir=v.clone().divideScalar(len);
 const seg=buildWallSegment(len-GATE_SPAN);
 seg.position.copy(p1).addScaledVector(v,.5);
 seg.rotation.y=Math.atan2(-dir.z,dir.x);
 wallRing.add(seg);
}
console.log('[T] walls done',performance.now()|0);await phase('官庁街を建てています…');
const depot=buildDepot();depot.root.position.set(26,0,-20);depot.root.rotation.y=-Math.PI/4;scene.add(depot.root);
// Player collision: solid structures block, stairs carry you up, ghosts are
// holograms you can walk through, and the hexagon of walls is a hard border.
const solids=[wallRing,depot.root,assemblyB.root,window.__vaultB.root,...gates.map(g=>g.root)];
const walkables=[ground,floor,...solids];
const fwdRay=new T.Raycaster(),dnRay=new T.Raycaster();fwdRay.far=.9;dnRay.far=40;
const HEXN=[];for(let k=0;k<6;k++){const a2=Math.PI-(k+.5)*Math.PI/3;HEXN.push([Math.sin(a2),Math.cos(a2)]);}
const INR=RING*Math.cos(Math.PI/6)-1.8;
// The cast walks in.
console.log('[T] cast start',performance.now()|0);await phase('住人を起こしています…');
const walkers=loadCast(scene);console.log('[T] cast done',performance.now()|0);
// Bake every rigid run of meshes down to one draw call per joint and material.
console.log('[T] opt depot',performance.now()|0);await phase('町を磨いています…');
const baked=[optimize(depot.root,t=>depot.tick(t))];console.log('[T] opt walls',performance.now()|0);baked.push(optimize(wallRing,()=>{}));console.log('[T] opt lighthouse',performance.now()|0);baked.push(optimize(lighthouse.root,t=>lighthouse.tick(t)));console.log('[T] opt assembly',performance.now()|0);baked.push(optimize(assemblyB.root,t=>assemblyB.tick(t,.016),o=>o.userData.base));console.log('[T] opt shops',performance.now()|0);baked.push(optimize(shops,()=>{}),optimize(houses,()=>{}),optimize(forgeWorks.root,t=>forgeWorks.tick(t)));
console.log('[T] opt gates',performance.now()|0);let gateDyn=null;
for(const g of gates){const r=optimize(g.root,t=>g.tick(t,.016),o=>o.userData.base,gateDyn);gateDyn=gateDyn||r.dynNames;baked.push(r);}console.log('[T] opt walkers',performance.now()|0);
baked.push(optimize(civic,()=>{},o=>{let p=o;while(p){if(p===assemblyB.root||p===window.__vaultB.root)return true;p=p.parent;}return false;}));
for(const w of walkers)baked.push(optimize(w.root,t=>w.update(.1,t)));
console.log('[TOWN] merged meshes:',baked.reduce((s,b)=>s+b.before,0),'->',baked.reduce((s,b)=>s+b.after,0));
// Click to follow: pick a walker with a ray, keep the target on it while set.
const ray=new T.Raycaster(),pointer=new T.Vector2(),clickTmp=new T.Vector3();let following=null;
function setFollow(w){following=w;$('#follow-name').textContent=w?w.name+' を追跡中':'';$('#follow-name').style.color=w?w.accent:'';}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(player)return;// clicking picks nothing while walking as NOMAD
 pointer.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(pointer,camera);
 // A generous hitbox: an exact mesh hit wins, otherwise the walker whose body
 // passes within 1.4 units of the ray — distant figures are only a few pixels.
 let best=null,bd=1e9;
 for(const w of walkers){
  const d=ray.intersectObject(w.root,true).length?0:ray.ray.distanceToPoint(clickTmp.copy(w.root.position).setY(w.root.position.y+.5));
  if(d<bd){bd=d;best=w;}
 }
 setFollow(bd<1.4?best:null);
});
$('#unfollow').onclick=()=>setFollow(null);$('#front').onclick=()=>{if(player)exitPlayer();front();};
// NOMAD mode: borrow the wanderer, walk it with WASD/arrows, orbit stays on the mouse.
let player=null;const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Escape'&&player)exitPlayer();});
addEventListener('keyup',e=>{keys[e.code]=false;});
const nomadW=walkers.find(w=>w.id==='nomad');
function enterPlayer(){
 player={};nomadW.manual=true;nomadW.setMoving(false);setFollow(null);
 $('#walk').classList.add('active');
 $('#follow-name').textContent='NOMAD視点 · WASD/矢印キーで移動 · Escで俯瞰へ';$('#follow-name').style.color='#d8b669';
 const p=nomadW.root.position;
 camera.position.set(p.x,3.4,p.z+8);controls.target.set(p.x,1.2,p.z);controls.update();
}
function exitPlayer(){
 player=null;nomadW.manual=false;nomadW.setMoving(true);
 $('#walk').classList.remove('active');$('#follow-name').textContent='';front();
}
$('#walk').onclick=()=>player?exitPlayer():renderer.shadowMap.needsUpdate=true;// the town is static; bake its shadows once
enterPlayer();
const camF=new T.Vector3(),camR=new T.Vector3(),mv=new T.Vector3();
let paused=false;$('#pause').onchange=e=>paused=e.target.checked;
if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;$('#pause').checked=true;}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.35,.4,1.1));composer.addPass(new OutputPass());
const clock=new T.Clock();let elapsed=0,frames=0;
function frame(){const dt=Math.min(clock.getDelta(),.05);
 if(!paused){elapsed+=dt;
  for(const w of walkers)w.update(dt,elapsed,camera.position.distanceTo(w.root.position)>90);
  // Flame vertex morphs are the CPU hogs: near gates tick on alternate frames, far ones rest.
  gates.forEach((g,i)=>{if((frames+i)%2===0&&camera.position.distanceTo(g.root.position)<170)g.tick(elapsed,dt*2);});
  if(camera.position.distanceTo(depot.root.position)<120)depot.tick(elapsed);
  if(frames%2===0&&camera.position.distanceTo(assemblyB.root.position)<170)assemblyB.tick(elapsed,dt*2);
  if(camera.position.distanceTo(window.__vaultB.root.position)<200)window.__vaultB.tick(elapsed,dt,camera);
  for(const f of labelTicks)f(elapsed);
  normal.offset.set(elapsed*.008,elapsed*.02);
 }
 if(player&&!paused){
  camera.getWorldDirection(camF);camF.y=0;camF.normalize();
  camR.set(-camF.z,0,camF.x);
  mv.set(0,0,0);
  if(keys.KeyW||keys.ArrowUp)mv.add(camF);
  if(keys.KeyS||keys.ArrowDown)mv.sub(camF);
  if(keys.KeyD||keys.ArrowRight)mv.add(camR);
  if(keys.KeyA||keys.ArrowLeft)mv.sub(camR);
  const moving=mv.lengthSq()>0;
  nomadW.setMoving(moving);
  if(moving){
   mv.normalize();
   const pos=nomadW.root.position;
   const ty=Math.atan2(mv.x,mv.z);
   let dr=ty-nomadW.root.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));
   nomadW.root.rotation.y+=dr*.2;
   fwdRay.set(new T.Vector3(pos.x,pos.y+1,pos.z),mv);
   const blocked=fwdRay.intersectObjects(solids,true).length>0;
   if(!blocked){
    mv.multiplyScalar(dt*6);
    const np=pos.clone().add(mv);
    const inside=HEXN.every(([nx,nz])=>np.x*nx+np.z*nz<INR);
    if(inside){
     dnRay.set(new T.Vector3(np.x,pos.y+2.5,np.z),new T.Vector3(0,-1,0));
     const hit=dnRay.intersectObjects(walkables,true)[0];
     const hy=hit?pos.y+2.5-hit.distance:0;
     if(hy-pos.y<=.75){
      const dy=(hy-pos.y)*.5;
      pos.set(np.x,pos.y+dy,np.z);
      camera.position.add(mv);camera.position.y+=dy;
     }
    }
   }
  }
  controls.target.lerp(new T.Vector3(nomadW.root.position.x,nomadW.root.position.y+1.2,nomadW.root.position.z),.3);
 }else if(following)controls.target.lerp(new T.Vector3(following.root.position.x,1,following.root.position.z),.08);
 controls.update();composer.render();frames++;
 if(frames===2)$('#loading')?.classList.add('done');}
renderer.setAnimationLoop(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
renderer.shadowMap.needsUpdate=true;// the town is static; bake its shadows once
enterPlayer();
window.town={scene,camera,controls,walkers,step:frame,follow:setFollow,get state(){return{frames,following:following?.name??null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}};

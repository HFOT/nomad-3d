import * as T from 'three';import{OrbitControls}from'three/addons/controls/OrbitControls.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';import{RenderPass}from'three/addons/postprocessing/RenderPass.js';import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';import{OutputPass}from'three/addons/postprocessing/OutputPass.js';
import{buildGate}from'../gate/model.js';import{materials as gateMaterials}from'../gate/materials.js';import{castBuilders}from'./cast.js';import{optimize}from'./merge.js?v=3';import{makeBuilders}from'./buildings.js';
import {buildDistrictInfrastructure} from './districts.js';
import {buildNeighborhood} from './neighborhood.js';
import {createAssembly,createVault,createDepot,createArchive} from './landmarks.js';
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
const phase=m=>{const l=document.querySelector('#loading'),el=l?.querySelector('span');if(el)el.textContent=m;
 // Keep the loading overlay responsive without compiling every unbatched
 // construction mesh. The first actual render uses the finished batches.
 return new Promise(r=>{const d=setTimeout(r,150);requestAnimationFrame(()=>{clearTimeout(d);r();});});};
const scene=new T.Scene();scene.background=new T.Color('#344955');scene.fog=new T.FogExp2('#344955',.0018);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.7,900);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.5;controls.minDistance=4;controls.maxDistance=430;
function front(){camera.position.set(12,185,248);controls.target.set(0,0,0);controls.update();}
// The boot watches from the boulevard: a ground camera plus dusk fog keeps
// construction renders cheap (only nearby structures resolve) and the town
// reveals itself the way the player will first see it.
camera.position.set(6,4.2,118);controls.target.set(0,30,0);controls.update();
// Dusk: a low amber sun in the west, indigo rim from the east, warm hemisphere.
const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.24;
scene.environmentIntensity=.65;
scene.add(new T.HemisphereLight(0xe1ecff,0x61503d,1.7));
const sun=new T.DirectionalLight(0xffb36b,2.0);sun.position.set(-30,12,8);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-155,right:155,top:160,bottom:-155});scene.add(sun);
const rim=new T.DirectionalLight(0x5a6bd8,.8);rim.position.set(3,10,-20);scene.add(rim);
sun.shadow.bias=-.00035;sun.shadow.normalBias=.24;sun.intensity=2.6;sun.color.set(0xffd2a0);
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
// The district module owns all streets; the old two-road scaffold is retired.
const ringRoad=new T.Mesh(new T.RingGeometry(38,42,64),paveMat);ringRoad.rotation.x=-Math.PI/2;ringRoad.position.y=.065;ringRoad.receiveShadow=true;scene.add(ringRoad);
const plazaPave=new T.Mesh(new T.CircleGeometry(13,40),paveMat);plazaPave.rotation.x=-Math.PI/2;plazaPave.position.y=.075;plazaPave.receiveShadow=true;scene.add(plazaPave);
ringRoad.visible=false;
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
for(let j=0;j<8;j++){// stop at z=43: clear of the stair's foot
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
const cityWorks=buildDistrictInfrastructure(WM);scene.add(cityWorks.root);
const lighthouse=B.buildLighthouse(SIGNALS.map(s=>s.color));lighthouse.root.position.set(40,0,-22);scene.add(lighthouse.root);
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
 const sp=new T.Sprite(mat);sp.position.set(x,y,z);sp.scale.set(12*size,3*size,1);sp.visible=false;scene.add(sp);
 labelTicks.push(t=>{mat.opacity=.82+.18*Math.sin(t*(real?7:3)+x);});
}
// Civic quarter: the REAL delegates assembly at the head of the approach;
// vault and archive are still plans, so they stand as ghosts.
const civic=new T.Group();scene.add(civic);
// The town is a hub: heavy real models live on their own pages, and the town
// shows lite stand-ins — click one to enter the real building.
const assemblyB=createAssembly();civic.add(assemblyB.root);
await phase('大金庫の実物を設置しています…');
const vaultB=createVault();window.__vaultB=vaultB;civic.add(vaultB.root);
await phase('商店街と民家を建てています…');
// Main-street shops face the paving; shady fronts face the back alley instead.
const shops=new T.Group();shops.position.z=28;scene.add(shops);// the street sits just south of the great stair (tip ~z39)
{let n=0;
 for(const z of [22,32,42,52]){const sh=B.buildShop(100+n++,false);sh.root.position.set(6.8,0,z);sh.root.rotation.y=-Math.PI/2;shops.add(sh.root);}
 for(const z of [26,38,50]){const sh=B.buildShop(200+n++,false);sh.root.position.set(-6.8,0,z);sh.root.rotation.y=Math.PI/2;shops.add(sh.root);}
 for(const z of [30,44,54]){const sh=B.buildShop(300+n++,true);sh.root.position.set(-15.8,0,z);sh.root.rotation.y=Math.PI/2;shops.add(sh.root);}
 for(const [x,z] of [[2.6,28],[-2.6,34],[2.6,40]]){const st=B.buildStall(400+n++);st.root.position.set(x,0,z);st.root.rotation.y=(n%2?.4:-.5);shops.add(st.root);}}
// House clusters fill the residential wedges; the smithy works the west side.
const houses=new T.Group();scene.add(houses);
{let n=0;
 const clusters=[
  [[-48,26],[-42,32],[-52,34],[-44,42],[-54,20]],
  [[44,30],[51,24],[48,38],[56,32],[42,44]],
  [[30,-34],[37,-28],[33,-42],[41,-38]],
  [[-26,-38],[-33,-32],[-30,-46]],
 ];
 for(const cluster of clusters)for(const [x,z] of cluster){
  const h=B.buildHouse(500+n*37);h.root.position.set(x,0,z);h.root.rotation.y=(n*2.4)%(Math.PI*2);houses.add(h.root);n++;
 }}
const forgeWorks=B.buildForgeWorks();forgeWorks.root.position.set(-34,0,-14);forgeWorks.root.rotation.y=1.1;scene.add(forgeWorks.root);
// Everything not yet deployed as a real page becomes a ghost of the plan.
ghost(lighthouse.root);shops.visible=false;houses.visible=false;forgeWorks.root.visible=false;
// Names float over each structure — fire for the built, ghost-light for the planned.

label('議事堂',-44,30,-26,true,1.4);
label('大金庫',0,26,-52,true,1.2);
label('憲法の書庫',0,104,0,true,1.6);






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
const depot=createDepot();scene.add(depot.root);
// The constitutional archive stands at the heart of the town. It batches its
// own statics and rewrites seam vertices every tick, so it skips optimize().
await phase('書庫塔を建てています…');
const archiveB=createArchive();scene.add(archiveB.root);
const landmarkModels=[assemblyB,vaultB,depot,archiveB];
const neighborhood=buildNeighborhood(landmarkModels.map(m=>new T.Box3().setFromObject(m.root)),cityWorks.streets);scene.add(neighborhood.root);
// Player collision: solid structures block, stairs carry you up, ghosts are
// holograms you can walk through, and the hexagon of walls is a hard border.
const solids=[neighborhood.root,wallRing,depot.root,assemblyB.root,window.__vaultB.root,archiveB.root,...gates.map(g=>g.root)];
const walkables=[ground,floor,cityWorks.root,...solids];
const fwdRay=new T.Raycaster(),dnRay=new T.Raycaster();fwdRay.far=.9;dnRay.far=40;
const HEXN=[];for(let k=0;k<6;k++){const a2=Math.PI-(k+.5)*Math.PI/3;HEXN.push([Math.sin(a2),Math.cos(a2)]);}
const INR=RING*Math.cos(Math.PI/6)-1.8;
// The cast walks in.
console.log('[T] cast start',performance.now()|0);await phase('住人を起こしています…');
const walkers=[];
{const builders=castBuilders(scene);
 for(let i=0;i<builders.length;i++){walkers.push(builders[i]());if(i%2===1)await phase('住人を起こしています… '+(i+1)+'/'+builders.length);}}
console.log('[T] cast done',performance.now()|0);
// LOD registry: on the ground, distant structures hide and the fog closes in;
// from the air (camera.y>=40) the whole master plan stays visible. Static
// entries cache their world position; walkers are tracked live.
scene.updateMatrixWorld(true);
const lod=[];const lodAdd=(o,d,track)=>lod.push({o,p:track?null:o.getWorldPosition(new T.Vector3()),d2:d*d});
for(const g of gates)lodAdd(g.root,280);


// Old placeholder shops remain hidden; detailed neighborhoods own the street.

for(const w of walkers)lodAdd(w.root,130,true);
// Bake every rigid run of meshes down to one draw call per joint and material.
console.log('[T] opt start',performance.now()|0);
await phase('配送所を磨いています…');const baked=[optimize(depot.root,t=>depot.tick(t)),optimize(cityWorks.root,t=>cityWorks.tick(t))];
await phase('城壁を磨いています…');for(const seg of wallRing.children)baked.push(optimize(seg,()=>{}));// per edge: frustum culling can drop the far walls
await phase('灯台を磨いています…');baked.push(optimize(lighthouse.root,t=>lighthouse.tick(t)));
await phase('議事堂を磨いています…');baked.push(optimize(assemblyB.root,t=>assemblyB.tick(t),o=>o.userData.base));
await phase('商店街を磨いています…');for(const c of shops.children)baked.push(optimize(c,()=>{}));
for(const c of houses.children)baked.push(optimize(c,()=>{}));
baked.push(optimize(forgeWorks.root,t=>forgeWorks.tick(t)));
await phase('城門を磨いています…');console.log('[T] opt gates',performance.now()|0);
// The six gatehouses are identical masonry, so only the first is merged for
// real. The other five drop the same bricks (matched by their deterministic
// GatePart names) and re-hang gate one's merged shells — geometry and
// materials shared by reference, so five gates' vertices never touch the heap.
{
 const g0=gates[0],r0=optimize(g0.root,t=>g0.tick(t,.016),o=>o.userData.base);
 baked.push(r0);
 for(const g of gates.slice(1)){
  const byName=new Map(),doomed=[];
  g.root.traverse(o=>{if(o.name)byName.set(o.name,o);if(o.isMesh&&o.name&&r0.removedNames.has(o.name))doomed.push(o);});
  for(const o of doomed){o.removeFromParent();o.geometry.dispose();}
  for(const {mesh,ancName} of r0.merged){
   const twin=new T.Mesh(mesh.geometry,mesh.material);
   twin.castShadow=mesh.castShadow;twin.receiveShadow=mesh.receiveShadow;
   (byName.get(ancName)||g.root).add(twin);
  }
 }
}
await phase('書庫塔を磨いています…');console.log('[T] opt archive',performance.now()|0);
// Archive and vault batch their own static architecture. Do not re-bake their
// vertex-driven crystal seams, vault shutters or furnace steam.
await phase('官庁街を磨いています…');console.log('[T] opt walkers',performance.now()|0);
baked.push(optimize(civic,()=>{},o=>{let p=o;while(p){if(p===assemblyB.root||p===window.__vaultB.root)return true;p=p.parent;}return false;}));
for(let i=0;i<walkers.length;i++){const w=walkers[i];baked.push(optimize(w.root,t=>w.update(.1,t)));if(i%3===2)await phase('住人を磨いています… '+(i+1)+'/'+walkers.length);}
console.log('[TOWN] merged meshes:',baked.reduce((s,b)=>s+b.before,0),'->',baked.reduce((s,b)=>s+b.after,0));
// Click to follow: pick a walker with a ray, keep the target on it while set.
const ray=new T.Raycaster(),pointer=new T.Vector2(),clickTmp=new T.Vector3();let following=null;
function setFollow(w){following=w;$('#follow-name').textContent=w?w.name+' を追跡中':'';$('#follow-name').style.color=w?w.accent:'';}
// The town is a hub: a clean click (no drag, no long-press) on a landmark
// opens its real ARCHITECTURE page; other clicks pick a walker to follow.
const portals=[
 {root:archiveB.root,href:'../archive/'},
 {root:assemblyB.root,href:'../assembly/'},
 {root:window.__vaultB.root,href:'../vault/'},
 {root:depot.root,href:'../depot/'},
 ...gates.map(g=>({root:g.root,href:'../gate/'})),
];
let downT=0,downX=0,downY=0;
renderer.domElement.addEventListener('pointerdown',e=>{downT=performance.now();downX=e.clientX;downY=e.clientY;});
renderer.domElement.addEventListener('pointerup',e=>{
 if(performance.now()-downT>400||Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>6)return;// that was a drag
 pointer.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(pointer,camera);
 for(const p of portals)if(civicLayer.visible&&ray.intersectObject(p.root,true).length){location.href=p.href;return;}
 if(player)return;// walker picking stays off while walking as NOMAD
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
$('#walk').onclick=()=>player?exitPlayer():enterPlayer();
const camF=new T.Vector3(),camR=new T.Vector3(),mv=new T.Vector3();
let paused=false;$('#pause').onchange=e=>paused=e.target.checked;
const civicLayer=new T.Group();scene.add(civicLayer);civicLayer.add(civic,archiveB.root,depot.root,lighthouse.root);
lighthouse.root.visible=false;
const aside=document.querySelector('aside');
const switches=document.createElement('div');switches.innerHTML='<label><input id="civilian" type="checkbox" checked> 民家・商店街</label><label><input id="landmarks" type="checkbox" checked> 大型建造物</label><button id="market-view">商店街へ</button><button id="bridge-view">橋と水路へ</button>';
aside.insertBefore(switches,document.querySelector('#pause').parentElement);
const landmarkSelect=document.createElement('select');landmarkSelect.setAttribute('aria-label','建造物へ移動');landmarkSelect.style.cssText='width:100%;padding:9px;background:#453341;color:#f6dfc6;border:1px solid #a5826866;border-radius:6px;margin:6px 0';
landmarkSelect.innerHTML='<option value="">建造物へ移動…</option><option value="3">憲法書庫</option><option value="0">DRep議事堂</option><option value="1">大金庫</option><option value="2">配送所</option>';
switches.append(landmarkSelect);
landmarkSelect.onchange=()=>{if(landmarkSelect.value==='')return;if(player)exitPlayer();civicLayer.visible=true;$('#landmarks').checked=true;const m=landmarkModels[+landmarkSelect.value],b=new T.Box3().setFromObject(m.root),c=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3()),d=Math.max(size.x,size.y,size.z);controls.target.copy(c);camera.position.copy(c).add(new T.Vector3(d*.45,d*.28,d*1.5).applyAxisAngle(new T.Vector3(0,1,0),m.root.rotation.y));controls.update();};
const vaultButton=document.createElement('button');vaultButton.textContent='金庫を開く';switches.append(vaultButton);let vaultLocked=true;
vaultButton.onclick=()=>{vaultLocked=!vaultLocked;vaultB.setLock(vaultLocked);vaultButton.textContent=vaultLocked?'金庫を開く':'金庫を閉じる';};
$('#civilian').onchange=e=>{neighborhood.root.visible=e.target.checked;renderer.shadowMap.needsUpdate=true;};
$('#landmarks').onchange=e=>{civicLayer.visible=e.target.checked;renderer.shadowMap.needsUpdate=true;};
$('#market-view').onclick=()=>{if(player)exitPlayer();camera.position.set(-39,7,80);controls.target.set(-39,3,36);controls.update();};
$('#bridge-view').onclick=()=>{if(player)exitPlayer();camera.position.set(15,6,38);controls.target.set(0,1,25);controls.update();};
if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;$('#pause').checked=true;}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth/2,innerHeight/2),.35,.4,1.1));// half-res bloom: a soft glow needs no full-res blur chain
composer.addPass(new OutputPass());
const clock=new T.Clock();let elapsed=0,frames=0;
// Full character models each carry local lights. At nation scale, dozens of
// overlapping point-light shader loops overwhelm even distant street views.
// Six movable lamps illuminate the camera neighborhood; emissive fire remains
// on every fixture and character independently.
const localLights=[];scene.updateMatrixWorld(true);
scene.traverse(o=>{if(o.isPointLight)localLights.push({source:o,position:o.getWorldPosition(new T.Vector3()),color:o.color.clone(),power:o.intensity});});
for(const l of localLights)l.source.removeFromParent();
const activeLights=Array.from({length:6},()=>{const l=new T.PointLight(0xffb16c,0,16,2);scene.add(l);return l;});
function updateLocalLights(){const nearest=localLights.slice().sort((a,b)=>camera.position.distanceToSquared(a.position)-camera.position.distanceToSquared(b.position));for(let i=0;i<activeLights.length;i++){const l=nearest[i];if(l){activeLights[i].position.copy(l.position);activeLights[i].color.copy(l.color);activeLights[i].intensity=Math.min(8,l.power*3);}}}
updateLocalLights();
// Adaptive render scale: the 200m tower is heavy on integrated GPUs, so the
// internal resolution follows measured frame time (0.6x .. native, 0.1 steps).
// ?px=0.8 in the URL pins the scale by hand.
const pxForced=+new URLSearchParams(location.search).get('px')||0;
const pxCap=Math.min(devicePixelRatio,1.3);let px=pxForced||pxCap,ftAcc=0,ftN=0;
if(pxForced){renderer.setPixelRatio(px);composer.setPixelRatio(px);renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}
function tune(dt){if(pxForced)return;ftAcc+=dt;if(++ftN<50)return;const avg=ftAcc/ftN;ftAcc=0;ftN=0;
 const want=avg>.042?Math.max(1,px-.1):(avg<.024?Math.min(pxCap,px+.1):px);
 if(Math.abs(want-px)>.01){px=want;renderer.setPixelRatio(px);composer.setPixelRatio(px);renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}}
function frame(){const dt=Math.min(clock.getDelta(),.05);
 if(!paused){elapsed+=dt;
  for(const w of walkers)w.update(dt,elapsed,camera.position.distanceTo(w.root.position)>90);
  cityWorks.tick(elapsed);
  // Flame vertex morphs are the CPU hogs: near gates tick on alternate frames, far ones rest.
  gates.forEach((g,i)=>{if((frames+i)%2===0&&camera.position.distanceTo(g.root.position)<170)g.tick(elapsed,dt*2);});
  if(civicLayer.visible){
   archiveB.tick(dt,camera.position.distanceTo(archiveB.root.position));
   depot.tick(elapsed);
   if(frames%2===0){assemblyB.tick(elapsed);vaultB.tick(elapsed,dt*2);}
  }
  if(frames%15===0){const ground=camera.position.y<40;
   for(const e of lod)e.o.visible=!ground||camera.position.distanceToSquared(e.p||e.o.position)<e.d2;}
  scene.fog.density=T.MathUtils.lerp(.0028,.0012,Math.min(1,camera.position.y/70));
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
   const blocked=fwdRay.intersectObjects(solids.filter(o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}),true).length>0;
   if(!blocked){
    mv.multiplyScalar(dt*6);
    const np=pos.clone().add(mv);
    const inside=HEXN.every(([nx,nz])=>np.x*nx+np.z*nz<INR)&&!cityWorks.isWater(np.x,np.z);
    if(inside){
     dnRay.set(new T.Vector3(np.x,pos.y+2.5,np.z),new T.Vector3(0,-1,0));
     const hit=dnRay.intersectObjects(walkables,true)[0];
     const hy=hit?pos.y+2.5-hit.distance:0;
     if(hy-pos.y<=1.15){// one 0.77m riser plus climb lag
      // climb snaps up (long stairs accumulate lag under damping); descent stays smooth
      const dy=hy>pos.y?Math.min(hy-pos.y,.8):(hy-pos.y)*.5;
      pos.set(np.x,pos.y+dy,np.z);
      camera.position.add(mv);camera.position.y+=dy;
     }
    }
   }
  }
  controls.target.lerp(new T.Vector3(nomadW.root.position.x,nomadW.root.position.y+1.2,nomadW.root.position.z),.3);
 }else if(following)controls.target.lerp(new T.Vector3(following.root.position.x,1,following.root.position.z),.08);
 if(!paused)tune(dt);
 if(frames%30===0)updateLocalLights();controls.update();composer.render();frames++;
 if(frames===2)$('#loading')?.classList.add('done');}
renderer.setAnimationLoop(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
renderer.shadowMap.needsUpdate=true;// the town is static; bake its shadows once
front();
window.town={scene,camera,controls,walkers,cityWorks,neighborhood,civicLayer,landmarkModels,step:frame,follow:setFollow,get state(){return{frames,following:following?.name??null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}};

import * as T from 'three';import{OrbitControls}from'three/addons/controls/OrbitControls.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';import{RenderPass}from'three/addons/postprocessing/RenderPass.js';import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';import{OutputPass}from'three/addons/postprocessing/OutputPass.js';
import{buildGate}from'../gate/model.js';import{materials as gateMaterials}from'../gate/materials.js';import{buildDepot}from'../depot/model.js';import{loadCast}from'./cast.js';import{optimize}from'./merge.js';
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
 }}renderer.setPixelRatio(Math.min(devicePixelRatio,1.3));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#2b2030');scene.fog=new T.FogExp2('#2b2030',.006);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,500);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.5;controls.minDistance=4;controls.maxDistance=260;
function front(){camera.position.set(0,48,142);controls.target.set(0,2,-8);controls.update();}front();
// Dusk: a low amber sun in the west, indigo rim from the east, warm hemisphere.
const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.24;
scene.add(new T.HemisphereLight(0xe8a06a,0x2a2026,.68));
const sun=new T.DirectionalLight(0xffb36b,2.0);sun.position.set(-30,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-92,right:92,top:92,bottom:-92});scene.add(sun);
const rim=new T.DirectionalLight(0x5a6bd8,.8);rim.position.set(3,10,-20);scene.add(rim);
// Ground, road and plaza.
const ground=new T.Mesh(new T.PlaneGeometry(320,320),new T.MeshStandardMaterial({color:0x3a3433,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
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
const floorTex=brickTexture();floorTex.repeat.set(20,20);
const floor=new T.Mesh(new T.CircleGeometry(69.5,6,Math.PI/2),new T.MeshStandardMaterial({color:0xcabc9f,map:floorTex,bumpMap:floorTex,bumpScale:.05,roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=.04;floor.receiveShadow=true;scene.add(floor);
// Canal on the east side, same procedural normals the depot page uses.
const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=128;const nc=normalCanvas.getContext('2d'),ni=nc.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;ni.data[i]=128+Math.sin(x*.25+y*.18)*30;ni.data[i+1]=128+Math.cos(y*.31-x*.13)*30;ni.data[i+2]=245;ni.data[i+3]=255;}nc.putImageData(ni,0,0);const normal=new T.CanvasTexture(normalCanvas);normal.wrapS=normal.wrapT=T.RepeatWrapping;
// A reflective Water pass would render the whole town twice; a normal-mapped
// dark plane with a drifting texture reads as canal at this distance for free.
const waterMat=new T.MeshStandardMaterial({color:0x0a1a22,metalness:.75,roughness:.28,normalMap:normal,normalScale:new T.Vector2(.6,.6)});
normal.repeat.set(6,36);
const water=new T.Mesh(new T.PlaneGeometry(20,280),waterMat);water.rotation.x=-Math.PI/2;water.position.set(74,-.05,0);scene.add(water);
// Street lamps along the road: brass poles, amber heads already lit for dusk.
const lampMat=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});
const lampGlow=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.8});
for(let j=0;j<6;j++){
 const x=(j%2?4:-4),z=58-j*7;
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
const RING=70,gates=[],gatePos=[];
for(let k=0;k<6;k++){
 const g=buildGate();
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
const WM=gateMaterials();
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
const wallRing=new T.Group();scene.add(wallRing);
for(let k=0;k<6;k++){
 const p1=gatePos[k],p2=gatePos[(k+1)%6];
 const v=new T.Vector3().subVectors(p2,p1),len=v.length(),dir=v.clone().divideScalar(len);
 const seg=buildWallSegment(len-GATE_SPAN);
 seg.position.copy(p1).addScaledVector(v,.5);
 seg.rotation.y=Math.atan2(-dir.z,dir.x);
 wallRing.add(seg);
}
const depot=buildDepot();depot.root.position.set(26,0,-20);depot.root.rotation.y=-Math.PI/4;scene.add(depot.root);
// The cast walks in.
const walkers=loadCast(scene);
// Bake every rigid run of meshes down to one draw call per joint and material.
const baked=[optimize(depot.root,t=>depot.tick(t)),optimize(wallRing,()=>{})];
for(const g of gates)baked.push(optimize(g.root,t=>g.tick(t,.016),o=>o.userData.base));
for(const w of walkers)baked.push(optimize(w.root,t=>w.update(.1,t)));
console.log('[TOWN] merged meshes:',baked.reduce((s,b)=>s+b.before,0),'->',baked.reduce((s,b)=>s+b.after,0));
// Click to follow: pick a walker with a ray, keep the target on it while set.
const ray=new T.Raycaster(),pointer=new T.Vector2();let following=null;
function setFollow(w){following=w;$('#follow-name').textContent=w?w.name+' を追跡中':'';$('#follow-name').style.color=w?w.accent:'';}
renderer.domElement.addEventListener('pointerdown',e=>{
 pointer.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(pointer,camera);
 for(const w of walkers){if(ray.intersectObject(w.root,true).length){setFollow(w);return;}}
 setFollow(null);
});
$('#unfollow').onclick=()=>setFollow(null);$('#front').onclick=front;
let paused=false;$('#pause').onchange=e=>paused=e.target.checked;
if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;$('#pause').checked=true;}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.35,.4,1.1));composer.addPass(new OutputPass());
const clock=new T.Clock();let elapsed=0,frames=0;
function frame(){const dt=Math.min(clock.getDelta(),.05);
 if(!paused){elapsed+=dt;
  for(const w of walkers)w.update(dt,elapsed);
  for(const g of gates)g.tick(elapsed,dt);depot.tick(elapsed);
  normal.offset.set(elapsed*.008,elapsed*.02);
 }
 if(following)controls.target.lerp(new T.Vector3(following.root.position.x,1,following.root.position.z),.08);
 controls.update();composer.render();frames++;}
renderer.setAnimationLoop(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
window.town={scene,camera,controls,walkers,step:frame,follow:setFollow,get state(){return{frames,following:following?.name??null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}};

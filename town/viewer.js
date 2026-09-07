import * as T from 'three';import{OrbitControls}from'three/addons/controls/OrbitControls.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';import{RenderPass}from'three/addons/postprocessing/RenderPass.js';import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';import{OutputPass}from'three/addons/postprocessing/OutputPass.js';
import{buildGate}from'../gate/model.js';import{buildDepot}from'../depot/model.js';import{loadCast}from'./cast.js';import{optimize}from'./merge.js';
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
const scene=new T.Scene();scene.background=new T.Color('#2b2030');scene.fog=new T.FogExp2('#2b2030',.018);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,200);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.5;controls.minDistance=4;controls.maxDistance=70;
function front(){camera.position.set(0,21,56);controls.target.set(0,1.5,-4);controls.update();}front();
// Dusk: a low amber sun in the west, indigo rim from the east, warm hemisphere.
const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.24;
scene.add(new T.HemisphereLight(0xe8a06a,0x2a2026,.68));
const sun=new T.DirectionalLight(0xffb36b,2.0);sun.position.set(-30,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35});scene.add(sun);
const rim=new T.DirectionalLight(0x5a6bd8,.8);rim.position.set(3,10,-20);scene.add(rim);
// Ground, road and plaza.
const ground=new T.Mesh(new T.PlaneGeometry(120,120),new T.MeshStandardMaterial({color:0x3a3433,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const roadMat=new T.MeshStandardMaterial({color:0x4a423d,roughness:.9});
const road=new T.Mesh(new T.BoxGeometry(4,.05,30),roadMat);road.position.set(0,.03,11);road.receiveShadow=true;scene.add(road);
const plaza=new T.Mesh(new T.CircleGeometry(7,48),roadMat);plaza.rotation.x=-Math.PI/2;plaza.position.y=.06;plaza.receiveShadow=true;scene.add(plaza);
// Canal on the east side, same procedural normals the depot page uses.
const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=128;const nc=normalCanvas.getContext('2d'),ni=nc.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;ni.data[i]=128+Math.sin(x*.25+y*.18)*30;ni.data[i+1]=128+Math.cos(y*.31-x*.13)*30;ni.data[i+2]=245;ni.data[i+3]=255;}nc.putImageData(ni,0,0);const normal=new T.CanvasTexture(normalCanvas);normal.wrapS=normal.wrapT=T.RepeatWrapping;
// A reflective Water pass would render the whole town twice; a normal-mapped
// dark plane with a drifting texture reads as canal at this distance for free.
const waterMat=new T.MeshStandardMaterial({color:0x0a1a22,metalness:.75,roughness:.28,normalMap:normal,normalScale:new T.Vector2(.6,.6)});
normal.repeat.set(6,36);
const water=new T.Mesh(new T.PlaneGeometry(16,120),waterMat);water.rotation.x=-Math.PI/2;water.position.set(38,-.05,0);scene.add(water);
// Street lamps along the road: brass poles, amber heads already lit for dusk.
const lampMat=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});
const lampGlow=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.8});
for(let j=0;j<5;j++){
 const x=(j%2?3:-3),z=19-j*4.5;
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
const gates=[];
for(let k=0;k<6;k++){
 const g=buildGate();
 const a=Math.PI-k*Math.PI/3,R=25;// north gate first, then clockwise like the radar chart
 g.root.position.set(Math.sin(a)*R,0,Math.cos(a)*R);
 g.root.rotation.y=a;
 g.root.scale.setScalar(1.4);
 tintGate(g,SIGNALS[k]);
 scene.add(g.root);gates.push(g);
}
const depot=buildDepot();depot.root.position.set(13,0,-10);depot.root.rotation.y=-Math.PI/4;scene.add(depot.root);
// The cast walks in.
const walkers=loadCast(scene);
// Bake every rigid run of meshes down to one draw call per joint and material.
const baked=[optimize(depot.root,t=>depot.tick(t))];
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

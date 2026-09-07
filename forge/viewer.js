import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
import { createMaterials,buildRobot,buildGround } from './model.js';

const $=s=>document.querySelector(s);
const status=$('#status');
window.addEventListener('error',e=>{status.textContent='読み込みエラー';$('#loading p').textContent='読み込めませんでした。ページを再読み込みしてください。';console.error(e.error)});
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;$('#stage').appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#20241f');scene.fog=new T.FogExp2('#20241f',.032);
const camera=new T.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=4.5;controls.maxDistance=200;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.23;controls.autoRotateSpeed=.65;
// Framed from the front-right: the chain runs away behind, so the default view
// has to show both the furnace door and the ledger it feeds.
function resetCamera(){const mobile=innerWidth<800;camera.position.set(mobile?6.2:5.6,mobile?3.6:3.2,mobile?12.5:8.6);controls.target.set(0,mobile?2.1:2.0,mobile?-.6:-.8);if(mobile){camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.18,innerWidth,innerHeight)}else{camera.setViewOffset(innerWidth,innerHeight,innerWidth*.065,0,innerWidth,innerHeight)}controls.update()}
resetCamera();
const pmrem=new T.PMREMGenerator(renderer),envScene=new RoomEnvironment();const env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;scene.environmentIntensity=.52;envScene.dispose();pmrem.dispose();
const hemi=new T.HemisphereLight(0xbcc6cf,0x3a2a1c,1.25);scene.add(hemi);
const key=new T.DirectionalLight(0xffe0b2,3.8);key.position.set(-3.5,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-3;key.shadow.normalBias=.018;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
const rim=new T.DirectionalLight(0x9fd8bc,2.1);rim.position.set(3,5,-4);scene.add(rim);
const fill=new T.DirectionalLight(0x8fa2b0,.5);fill.position.set(-4,2,-1);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x23271f,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.45;floor.receiveShadow=true;scene.add(floor);
const M=createMaterials();const robot=buildRobot(M);scene.add(robot.root);const ground=buildGround(M);scene.add(ground);
const mixer=new T.AnimationMixer(robot.root);let current=mixer.clipAction(robot.clips[0]);current.play();let motion='Idle',surface='original',paused=false;
const originals=new Map();robot.root.traverse(o=>{if(o.isMesh)originals.set(o.uuid,o.material)});
const clay=new T.MeshStandardMaterial({color:0xacb2a0,roughness:.7,metalness:0});const wire=new T.MeshBasicMaterial({color:0xbccdb4,wireframe:true});
const target=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,samples:4});
const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));const sao=new SAOPass(scene,camera,new T.Vector2(innerWidth*.6,innerHeight*.6));sao.params.saoIntensity=.015;sao.params.saoScale=1;sao.params.saoKernelRadius=16;sao.params.saoBlurRadius=4;composer.addPass(sao);const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.42,.62,1.6);composer.addPass(bloom);composer.addPass(new OutputPass());
function pressed(selector,el){document.querySelectorAll(selector).forEach(b=>{const active=b===el;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})}
function setMotion(name){const next=mixer.clipAction(robot.clips.find(c=>c.name===name));if(next!==current){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();current.crossFadeTo(next,.4,true);current=next}motion=name;status.textContent={Idle:'炉の前で構えています',Walk:'炉ごと歩いています',Look:'あたりを見回しています',Guard:'槌を担いで待っています'}[name];document.querySelectorAll('[data-motion]').forEach(b=>{b.classList.toggle('active',b.dataset.motion===name);b.setAttribute('aria-pressed',String(b.dataset.motion===name))})}
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));
$('#speed').oninput=e=>{$('#speed-value').value=Number(e.target.value).toFixed(1)+'×';mixer.timeScale=Number(e.target.value)};
$('#pause').onchange=e=>paused=e.target.checked;$('#rotate').onchange=e=>controls.autoRotate=e.target.checked;
document.querySelectorAll('[data-material]').forEach(b=>b.onclick=()=>{surface=b.dataset.material;pressed('[data-material]',b);robot.root.traverse(o=>{if(o.isMesh)o.material=surface==='clay'?clay:surface==='wire'?wire:originals.get(o.uuid)})});
function lighting(mode){const styles={forge:{bg:'#20241f',key:3.8,env:.52,hemi:1.25,rim:2.1,exposure:1.08,keyColor:0xffe0b2,floor:0x23271f},studio:{bg:'#797b70',key:3.9,env:1.05,hemi:2.0,rim:2,exposure:1.15,keyColor:0xfff3df,floor:0x666a60},night:{bg:'#0c1512',key:.5,env:.20,hemi:.34,rim:1.7,exposure:1.14,keyColor:0x86b7a4,floor:0x0f1a16}};const p=styles[mode];scene.background.set(p.bg);scene.fog.color.set(p.bg);key.intensity=p.key;key.color.set(p.keyColor);scene.environmentIntensity=p.env;hemi.intensity=p.hemi;rim.intensity=p.rim;rim.color.set(mode==='night'?0x74c9a2:0x9fd8bc);floor.material.color.set(p.floor);renderer.toneMappingExposure=p.exposure}
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{lighting(b.dataset.light);pressed('[data-light]',b)});
$('#reset').onclick=resetCamera;$('#collapse').onclick=()=>{const settings=$('#settings'),v=!settings.hidden;settings.hidden=v;$('#collapse').textContent=v?'+':'−';$('#collapse').setAttribute('aria-expanded',String(!v))};
$('#reference').onclick=()=>$('#concept-dialog').showModal();$('#close-reference').onclick=()=>$('#concept-dialog').close();$('#concept-dialog').onclick=e=>{if(e.target===$('#concept-dialog'))$('#concept-dialog').close()};
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
$('#capture').onclick=()=>{composer.render();renderer.domElement.toBlob(b=>download(b,'FORGE-portrait.png'))};
async function exportModel(){
  const button=$('#export');button.disabled=true;status.textContent='モデルを保存しています…';
  const saved=[];robot.root.traverse(o=>{if(o.isMesh){saved.push([o,o.material]);o.material=originals.get(o.uuid)}});
  try{return await new GLTFExporter().parseAsync(robot.root,{binary:true,animations:robot.clips,onlyVisible:true,maxTextureSize:1024})}
  finally{for(const [o,m] of saved)o.material=m;button.disabled=false;status.textContent='アニメーション付きGLBを保存しました'}
}
$('#export').onclick=async()=>{try{download(new Blob([await exportModel()],{type:'model/gltf-binary'}),'FORGE-animated.glb')}catch(e){console.error(e);status.textContent='保存に失敗しました。もう一度お試しください'}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){paused=true;$('#pause').checked=true}

// ---- The ledger readout. The mechanism owns the numbers; this only reports
// them, once per forged block rather than once per frame.
let shownHeight=-1;
function updateLedger(){
  const s=robot.ward.state;
  $('#height-value').textContent='#'+s.height.toLocaleString('en-US');
  $('#pending-value').textContent=Math.floor(s.pending)+' tx';
  $('#last-value').textContent=s.lastCount?s.lastCount+' tx':'空ブロック';
  const backlog=Math.max(0,Math.floor(s.pending)-s.capacity);
  $('#forge-caption').textContent=backlog>0
    ?'待機 '+Math.floor(s.pending)+' 件に対し、1ブロックに入るのは '+s.capacity+' 件まで。'+backlog+' 件が次のスロットへ積み残されています。'
    :s.pending<1?'待っているtransactionがありません。それでもスロットは来るので、空のブロックを鍛えて鎖を繋ぎます。'
    :'待機 '+Math.floor(s.pending)+' 件。すべて次のブロックに収まります。';
}
$('#inflow').oninput=e=>{const v=Number(e.target.value);robot.ward.setState({inflow:v});$('#inflow-value').textContent=v+'/s';updateLedger()};
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{
  const p=b.dataset.preset;
  robot.ward.setState(p==='quiet'?{inflow:2,pending:0}:p==='steady'?{inflow:26,pending:9}:p==='busy'?{inflow:70,pending:34}:{inflow:120,pending:80});
  $('#inflow').value=robot.ward.state.inflow;$('#inflow-value').textContent=robot.ward.state.inflow+'/s';
  pressed('[data-preset]',b);updateLedger();
});
updateLedger();

const clock=new T.Clock();let elapsed=0,frames=0;
renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);
  if(!paused){mixer.update(dt);elapsed+=dt}
  // The mechanism runs after the mixer: the hammer stroke is the one thing that
  // overrides the baked clip, and it has to have the last word.
  robot.ward.tick(elapsed,paused?0:dt,motion);
  if(robot.ward.state.height!==shownHeight){shownHeight=robot.ward.state.height;updateLedger()}
  controls.update();composer.render();frames++;
  if(frames===2){$('#loading').classList.add('done');status.textContent='炉の前で構えています'}
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);resetCamera()});
window.ward={scene,robot,mixer,camera,controls,renderer,composer,setMotion,exportModel,lighting,get state(){return{motion,surface,paused,frames,forge:robot.ward.state,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}};

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
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;$('#stage').appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#252b25');scene.fog=new T.FogExp2('#252b25',.035);
const camera=new T.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=4.5;controls.maxDistance=17;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.23;controls.autoRotateSpeed=.65;controls.target.set(0,2.07,0);
function resetCamera(){const mobile=innerWidth<800;camera.position.set(mobile?-5.0:-5.2,mobile?4.0:3.65,mobile?10.9:9.7);controls.target.set(0,mobile?2.30:2.15,0);if(mobile){camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.13,innerWidth,innerHeight)}else{camera.setViewOffset(innerWidth,innerHeight,innerWidth*.065,0,innerWidth,innerHeight)}controls.update()}
resetCamera();
const pmrem=new T.PMREMGenerator(renderer),envScene=new RoomEnvironment();const env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;scene.environmentIntensity=.58;envScene.dispose();pmrem.dispose();
const hemi=new T.HemisphereLight(0xc4cfdb,0x403421,1.4);scene.add(hemi);
const key=new T.DirectionalLight(0xffe2b4,4.1);key.position.set(-3.5,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=6;key.shadow.camera.bottom=-3;key.shadow.normalBias=.018;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
const rim=new T.DirectionalLight(0xb9cfb5,2.4);rim.position.set(3,5,-4);scene.add(rim);
const fill=new T.DirectionalLight(0x91a8b9,.5);fill.position.set(-4,2,-1);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x242922,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.45;floor.receiveShadow=true;scene.add(floor);
const M=createMaterials();const robot=buildRobot(M);scene.add(robot.root);const ground=buildGround(M);scene.add(ground);
const mixer=new T.AnimationMixer(robot.root);let current=mixer.clipAction(robot.clips[0]);current.play();let motion='Idle',surface='original',paused=false,lanternOn=true;
const originals=new Map();robot.root.traverse(o=>{if(o.isMesh)originals.set(o.uuid,o.material)});
const clay=new T.MeshStandardMaterial({color:0xacb2a0,roughness:.7,metalness:0});const wire=new T.MeshBasicMaterial({color:0xbccdb4,wireframe:true});
const target=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,samples:4});
const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));const sao=new SAOPass(scene,camera,new T.Vector2(innerWidth*.6,innerHeight*.6));sao.params.saoIntensity=.015;sao.params.saoScale=1;sao.params.saoKernelRadius=16;sao.params.saoBlurRadius=4;composer.addPass(sao);const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.17,.5,1.45);composer.addPass(bloom);composer.addPass(new OutputPass());
function pressed(selector,target){document.querySelectorAll(selector).forEach(b=>{const active=b===target;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})}
function setMotion(name){const next=mixer.clipAction(robot.clips.find(c=>c.name===name));if(next!==current){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();current.crossFadeTo(next,.4,true);current=next}motion=name;status.textContent={Idle:'のんびり待機中',Walk:'てくてく散歩中',Wave:'こんにちは！',Look:'あたりを見回しています'}[name];document.querySelectorAll('[data-motion]').forEach(b=>{b.classList.toggle('active',b.dataset.motion===name);b.setAttribute('aria-pressed',String(b.dataset.motion===name))})}
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));
$('#speed').oninput=e=>{$('#speed-value').value=Number(e.target.value).toFixed(1)+'×';mixer.timeScale=Number(e.target.value)};
$('#pause').onchange=e=>paused=e.target.checked;$('#rotate').onchange=e=>controls.autoRotate=e.target.checked;
$('#lantern').onchange=e=>{lanternOn=e.target.checked;robot.rig.flame.visible=lanternOn;robot.rig.fire.visible=lanternOn};
document.querySelectorAll('[data-material]').forEach(b=>b.onclick=()=>{surface=b.dataset.material;pressed('[data-material]',b);robot.root.traverse(o=>{if(o.isMesh)o.material=surface==='clay'?clay:surface==='wire'?wire:originals.get(o.uuid)});robot.rig.flame.visible=surface==='original'&&lanternOn;robot.rig.fire.visible=surface==='original'&&lanternOn});
function lighting(mode){const styles={dusk:{bg:'#252b25',key:4.1,env:.58,hemi:1.4,rim:2.4,exposure:1.1,keyColor:0xffe2b4,floor:0x242922},studio:{bg:'#797b70',key:3.9,env:1.05,hemi:2.0,rim:2,exposure:1.15,keyColor:0xfff3df,floor:0x666a60},night:{bg:'#0d1820',key:.6,env:.22,hemi:.40,rim:2.0,exposure:1.12,keyColor:0x8eb9d8,floor:0x101b21}};const p=styles[mode];scene.background.set(p.bg);scene.fog.color.set(p.bg);key.intensity=p.key;key.color.set(p.keyColor);scene.environmentIntensity=p.env;hemi.intensity=p.hemi;rim.intensity=p.rim;rim.color.set(mode==='night'?0x7fb4d8:0xb9cfb5);floor.material.color.set(p.floor);renderer.toneMappingExposure=p.exposure;}
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{lighting(b.dataset.light);pressed('[data-light]',b)});
$('#reset').onclick=resetCamera;$('#collapse').onclick=()=>{const settings=$('#settings'),v=!settings.hidden;settings.hidden=v;$('#collapse').textContent=v?'+':'−';$('#collapse').setAttribute('aria-expanded',String(!v))};
$('#reference').onclick=()=>$('#concept-dialog').showModal();$('#close-reference').onclick=()=>$('#concept-dialog').close();$('#concept-dialog').onclick=e=>{if(e.target===$('#concept-dialog'))$('#concept-dialog').close()};
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
$('#capture').onclick=()=>{composer.render();renderer.domElement.toBlob(b=>download(b,'NOMAD-portrait.png'))};
async function exportModel(){
  const button=$('#export');button.disabled=true;status.textContent='モデルを保存しています…';
  const saved=[];robot.root.traverse(o=>{if(o.isMesh){saved.push([o,o.material]);o.material=originals.get(o.uuid)}});const vis=robot.rig.flame.visible;robot.rig.flame.visible=true;
  try{const exporter=new GLTFExporter();const data=await exporter.parseAsync(robot.root,{binary:true,animations:robot.clips,onlyVisible:false,maxTextureSize:1024});return data}finally{for(const [o,m]of saved)o.material=m;robot.rig.flame.visible=vis;button.disabled=false;status.textContent='アニメーション付きGLBを保存しました'}
}
$('#export').onclick=async()=>{try{download(new Blob([await exportModel()],{type:'model/gltf-binary'}),'NOMAD-animated.glb')}catch(e){console.error(e);status.textContent='保存に失敗しました。もう一度お試しください'}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){paused=true;$('#pause').checked=true}
const clock=new T.Clock();let elapsed=0,frames=0;
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(!paused){mixer.update(dt);elapsed+=dt;robot.rig.flame.scale.set(1+.08*Math.sin(elapsed*19),1+.12*Math.sin(elapsed*13),1);robot.rig.fire.intensity=2.5+.20*Math.sin(elapsed*17)+.1*Math.sin(elapsed*29)}controls.update();composer.render();frames++;if(frames===2){$('#loading').classList.add('done');status.textContent='のんびり待機中'}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);resetCamera()});
// Local verification/export hook. The same export path powers the visible save button.
window.nomad={scene,robot,mixer,camera,controls,renderer,composer,setMotion,exportModel,lighting,get state(){return{motion,surface,paused,frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}};

import * as T from 'three';import{OrbitControls}from'three/addons/controls/OrbitControls.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';import{RenderPass}from'three/addons/postprocessing/RenderPass.js';import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';import{OutputPass}from'three/addons/postprocessing/OutputPass.js';import{GLTFExporter}from'three/addons/exporters/GLTFExporter.js';import{buildHydra}from'./model.js';
const $=s=>document.querySelector(s),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;$('#stage').appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#16121a');scene.fog=new T.FogExp2('#16121a',.035);const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.1,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.5;controls.minDistance=2.5;controls.maxDistance=15;
function reset(){const mobile=innerWidth<800;camera.position.set(2.6,1.7,mobile?7.0:4.8);controls.target.set(0,.75,0);camera.setViewOffset(innerWidth,innerHeight,mobile?0:innerWidth*.07,mobile?innerHeight*.16:0,innerWidth,innerHeight);controls.update();}reset();
const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pm.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.22;room.dispose();pm.dispose();scene.add(new T.HemisphereLight(0xe8b4b8,0x1a1214,.9));const key=new T.DirectionalLight(0xffe9e4,1.5);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);const rim=new T.DirectionalLight(0xe8384f,1.8);rim.position.set(3,3,-4);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:0x1d171b,roughness:1,metalness:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
// A bare dark floor. The five spinning flames are the only fire on this stage.
const figure=buildHydra();scene.add(figure.root);const mixer=new T.AnimationMixer(figure.root);let motion='Idle',action=mixer.clipAction(figure.clips[0]);action.play();let time=0,frames=0,speed=1,paused=false,count=0,firing=null,charge=0;
// Charge streams: five thin beams that bridge each lantern to the chamber while charging.
const streamMat=new T.MeshBasicMaterial({color:0xff5040,toneMapped:false,transparent:true,opacity:0,depthWrite:false});
const streams=[];for(let j=0;j<5;j++){const beam=new T.Mesh(new T.CylinderGeometry(.006,.006,1,6),streamMat);beam.castShadow=false;beam.visible=false;scene.add(beam);streams.push(beam);}
// The settlement bolt: a hot core with a stretched tail, plus a burst ring at the far end.
const bolt=new T.Group();bolt.visible=false;scene.add(bolt);
const boltMat=new T.MeshBasicMaterial({color:0xffb0a6,toneMapped:false});
{const core=new T.Mesh(new T.SphereGeometry(.05,20,14),boltMat);bolt.add(core);
 const tail=new T.Mesh(new T.SphereGeometry(.032,14,10),new T.MeshBasicMaterial({color:0xff5040,toneMapped:false,transparent:true,opacity:.55,depthWrite:false}));tail.scale.set(1,1,7);tail.position.z=-.24;bolt.add(tail);
 bolt.children.forEach(c=>c.castShadow=false);}
const burstMat=new T.MeshBasicMaterial({color:0xff5040,toneMapped:false,transparent:true,opacity:0,depthWrite:false});
const burst=new T.Mesh(new T.TorusGeometry(.16,.014,10,48),burstMat);burst.visible=false;burst.castShadow=false;scene.add(burst);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.55,.5,1.35));composer.addPass(new OutputPass());
function setMotion(n){const next=mixer.clipAction(figure.clips.find(c=>c.name===n));next.reset().play();if(next!==action)action.crossFadeTo(next,.35,true);action=next;motion=n;document.querySelectorAll('[data-motion]').forEach(b=>{b.classList.toggle('active',b.dataset.motion===n);b.setAttribute('aria-pressed',String(b.dataset.motion===n))});$('#status').textContent={Idle:'五つの炎が回っています',Walk:'歩いています'}[n];}
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));$('#speed').oninput=e=>{speed=Number(e.target.value);$('#speed-value').value=speed+'×'};$('#pause').onchange=e=>paused=e.target.checked;$('#rotate').onchange=e=>controls.autoRotate=e.target.checked;$('#reset').onclick=reset;$('#collapse').onclick=()=>{$('#settings').hidden=!$('#settings').hidden};
$('#fire').onclick=()=>{if(firing)return;firing={start:time,fired:false,from:new T.Vector3(),dir:new T.Vector3()};$('#status').textContent='五つの炎から、力を集めています…';};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}$('#capture').onclick=()=>renderer.domElement.toBlob(b=>download(b,'HYDRA.png'));$('#export').onclick=async()=>{const b=$('#export');b.disabled=true;try{download(new Blob([await new GLTFExporter().parseAsync(figure.root,{binary:true,animations:figure.clips})]),'HYDRA-animated.glb')}finally{b.disabled=false}};
const wA=new T.Vector3(),wB=new T.Vector3(),up=new T.Vector3(0,1,0);
function bridge(beam,from,to){const v=wB.copy(to).sub(from);beam.position.copy(from).addScaledVector(v,.5);beam.scale.set(1,v.length(),1);beam.quaternion.setFromUnitVectors(up,v.normalize());}
const clock=new T.Clock();function frame(){const dt=Math.min(clock.getDelta(),.05);if(!paused){time+=dt*speed;mixer.update(dt*speed);
 if(firing){const f=time-firing.start;
  if(f<1.6){// charge: streams tighten from every lantern into the chamber
   charge=Math.min(1,f/1.6);streamMat.opacity=.15+charge*.6;
   figure.anchors.chamber.getWorldPosition(wA);
   streams.forEach((beam,j)=>{beam.visible=true;bridge(beam,figure.anchors.flames[j].getWorldPosition(new T.Vector3()),wA);});
  }else if(!firing.fired){firing.fired=true;streams.forEach(beam=>beam.visible=false);
   figure.anchors.muzzle.getWorldPosition(firing.from);figure.anchors.muzzle.getWorldDirection(firing.dir);
   bolt.visible=true;bolt.position.copy(firing.from);bolt.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),firing.dir);
  }else{const s=(f-1.6)/1.1;
   if(s<1){bolt.position.copy(firing.from).addScaledVector(firing.dir,s*6);charge=Math.max(0,1-s*2);}
   else{if(bolt.visible){bolt.visible=false;burst.visible=true;burst.position.copy(firing.from).addScaledVector(firing.dir,6);burst.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),firing.dir);}
    const e=(s-1)*2.2;if(e<1){burst.scale.setScalar(1+e*2.5);burstMat.opacity=.9*(1-e);}
    else{burst.visible=false;firing=null;charge=0;$('#status').textContent='決済完了 · '+(++count)+' shots';}}}
 }else charge=Math.max(0,charge-dt*2);
 figure.tick(time,motion,charge);
 if(motion==='Walk'&&$('#travel').checked&&!firing){const a=time*.28;figure.root.position.set(Math.sin(a)*1.25,0,Math.sin(a*2)*.48);figure.root.rotation.y=Math.atan2(Math.cos(a)*1.25,Math.cos(a*2)*.96);}
}controls.update();composer.render();frames++;}renderer.setAnimationLoop(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);reset()});if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;$('#pause').checked=true;}window.hydra={figure,mixer,scene,camera,controls,renderer,setMotion,step:frame,get state(){return{frames,motion,count,paused}}};

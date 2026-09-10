import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {buildArcade} from './model.js';

const scene=new T.Scene();scene.background=new T.Color(0x142334);scene.fog=new T.Fog(0x142334,65,140);
const camera=new T.PerspectiveCamera(40,innerWidth/innerHeight,.05,220),renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.prepend(renderer.domElement);
const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
const ambient=new T.HemisphereLight(0xbed3ee,0x65503b,1.25);scene.add(ambient);
const sun=new T.DirectionalLight(0xffd39a,2.1);sun.position.set(-16,28,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:85});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
const fill=new T.DirectionalLight(0x749bdb,.85);fill.position.set(15,18,-15);scene.add(fill);
for(const x of [-3.65,0,3.65]){const l=new T.PointLight(0xffba61,32,8,2);l.position.set(x,4.8,2.6);scene.add(l);}
for(const x of [-7.35,7.35]){const l=new T.PointLight(0xffac42,14,5,2);l.position.set(x,14.6,3.05);scene.add(l);}
const heart=new T.PointLight(0xffa42f,32,9,2);heart.position.set(0,10,2.4);scene.add(heart);
const arcade=buildArcade();scene.add(arcade.root);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.6;controls.maxDistance=85;controls.maxPolarAngle=Math.PI*.495;
const views={
 exterior:{p:[23,16,32],t:[0,7,0],cut:false,text:'大金庫と同じ石材。大アーチの機械室と2基の灯塔、左右の空中配管を備えた遊技館。'},
 hall:{p:[9,5.5,14],t:[0,3,.5],cut:true,text:'3台の遊技装置、梁に吊った動力軸、分岐配管と圧力計。奥には作業台、側面と上階には点検用通路。'},
 engine:{p:[7,11,13],t:[0,9.7,2.2],cut:true,text:'80歯の主歯車と24歯の従動歯車。共通モジュールの歯形と歯数比に対応した回転、背面の軸受と伝達プーリー。'},
 service:{p:[10,7,-16],t:[0,4,-3],cut:true,rear:true,text:'画像の見えない側を補完した整備室。背面の伝達ベルト、工具台、分岐弁、2折れ階段と上階の点検回廊。'},
 helix:{p:[-7,4.4,6.8],t:[-3.65,2.8,1],cut:true,text:'2本の螺旋レール、転がる球、支持腕、回収シュート、背面のバケット昇降機、上部の計器盤。'},
 reels:{p:[3.4,3.7,7],t:[0,2.8,1],cut:true,text:'立体記号を載せた3本の回転ドラム。共通軸・側面歯車・操作レバー・背面の伝達歯車とばね機構。'},
 crane:{p:[7,4,6],t:[3.65,2.8,1],cut:true,text:'透明な円筒内に景品、横移動する台車、巻上げドラム、伸縮するワイヤー、開閉する4本の爪。'},
 pipes:{p:[16,12,15],t:[6.9,8.6,3.6],cut:false,text:'炎の可視配管、ボルト付きフランジ、圧力調整筒と計器。左右の接続口は住宅と同じ DN440・上向き・地上9 m。'}
};
let active='exterior',time=0,exporting=false;
function showView(id){active=id;const v=views[id];arcade.setCutaway(v.cut);arcade.layers.rear.visible=!v.rear;document.querySelector('#cutaway').checked=v.cut;const target=new T.Vector3(...v.t),offset=new T.Vector3(...v.p).sub(target);if(innerWidth<=760)offset.multiplyScalar(id==='exterior'?2:1.65);camera.position.copy(target).add(offset);controls.target.copy(target);camera.setViewOffset(innerWidth,innerHeight,innerWidth>760?125:0,innerWidth<=760?innerHeight*.16:0,innerWidth,innerHeight);camera.updateProjectionMatrix();controls.update();document.querySelector('#description').textContent=v.text;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelector('#cutaway').onchange=e=>{arcade.setCutaway(e.target.checked);arcade.layers.rear.visible=true;};
document.querySelector('#day').onchange=e=>{ambient.intensity=e.target.checked?2.3:1.25;sun.intensity=e.target.checked?3:2.1;scene.background.setHex(e.target.checked?0x748c9c:0x142334);scene.fog.color.copy(scene.background);};
async function exportAsset(which='all'){
 const object=which==='all'?arcade.root:arcade.machines[Number(which)],visibility=Object.values(arcade.layers).map(g=>g.visible),pos=object.position.clone();
 try{exporting=true;Object.values(arcade.layers).forEach(g=>g.visible=true);arcade.tick(0);if(which!=='all')object.position.set(0,0,0);
  const names=new Set();object.traverse(o=>names.add(o.name));const animations=arcade.root.animations.map(c=>new T.AnimationClip(c.name,c.duration,c.tracks.filter(t=>names.has(t.name.slice(0,t.name.lastIndexOf('.'))))));
  return await new GLTFExporter().parseAsync(object,{binary:true,animations,onlyVisible:false});
 }finally{Object.values(arcade.layers).forEach((g,i)=>g.visible=visibility[i]);object.position.copy(pos);arcade.tick(time);exporting=false;}
}
document.querySelector('#download').onclick=async()=>{const b=document.querySelector('#download');b.disabled=true;try{const which=document.querySelector('#asset').value,buffer=await exportAsset(which),a=document.createElement('a'),url=URL.createObjectURL(new Blob([buffer],{type:'model/gltf-binary'}));a.href=url;a.download=`CORN-arcade-${which}.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}catch(e){document.querySelector('#error').hidden=false;document.querySelector('#error').textContent=e.message;}finally{b.disabled=false;}};
showView(active);let count=0,vertices=0;arcade.root.traverse(o=>{if(o.isMesh){count++;vertices+=o.geometry.attributes.position.count;}});document.querySelector('#status').textContent=`3装置 / ${arcade.motions.length}可動部 / ${Math.round(vertices/3).toLocaleString()}面相当 · CORN`;
window.arcade={...arcade,renderer,scene,camera,controls,showView,exportAsset,stats:{meshes:count,vertices,motions:arcade.motions.length}};
const clock=new T.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(exporting)return;if(!document.querySelector('#pause').checked)time+=dt;arcade.tick(time);controls.update();renderer.render(scene,camera);});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);showView(active);});

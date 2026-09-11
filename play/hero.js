import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildMouse} from '../pip/model.js';

// PIP, live, on the front page: the same figure the games run, standing on a
// brass plate on porcelain-coloured ground, idling, turned slowly by the
// visitor's pointer. Transparent over the page, so the page is the room.
const host=document.getElementById('hero3d');
if(host){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
 renderer.setClearColor(0x000000,0);
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 host.appendChild(renderer.domElement);

 const scene=new T.Scene();
 const camera=new T.PerspectiveCamera(30,1,.1,60);
 const pmrem=new T.PMREMGenerator(renderer);
 scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;
 scene.environmentIntensity=.55;
 scene.add(new T.HemisphereLight(0xfff4e6,0xcdbfa8,.9));
 const key=new T.DirectionalLight(0xfff0d6,1.6);
 key.position.set(-3,6,4);key.castShadow=true;
 key.shadow.mapSize.set(1024,1024);key.shadow.radius=6;
 key.shadow.camera.left=key.shadow.camera.bottom=-2.5;key.shadow.camera.right=key.shadow.camera.top=2.5;
 scene.add(key);

 // The plate from the games, and a shadow catcher so PIP has weight on the page.
 const plate=new T.Mesh(new T.CylinderGeometry(.95,.95,.06,48),new T.MeshStandardMaterial({color:0x8a6a2b,metalness:.85,roughness:.42}));
 plate.position.y=-.03;plate.receiveShadow=true;scene.add(plate);
 const ring=new T.Mesh(new T.TorusGeometry(1.0,.04,8,64),new T.MeshStandardMaterial({color:0xc9a24a,metalness:.9,roughness:.35}));
 ring.rotation.x=Math.PI/2;ring.position.y=.01;scene.add(ring);
 const catcher=new T.Mesh(new T.CircleGeometry(3,48),new T.ShadowMaterial({opacity:.18}));
 catcher.rotation.x=-Math.PI/2;catcher.position.y=-.06;catcher.receiveShadow=true;scene.add(catcher);

 const fig=buildMouse();
 fig.root.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
 // Fit to a known height, feet on the plate.
 const box=new T.Box3().setFromObject(fig.root);const h=box.max.y-box.min.y;const s=1.5/h;
 fig.root.scale.setScalar(s);fig.root.position.y=-box.min.y*s;
 scene.add(fig.root);
 const mixer=new T.AnimationMixer(fig.root);
 mixer.clipAction(fig.clips.find(c=>c.name==='Idle')||fig.clips[0]).play();

 // Turned by the pointer, gently, and left to drift back.
 let want=0,turn=0;
 addEventListener('pointermove',e=>{want=((e.clientX/innerWidth)-.5)*.9;},{passive:true});

 function size(){
  const w=host.clientWidth,hh=host.clientHeight;
  renderer.setSize(w,hh,false);camera.aspect=w/hh;camera.updateProjectionMatrix();
 }
 size();addEventListener('resize',size);
 camera.position.set(0,1.25,4.6);camera.lookAt(0,.78,0);

 const clock=new T.Clock();let t=0;
 renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);t+=dt;
  mixer.update(dt);fig.tick(t,'Idle',0);
  turn+=(want-turn)*Math.min(1,dt*3);
  fig.root.rotation.y=turn+Math.sin(t*.4)*.12;
  renderer.render(scene,camera);
 });
 host.classList.add('on');
}

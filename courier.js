import * as T from 'three';
import { buildMouse } from './pip/model.js';

// PIP crosses the foot of the teaser, back and forth, delivering nothing in
// particular. It loads after the page is up and fades in when it is ready, so
// the first paint is never waiting on it.
export async function runCourier(host){
 const W=()=>host.clientWidth,H=()=>host.clientHeight;
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setSize(W(),H());
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 host.appendChild(renderer.domElement);

 const scene=new T.Scene();
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 // A longer lens, further back: at 30° from 3.6 units the perspective was
 // strong enough that the running lean read as a squat, wide body.
 const camera=new T.PerspectiveCamera(22,W()/H(),.1,60);
 camera.position.set(0,.92,5.0);camera.lookAt(0,.62,0);
 scene.add(new T.HemisphereLight(0xbcd2dd,0x1a2018,1.5));
 const key=new T.DirectionalLight(0xffe2b0,1.5);key.position.set(-3,4,3);
 key.castShadow=true;key.shadow.mapSize.set(1024,1024);
 const shadowCam=key.shadow.camera;shadowCam.left=-5;shadowCam.right=5;shadowCam.top=4;shadowCam.bottom=-4;shadowCam.near=.5;shadowCam.far=14;
 key.shadow.bias=-.0012;
 scene.add(key);
 // An invisible floor that catches the shadow: without it PIP just grows and
 // shrinks with no sense of standing anywhere.
 const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({opacity:.42}));
 floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const rim=new T.DirectionalLight(0x8fd8f0,.8);rim.position.set(4,2,-3);scene.add(rim);

 const pip=buildMouse();
 // The mixer owns pip.root's transform, so steering happens on a carrier
 // group above it.
 const carrier=new T.Group();carrier.add(pip.root);scene.add(carrier);
 pip.root.traverse(o=>{if(o.isMesh)o.castShadow=true});

 // How much room there is at a given depth: nearer to the camera the frame is
 // narrower in world units and the head reaches higher, so PIP is kept further
 // in. Without this it clips the edges of the lane whenever it comes forward.
 const HEAD=1.5,FOOT=-.1;
 const roomAt=z=>{
  const dist=camera.position.z-z;
  const halfH=Math.tan(camera.fov*Math.PI/360)*dist;
  const halfW=halfH*camera.aspect;
  // Keep the whole body inside the frame: the shot must cover foot to head.
  const fits=halfH*2>=(HEAD-FOOT)*1.12;
  return {halfW,fits};
 };
 const nearestZ=()=>{
  // Walk back from the camera until the full body fits in frame.
  let z=camera.position.z-1;
  while(z>-3&&!roomAt(z).fits)z-=.1;
  return z-.15;
 };
 // Marks always sit well to one side of where PIP is now, and never far in
 // depth: walking straight at the camera turns it face-on, which is its widest
 // and least flattering silhouette. Kept mostly lateral, it stays in profile.
 const pick=from=>{
  const far=-1.8,near=Math.min(.7,nearestZ());
  const z=T.MathUtils.clamp((from?from.z:0)+(Math.random()*2-1)*.7,far,near);
  // Stay well inside the frame: perspective distorts most toward the edges,
  // and a turn made out there is where the body looks stretched.
  const limit=Math.max(.3,(roomAt(z).halfW-.75)*.62);
  const here=from?from.x:0;
  // Cross to the other side of the lane, so the walk reads as a run past.
  const side=here>0?-1:1;
  const x=side*(limit*(.35+Math.random()*.65));
  return new T.Vector3(x,0,z);
 };
 let target=pick(null),heading=Math.PI/2,dash=0,dashTimer=3+Math.random()*4,t=0;
 carrier.position.copy(pick(null));

 const clock=new T.Clock();
 let running=true;
 const resize=()=>{
  if(!W()||!H())return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W(),H());
  camera.aspect=W()/H();camera.updateProjectionMatrix();
 };
 addEventListener('resize',resize);
 // Zoom and layout shifts do not always fire a window resize.
 new ResizeObserver(resize).observe(host);
 // Nothing to animate while the tab is hidden or the section is scrolled away.
 const io=new IntersectionObserver(([e])=>{running=e.isIntersecting},{threshold:0});
 io.observe(host);

 const mixer=new T.AnimationMixer(pip.root);
 const actions={};
 for(const clip of pip.clips)actions[clip.name]=mixer.clipAction(clip);
 let motion='Run';
 const setMotion=name=>{
  if(name===motion)return;
  actions[motion]?.fadeOut(.25);
  actions[name]?.reset().fadeIn(.25).play();
  motion=name;
 };
 actions.Run?.play();

 const step=new T.Vector3();
 renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);
  if(!running||document.hidden)return;
  t+=dt;
  dashTimer-=dt;
  if(dashTimer<=0){dash=1.6;dashTimer=5+Math.random()*7;}
  if(dash>0)dash-=dt;
  setMotion(dash>0?'Dash':'Run');

  // Head for the current mark; on arrival, choose another anywhere in the lane.
  step.copy(target).sub(carrier.position);
  const distance=step.length();
  if(distance<.25){target=pick(carrier.position);}
  else if(Math.abs(carrier.position.x)>(roomAt(carrier.position.z).halfW-.75)*.78){
   // The frame narrowed under it (a resize, or it drifted forward): pick again.
   target=pick(carrier.position);
  }
  else{
   step.divideScalar(distance);
   carrier.position.addScaledVector(step,(dash>0?3.4:1.5)*dt);
   // Turn toward the way it is going, the long way never taken.
   const want=Math.atan2(step.x,step.z);
   let delta=(want-heading+Math.PI*3)%(Math.PI*2)-Math.PI;
   heading+=delta*(1-Math.exp(-dt*5));
   carrier.rotation.y=heading;
  }
  pip.tick(t,motion,0);
  mixer.update(dt);
  renderer.render(scene,camera);
 });
 host.classList.add('ready');
 return ()=>{io.disconnect();removeEventListener('resize',resize);renderer.setAnimationLoop(null);renderer.dispose();};
}

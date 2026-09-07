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
 const camera=new T.PerspectiveCamera(30,W()/H(),.1,60);
 camera.position.set(0,.70,3.6);camera.lookAt(0,.50,0);
 scene.add(new T.HemisphereLight(0xbcd2dd,0x1a2018,1.5));
 const key=new T.DirectionalLight(0xffe2b0,1.5);key.position.set(-3,4,3);scene.add(key);
 const rim=new T.DirectionalLight(0x8fd8f0,.8);rim.position.set(4,2,-3);scene.add(rim);

 const pip=buildMouse();
 // The mixer owns pip.root's transform, so steering happens on a carrier
 // group above it.
 const carrier=new T.Group();carrier.add(pip.root);scene.add(carrier);

 const bounds=()=>{
  const halfW=Math.tan(camera.fov*Math.PI/360)*camera.position.z*camera.aspect;
  return {x:halfW*.80,near:.7,far:-1.8};
 };
 const pick=()=>{const b=bounds();return new T.Vector3((Math.random()*2-1)*b.x,0,b.far+Math.random()*(b.near-b.far))};
 let target=pick(),heading=Math.PI/2,dash=0,dashTimer=3+Math.random()*4,t=0;
 carrier.position.copy(pick());

 const clock=new T.Clock();
 let running=true;
 const resize=()=>{renderer.setSize(W(),H());camera.aspect=W()/H();camera.updateProjectionMatrix()};
 addEventListener('resize',resize);
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
  if(distance<.25){target=pick();}
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

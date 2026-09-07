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
 camera.position.set(0,.62,4.2);camera.lookAt(0,.52,0);
 scene.add(new T.HemisphereLight(0xbcd2dd,0x1a2018,1.5));
 const key=new T.DirectionalLight(0xffe2b0,1.5);key.position.set(-3,4,3);scene.add(key);
 const rim=new T.DirectionalLight(0x8fd8f0,.8);rim.position.set(4,2,-3);scene.add(rim);

 const pip=buildMouse();
 pip.root.scale.setScalar(1);
 scene.add(pip.root);

 // Lane limits in world units, derived from the camera frustum at z=0.
 const halfWidth=()=>Math.tan(camera.fov*Math.PI/360)*camera.position.z*camera.aspect;
 let dir=1,x=-halfWidth()*.9,t=0,dash=0,dashTimer=4+Math.random()*5;
 const clock=new T.Clock();
 let running=true;
 const resize=()=>{renderer.setSize(W(),H());camera.aspect=W()/H();camera.updateProjectionMatrix()};
 addEventListener('resize',resize);
 // Nothing to animate while the tab is hidden or the section is scrolled away.
 const io=new IntersectionObserver(([e])=>{running=e.isIntersecting},{threshold:0});
 io.observe(host);

 renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);
  if(!running||document.hidden)return;
  t+=dt;
  dashTimer-=dt;
  if(dashTimer<=0){dash=1.4;dashTimer=5+Math.random()*7;}
  if(dash>0)dash-=dt;
  const motion=dash>0?'Dash':'Run';
  const speed=dash>0?3.1:1.35;
  x+=dir*speed*dt;
  const edge=halfWidth()*.95;
  if(x>edge){x=edge;dir=-1;}
  if(x<-edge){x=-edge;dir=1;}
  pip.root.position.set(x,0,0);
  // Face the way it runs, with a little lean into the turn-around.
  pip.root.rotation.y=T.MathUtils.lerp(pip.root.rotation.y,dir>0?Math.PI/2:-Math.PI/2,1-Math.exp(-dt*6));
  pip.tick(t,motion,0);
  const clip=pip.clips.find(c=>c.name===motion);
  if(clip){
   if(!pip._mixer){pip._mixer=new T.AnimationMixer(pip.root);pip._actions={};}
   if(!pip._actions[motion]){pip._actions[motion]=pip._mixer.clipAction(clip);}
   for(const [name,action] of Object.entries(pip._actions))
    action.enabled=name===motion,action.setEffectiveWeight(name===motion?1:0),action.play();
   pip._mixer.update(dt);
  }
  renderer.render(scene,camera);
 });
 host.classList.add('ready');
 return ()=>{io.disconnect();removeEventListener('resize',resize);renderer.setAnimationLoop(null);renderer.dispose();};
}

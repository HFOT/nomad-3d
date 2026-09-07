import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export function buildNox(){
 const root=new T.Group();root.name='NOX';root.userData={author:'CORN',concept:'Hovering black-masked proof bearer. Fictional simulation.'};let serial=0;const rig={};
 // The same karakuri build language as the rest of the series: porcelain, lacquer and brass.
 const lacquer=new T.MeshStandardMaterial({color:0x1c2140,metalness:.45,roughness:.38});
 const porcelain=new T.MeshStandardMaterial({color:0xe1d6b9,metalness:.12,roughness:.44});
 const brass=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});
 const dark=new T.MeshStandardMaterial({color:0x10121e,metalness:.6,roughness:.4});
 const maskMat=new T.MeshPhysicalMaterial({color:0x0a0b12,roughness:.22,clearcoat:1,clearcoatRoughness:.15});
 const glow=new T.MeshStandardMaterial({color:0xd7dbff,emissive:0x939bf0,emissiveIntensity:2.0});
 const eyeMat=new T.MeshStandardMaterial({color:0x6b74d8,emissive:0x939bf0,emissiveIntensity:1.5});
 const ringGlow=new T.MeshStandardMaterial({color:0xbfc5ff,emissive:0x939bf0,emissiveIntensity:1.2,metalness:.4,roughness:.3});
 // The heart is a dark orb while shelled; only its emissive channel carries the reveal.
 const heartMat=new T.MeshStandardMaterial({color:0x262c4e,emissive:0x939bf0,emissiveIntensity:.5,roughness:.4});
 function g(p,name,x=0,y=0,z=0){const o=new T.Group();o.name=name;o.position.set(x,y,z);p.add(o);return o;}
 function m(p,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.name='NoxPart'+serial++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function ball(p,mat,x,y,z,a,b=a,c=a){const o=m(p,new T.SphereGeometry(1,40,28),mat,x,y,z);o.scale.set(a,b,c);return o;}
 function box(p,mat,x,y,z,w,h,d,r=.025){return m(p,new RoundedBoxGeometry(w,h,d,6,r),mat,x,y,z);}
 function cyl(p,mat,x,y,z,r,h,axis='y'){const o=m(p,new T.CylinderGeometry(r,r,h,32),mat,x,y,z);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;return o;}
 function ring(p,mat,x,y,z,r,t,axis='z'){const o=m(p,new T.TorusGeometry(r,t,12,64),mat,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
 function link(p,mat,a,b,r1,r2=r1){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=m(p,new T.CylinderGeometry(r2,r1,v.length(),32),mat);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}

 // The whole figure hovers on an energy core: no legs anywhere in the series' ninth body.
 const body=rig.body=g(root,'NoxBody',0,.62,0);

 // Torso: a lacquered karakuri chest with brass seams, in the same build as the others.
 box(body,lacquer,0,.10,0,.44,.42,.32,.10);
 box(body,brass,0,-.10,0,.30,.05,.24,.02);
 // A tapered waist runs the torso down into the core, so the rings read as the lower body.
 m(body,new T.CylinderGeometry(.155,.085,.15,32),lacquer,0,-.185,0);
 cyl(body,brass,0,-.262,0,.088,.02);
 for(const s of [-1,1])for(let j=0;j<3;j++)box(body,brass,s*.16,.22-j*.055,.162,.019,.022,.007,.003);
 // A proof-sigil emblem set into the chest: a small emissive diamond in a brass bezel.
 const emblem=m(body,new T.OctahedronGeometry(.032),glow,0,.13,.168);emblem.scale.z=.45;emblem.rotation.z=Math.PI/4;emblem.castShadow=false;
 ring(body,brass,0,.13,.166,.05,.006);

 // Head: a porcelain dome that is never seen bare — a black lacquered mask covers the face.
 const head=rig.head=g(body,'NoxHead',0,.44,0);
 ball(head,porcelain,0,0,-.01,.125,.140,.115);
 cyl(head,brass,0,-.135,0,.075,.035);// collar between mask and torso
 const mask=g(head,'NoxMask',0,.005,.065);mask.rotation.x=-.06;
 ball(mask,maskMat,0,0,0,.112,.132,.045);
 const rim=m(mask,new T.TorusGeometry(.112,.008,10,48),brass,0,0,.012);rim.scale.set(1,1.18,1);
 for(const s of [-1,1]){
  const slit=m(mask,new T.BoxGeometry(.044,.0045,.008),eyeMat,s*.046,.014,.041);
  slit.rotation.z=s*.10;slit.rotation.y=s*.30;slit.castShadow=false;
 }
 ball(head,brass,0,.148,0,.018,.010,.018);// a small brass crest on the dome

 // Arms: the series' jointed build — lacquer links, brass cuffs, porcelain hands.
 for(const s of [-1,1]){
  const arm=rig['arm'+s]=g(body,'NoxArm'+s,s*.26,.20,0);
  cyl(arm,dark,0,0,0,.060,.10,'x');cyl(arm,brass,s*.045,0,0,.047,.018,'x');
  link(arm,lacquer,[0,-.02,0],[s*.045,-.16,.05],.056,.045);
  ball(arm,dark,s*.045,-.16,.05,.045);cyl(arm,brass,s*.08,-.16,.05,.032,.018,'x');
  link(arm,lacquer,[s*.045,-.16,.05],[s*.01,-.30,.10],.047,.036);
  cyl(arm,brass,s*.01,-.315,.10,.036,.02);
  ball(arm,porcelain,s*.005,-.35,.105,.032,.038,.028);
 }

 // The energy core: a glowing heart wrapped in layered rings. The rings are the
 // disclosure mechanism — laid flat they shell the light away, tilted open they let it out.
 const core=rig.core=g(body,'NoxCore',0,-.345,0);
 const heart=ball(core,heartMat,0,0,0,.085);heart.castShadow=false;
 const coreLight=new T.PointLight(0x939bf0,.5,2.2);core.add(coreLight);
 const rings=[];
 for(let j=0;j<4;j++){
  const carrier=g(core,'NoxRingCarrier'+j,0,0,0);// tick sets the open tilt here
  const spinner=g(carrier,'NoxRing'+j,0,0,0);// and the spin here
  const radius=.15+j*.062;
  const hoop=m(spinner,new T.TorusGeometry(radius,.017-j*.002,12,72),j%2?brass:dark);
  hoop.rotation.x=Math.PI/2;
  const edge=m(spinner,new T.TorusGeometry(radius,.005,8,72),ringGlow);edge.rotation.x=Math.PI/2;edge.position.y=.012;edge.castShadow=false;
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;const stud=box(spinner,brass,Math.sin(a)*radius,0,Math.cos(a)*radius,.020,.030,.020,.004);stud.rotation.y=a;}
  rings.push({carrier,spinner,dir:j%2?-1:1,speed:.5+j*.22,tilt:.55+j*.28});
 }

 // Night motes: a few slow embers that orbit the figure. Pure atmosphere.
 const motes=[];
 for(let j=0;j<5;j++){
  const mote=ball(root,glow,0,0,0,.0075);mote.castShadow=false;
  motes.push({mote,r:.48+j*.075,h:.32+j*.14,phase:j*2.4,speed:.25+j*.06});
 }

 // Clips are sampled from pose() exactly like the other characters.
 const nodes=Object.values(rig),clips=[];
 function pose(mode,t){
  if(mode==='Idle'){
   const w=t*Math.PI/2;// one full cycle over the 4s loop
   body.position.set(0,.62+.045*Math.sin(w),0);body.rotation.set(.01*Math.sin(w+.7),0,.02*Math.sin(w+1.3));
   head.rotation.set(0,.08*Math.sin(w+2.1),.015*Math.sin(w));
   for(const s of [-1,1])rig['arm'+s].rotation.set(.05*Math.sin(w+s),0,s*.04);
   core.position.set(0,-.345-.018*Math.sin(w),0);core.rotation.set(0,0,.02*Math.sin(w+.5));
  }else{// Drift: pitched into the glide, arms trailing, the core leaning into the turn
   const w=t*Math.PI*2/3;// one full cycle over the 3s loop
   body.position.set(0,.62+.03*Math.sin(2*w),0);body.rotation.set(.16+.015*Math.sin(2*w),0,.02*Math.sin(w));
   head.rotation.set(-.09,.04*Math.sin(w),0);
   for(const s of [-1,1])rig['arm'+s].rotation.set(-.28+.03*Math.sin(w+s),0,s*.10);
   core.position.set(0,-.325,-.03);core.rotation.set(-.10,0,.015*Math.sin(w));
  }
 }
 for(const [name,duration] of [['Idle',4],['Drift',3]]){
  const times=[],data=nodes.map(()=>({p:[],q:[]}));
  for(let i=0;i<=duration*30;i++){const t=i/30;pose(name,t);times.push(t);nodes.forEach((o,j)=>{data[j].p.push(...o.position.toArray());data[j].q.push(...o.quaternion.toArray());});}
  const tracks=[];nodes.forEach((o,j)=>{tracks.push(new T.VectorKeyframeTrack(o.name+'.position',times,data[j].p),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,data[j].q));});
  clips.push(new T.AnimationClip(name,duration,tracks));
 }
 pose('Idle',0);

 let boost=0;
 return{root,rig,clips,tick(t,motion='Idle',proof=0){
  boost=T.MathUtils.lerp(boost,motion==='Drift'?1:.18,.08);
  // The core breathes on its own slow cycle: shelled most of the time, then the
  // rings tilt open and the light spills out. A proof forces them open.
  const open=Math.max(Math.pow(Math.max(0,Math.sin(t*.45)),3),proof);
  rings.forEach((r,j)=>{
   r.spinner.rotation.y=t*r.speed*r.dir*(1+boost*1.6);
   r.carrier.rotation.x=.05*Math.sin(t*.9+j)+r.tilt*open*(j%2?-1:1);
   r.carrier.rotation.z=.04*Math.sin(t*.7+j*2)+r.tilt*.55*open*(j%2?1:-1);
  });
  const flicker=.10*Math.sin(t*9)+.05*Math.sin(t*21);
  glow.emissiveIntensity=.9+flicker+open*2.0;
  heartMat.emissiveIntensity=.35+flicker+open*3.4;
  coreLight.intensity=.3+flicker+open*1.9;
  ringGlow.emissiveIntensity=1.0+.3*Math.sin(t*3.1)+open*1.2;
  eyeMat.emissiveIntensity=1.4+.35*Math.sin(t*1.7)+proof*1.0;
  for(const {mote,r,h,phase,speed} of motes){
   const a=t*speed+phase;
   mote.position.set(Math.sin(a)*r,h+.12*Math.sin(a*1.7),Math.cos(a)*r);
   mote.scale.setScalar(.0075*(1+.4*Math.sin(a*3.1)));
  }
 }};
}

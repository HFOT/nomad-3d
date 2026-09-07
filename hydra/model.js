import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export function buildHydra(){
 const root=new T.Group();root.name='HYDRA';root.userData={author:'CORN',concept:'Black-armored settlement gunner with five spinning-flame lanterns. Fictional simulation.'};let serial=0;const rig={};
 const armor=new T.MeshStandardMaterial({color:0x15171c,metalness:.55,roughness:.5});
 const porcelain=new T.MeshStandardMaterial({color:0xe8e2d5,metalness:.1,roughness:.4});
 const brass=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});
 const dark=new T.MeshStandardMaterial({color:0x0c0e13,metalness:.6,roughness:.4});
 const flameMat=new T.MeshStandardMaterial({color:0xffd7cc,emissive:0xff3b30,emissiveIntensity:2.5});
 const trailMat=new T.MeshStandardMaterial({color:0xff8d80,emissive:0xe8384f,emissiveIntensity:1.8,transparent:true,opacity:.55,depthWrite:false});
 const glass=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.08,metalness:0,transmission:.92,thickness:.02});
 const chamberMat=new T.MeshStandardMaterial({color:0xffe3df,emissive:0xff3b30,emissiveIntensity:.3});
 const eyeMat=new T.MeshStandardMaterial({color:0xd85560,emissive:0xe8384f,emissiveIntensity:1.5});
 function g(p,name,x=0,y=0,z=0){const o=new T.Group();o.name=name;o.position.set(x,y,z);p.add(o);return o;}
 function m(p,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.name='HydraPart'+serial++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function ball(p,mat,x,y,z,a,b=a,c=a){const o=m(p,new T.SphereGeometry(1,40,28),mat,x,y,z);o.scale.set(a,b,c);return o;}
 function box(p,mat,x,y,z,w,h,d,r=.02){return m(p,new RoundedBoxGeometry(w,h,d,5,r),mat,x,y,z);}
 function cyl(p,mat,x,y,z,r,h,axis='y'){const o=m(p,new T.CylinderGeometry(r,r,h,32),mat,x,y,z);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;return o;}
 function ring(p,mat,x,y,z,r,t,axis='z'){const o=m(p,new T.TorusGeometry(r,t,10,40),mat,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
 function link(p,mat,a,b,r1,r2=r1){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=m(p,new T.CylinderGeometry(r2,r1,v.length(),24),mat);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}

 const body=rig.body=g(root,'GunnerBody',0,.5,0);
 box(body,armor,0,.05,0,.42,.5,.30,.09);
 // Brass center seam and a small red service lamp: the only warm marks on the black shell.
 box(body,brass,0,.05,.152,.02,.42,.012,.004);
 for(const y of [-.1,.02,.14])box(body,brass,0,y,.155,.11,.014,.008,.003);
 ball(body,eyeMat,.13,.2,.15,.013).castShadow=false;

 // Flattened porcelain head over a dark collar; two narrow red eye slits are the whole face.
 const head=rig.head=g(body,'GunnerHead',0,.42,0);
 cyl(head,dark,0,-.02,0,.10,.06);
 ball(head,porcelain,0,.11,0,.20,.165,.175);
 for(const s of [-1,1]){
  const slit=m(head,new T.BoxGeometry(.05,.007,.016),eyeMat,s*.072,.10,.170);
  slit.rotation.z=s*.08;slit.rotation.y=s*.2;slit.castShadow=false;
 }
 box(head,dark,0,.05,.16,.05,.01,.01,.004);
 ring(head,brass,0,.02,0,.185,.007,'y');

 // Legs: ball hips, armored thighs, heavy boots. The gunner stands planted.
 for(const s of [-1,1]){
  const leg=rig['leg'+s]=g(body,'Leg'+s,s*.13,-.25,0);
  ball(leg,dark,0,0,0,.065);
  box(leg,armor,0,-.09,0,.115,.17,.125,.03);
  cyl(leg,brass,s*.06,-.12,0,.04,.016,'x');
  const foot=g(leg,'Boot'+s,0,-.17,.04);
  box(foot,armor,0,-.015,.01,.15,.11,.24,.04);
  box(foot,dark,0,-.065,.015,.155,.026,.24,.008);
  box(foot,brass,0,-.015,.128,.12,.02,.012,.004);
 }

 // Left arm: an open porcelain hand. Right arm: the light cannon lives at the wrist.
 const armL=rig['arm-1']=g(body,'Arm-1',-.24,.2,0);
 cyl(armL,dark,0,0,0,.055,.09,'x');
 link(armL,armor,[0,-.02,0],[-.03,-.17,.03],.05,.04);
 ball(armL,dark,-.03,-.17,.03,.04);
 link(armL,armor,[-.03,-.17,.03],[-.04,-.30,.09],.038,.03);
 ball(armL,porcelain,-.04,-.315,.10,.028,.034,.026);
 const armR=rig.arm1=g(body,'Arm1',.24,.2,0);
 cyl(armR,dark,0,0,0,.055,.09,'x');
 link(armR,armor,[0,-.02,0],[.03,-.15,.07],.05,.04);
 ball(armR,dark,.03,-.15,.07,.04);
 link(armR,armor,[.03,-.15,.07],[.02,-.24,.16],.038,.032);
 // The cannon: brass barrel out of a black receiver, glass charge chamber on top.
 const gun=g(armR,'LightCannon',.02,-.26,.18);gun.rotation.x=-.35;
 box(gun,dark,0,-.05,-.02,.032,.08,.045,.008);
 box(gun,armor,0,.01,.04,.06,.065,.19,.014);
 cyl(gun,brass,0,.02,.21,.020,.26,'z');
 cyl(gun,dark,0,.02,.30,.026,.05,'z');
 ring(gun,brass,0,.02,.335,.024,.006);
 for(let j=0;j<3;j++)ring(gun,brass,0,.02,.10+j*.05,.024,.004);
 const chamberAnchor=g(gun,'ChamberAnchor',0,.075,.02);
 cyl(gun,glass,0,.075,.02,.030,.07,'z');
 ring(gun,brass,0,.075,-.017,.030,.005);ring(gun,brass,0,.075,.057,.030,.005);
 const chamberCore=ball(gun,chamberMat,0,.075,.02,.02);chamberCore.castShadow=false;
 const chamberLight=new T.PointLight(0xff5040,.1,1.2);chamberLight.position.set(0,.075,.02);gun.add(chamberLight);
 const muzzleAnchor=g(gun,'MuzzleAnchor',0,.02,.36);

 // The back hub: five booms fan out behind the shoulders, one spinning-flame lantern each.
 cyl(body,brass,0,.16,-.17,.07,.06,'z');
 ring(body,dark,0,.16,-.20,.07,.012);
 const boomBase=[],flameSpinners=[],trailRings=[],flameAnchors=[];
 for(let j=0;j<5;j++){
  const a=(j-2)*.52;boomBase.push(a);
  const boom=rig['boom'+j]=g(body,'Boom'+j,0,.16,-.22);boom.rotation.z=a;
  link(boom,dark,[0,0,0],[0,.30,-.04],.020,.015);
  ball(boom,brass,0,.30,-.04,.022);
  link(boom,dark,[0,.30,-.04],[0,.58,-.06],.014,.011);
  const lantern=g(boom,'HeadLantern'+j,0,.66,-.06);lantern.rotation.z=-a;// lanterns hang level however the boom fans
  cyl(lantern,brass,0,.065,0,.042,.022);ball(lantern,brass,0,.082,0,.012,.015,.012);
  cyl(lantern,brass,0,-.065,0,.046,.022);
  cyl(lantern,glass,0,0,0,.044,.11);
  for(const y of [-.05,.05])ring(lantern,dark,0,y,0,.044,.004,'y');
  // The flame is a spinner: a hot core with three tilted blades. tick() spins it fast
  // enough to read as a vortex; the horizontal trail ring is the after-image.
  const spinner=g(lantern,'FlameSpinner'+j,0,0,0);
  ball(spinner,flameMat,0,0,0,.024).castShadow=false;
  for(let k=0;k<3;k++){
   const blade=ball(spinner,flameMat,Math.sin(k*2.1)*.026,0,Math.cos(k*2.1)*.026,.010,.040,.022);
   blade.rotation.y=k*2.1;blade.rotation.z=.5;blade.castShadow=false;
  }
  const trail=ring(lantern,trailMat,0,0,0,.033,.005,'y');trail.castShadow=false;
  flameSpinners.push(spinner);trailRings.push(trail);flameAnchors.push(lantern);
 }

 const nodes=Object.values(rig),clips=[];
 function pose(mode,t){
  if(mode==='Idle'){
   const w=t*Math.PI/2;// one cycle over the 4s loop
   body.position.set(0,.5+.008*Math.sin(w),0);body.rotation.set(0,0,.01*Math.sin(w+1));
   head.rotation.set(.01*Math.sin(w),.06*Math.sin(w+2),0);
   rig['arm-1'].rotation.set(.05*Math.sin(w),0,.04);
   rig.arm1.rotation.set(.03*Math.sin(w+.6),0,-.02);
   for(const s of [-1,1])rig['leg'+s].rotation.set(0,0,0);
   for(let j=0;j<5;j++)rig['boom'+j].rotation.set(.02*Math.sin(w+j*1.3),0,boomBase[j]+.03*Math.sin(w+j));
  }else{// Walk: two full steps per 2s loop, booms trailing with inertia
   const c=t*Math.PI*2;
   body.position.set(0,.5+.012*Math.abs(Math.cos(c)),0);body.rotation.set(.05,0,.015*Math.sin(c));
   head.rotation.set(-.02,.04*Math.sin(c),0);
   rig['arm-1'].rotation.set(.5*Math.sin(c),0,.04);
   rig.arm1.rotation.set(.22*Math.sin(c+Math.PI),0,-.02);
   for(const s of [-1,1])rig['leg'+s].rotation.set(s*.55*Math.sin(c),0,0);
   for(let j=0;j<5;j++)rig['boom'+j].rotation.set(.09+.04*Math.sin(c+j*1.1),0,boomBase[j]+.02*Math.sin(c*2+j));
  }
 }
 for(const [name,duration] of [['Idle',4],['Walk',2]]){
  const times=[],data=nodes.map(()=>({p:[],q:[]}));
  for(let i=0;i<=duration*30;i++){const t=i/30;pose(name,t);times.push(t);nodes.forEach((o,j)=>{data[j].p.push(...o.position.toArray());data[j].q.push(...o.quaternion.toArray());});}
  const tracks=[];nodes.forEach((o,j)=>{tracks.push(new T.VectorKeyframeTrack(o.name+'.position',times,data[j].p),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,data[j].q));});
  clips.push(new T.AnimationClip(name,duration,tracks));
 }
 pose('Idle',0);

 const anchors={flames:flameAnchors,muzzle:muzzleAnchor,chamber:chamberAnchor};
 return{root,rig,clips,anchors,tick(t,motion='Idle',charge=0){
  for(let j=0;j<5;j++){
   flameSpinners[j].rotation.y=t*(9+charge*27)+j*1.3;
   trailRings[j].scale.setScalar(1+.12*Math.sin(t*10+j)+charge*.35);
  }
  flameMat.emissiveIntensity=2.2+.6*Math.sin(t*15)+charge*2;
  trailMat.opacity=.45+charge*.4;
  chamberMat.emissiveIntensity=.3+charge*3.7;
  chamberCore.scale.setScalar(.02*(1+charge*.8));
  chamberLight.intensity=.1+charge*1.2;
  eyeMat.emissiveIntensity=1.4+.3*Math.sin(t*2.3)+charge*.8;
 }};
}

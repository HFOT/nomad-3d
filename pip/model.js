import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export function buildMouse(){
 const root=new T.Group();root.name='PIP';root.userData={author:'CORN',concept:'Small mechanical transaction courier. Fictional simulation.'};let serial=0;const rig={};
 const ivory=new T.MeshStandardMaterial({color:0xe1d6b9,metalness:.12,roughness:.44});const leather=new T.MeshStandardMaterial({color:0x513927,roughness:.82});const blue=new T.MeshStandardMaterial({color:0xc3953e,metalness:.78,roughness:.34});const brass=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});const dark=new T.MeshStandardMaterial({color:0x141e20,metalness:.6,roughness:.4});const eye=new T.MeshPhysicalMaterial({color:0x020609,roughness:.10,clearcoat:1,envMapIntensity:.3});const cyan=new T.MeshStandardMaterial({color:0xbbf9ff,emissive:0x48cbff,emissiveIntensity:2.5});const amber=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:.85,metalness:.25,roughness:.18});
 function g(p,name,x=0,y=0,z=0){const o=new T.Group();o.name=name;o.position.set(x,y,z);p.add(o);return o;}
 function m(p,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.name='CourierPart'+serial++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function ball(p,mat,x,y,z,a,b=a,c=a){const o=m(p,new T.SphereGeometry(1,40,28),mat,x,y,z);o.scale.set(a,b,c);return o;}
 function box(p,mat,x,y,z,w,h,d,r=.025){return m(p,new RoundedBoxGeometry(w,h,d,6,r),mat,x,y,z);}
 function cyl(p,mat,x,y,z,r,h,axis='y'){const o=m(p,new T.CylinderGeometry(r,r,h,32),mat,x,y,z);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;return o;}
 function ring(p,mat,x,y,z,r,t,axis='z'){const o=m(p,new T.TorusGeometry(r,t,10,40),mat,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
 const body=rig.body=g(root,'CourierBody',0,.45,0);box(body,blue,0,.05,0,.48,.47,.36,.11);
 // Oversized wrap clears the shoulder shell and trails along the ground.
 const scarfMat=new T.MeshStandardMaterial({color:0x9e2430,roughness:.94,side:T.DoubleSide});
 for(let j=0;j<3;j++){const fold=m(body,new T.TorusGeometry(.248+j*.009,.039,16,64),scarfMat,0,.264-j*.030,0);fold.rotation.x=Math.PI/2;fold.scale.set(1.12,.85,1);}
 ball(body,scarfMat,-.275,.235,-.075,.066,.060,.063);
 const scarfTail=g(body,'RedScarfTail',-.275,.235,-.075);
 const ribbonGeo=new T.PlaneGeometry(1,1,12,60);const ribbon=m(scarfTail,ribbonGeo,scarfMat);ribbon.frustumCulled=false;
 const ribbonPos=ribbonGeo.attributes.position;
 function animateScarf(t,power){
  for(let row=0;row<=60;row++)for(let col=0;col<=12;col++){
   const u=row/60,w=col/12-.5;
   const width=.135*(1-.2*u),wave=Math.sin(u*15-t*(5+power*7))*u*u;
   // At rest the last third rests on the floor; air lifts it behind the courier.
   const y=-.655*Math.sin(Math.min(1,u/.70)*Math.PI/2)*(1-power*.87)+wave*.065*power;
   const z=-u*(.64+power*.55);
   ribbonPos.setXYZ(row*13+col,w*width+Math.sin(u*9-t*4)*.025*u*power,y+w*w*.035+Math.sin(u*22)*.005,z+Math.sin(w*6)*.008);
  }
  ribbonPos.needsUpdate=true;ribbonGeo.computeVertexNormals();
 }
 animateScarf(0,0);
 // A continuous porcelain shell: full cheeks, a broad dome and a short soft chin.
 const head=rig.head=g(body,'CourierHead',0,.515,0);
 const headGeo=new T.SphereGeometry(1,96,64);const hp=headGeo.attributes.position;
 function headPoint(x,y,z){const lower=y<0;return new T.Vector3(x*.365*(lower?1+.07*(-y):1),y*(lower?.235:.285),z*.285*(lower?1+.035*(-y):1));}
 for(let i=0;i<hp.count;i++){const v=headPoint(hp.getX(i),hp.getY(i),hp.getZ(i));hp.setXYZ(i,v.x,v.y,v.z);}headGeo.computeVertexNormals();m(head,headGeo,ivory);
 for(const side of [-1,1]){
  const lens=g(head,'Optic'+side,side*.124,-.048,.262);lens.rotation.y=side*.26;
  ball(lens,dark,0,0,-.008,.055,.060,.019);
  ring(lens,brass,0,0,.002,.048,.004);
  ball(lens,eye,0,0,.007,.049,.051,.020);
  ball(lens,ivory,-.012,.016,.024,.007);
  cyl(head,dark,side*.339,-.008,-.005,.079,.039,'x');cyl(head,brass,side*.357,-.008,-.005,.072,.022,'x');
  cyl(head,blue,side*.371,-.008,-.005,.055,.009,'x');ring(head,brass,side*.379,-.008,-.005,.056,.005,'x');
 }
 box(head,dark,0,-.137,.241,.044,.009,.009,.004);
 // Paired ear-mounted electrodes converge above the porcelain dome.
 const electrodeTips=[];
 for(const side of [-1,1]){
  cyl(head,brass,side*.382,-.008,-.005,.046,.035,'x');
  // Swept twin rails leave an airy opening around a porcelain conductor.
  const profile=[[side*.385,-.008,-.005],[side*.435,.10,-.012],[side*.426,.235,-.01],[side*.335,.375,0],[side*.215,.45,0],[side*.13,.465,0]];
  const path=new T.CatmullRomCurve3(profile.map(v=>new T.Vector3(...v)));
  const shell=new T.TubeGeometry(path,64,1,12,false),pos=shell.attributes.position;
  for(let i=0;i<pos.count;i++){const u=Math.floor(i/13)/64,center=path.getPointAt(u),radius=.022*(1-u)+.009*u;const v=new T.Vector3().fromBufferAttribute(pos,i).sub(center).multiplyScalar(radius).add(center);pos.setXYZ(i,v.x,v.y,v.z);}shell.computeVertexNormals();m(head,shell,brass);
  tube(head,brass,[[side*.386,.018,.017],[side*.38,.17,.018],[side*.36,.285,.018],[side*.285,.39,.016],[side*.215,.45,0]],.006);
  tube(head,ivory,[[side*.418,.07,-.01],[side*.435,.12,-.012],[side*.433,.17,-.01]],.025);
  for(const u of [.17,.29]){const center=path.getPointAt(u),collar=ring(head,brass,...center.toArray(),.027,.004);collar.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),path.getTangentAt(u));}
  tube(head,cyan,[[side*.413,.19,.015],[side*.393,.26,.015],[side*.352,.325,.015]],.003);
  const terminal=g(head,'ElectrodeTerminal'+side,side*.139,.465,0);terminal.rotation.z=side*Math.PI/2;
  cyl(terminal,brass,0,0,0,.018,.043);ring(terminal,dark,0,.01,0,.018,.003,'y');
  ball(head,cyan,side*.114,.465,0,.009);
  electrodeTips.push(new T.Vector3(side*.114,.465,0));
 }
 const arcMaterial=new T.MeshBasicMaterial({color:0xa8f3ff,toneMapped:false});
 const arcs=[];
 for(let j=0;j<3;j++){
  const segments=[];for(let i=0;i<14;i++){const part=m(head,new T.CylinderGeometry(j===0?.0035:.0018,j===0?.0035:.0018,1,6),arcMaterial);part.castShadow=false;segments.push(part);}arcs.push(segments);
 }
 const electricLight=new T.PointLight(0x65ceff,.4,1.3);electricLight.position.set(0,.44,.045);head.add(electricLight);
 function electricity(t,power){
  const phase=Math.floor(t*(18+power*20));
  for(let j=0;j<arcs.length;j++){
   const points=[];for(let i=0;i<=14;i++){const f=i/14,envelope=Math.sin(f*Math.PI);points.push(new T.Vector3(-.114+f*.228,.465+envelope*(.022+Math.sin(i*17.3+phase*4.7+j*12)*(.016+power*.025)),envelope*Math.sin(i*9+phase*2+j*5)*.023));}
   arcs[j].forEach((part,i)=>{const d=points[i+1].clone().sub(points[i]);part.position.copy(points[i]).add(points[i+1]).multiplyScalar(.5);part.scale.y=d.length();part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());part.visible=j===0||Math.sin(phase+j*2)>.1;});
  }
  electricLight.intensity=.25+power*.65+.12*Math.abs(Math.sin(phase*3));
 }
 electricity(0,0);
 const packet=g(body,'TransactionPacket',0,.065,.355);
 const crystal=m(packet,new RoundedBoxGeometry(.255,.255,.255,5,.012),new T.MeshPhysicalMaterial({color:0xeeb75b,metalness:.05,roughness:.16,transmission:.65,thickness:.12,ior:1.45,clearcoat:1}));
 box(packet,amber,0,0,0,.13,.13,.13,.012);
 for(let k=0;k<3;k++){const hoop=ring(packet,amber,0,0,0,.086+k*.012,.002);hoop.rotation.set(k*.7,k*.5,k*.2);}
 // The payload keeps a fixed orientation in the hands. Bright physical edges define all six cube faces.
 for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
  const dims=[.008,.008,.008],pos=[0,0,0];dims[axis]=.244;pos[(axis+1)%3]=a*.123;pos[(axis+2)%3]=b*.123;
  box(packet,brass,...pos,...dims,.003);
 }
 const runeMat=new T.MeshStandardMaterial({color:0xffe8a5,emissive:0xffb737,emissiveIntensity:1.5});
 for(let j=0;j<3;j++){box(packet,runeMat,-.058+j*.054,.018,.129,.028,.007,.002,.001);box(packet,runeMat,-.058+j*.054,-.026,.129,.007,.025,.002,.001);}
 const pl=new T.PointLight(0xffc168,.14,.8);packet.add(pl);
 function link(p,mat,a,b,r1,r2=r1){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=m(p,new T.CylinderGeometry(r2,r1,v.length(),32),mat);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 for(const s of [-1,1]){
  const arm=rig['arm'+s]=g(body,'Arm'+s,s*.25,.16,0);
  cyl(arm,dark,0,0,0,.066,.105,'x');cyl(arm,brass,s*.05,0,0,.051,.018,'x');
  link(arm,blue,[0,-.025,0],[s*.025,-.145,.105],.063,.052);
  ball(arm,dark,s*.025,-.145,.105,.05);cyl(arm,brass,s*.065,-.145,.105,.036,.02,'x');
  link(arm,blue,[s*.025,-.145,.105],[-s*.065,-.135,.285],.054,.041);
  link(arm,brass,[-s*.065,-.135,.285],[-s*.09,-.115,.345],.033);
  const hand=g(arm,'Hand'+s,-s*.098,-.108,.35);
  box(hand,brass,0,0,0,.046,.075,.075,.016);
  for(let j=0;j<3;j++){
   const z=-.025+j*.024;
   link(hand,brass,[0,-.025,z],[-s*.045,-.033,z],.010);
   ball(hand,dark,-s*.042,-.033,z,.011);
   link(hand,brass,[-s*.042,-.033,z],[-s*.055,-.009,z],.009);
  }
  link(hand,brass,[0,.022,.017],[-s*.02,.037,.02],.013);
  const leg=rig['leg'+s]=g(body,'Leg'+s,s*.145,-.19,0);ball(leg,dark,0,0,0,.073);box(leg,blue,0,-.08,0,.12,.17,.13,.035);cyl(leg,brass,s*.065,-.12,0,.043,.018,'x');const foot=g(leg,'Boot'+s,0,-.16,.045);box(foot,blue,0,-.015,.01,.165,.115,.25,.045);box(foot,dark,0,-.07,.015,.17,.028,.25,.009);box(foot,brass,0,-.015,.137,.13,.022,.012,.004);
 }

 // Wrapped shoulder straps and stitched satchel edges are physical geometry.
 function tube(p,mat,points,r){return m(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),32,r,8,false),mat);}
 // Fine mechanical seams, ear screws, knuckles and sole tread.
 for(const sign of [-1,1]){
  for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(head,brass,sign*.373,Math.sin(a)*.064,Math.cos(a)*.064,.008,.008,'x');}
  const leg=rig['leg'+sign];for(let j=0;j<5;j++)box(leg,brass,0,-.225,-.025+j*.04,.153,.008,.012,.003);

 }
 // Porcelain pinpricks and patina, distributed deterministically over the head.
 let seed=29;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 const patina=new T.MeshStandardMaterial({color:0x8c8065,roughness:.95});
 const specks=new T.InstancedMesh(new T.SphereGeometry(1,5,4),patina,280);head.add(specks);specks.name='PorcelainPatina';
 for(let i=0;i<280;i++){const a=rand()*Math.PI*2,b=Math.acos(2*rand()-1),r=.0008+rand()*.0015;const matrix=new T.Matrix4();matrix.compose(headPoint(Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)).multiplyScalar(1.001),new T.Quaternion(),new T.Vector3(r,r,r));specks.setMatrixAt(i,matrix);}
 // Wind goggles: sealed lenses and a continuous retaining strap.
 const gogglesGlass=new T.MeshPhysicalMaterial({color:0x030507,roughness:.12,metalness:.15,clearcoat:1,clearcoatRoughness:.08});
 const strapPoints=[];for(let i=0;i<=64;i++){const a=Math.PI/3+i/64*Math.PI*4/3;strapPoints.push([Math.sin(a)*.367,-.045,Math.cos(a)*.288]);}
 tube(head,leather,strapPoints,.021);for(const side of [-1,1])tube(head,leather,[[side*.218,-.045,.274],[side*.29,-.045,.22],[side*.318,-.045,.144]],.018);
 for(const side of [-1,1]){
  const optic=head.getObjectByName('Optic'+side);
  ring(optic,dark,0,0,.024,.094,.013);ring(optic,brass,0,0,.038,.093,.006);
  const lens=ball(optic,gogglesGlass,0,0,.039,.085,.085,.022);lens.castShadow=false;
  for(const y of [-.023,.023])ball(optic,brass,side*.089,y,.035,.004);
 }
 tube(head,brass,[[-.029,-.045,.289],[0,-.033,.302],[.029,-.045,.289]],.009);
 // Back-mounted acceleration gearbox, with visible meshing teeth and axle bearings.
 const drive=g(body,'AccelerationDrive',0,.065,-.24);
 box(drive,dark,0,0,0,.35,.29,.10,.035);
 const gears=[];
 for(const [x,y,r,n,direction] of [[-.064,0,.092,18,1],[.081,.055,.059,12,-1]]){
  cyl(drive,brass,x,y,-.065,r*.36,.034,'z');
  const gear=g(drive,'DriveGear'+gears.length,x,y,-.083);gears.push({gear,direction,ratio:18/n});
  ring(gear,brass,0,0,0,r*.79,.012);cyl(gear,dark,0,0,0,r*.25,.024,'z');ring(gear,brass,0,0,-.017,r*.24,.006);
  for(let j=0;j<n;j++){const a=j/n*Math.PI*2;const tooth=box(gear,brass,Math.cos(a)*r,Math.sin(a)*r,0,.023,.016,.024,.003);tooth.rotation.z=a;}
  for(let j=0;j<5;j++){const a=j/5*Math.PI*2;const spoke=box(gear,blue,Math.cos(a)*r*.47,Math.sin(a)*r*.47,0,r*.65,.013,.020,.003);spoke.rotation.z=a;}
 }
 const jets=[];
 const exhaustMat=new T.MeshStandardMaterial({color:0xc7faff,emissive:0x3ad4ff,emissiveIntensity:3,transparent:true,opacity:.65,depthWrite:false});
 for(const side of [-1,1]){
  const engine=g(body,'ForwardThruster'+side,side*.205,-.055,-.24);
  cyl(engine,blue,0,0,-.07,.070,.16,'z');ring(engine,brass,0,0,-.14,.069,.009);
  cyl(engine,dark,0,0,-.155,.053,.025,'z');ring(engine,brass,0,0,-.174,.049,.007);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;box(engine,brass,Math.cos(a)*.06,Math.sin(a)*.06,-.085,.008,.008,.10,.002);}
  const jet=ball(engine,exhaustMat,0,0,-.21,.030,.030,.06);jet.castShadow=false;jets.push(jet);
  const hot=ball(engine,cyan,0,0,-.179,.024,.024,.013);hot.castShadow=false;
 }
 const sideJets=[];
 for(const side of [-1,1]){
  const mount=g(body,'ShoulderThruster'+side,side*.29,.16,-.055);
  mount.rotation.y=-side*Math.PI/2;mount.scale.setScalar(.72);
  cyl(mount,dark,0,0,.01,.081,.075,'z');
  cyl(mount,blue,0,0,-.07,.070,.16,'z');ring(mount,brass,0,0,-.14,.069,.009);
  cyl(mount,dark,0,0,-.155,.053,.025,'z');ring(mount,brass,0,0,-.174,.049,.007);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;box(mount,brass,Math.cos(a)*.06,Math.sin(a)*.06,-.085,.008,.008,.10,.002);}
  const jet=ball(mount,exhaustMat,0,0,-.21,.030,.030,.025);jet.castShadow=false;
  ball(mount,cyan,0,0,-.179,.024,.024,.013);sideJets.push({side,jet});
 }
 let boost=0;root.userData.acceleration='Twin rear-facing thrusters propel the courier forwards';
 // Fine engraved rather than floating decoration.
 for(const s of [-1,1])for(let j=0;j<3;j++)box(body,brass,s*.174,.12-j*.06,.180,.019,.022,.007,.003);
 const nodes=Object.values(rig),clips=[];
 function pose(mode,t){const active=mode!=='Idle',c=t*Math.PI*(mode==='Dash'?10:6);body.position.y=.45+(active?.025*Math.cos(c*2):.007*Math.sin(t*Math.PI));body.rotation.x=active?.12:0;head.rotation.y=.065*Math.sin(t*Math.PI);head.rotation.z=.02*Math.sin(t*Math.PI);for(const s of [-1,1]){rig['leg'+s].rotation.x=active?s*.65*Math.sin(c):0;rig['arm'+s].rotation.x=0;}}
 for(const [name,duration] of [['Idle',4],['Run',2],['Dash',2]]){const times=[],data=nodes.map(()=>({p:[],q:[]}));for(let i=0;i<=duration*30;i++){const t=i/30;pose(name,t);times.push(t);nodes.forEach((o,j)=>{data[j].p.push(...o.position.toArray());data[j].q.push(...o.quaternion.toArray());});}const tracks=[];nodes.forEach((o,j)=>{tracks.push(new T.VectorKeyframeTrack(o.name+'.position',times,data[j].p),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,data[j].q));});clips.push(new T.AnimationClip(name,duration,tracks));}
 pose('Idle',0);return{root,rig,clips,tick(t,motion='Idle',lateral=0){for(const {side,jet} of sideJets){const power=lateral*side<0?1:0;jet.visible=power>0;const length=.035+power*.22*(1+.12*Math.sin(t*41));jet.scale.z=length;jet.position.z=-.18-length*.8;}boost=T.MathUtils.lerp(boost,motion==='Dash'?1:motion==='Run'?.42:.06,.12);for(const item of gears)item.gear.rotation.z=t*(1+boost*14)*item.direction*item.ratio;for(const jet of jets){const length=.025+boost*.18*(1+.12*Math.sin(t*37));jet.scale.z=length;jet.position.z=-.18-length*.8;}electricity(t,boost);animateScarf(t,motion==='Idle'?0:boost);}};
}


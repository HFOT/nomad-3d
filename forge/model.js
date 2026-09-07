import * as T from 'three';
import { addWard } from './ward.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// FORGE is authored here in full; nothing is loaded from a remote asset.
// Where the other carakuri travel, this one is planted: a squat, wide smith
// whose whole body is a press. The proportions are deliberately bottom-heavy —
// an anvil with arms.
let seed=90210;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const clamp=T.MathUtils.clamp;

export function createMaterials(){
  function texture(kind,base,size=512){
    const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,size,size);
    const im=g.getImageData(0,0,size,size),d=im.data;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;let n=(rand()-.5)*(kind==='apron'?30:16);if(kind==='apron')n+=((x%5===0?1:-.3)+(y%5===0?1:-.3))*9;for(let k=0;k<3;k++)d[i+k]=clamp(d[i+k]+n,0,255)}
    g.putImageData(im,0,0);
    // Soot, scale and hammer scars: a forge surface is never clean.
    for(let i=0;i<1500;i++){const x=rand()*size,y=rand()*size,r=rand()*3.2+.3;g.fillStyle=kind==='brass'?`rgba(44,34,20,${rand()*.6})`:`rgba(12,11,10,${rand()*.55})`;g.beginPath();g.ellipse(x,y,r,r*(.25+rand()),rand()*6.28,0,6.28);g.fill()}
    for(let i=0;i<120;i++){const x=rand()*size,y=rand()*size;g.strokeStyle=kind==='brass'?'#e3d5a330':'#c9cbc522';g.lineWidth=rand()*1.5+.3;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*40,y+rand()*14);g.stroke()}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;return tex;
  }
  function normalFromTexture(tex,kind){
    const c=tex.image,w=c.width,h=c.height,src=c.getContext('2d').getImageData(0,0,w,h).data;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),img=ctx.createImageData(w,h),strength=kind==='apron'?1.0:.30;
    const height=(x,y)=>{const i=(((y+h)%h)*w+(x+w)%w)*4;return(src[i]+src[i+1]+src[i+2])/765};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(height(x-1,y)-height(x+1,y))*strength,dy=(height(x,y-1)-height(x,y+1))*strength,inv=1/Math.sqrt(dx*dx+dy*dy+1),i=(y*w+x)*4;img.data[i]=(dx*inv*.5+.5)*255;img.data[i+1]=(dy*inv*.5+.5)*255;img.data[i+2]=(inv*.5+.5)*255;img.data[i+3]=255}
    ctx.putImageData(img,0,0);const n=new T.CanvasTexture(canvas);n.wrapS=n.wrapT=T.RepeatWrapping;n.anisotropy=8;return n;
  }
  const make=(name,color,metalness,roughness,kind)=>{const mat=new T.MeshStandardMaterial({color:kind?0xffffff:color,metalness,roughness});mat.name=name;if(kind){mat.map=texture(kind,color);mat.normalMap=normalFromTexture(mat.map,kind)}return mat};
  return {
    iron:make('Forge-blacked steel','#474d4e',.86,.42,'iron'),
    plate:make('Hammered armour plate','#5b6467',.88,.34,'iron'),
    dark:make('Recessed black metal','#12181a',.62,.52),
    brass:make('Patinated brass','#8e723e',.82,.36,'brass'),
    edge:make('Polished brass edge','#b8a06a',.85,.24),
    steel:make('Bright machined steel','#8a9497',.92,.20),
    apron:make('Scorched leather apron','#4a3226',0,.86,'apron'),
    anvil:make('Cold anvil iron','#33383a',.80,.50),
    eye:new T.MeshPhysicalMaterial({name:'Welding visor glass',color:0x05090b,metalness:.2,roughness:.10,clearcoat:1,clearcoatRoughness:.05}),
    // The furnace: everything hot in this build shares one ember.
    ember:new T.MeshStandardMaterial({name:'Furnace ember',color:0xffca8a,emissive:0xff5a12,emissiveIntensity:3.2,roughness:1}),
    spark:new T.MeshBasicMaterial({name:'Forge spark',color:0xffd9a0,toneMapped:false}),
    // A transaction on its way in: the same amber cube PIP carries.
    packet:new T.MeshStandardMaterial({name:'Pending transaction',color:0xe8b465,emissive:0xff9c2a,emissiveIntensity:.55,metalness:.15,roughness:.26}),
    // A sealed block: cold, solid, lit along the seam where it was closed.
    seal:new T.MeshStandardMaterial({name:'Block seal light',color:0x9fe8c8,emissive:0x2fbc7d,emissiveIntensity:1.1,roughness:1}),
    block:make('Sealed block shell','#49514f',.86,.36,'iron'),
    stone:make('Forge floor stone','#4c4f48',.03,.98,'iron'),
  };
}

export function buildRobot(M){
  const root=new T.Group();root.name='FORGE';const rig={};let serial=0;
  function group(parent,name,x=0,y=0,z=0){const o=new T.Group();o.name=name||'Assembly_'+serial++;o.position.set(x,y,z);parent.add(o);return o}
  function mesh(parent,geo,mat,x=0,y=0,z=0,name){const o=new T.Mesh(geo,mat);o.name=name||'Part_'+serial++;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
  const sphere=(p,m,x,y,z,sx,sy=sx,sz=sx)=>{const o=mesh(p,new T.SphereGeometry(1,32,22),m,x,y,z);o.scale.set(sx,sy,sz);return o};
  const box=(p,m,x,y,z,w,h,d,r=.04)=>mesh(p,new RoundedBoxGeometry(w,h,d,3,r),m,x,y,z);
  const cyl=(p,m,x,y,z,r,h,axis='y',r2=r)=>{const o=mesh(p,new T.CylinderGeometry(r,r2,h,32),m,x,y,z);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o};
  const torus=(p,m,x,y,z,r,t,axis='z')=>{const o=mesh(p,new T.TorusGeometry(r,t,10,44),m,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o};
  function curve(p,m,pts,r=.01){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(...a))),Math.max(12,pts.length*8),r,8,false),m)}
  function rod(p,m,a,b,r){const A=new T.Vector3(...a),B=new T.Vector3(...b),o=cyl(p,m,0,0,0,r,A.distanceTo(B));o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return o}
  function lathe(p,m,profile,x,y,z,sx=1,sz=1){const path=new T.CatmullRomCurve3(profile.map(a=>new T.Vector3(a[0],a[1],0)),false,'centripetal');const sampled=path.getPoints(profile.length*6).map(v=>new T.Vector2(Math.max(0,v.x),v.y));const o=mesh(p,new T.LatheGeometry(sampled,72),m,x,y,z);o.scale.set(sx,1,sz);return o}
  function rivets(p,m,count,radius,y,z,size=.026){for(let i=0;i<count;i++){const a=i/count*Math.PI*2;cyl(p,m,Math.cos(a)*radius,y,z+Math.sin(a)*radius*.7,size,.016,'z')}}

  // ---- Pelvis: literally an anvil. The whole figure is built up from it.
  const body=rig.body=group(root,'Body',0,1.22,0);
  box(body,M.anvil,0,-.08,0,1.30,.34,.86,.07);
  box(body,M.iron,0,.16,0,.92,.30,.66,.06);
  for(const s of [-1,1])box(body,M.edge,s*.60,-.08,0,.06,.24,.74,.02);
  // The horn of the anvil, pointing forward where the work lands.
  const horn=mesh(body,new T.ConeGeometry(.20,.52,24),M.anvil,0,-.06,.62);horn.rotation.x=Math.PI/2;

  // ---- Torso: a barrel furnace. The front opens; the back carries the hopper.
  const torso=rig.torso=group(body,'Torso',0,.60,0);
  lathe(torso,M.plate,[[0,-.50],[.44,-.48],[.66,-.36],[.78,-.10],[.79,.20],[.72,.44],[.56,.60],[.30,.66],[0,.67]],0,0,0,1,.84);
  torus(torso,M.brass,0,-.44,0,.60,.045,'y').scale.z=.84;
  torus(torso,M.brass,0,.44,0,.66,.040,'y').scale.z=.84;
  rivets(torso,M.edge,14,.70,.02,.02);
  // A scorched apron, hung low as a waist skirt so the furnace door stays clear.
  const apron=group(torso,'Apron',0,-.56,.50);
  box(apron,M.apron,0,-.04,0,.94,.44,.05,.03);
  for(const s of [-1,1])rod(apron,M.apron,[s*.30,.18,0],[s*.44,.90,-.28],.030);

  // ---- Head: low, wide, and mostly visor. It looks down at the work.
  const neck=group(torso,'Neck',0,.62,-.02);cyl(neck,M.iron,0,0,0,.26,.24);
  const head=rig.head=group(torso,'Head',0,.96,.02);
  lathe(head,M.plate,[[0,-.34],[.40,-.33],[.52,-.24],[.56,-.02],[.53,.20],[.42,.33],[.22,.40],[0,.41]],0,0,0,1.02,.90);
  box(head,M.iron,0,.24,-.02,.86,.20,.62,.05);
  // The welding visor drops for the strike; the slit eyes burn behind it.
  const visor=rig.visor=group(head,'Visor',0,.16,.30);
  box(visor,M.iron,0,-.02,.10,.88,.17,.15,.04);
  box(visor,M.iron,0,-.44,.10,.88,.15,.15,.04);
  for(const s of [-1,1])box(visor,M.iron,s*.37,-.23,.10,.15,.44,.15,.04);
  box(visor,M.eye,0,-.23,.16,.64,.30,.05,.02);
  torus(visor,M.brass,0,-.23,.17,.36,.020).scale.set(1.10,.52,1);
  for(const s of [-1,1])cyl(visor,M.edge,s*.42,0,.06,.055,.05,'x');
  for(const s of [-1,1]){const slit=box(visor,M.ember,s*.17,-.23,.195,.22,.05,.02,.012);slit.name='EyeSlit_'+s}
  // Ear intakes: the furnace has to breathe.
  for(const s of [-1,1]){const ear=group(head,'Intake_'+s,s*.54,-.06,-.02);ear.rotation.y=s*Math.PI/2;cyl(ear,M.dark,0,0,0,.15,.10,'z');torus(ear,M.brass,0,0,.05,.14,.022);for(let i=0;i<3;i++)torus(ear,M.edge,0,0,.07,.11-i*.035,.010)}

  // ---- Arms. The right one carries the hammer, the left is an open tray: the
  // courier hand-off point. Only the right is ever overridden by the mechanism.
  for(const s of [-1,1]){
    const arm=rig['arm'+s]=group(torso,'Shoulder_'+s,s*.86,.34,0);
    sphere(arm,M.iron,0,0,0,.30,.28,.29);
    box(arm,M.plate,s*.10,.10,0,.44,.34,.52,.09);
    rivets(arm,M.edge,7,.24,.10,.24,.022);
    sphere(arm,M.plate,0,-.34,.01,.20,.34,.19);
    const elbow=rig['elbow'+s]=group(arm,'Elbow_'+s,0,-.64,0);
    sphere(elbow,M.iron,0,0,0,.17);
    sphere(elbow,M.plate,0,-.26,0,.175,.32,.17);
    const hand=rig['hand'+s]=group(elbow,'Hand_'+s,0,-.56,0);
    if(s===1){
      // A hammer fist: the forearm is the shaft, the head is the tool.
      box(hand,M.dark,0,-.04,0,.30,.26,.28,.07);
      const hammer=group(hand,'Hammer',0,-.34,.02);
      box(hammer,M.steel,0,0,0,.62,.36,.36,.05);
      for(const e of [-1,1])box(hammer,M.edge,e*.32,0,0,.05,.34,.34,.02);
      torus(hammer,M.brass,0,.19,0,.13,.035,'y');
      cyl(hammer,M.iron,0,.28,0,.09,.24);
    }else{
      // An open tray, palm up: this is where PIP sets the packet down.
      box(hand,M.plate,0,-.10,.16,.52,.09,.46,.04);
      for(const e of [-1,1])box(hand,M.iron,e*.24,-.02,.16,.05,.14,.46,.02);
      box(hand,M.iron,0,-.02,.37,.50,.14,.05,.02);
      torus(hand,M.brass,0,-.05,.16,.20,.020,'y');
    }
  }

  // ---- Legs: short, splayed, planted. It braces rather than walks.
  for(const s of [-1,1]){
    const leg=rig['leg'+s]=group(root,'Hip_'+s,s*.50,1.18,0);
    sphere(leg,M.iron,0,0,0,.24,.22,.24);
    box(leg,M.plate,s*.03,-.30,0,.40,.54,.42,.10);
    const knee=rig['knee'+s]=group(leg,'Knee_'+s,0,-.60,0);
    sphere(knee,M.iron,0,0,0,.19);
    torus(knee,M.brass,0,0,0,.20,.028,'x');
    box(knee,M.plate,0,-.26,.01,.34,.46,.36,.09);
    const foot=rig['foot'+s]=group(knee,'Foot_'+s,0,-.52,.02);
    box(foot,M.anvil,0,-.09,.10,.62,.18,.84,.05);
    box(foot,M.iron,0,-.19,.10,.66,.06,.88,.02);
    for(let i=0;i<3;i++)box(foot,M.edge,0,-.20,-.20+i*.30,.60,.04,.06,.015);
  }

  const ward=addWard({root,rig,M,helpers:{group,mesh,sphere,box,cyl,torus,curve,rod,lathe,rivets}});

  root.userData={title:'FORGE — Block forger 08',author:'CORN',units:'meters',animation:'Rigid hierarchical articulation, four baked looping clips'};
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry;if(o.material.normalMap){
    if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.computeTangents();
    const a=g.attributes.tangent,n=g.attributes.normal,v=new T.Vector3(),normal=new T.Vector3();
    for(let i=0;i<a.count;i++){v.set(a.getX(i),a.getY(i),a.getZ(i));if(!Number.isFinite(v.lengthSq())||v.lengthSq()<1e-10){normal.fromBufferAttribute(n,i);v.set(Math.abs(normal.x)<.9?1:0,Math.abs(normal.x)<.9?0:1,0).cross(normal)}v.normalize();a.setXYZW(i,v.x,v.y,v.z,a.getW(i)<0?-1:1)}
  }else if(!o.material.map&&!o.material.emissiveMap){g.deleteAttribute('uv')}});

  const rest=new Map();root.traverse(o=>rest.set(o.uuid,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));
  function pose(mode,t){
    const lookTime=t;if(mode==='Look')t=t*2/3;
    for(const o of Object.values(rig)){const r=rest.get(o.uuid);if(r){o.position.copy(r.position);o.quaternion.copy(r.quaternion);o.scale.copy(r.scale)}}
    const breath=Math.sin(t*Math.PI*.5),walk=mode==='Walk',cycle=t*Math.PI;
    // Even at rest the whole frame settles and lifts: a bellows, not a breath.
    body.position.y=1.22+(walk?.055*Math.cos(cycle*2):.020*breath);
    body.rotation.z=walk?.05*Math.sin(cycle):.008*breath;
    body.rotation.y=walk?.07*Math.sin(cycle):.012*Math.sin(t*Math.PI*.5);
    rig.torso.rotation.x=walk?.04:.055+.012*breath;
    rig.head.rotation.y=mode==='Look'?.46*Math.sin(lookTime*Math.PI/3):.05*Math.sin(t*Math.PI*.5);
    rig.head.rotation.x=mode==='Look'?-.06:.10+.02*breath;
    rig.visor.rotation.x=0;
    for(const s of [-1,1]){
      const phase=cycle+(s<0?Math.PI:0),swing=Math.sin(phase);
      rig['leg'+s].rotation.x=walk?.42*swing:0;
      rig['leg'+s].rotation.z=s*.10;
      rig['knee'+s].rotation.x=walk?.58*Math.max(0,-swing):-.05;
      rig['foot'+s].rotation.x=walk?-.18*swing-.22*Math.max(0,-swing):.05;
      rig['arm'+s].rotation.z=s*.14;
      rig['arm'+s].rotation.x=walk?-.22*swing:.03*Math.sin(t*Math.PI*.5+s);
      rig['elbow'+s].rotation.x=-.18;
    }
    // The tray hand is held out and steady — something is expected to land on it.
    rig['arm-1'].rotation.x=-.50;rig['arm-1'].rotation.z=-.34;
    rig['elbow-1'].rotation.x=-1.26;rig['hand-1'].rotation.x=.62;
    if(mode==='Guard'){rig.arm1.rotation.x=-.75;rig.elbow1.rotation.x=-1.30;rig.head.rotation.x=.02;rig.torso.rotation.x=.02}
    ward.animate(t,mode);
  }
  const animated=Object.values(rig);
  const clips=[];
  for(const [name,duration] of [['Idle',4],['Walk',2],['Look',6],['Guard',4]]){
    const samples=Math.round(duration*30),times=[],values=new Map(animated.map(o=>[o,{p:[],q:[]}]));
    for(let i=0;i<=samples;i++){const t=i/30;times.push(t);pose(name,t);for(const o of animated){const v=values.get(o);v.p.push(...o.position.toArray());v.q.push(...o.quaternion.clone().normalize().toArray())}}
    const tracks=[];for(const o of animated){const v=values.get(o);tracks.push(new T.VectorKeyframeTrack(o.name+'.position',times,v.p),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,v.q))}
    clips.push(new T.AnimationClip(name,duration,tracks));
  }
  pose('Idle',0);root.animations=clips;
  return {root,rig,clips,pose,ward,helpers:{mesh,sphere,box,cyl,torus,curve,rod}};
}

export function buildGround(M){
  const g=new T.Group();g.name='Forge floor';
  function slab(x,y,z,sx,sy,sz){const geo=new T.DodecahedronGeometry(1,1),p=geo.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),n=1+.07*Math.sin(v.x*13+v.z*9)*Math.cos(v.y*15);p.setXYZ(i,v.x*n,v.y*n,v.z*n)}geo.computeVertexNormals();const o=new T.Mesh(geo,M.stone);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.y=rand()*5;o.castShadow=o.receiveShadow=true;g.add(o)}
  slab(0,-.20,0,2.5,.28,1.9);slab(-1.5,-.28,.7,.95,.20,.75);slab(1.55,-.30,.6,.90,.19,.72);slab(.1,-.34,-1.2,1.7,.15,.7);
  // Cinders scattered where the sparks land.
  const cinder=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),M.dark,300),matrix=new T.Matrix4(),q=new T.Quaternion();
  for(let i=0;i<300;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand());matrix.compose(new T.Vector3(Math.cos(a)*r*2.3,.03-r*.10,Math.sin(a)*r*1.7),q,new T.Vector3(.02+rand()*.05,.012+rand()*.02,.02+rand()*.05));cinder.setMatrixAt(i,matrix)}
  cinder.receiveShadow=true;g.add(cinder);return g;
}

import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Everything on the field except PIP. A run puts a few hundred swarmers on
// screen, so each kind shares one geometry and one material and the run keeps
// pools of meshes rather than building and dropping them.
export const ARENA=34;   // how far from the centre PIP may go
export const SPAWN_R=30; // swarmers arrive on this circle, outside the view

const stone=new T.MeshStandardMaterial({color:0x2a3138,metalness:.08,roughness:.92});
const rail=new T.MeshStandardMaterial({color:0x9d7f49,metalness:.8,roughness:.32});
const amber=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.6,metalness:.25,roughness:.18});
const forge=new T.MeshStandardMaterial({color:0xa8e6c8,emissive:0x2fbd86,emissiveIntensity:.55,metalness:.35,roughness:.3});
// The swarm is the one thing here that does not belong to the porcelain and
// brass world: it takes no light back.
const matte=new T.MeshStandardMaterial({color:0x0c1013,emissive:0x2a0d0d,emissiveIntensity:.5,roughness:1,metalness:0});

function grain(base,ink){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 for(let i=0;i<2400;i++){x.globalAlpha=.05+Math.random()*.09;x.fillStyle=i%4?ink:'#ffffff';x.fillRect(Math.random()*256,Math.random()*256,2,2);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(11,11);return t;
}

// The yard PIP defends: a paved courier apron, not an arena. Everything here
// is instanced or counted in tens, because the swarm needs the frame budget.
// It has no concentric rings: distance is read from the paving and the rails,
// which is what a real yard gives you.
let POOL_TEX=null;
function lightPool(){
 if(POOL_TEX)return POOL_TEX;
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,4,64,64,64);
 g.addColorStop(0,'rgba(150,205,225,.55)');g.addColorStop(.45,'rgba(120,175,200,.16)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return POOL_TEX=t;
}

export function buildArena(){
 const group=new T.Group();
 const R=ARENA+2;

 // The substrate shows through every joint, so the paving needs no grout of
 // its own.
 const base=new T.Mesh(new T.CircleGeometry(R+.4,80),new T.MeshStandardMaterial({color:0x0d1215,roughness:1}));
 base.rotation.x=-Math.PI/2;group.add(base);

 // Paving. One instanced slab, tone varied per stone so the ground reads as
 // laid rather than painted.
 const STEP=3.1,SLAB=2.86;
 const cells=[];
 for(let gx=-Math.ceil(R/STEP);gx<=Math.ceil(R/STEP);gx++)
  for(let gz=-Math.ceil(R/STEP);gz<=Math.ceil(R/STEP);gz++){
   const x=gx*STEP,z=gz*STEP;
   if(Math.hypot(x,z)>R-1.1)continue;
   cells.push([x,z,gx,gz]);
  }
 const slabs=new T.InstancedMesh(new RoundedBoxGeometry(SLAB,.16,SLAB,2,.03),new T.MeshStandardMaterial({map:grain('#2b333a','#0d1216'),metalness:.05,roughness:.94}),cells.length);
 const m4=new T.Matrix4(),col=new T.Color();
 cells.forEach(([x,z,gx,gz],i)=>{
  // A stable wobble per stone: the same yard every run, never a grid of clones.
  const n=Math.sin(gx*12.9898+gz*78.233)*43758.5453;
  const f=n-Math.floor(n);
  m4.makeTranslation(x,.06+f*.02,z);
  slabs.setMatrixAt(i,m4);
  col.setHSL(.55,.06,.148+f*.05);
  slabs.setColorAt(i,col);
 });
 group.add(slabs);

 // Brass inlay along every fourth joint, cut to the circle. Straight lines,
 // both axes: they say which way you are travelling without drawing a target.
 const inlayMat=new T.MeshStandardMaterial({color:0x715c35,metalness:.8,roughness:.44});
 for(let k=-4;k<=4;k++){
  const c=k*STEP*4+STEP/2;
  if(Math.abs(c)>R-2)continue;
  const half=Math.sqrt(Math.max(0,(R-1.4)*(R-1.4)-c*c));
  for(const axis of [0,1]){
   const bar=new T.Mesh(new T.BoxGeometry(axis?.07:half*2,.03,axis?half*2:.07),inlayMat);
   bar.position.set(axis?c:0,.155,axis?0:c);
   group.add(bar);
  }
 }

 // The transport line the depot runs on, laid straight across the yard.
 const railMat=new T.MeshStandardMaterial({color:0xa48a55,metalness:.9,roughness:.26});
 const sleeperGeo=new T.BoxGeometry(2.6,.12,.5);
 const sleeperMat=new T.MeshStandardMaterial({color:0x3a2d20,roughness:.88});
 const SLEEPERS=Math.floor((R*2-6)/2.1);
 const sleepers=new T.InstancedMesh(sleeperGeo,sleeperMat,SLEEPERS);
 const ang=Math.PI*.18,dx=Math.cos(ang),dz=Math.sin(ang);
 for(let i=0;i<SLEEPERS;i++){
  const t=-(R-3)+i*2.1;
  m4.makeRotationY(-ang);m4.setPosition(dx*t,.14,dz*t);
  sleepers.setMatrixAt(i,m4);
 }
 group.add(sleepers);
 for(const side of [-1,1]){
  const rail=new T.Mesh(new T.BoxGeometry((R-3)*2,.1,.14),railMat);
  rail.position.set(-side*dz*1.0,.22,side*dx*1.0);
  rail.rotation.y=-ang;group.add(rail);
 }

 // Service hatches: brass discs sunk into the paving, placed by hand so the
 // yard has landmarks you can steer by.
 for(const [hx,hz] of [[-14,9],[11,-16],[22,14],[-24,-11],[5,25],[-6,-26]]){
  const plate=new T.Mesh(new T.CylinderGeometry(1.15,1.15,.09,26),new T.MeshStandardMaterial({color:0x7e693f,metalness:.85,roughness:.42}));
  plate.position.set(hx,.17,hz);group.add(plate);
  const lip=new T.Mesh(new T.TorusGeometry(1.2,.05,8,28),inlayMat);
  lip.rotation.x=Math.PI/2;lip.position.set(hx,.19,hz);group.add(lip);
 }

 // The rim: a low wall, posts, lamps, and the pool each lamp throws.
 const wall=new T.Mesh(new T.CylinderGeometry(R+.9,R+.9,1.5,96,1,true),new T.MeshStandardMaterial({color:0x1e262b,roughness:.95,side:T.BackSide}));
 wall.position.y=.75;group.add(wall);
 const rim=new T.Mesh(new T.TorusGeometry(R+.9,.2,10,120),inlayMat);
 rim.rotation.x=Math.PI/2;rim.position.y=1.5;group.add(rim);
 const poolTex=lightPool();
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  const px=Math.cos(a)*(R+.6),pz=Math.sin(a)*(R+.6);
  const post=new T.Mesh(new T.CylinderGeometry(.1,.15,3.1,10),new T.MeshStandardMaterial({color:0x232b30,roughness:.9}));
  post.position.set(px,1.55,pz);group.add(post);
  const lamp=new T.Mesh(new T.SphereGeometry(.22,16,12),new T.MeshStandardMaterial({color:0xbbf9ff,emissive:0x48cbff,emissiveIntensity:2.1}));
  lamp.position.set(px,3.2,pz);group.add(lamp);
  const pool=new T.Mesh(new T.PlaneGeometry(15,15),new T.MeshBasicMaterial({map:poolTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
  pool.rotation.x=-Math.PI/2;pool.position.set(Math.cos(a)*(R-4),.2,Math.sin(a)*(R-4));group.add(pool);
 }

 // Pallets stacked against the wall. Scenery only: the swarm walks over them
 // and so does PIP, so they never become a collision the player cannot see.
 const crateMat=new T.MeshStandardMaterial({color:0x4a3524,roughness:.85});
 for(let i=0;i<14;i++){
  const a=(i*2.39)%(Math.PI*2),rr=R-2.4;
  const stack=new T.Group();
  stack.position.set(Math.cos(a)*rr,0,Math.sin(a)*rr);
  stack.rotation.y=-a+Math.PI/2;
  const n=1+(i%3);
  for(let k=0;k<n;k++){
   const box=new T.Mesh(new RoundedBoxGeometry(1.5,.85,1.2,3,.04),crateMat);
   box.position.set((k%2)*.16,.45+k*.86,0);stack.add(box);
   const band=new T.Mesh(new T.BoxGeometry(1.54,.07,.05),inlayMat);
   band.position.set((k%2)*.16,.45+k*.86,.61);stack.add(band);
  }
  group.add(stack);
 }

 return group;
}

// Four kinds of arrival. They are told apart by size and by how much ember
// shows in them: from this camera that is all the player has time to read.
// hp is how many thrown transactions it takes; speed is a multiplier on the
// pace of the run; from is the point in the minute the kind starts appearing.
export const SWARM={
 rock: {hp:1,speed:1,   size:.46,from:0,   weight:5},
 dart: {hp:1,speed:1.65,size:.3, from:.22, weight:4},
 split:{hp:2,speed:.92, size:.55,from:.34, weight:2},
 hulk: {hp:4,speed:.6,  size:.95,from:.46, weight:2},
};
const emberMat=t=>new T.MeshStandardMaterial({color:0x0c1013,emissive:t,emissiveIntensity:.55,roughness:1,metalness:0});
const SWARM_MAT={rock:matte,dart:emberMat(0x6d1f10),split:emberMat(0x3a1030),hulk:emberMat(0x14101f)};
export function buildBlobShadow(){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,2,64,64,62);
 g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.55,'rgba(0,0,0,.26)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(2.6,2.6),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.y=.24;return m;
}

export function buildSwarmer(kind){
 const k=SWARM[kind];
 if(kind==='dart'){
  const m=new T.Mesh(new T.OctahedronGeometry(k.size,0),SWARM_MAT.dart);
  m.castShadow=m.receiveShadow=false;return m;
 }
 if(kind==='hulk'){
  const g=new T.Group();
  const body=new T.Mesh(new T.DodecahedronGeometry(k.size,0),SWARM_MAT.hulk);
  g.add(body);
  // A dull band so the heavy one is not just a bigger rock.
  const band=new T.Mesh(new T.TorusGeometry(k.size*.92,.07,8,24),new T.MeshStandardMaterial({color:0x5d4a2c,metalness:.7,roughness:.6}));
  band.rotation.x=Math.PI/2.6;g.add(band);
  return g;
 }
 if(kind==='split'){
  // Two lobes: it looks like what it does when it dies.
  const g=new T.Group();
  for(const s of [-1,1]){
   const lobe=new T.Mesh(new T.IcosahedronGeometry(k.size*.66,0),SWARM_MAT.split);
   lobe.position.set(s*k.size*.42,s*.05,0);g.add(lobe);
  }
  return g;
 }
 const m=new T.Mesh(new T.IcosahedronGeometry(k.size,0),SWARM_MAT.rock);
 m.castShadow=m.receiveShadow=false;return m;
}

export function buildPellet(){
 const m=new T.Mesh(new RoundedBoxGeometry(.26,.26,.26,3,.02),amber);
 m.castShadow=false;return m;
}

export function buildBarrierBlock(){
 const m=new T.Mesh(new RoundedBoxGeometry(.62,.62,.62,4,.04),forge);
 m.castShadow=false;return m;
}

// The chain drawn between orbiting blocks: they protect as a chain, not as
// separate stones.
export function buildBarrierLink(){
 return new T.Mesh(new T.BoxGeometry(1,.05,.05),new T.MeshBasicMaterial({color:0x54e0a4,transparent:true,opacity:.5}));
}

export function buildGiantBlock(){
 const g=new T.Group();
 const cube=new T.Mesh(new RoundedBoxGeometry(5.4,5.4,5.4,6,.2),new T.MeshStandardMaterial({color:0xffcf88,emissive:0xff9b24,emissiveIntensity:.8,metalness:.3,roughness:.25}));
 g.add(cube);
 for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
  const dims=[.14,.14,.14],pos=[0,0,0];
  dims[axis]=5.5;pos[(axis+1)%3]=a*2.7;pos[(axis+2)%3]=b*2.7;
  const edge=new T.Mesh(new T.BoxGeometry(...dims),rail);edge.position.set(...pos);g.add(edge);
 }
 return g;
}

// The shock ring the giant block leaves: it is the hit box made visible, so it
// is built at radius 1 and scaled to whatever the run says the radius is.
export function buildShock(){
 const m=new T.Mesh(new T.RingGeometry(.82,1,64),new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.9,side:T.DoubleSide}));
 m.rotation.x=-Math.PI/2;m.position.y=.06;return m;
}

// The laser is not a bar of light: it is a line of blocks being struck, one
// after another, along the ground. Three additive sheaths give it a core and a
// glow; the segments travelling down it are what make it read as *block*.
// The group sits at PIP and runs along its own +x, so the run only has to set
// a length and a heading.
export function buildLaser(){
 const g=new T.Group();
 const beam=(w,h,color,opacity)=>{
  const m=new T.Mesh(new T.BoxGeometry(1,h,w),new T.MeshBasicMaterial({color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false}));
  g.add(m);return m;
 };
 const glow=beam(1.9,1.5,0xff9b24,.13);
 const mid =beam(.62,.52,0xffc25e,.42);
 const core=beam(.17,.15,0xfff8e6,.95);
 const flare=new T.Mesh(new T.SphereGeometry(.55,20,14),new T.MeshBasicMaterial({color:0xfff2d0,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));
 g.add(flare);
 const muzzle=new T.Mesh(new T.SphereGeometry(.2,16,12),new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false}));
 g.add(muzzle);
 const segs=[];
 for(let i=0;i<7;i++){
  const c=new T.Mesh(new RoundedBoxGeometry(.42,.42,.42,3,.03),new T.MeshBasicMaterial({color:0xffe6b4,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));
  g.add(c);segs.push(c);
 }
 g.userData={glow,mid,core,flare,muzzle,segs};
 return g;
}

// Shapes the beam for one frame: length, the pulse in its width, and the blocks
// running down it.
const LASER_START=1.35; // the beam leaves from in front of PIP, never over it
export function tuneLaser(g,length,t){
 const {glow,mid,core,flare,muzzle,segs}=g.userData;
 const span=length-LASER_START,mid_x=LASER_START+span/2;
 const pulse=1+Math.sin(t*38)*.16;
 for(const [m,k] of [[glow,1],[mid,.9],[core,.8]]){
  m.position.x=mid_x;m.scale.x=span;m.scale.y=m.scale.z=1+(pulse-1)*k;
 }
 muzzle.position.x=LASER_START;
 muzzle.scale.setScalar(1+Math.sin(t*31)*.2);
 flare.position.x=length;
 flare.scale.setScalar(1+Math.sin(t*27)*.22);
 for(let i=0;i<segs.length;i++){
  const d=LASER_START+((t*26+i*span/segs.length)%span);
  segs[i].position.x=d;
  segs[i].rotation.set(t*3+i,t*2.2+i,0);
  // The blocks fade in as they leave PIP and out as they reach the far end.
  segs[i].material.opacity=.85*Math.min(1,(d-LASER_START)/2)*Math.min(1,(length-d)/3);
 }
}

// Items are read at a glance from a top-down camera, so each one is a colour
// and a silhouette rather than an icon: colour says what, spin says pick me up.
export const ITEMS={
 fan:   {color:0xffc25e,label:'多面投げ',  note:'同時に投げる数 +1'},
 shield:{color:0x54e0a4,label:'ブロックバリア',note:'公転するブロック +1'},
 drop:  {color:0xff9b3c,label:'巨大ブロック',note:'その場に落として一掃'},
 laser: {color:0xfff0c4,label:'レーザー',  note:'一直線を焼き続ける'},
 gear:  {color:0x9fd8ff,label:'ギア加速',  note:'投擲間隔が半分'},
 mend:  {color:0xff8f9c,label:'修復',      note:'ヒビがひとつ塞がる'},
};
export function buildItem(kind){
 const g=new T.Group();
 const core=new T.Mesh(new T.OctahedronGeometry(.42,0),new T.MeshStandardMaterial({color:ITEMS[kind].color,emissive:ITEMS[kind].color,emissiveIntensity:1.5,roughness:.3}));
 g.add(core);
 const ring=new T.Mesh(new T.TorusGeometry(.62,.035,8,28),new T.MeshBasicMaterial({color:ITEMS[kind].color,transparent:true,opacity:.75}));
 ring.rotation.x=Math.PI/2;g.add(ring);
 const glow=new T.Mesh(new T.PlaneGeometry(3.6,3.6),new T.MeshBasicMaterial({map:lightPool(),color:ITEMS[kind].color,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
 glow.rotation.x=-Math.PI/2;glow.position.y=-.7;g.add(glow);
 g.position.y=.75;
 return g;
}

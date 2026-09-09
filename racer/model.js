import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Everything a course is made of. A course arrives as data (see courses.js): a
// plan curve, a height profile and a palette. The centre line is the single
// source of truth — the road, the verge, the lap count, the off-road test and
// every prop come from it — and the height is laid over the plan rather than
// built into it, so the rules of driving stay two-dimensional.
export const HALF_W=6.4;      // half the road width
export const SAMPLES=420;     // how finely the course is walked
const VERGE=15,BASE=-9;       // how far the flat land runs, and where it ends

export function makeCurve(control){
 return new T.CatmullRomCurve3(control.map(([x,z])=>new T.Vector3(x,0,z)),true,'catmullrom',.5);
}

// Height, keyed by how far round the course is and smoothed between keys, so no
// key leaves a crease in the road.
export function makeHeight(keys){
 return function hy(t){
  t=((t%1)+1)%1;
  for(let i=0;i<keys.length-1;i++){
   const [a,ya]=keys[i],[b,yb]=keys[i+1];
   if(t>=a&&t<=b){
    const f=b===a?0:(t-a)/(b-a);
    return ya+(yb-ya)*(f*f*(3-2*f));
   }
  }
  return 0;
 };
}

export function at(curve,hy,t,lateral,out=new T.Vector3()){
 const u=((t%1)+1)%1;
 const p=curve.getPointAt(u),tan=curve.getTangentAt(u);
 out.set(p.x-tan.z*lateral,hy(t),p.z+tan.x*lateral);
 return out;
}

// A deterministic wobble, so a course looks the same every time it is opened.
function seeded(seed){
 let s=seed>>>0;
 return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
}

function grain(base,ink,repeat){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 const r=seeded(9161);
 for(let i=0;i<2400;i++){x.globalAlpha=.05+r()*.09;x.fillStyle=i%4?ink:'#ffffff';x.fillRect(r()*256,r()*256,2,2);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);return t;
}

// Every long surface is a ribbon along the curve. Wound so the face looks up:
// reversed, a road is culled from the chase camera and the player drives on
// whatever shows through it.
function ribbon(curve,hy,inner,outer,dropIn,dropOut,vScale,mat,name){
 const pos=[],uv=[],idx=[];
 const p=new T.Vector3(),tan=new T.Vector3();
 for(let i=0;i<=SAMPLES;i++){
  const t=i/SAMPLES;
  curve.getPointAt(t%1,p);curve.getTangentAt(t%1,tan);
  const nx=-tan.z,nz=tan.x,y=hy(t);
  pos.push(p.x+nx*inner,y+dropIn,p.z+nz*inner, p.x+nx*outer,y+dropOut,p.z+nz*outer);
  uv.push(0,t*vScale, 1,t*vScale);
  if(i<SAMPLES){const a=i*2;idx.push(a,a+2,a+1, a+1,a+2,a+3);}
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(idx);g.computeVertexNormals();
 const m=new T.Mesh(g,mat);m.name=name;return m;
}

export function buildRoad(curve,hy,theme){
 const group=new T.Group();
 const rail=new T.MeshStandardMaterial({color:theme.rail,metalness:.82,roughness:.36,side:T.DoubleSide});
 // 150 lengths of grain round the lap. At one, the texture is stretched over
 // the whole course and the asphalt reads as long streaks.
 group.add(ribbon(curve,hy,HALF_W,-HALF_W,.02,.02,150,
  new T.MeshStandardMaterial({map:grain(theme.road[0],theme.road[1],[2,1]),metalness:.04,roughness:.94,envMapIntensity:.3}),'RoadSurface'));

 // Kerbs: one striped ribbon a side. Separate blocks left a gap wherever the
 // course stretched between samples, which a slope does everywhere.
 const stripe=(()=>{
  const c=document.createElement('canvas');c.width=8;c.height=64;const x=c.getContext('2d');
  x.fillStyle=theme.kerb[0];x.fillRect(0,0,8,32);
  x.fillStyle=theme.kerb[1];x.fillRect(0,32,8,32);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.NearestFilter;return t;
 })();
 const kerbMat=new T.MeshStandardMaterial({map:stripe,roughness:.85,envMapIntensity:.5,side:T.DoubleSide});
 for(const side of [-1,1]){
  group.add(ribbon(curve,hy,side*HALF_W,side*(HALF_W+1.02),.09,.09,82,kerbMat,'Kerb'+side));
  group.add(ribbon(curve,hy,side*(HALF_W+1.05),side*(HALF_W+1.27),.17,.17,1,rail,'Lip'+side));
 }

 const p=new T.Vector3(),tan=new T.Vector3();
 const postMat=new T.MeshStandardMaterial({color:0x232b30,roughness:.9});
 const lampMat=new T.MeshStandardMaterial({color:0xe8fbff,emissive:theme.lamp,emissiveIntensity:2});
 for(let i=0;i<SAMPLES;i+=9){
  const t=i/SAMPLES;
  curve.getPointAt(t,p);curve.getTangentAt(t,tan);
  const y=hy(t);
  for(const side of [-1,1]){
   const x=p.x-tan.z*side*(HALF_W+2.2),z=p.z+tan.x*side*(HALF_W+2.2);
   const post=new T.Mesh(new T.CylinderGeometry(.08,.12,2.4,8),postMat);
   post.position.set(x,y+1.2,z);group.add(post);
   const lamp=new T.Mesh(new T.SphereGeometry(.17,12,10),lampMat);
   lamp.position.set(x,y+2.5,z);group.add(lamp);
  }
 }
 return group;
}

// The land the circuit is cut into. Without it the road is a ribbon hanging in
// the air: the course has height, and a flat plane far below cannot follow it.
export function buildVerge(curve,hy,theme){
 const group=new T.Group();
 const dirt=new T.MeshStandardMaterial({map:grain(theme.verge[0],theme.verge[1],[3,60]),roughness:1,envMapIntensity:.18,side:T.DoubleSide});
 const bank=new T.MeshStandardMaterial({map:grain(theme.bank[0],theme.bank[1],[3,60]),roughness:1,envMapIntensity:.12,side:T.DoubleSide});
 for(const side of [-1,1]){
  group.add(ribbon(curve,hy,side*(HALF_W+1.05),side*(HALF_W+VERGE),-.06,-.55,120,dirt,'Verge'+side));
  const b=ribbon(curve,hy,side*(HALF_W+VERGE),side*(HALF_W+VERGE+8),-.55,0,120,bank,'Bank'+side);
  // The bank falls to a fixed floor rather than following the course down.
  const pos=b.geometry.attributes.position;
  for(let i=1;i<pos.count;i+=2)pos.setY(i,BASE);
  pos.needsUpdate=true;b.geometry.computeVertexNormals();
  group.add(b);
 }
 return group;
}

export function buildGround(theme){
 const g=new T.Mesh(new T.PlaneGeometry(560,560),new T.MeshStandardMaterial({map:grain(theme.bank[0],theme.bank[1],[48,48]),roughness:1,envMapIntensity:.1}));
 g.rotation.x=-Math.PI/2;g.position.y=BASE-.4;return g;
}

export function buildStartGate(theme){
 const group=new T.Group();
 const stone=new T.MeshStandardMaterial({color:0x2b3238,metalness:.06,roughness:.94});
 const forge=new T.MeshStandardMaterial({color:0xa8e6c8,emissive:0x2fbd86,emissiveIntensity:.6,metalness:.35,roughness:.3});
 for(const s of [-1,1]){
  const pillar=new T.Mesh(new RoundedBoxGeometry(1,6.2,1,4,.06),stone);
  pillar.position.set(s*(HALF_W+1.4),3.1,0);group.add(pillar);
 }
 const beam=new T.Mesh(new RoundedBoxGeometry(HALF_W*2+3.8,.8,.9,4,.06),stone);
 beam.position.y=6;group.add(beam);
 const strip=new T.Mesh(new T.BoxGeometry(HALF_W*2+3,.11,.2),forge);
 strip.position.y=5.5;group.add(strip);
 const white=new T.MeshStandardMaterial({color:theme.kerb[0],roughness:.85});
 for(let i=0;i<Math.ceil(HALF_W*2/.9);i++)for(let j=0;j<2;j++){
  if((i+j)%2)continue;
  const sq=new T.Mesh(new T.BoxGeometry(.9,.02,.6),white);
  sq.position.set(-HALF_W+.45+i*.9,.05,-.3+j*.6);group.add(sq);
 }
 return group;
}

export function buildBoostPad(){
 const g=new T.Group();
 const plate=new T.Mesh(new T.BoxGeometry(4.4,.04,3.4),new T.MeshBasicMaterial({color:0x2fbd86,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false}));
 plate.position.y=.06;g.add(plate);
 for(let i=0;i<3;i++){
  const chev=new T.Mesh(new T.BoxGeometry(3.4,.05,.34),new T.MeshBasicMaterial({color:0x9df3cd,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));
  chev.position.set(0,.09,-1+i*1);g.add(chev);
 }
 return g;
}

export function buildCrate(){
 const g=new T.Group();
 const rail=new T.MeshStandardMaterial({color:0x8d7443,metalness:.82,roughness:.36});
 const amber=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.5,metalness:.25,roughness:.18});
 g.add(new T.Mesh(new RoundedBoxGeometry(1.5,1.5,1.5,4,.09),new T.MeshPhysicalMaterial({color:0xeeb75b,metalness:.05,roughness:.2,transmission:.6,thickness:.2,ior:1.45,clearcoat:1})));
 g.add(new T.Mesh(new T.OctahedronGeometry(.42,0),amber));
 for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
  const dims=[.07,.07,.07],pos=[0,0,0];
  dims[axis]=1.52;pos[(axis+1)%3]=a*.76;pos[(axis+2)%3]=b*.76;
  const edge=new T.Mesh(new T.BoxGeometry(...dims),rail);edge.position.set(...pos);g.add(edge);
 }
 return g;
}

const matte=new T.MeshStandardMaterial({color:0x0c1013,emissive:0x2a0d0d,emissiveIntensity:.5,roughness:1,metalness:0});
export function buildJam(big){
 return new T.Mesh(big?new T.DodecahedronGeometry(1.15,0):new T.IcosahedronGeometry(.72,0),matte);
}

// A kicker across the road. Hit it with pace and the machine leaves the ground.
export function buildRamp(){
 const g=new T.Group();
 const wedge=new T.Mesh(new T.BoxGeometry(HALF_W*2-1,.9,4.6),new T.MeshStandardMaterial({color:0x6b5836,metalness:.7,roughness:.5}));
 wedge.rotation.x=-.19;wedge.position.y=.42;g.add(wedge);
 for(let i=0;i<4;i++){
  const chev=new T.Mesh(new T.BoxGeometry(HALF_W*2-2.2,.05,.3),new T.MeshBasicMaterial({color:0xa9e7cf,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false}));
  chev.rotation.x=-.19;chev.position.set(0,.72+i*.19,-1.5+i*1);g.add(chev);
 }
 return g;
}

export function buildBarrierBlock(){
 return new T.Mesh(new RoundedBoxGeometry(.7,.7,.7,4,.05),
  new T.MeshStandardMaterial({color:0xa8e6c8,emissive:0x2fbd86,emissiveIntensity:.6,metalness:.35,roughness:.3}));
}
export function buildGiantBlock(){
 const g=new T.Group();
 const rail=new T.MeshStandardMaterial({color:0x8d7443,metalness:.82,roughness:.36});
 g.add(new T.Mesh(new RoundedBoxGeometry(4.6,4.6,4.6,6,.18),new T.MeshStandardMaterial({color:0xffcf88,emissive:0xff9b24,emissiveIntensity:.75,metalness:.3,roughness:.25})));
 for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
  const dims=[.13,.13,.13],pos=[0,0,0];
  dims[axis]=4.7;pos[(axis+1)%3]=a*2.3;pos[(axis+2)%3]=b*2.3;
  const edge=new T.Mesh(new T.BoxGeometry(...dims),rail);edge.position.set(...pos);g.add(edge);
 }
 return g;
}
export function buildShock(){
 const m=new T.Mesh(new T.RingGeometry(.82,1,48),new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.9,side:T.DoubleSide}));
 m.rotation.x=-Math.PI/2;return m;
}
export function buildBlob(){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,2,64,64,62);
 g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.55,'rgba(0,0,0,.24)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(2.4,2.4),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
 m.rotation.x=-Math.PI/2;return m;
}
export function buildDriftSpark(){
 return new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshBasicMaterial({color:0xffc25e,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));
}

// The laser is not a bar of light: it is a line of blocks being struck, one
// after another. Three additive sheaths give it a core and a glow; the segments
// travelling down it are what make it read as *block*.
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
  segs[i].material.opacity=.85*Math.min(1,(d-LASER_START)/2)*Math.min(1,(length-d)/3);
 }
}

// ── what stands beside each course ──────────────────────────────────────────
// One entry per scenery kind named in courses.js. All of it is instanced or
// counted in tens: the machine and the props already have the frame budget.

function chainRail(curve,hy){
 const group=new T.Group();
 const STEP=7,n=Math.floor(SAMPLES/STEP)*2+4;
 const blocks=new T.InstancedMesh(new RoundedBoxGeometry(1.5,1.5,1.5,3,.07),
  new T.MeshStandardMaterial({color:0x2f3b3f,metalness:.5,roughness:.6}),n);
 const links=new T.InstancedMesh(new T.BoxGeometry(1,.13,.13),
  new T.MeshBasicMaterial({color:0xffb85c,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}),n);
 const m4=new T.Matrix4(),q=new T.Quaternion(),up=new T.Vector3(0,1,0),one=new T.Vector3(1,1,1);
 const v=new T.Vector3(),p=new T.Vector3(),tan=new T.Vector3(),prev={'-1':null,'1':null};
 let bi=0,li=0;
 for(let i=0;i<=SAMPLES;i+=STEP){
  const t=(i%SAMPLES)/SAMPLES;
  curve.getPointAt(t,p);curve.getTangentAt(t,tan);
  const y=hy(t);
  for(const side of [-1,1]){
   v.set(p.x-tan.z*side*(HALF_W+3.6),y+.75,p.z+tan.x*side*(HALF_W+3.6));
   if(i<SAMPLES&&bi<n){q.setFromAxisAngle(up,Math.atan2(tan.x,tan.z));m4.compose(v,q,one);blocks.setMatrixAt(bi++,m4);}
   const was=prev[side];
   if(was&&li<n){
    const len=Math.hypot(v.x-was.x,v.z-was.z,v.y-was.y);
    q.setFromAxisAngle(up,Math.atan2(v.x-was.x,v.z-was.z)+Math.PI/2);
    m4.compose(new T.Vector3((was.x+v.x)/2,(was.y+v.y)/2,(was.z+v.z)/2),q,new T.Vector3(len,1,1));
    links.setMatrixAt(li++,m4);
   }
   prev[side]={x:v.x,y:v.y,z:v.z};
  }
 }
 blocks.count=bi;links.count=li;group.add(blocks,links);
 return group;
}

function floatingBlocks(curve,hy,list){
 const group=new T.Group();
 const mat=new T.MeshStandardMaterial({color:0xd8b47a,emissive:0xff9b24,emissiveIntensity:.16,metalness:.3,roughness:.4});
 const rail=new T.MeshStandardMaterial({color:0x8d7443,metalness:.82,roughness:.36});
 const r=seeded(4211);
 for(const [t,lat,h,size] of list){
  const b=new T.Mesh(new RoundedBoxGeometry(size,size,size,4,size*.05),mat);
  at(curve,hy,t,lat,b.position);b.position.y+=h;
  b.rotation.set(r(),r(),r());group.add(b);
  const cage=new T.Mesh(new T.TorusGeometry(size*.95,.07,8,4),rail);
  cage.position.copy(b.position);cage.rotation.x=Math.PI/2;group.add(cage);
 }
 return group;
}

// Rock country: spires close in, peaks standing well off, and the river the
// course drops to meet.
function valleyScenery(curve,hy){
 const group=new T.Group();
 const r=seeded(7717);
 const spires=new T.InstancedMesh(new T.ConeGeometry(2.6,9,6,1),
  new T.MeshStandardMaterial({color:0x3a444c,roughness:.95,flatShading:true}),160);
 const m4=new T.Matrix4(),q=new T.Quaternion(),up=new T.Vector3(0,1,0),v=new T.Vector3(),sc=new T.Vector3();
 const p=new T.Vector3(),tan=new T.Vector3();
 let n=0;
 for(let i=0;i<SAMPLES&&n<160;i+=5){
  const t=i/SAMPLES;
  curve.getPointAt(t,p);curve.getTangentAt(t,tan);
  const y=hy(t);
  for(const side of [-1,1]){
   if(r()<.35)continue;
   const lat=(HALF_W+VERGE+5)+r()*30;
   v.set(p.x-tan.z*side*lat,y-2-r()*3,p.z+tan.x*side*lat);
   q.setFromAxisAngle(up,r()*6.28);
   sc.set(.5+r()*1.4,.5+r()*1.9,.5+r()*1.4);
   m4.compose(v,q,sc);spires.setMatrixAt(n++,m4);
  }
 }
 spires.count=n;group.add(spires);

 const peakMat=new T.MeshStandardMaterial({color:0x2b343c,roughness:1,flatShading:true});
 for(let i=0;i<14;i++){
  const a=i/14*6.28+r()*.3,d=190+r()*90;
  const peak=new T.Mesh(new T.ConeGeometry(26+r()*22,46+r()*48,5,1),peakMat);
  peak.position.set(Math.cos(a)*d,BASE+20,Math.sin(a)*d);
  peak.rotation.y=r()*6.28;group.add(peak);
 }

 // The river, running along the floor beside the course.
 const pos=[],idx=[];
 let k=0;
 for(let i=0;i<=SAMPLES;i++){
  const t=i/SAMPLES;
  curve.getPointAt(t%1,p);curve.getTangentAt(t%1,tan);
  const lat=HALF_W+VERGE+17;
  pos.push(p.x-tan.z*lat,BASE+.5,p.z+tan.x*lat, p.x-tan.z*(lat+14),BASE+.5,p.z+tan.x*(lat+14));
  if(i<SAMPLES)idx.push(k,k+2,k+1, k+1,k+2,k+3);
  k+=2;
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setIndex(idx);g.computeVertexNormals();
 group.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0x1d3a4a,emissive:0x0b2532,emissiveIntensity:.6,metalness:.7,roughness:.18,side:T.DoubleSide})));
 return group;
}

// Woodland: trunks and canopies in bands either side, thick enough to close the
// road in without ever standing on it.
function groveScenery(curve,hy){
 const group=new T.Group();
 const r=seeded(3391);
 const COUNT=420;
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.26,.4,4.4,6),
  new T.MeshStandardMaterial({color:0x3a2c20,roughness:.95}),COUNT);
 const canopy=new T.InstancedMesh(new T.ConeGeometry(2.1,5.4,7,1),
  new T.MeshStandardMaterial({color:0x2f4a2a,roughness:.9,flatShading:true}),COUNT*2);
 const m4=new T.Matrix4(),q=new T.Quaternion(),up=new T.Vector3(0,1,0),v=new T.Vector3(),sc=new T.Vector3();
 const p=new T.Vector3(),tan=new T.Vector3();
 let n=0,c=0;
 for(let i=0;i<COUNT;i++){
  const t=r();
  curve.getPointAt(t,p);curve.getTangentAt(t,tan);
  const side=r()<.5?-1:1;
  const lat=(HALF_W+VERGE-3)+r()*34;   // never nearer than the verge
  const y=hy(t)-1.2-r()*1.6;
  const s=.7+r()*.9;
  const x=p.x-tan.z*side*lat,z=p.z+tan.x*side*lat;
  q.setFromAxisAngle(up,r()*6.28);
  v.set(x,y+2.2*s,z);sc.set(s,s,s);
  m4.compose(v,q,sc);trunks.setMatrixAt(n++,m4);
  for(let j=0;j<2;j++){
   const cs=s*(1-j*.32);
   v.set(x,y+3.6*s+j*2.1*s,z);sc.set(cs,cs,cs);
   m4.compose(v,q,sc);canopy.setMatrixAt(c++,m4);
  }
 }
 trunks.count=n;canopy.count=c;group.add(trunks,canopy);
 return group;
}

export function buildScenery(kind,curve,hy){
 if(kind==='chain'){
  const g=new T.Group();
  g.add(chainRail(curve,hy));
  g.add(floatingBlocks(curve,hy,[[.06,-38,20,4.5],[.24,36,23,5.5],[.47,-40,19,4],
                                 [.66,39,25,6],[.83,-36,20,4.5],[.94,34,22,5]]));
  return g;
 }
 if(kind==='valley')return valleyScenery(curve,hy);
 if(kind==='grove')return groveScenery(curve,hy);
 return new T.Group();
}

export const ITEMS={
 gear:  {color:0x9fd8ff,label:'ギア加速',      note:'数秒、速度が上がる'},
 shield:{color:0x54e0a4,label:'ブロックバリア',note:'滞留を弾いて通れる'},
 drop:  {color:0xff9b3c,label:'巨大ブロック',  note:'前方の滞留を潰す'},
 laser: {color:0xfff0c4,label:'レーザー',      note:'前方一直線を焼く'},
};

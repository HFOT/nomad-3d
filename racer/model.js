import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The circuit. The centre line is the single source of truth: the road mesh,
// the lap count, the off-road test, the ghost and every prop placed on the
// course are all derived from this one curve.
export const HALF_W=6.4;      // half the road width
export const SAMPLES=420;     // how finely the run walks the curve

// The first point is the start line, and the two either side of it are laid
// almost in line with it: a closed Catmull-Rom bends hardest where its points
// turn a corner, and a start/finish must not sit in one.
const CONTROL=[
 [-10, -64],[ 24, -64],[ 56, -58],[ 78, -34],[ 82,  -2],
 [ 68,  26],[ 74,  54],[ 48,  76],[ 12,  82],[-22,  74],
 [-52,  80],[-76,  58],[-70,  26],[-82,  -8],[-64, -44],
 [-38, -62],
];

// The height of the course, keyed by how far round it is. The plan shape stays
// two-dimensional — laps, the off-road test and every collision are measured on
// the ground plan — and this is laid over it. The start straight is flat: a
// line you cross three times should be the same line every time.
const HEIGHT=[[0,0],[.10,0],[.20,3.4],[.30,3.4],[.355,3],[.45,-1.8],[.53,0],
              [.61,4.4],[.685,4.4],[.745,3.6],[.81,-.6],[.89,2],[.95,0],[1,0]];
export function trackY(t){
 t=((t%1)+1)%1;
 for(let i=0;i<HEIGHT.length-1;i++){
  const [a,ya]=HEIGHT[i],[b,yb]=HEIGHT[i+1];
  if(t>=a&&t<=b){
   const f=b===a?0:(t-a)/(b-a);
   return ya+(yb-ya)*(f*f*(3-2*f));   // smoothstep, so no crease at a key
  }
 }
 return 0;
}

export function buildCurve(){
 return new T.CatmullRomCurve3(CONTROL.map(([x,z])=>new T.Vector3(x,0,z)),true,'catmullrom',.5);
}

// Where a point on the course is, given how far round it is and how far it sits
// from the middle. Every prop below is placed with this.
export function at(curve,t,lateral,out=new T.Vector3()){
 const p=curve.getPointAt(t%1),tan=curve.getTangentAt(t%1);
 out.set(p.x-tan.z*lateral,trackY(t),p.z+tan.x*lateral);
 return out;
}

const stone=new T.MeshStandardMaterial({color:0x2b3238,metalness:.06,roughness:.94});
const rail=new T.MeshStandardMaterial({color:0x8d7443,metalness:.82,roughness:.36});
const railBothSides=new T.MeshStandardMaterial({color:0x8d7443,metalness:.82,roughness:.36,side:T.DoubleSide});
const kerbA=new T.MeshStandardMaterial({color:0xa8a294,roughness:.85,envMapIntensity:.5});
const kerbB=new T.MeshStandardMaterial({color:0x9c5040,roughness:.85,envMapIntensity:.5});
const amber=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.5,metalness:.25,roughness:.18});
const forge=new T.MeshStandardMaterial({color:0xa8e6c8,emissive:0x2fbd86,emissiveIntensity:.6,metalness:.35,roughness:.3});
const matte=new T.MeshStandardMaterial({color:0x0c1013,emissive:0x2a0d0d,emissiveIntensity:.5,roughness:1,metalness:0});

function grain(base,ink,repeat){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 for(let i=0;i<2400;i++){x.globalAlpha=.05+Math.random()*.09;x.fillStyle=i%4?ink:'#ffffff';x.fillRect(Math.random()*256,Math.random()*256,2,2);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);return t;
}

// The road: one ribbon following the curve, with kerbs striped along both
// edges and a lit brass lip so the edge is readable at speed.
export function buildRoad(curve){
 const group=new T.Group();
 const pos=[],uv=[],idx=[];
 const p=new T.Vector3(),tan=new T.Vector3();
 for(let i=0;i<=SAMPLES;i++){
  const t=i/SAMPLES;
  curve.getPointAt(t%1,p);curve.getTangentAt(t%1,tan);
  const nx=-tan.z,nz=tan.x;
  const y=trackY(t);
  pos.push(p.x+nx*HALF_W,y+.02,p.z+nz*HALF_W, p.x-nx*HALF_W,y+.02,p.z-nz*HALF_W);
  uv.push(0,t*150, 1,t*150);
  // Wound so the face looks up. Reversed, the road is invisible from above
  // and the player drives on the ground plane showing through it.
  if(i<SAMPLES){const a=i*2;idx.push(a,a+2,a+1, a+1,a+2,a+3);}
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();
 const surface=new T.Mesh(geo,new T.MeshStandardMaterial({map:grain('#252b32','#0e131a',[2,1]),metalness:.04,roughness:.94,envMapIntensity:.3}));
 surface.name='RoadSurface';group.add(surface);

 // Kerbs: one ribbon a side, striped by a texture rather than built from
 // separate blocks. Blocks left a gap wherever the course stretched between
 // samples, and a slope stretches every one of them.
 const stripe=(()=>{
  const c=document.createElement('canvas');c.width=8;c.height=64;const x=c.getContext('2d');
  x.fillStyle='#b9b3a4';x.fillRect(0,0,8,32);
  x.fillStyle='#a2543f';x.fillRect(0,32,8,32);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.NearestFilter;return t;
 })();
 const kerbMat=new T.MeshStandardMaterial({map:stripe,roughness:.85,envMapIntensity:.5,side:T.DoubleSide});
 for(const side of [-1,1]){
  const kp=[],ku=[],ki=[];
  for(let i=0;i<=SAMPLES;i++){
   const t=i/SAMPLES;
   curve.getPointAt(t%1,p);curve.getTangentAt(t%1,tan);
   const nx=-tan.z*side,nz=tan.x*side,y=trackY(t);
   kp.push(p.x+nx*HALF_W,y+.09,p.z+nz*HALF_W, p.x+nx*(HALF_W+1.02),y+.09,p.z+nz*(HALF_W+1.02));
   ku.push(0,t*82, 1,t*82);   // 82 stripes round: about one every three metres
   if(i<SAMPLES){const k=i*2;ki.push(k,k+2,k+1, k+1,k+2,k+3);}
  }
  const kg=new T.BufferGeometry();
  kg.setAttribute('position',new T.Float32BufferAttribute(kp,3));
  kg.setAttribute('uv',new T.Float32BufferAttribute(ku,2));
  kg.setIndex(ki);kg.computeVertexNormals();
  const mesh=new T.Mesh(kg,kerbMat);
  mesh.name='Kerb'+side;group.add(mesh);
 }

 // The brass lip past the kerb, and a lamp every so often beyond that.
 for(const side of [-1,1]){
  const lipPos=[],lipIdx=[];
  for(let i=0;i<=SAMPLES;i++){
   const t=i/SAMPLES;
   curve.getPointAt(t%1,p);curve.getTangentAt(t%1,tan);
   const nx=-tan.z*side,nz=tan.x*side,r=HALF_W+1.05;
   const y=trackY(t);
   lipPos.push(p.x+nx*r,y+.17,p.z+nz*r, p.x+nx*(r+.22),y+.17,p.z+nz*(r+.22));
   if(i<SAMPLES){const k=i*2;lipIdx.push(k,k+2,k+1, k+1,k+2,k+3);}
  }
  const lg=new T.BufferGeometry();
  lg.setAttribute('position',new T.Float32BufferAttribute(lipPos,3));
  lg.setIndex(lipIdx);lg.computeVertexNormals();
  group.add(new T.Mesh(lg,railBothSides));
 }
 for(let i=0;i<SAMPLES;i+=9){
  const t=i/SAMPLES;
  curve.getPointAt(t,p);curve.getTangentAt(t,tan);
  for(const side of [-1,1]){
   const x=p.x-tan.z*side*(HALF_W+2.2),z=p.z+tan.x*side*(HALF_W+2.2);
   const post=new T.Mesh(new T.CylinderGeometry(.08,.12,2.4,8),stone);
   const y=trackY(t);
   post.position.set(x,y+1.2,z);group.add(post);
   const lamp=new T.Mesh(new T.SphereGeometry(.17,12,10),new T.MeshStandardMaterial({color:0xbbf9ff,emissive:0x48cbff,emissiveIntensity:2}));
   lamp.position.set(x,y+2.5,z);group.add(lamp);
  }
 }
 return group;
}

// The ground the circuit is laid on: dark, so the road reads as the only place
// worth being.
export function buildGround(){
 const g=new T.Mesh(new T.PlaneGeometry(420,420),new T.MeshStandardMaterial({map:grain('#0a0e11','#04070a',[40,40]),roughness:1,envMapIntensity:.12}));
 g.rotation.x=-Math.PI/2;g.position.y=-7.5;return g;
}

// Start and finish: one arch over the road, the only structure on the course.
export function buildStartGate(){
 const group=new T.Group();
 for(const s of [-1,1]){
  const pillar=new T.Mesh(new RoundedBoxGeometry(1,6.2,1,4,.06),stone);
  pillar.position.set(s*(HALF_W+1.4),3.1,0);group.add(pillar);
 }
 const beam=new T.Mesh(new RoundedBoxGeometry(HALF_W*2+3.8,.8,.9,4,.06),stone);
 beam.position.y=6;group.add(beam);
 const strip=new T.Mesh(new T.BoxGeometry(HALF_W*2+3,.11,.2),forge);
 strip.position.y=5.5;group.add(strip);
 // The chequer on the road itself.
 for(let i=0;i<Math.ceil(HALF_W*2/.9);i++)for(let j=0;j<2;j++){
  if((i+j)%2)continue;
  const sq=new T.Mesh(new T.BoxGeometry(.9,.02,.6),kerbA);
  sq.position.set(-HALF_W+.45+i*.9,.05,-.3+j*.6);group.add(sq);
 }
 return group;
}

// A plate that gives back what a corner cost.
export function buildBoostPad(){
 const g=new T.Group();
 const plate=new T.Mesh(new T.BoxGeometry(4.4,.04,3.4),new T.MeshBasicMaterial({color:0x2fbd86,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false}));
 plate.position.y=.06;g.add(plate);
 for(let i=0;i<3;i++){
  const chev=new T.Mesh(new T.BoxGeometry(3.4,.05,.34),new T.MeshBasicMaterial({color:0x9df3cd,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}));
  chev.position.set(0,.09,-1+i*1);g.add(chev);
 }
 return g;
}

// The item crate. Picked up by driving through it, like everything else in
// this series.
export function buildCrate(){
 const g=new T.Group();
 const box=new T.Mesh(new RoundedBoxGeometry(1.5,1.5,1.5,4,.09),new T.MeshPhysicalMaterial({color:0xeeb75b,metalness:.05,roughness:.2,transmission:.6,thickness:.2,ior:1.45,clearcoat:1}));
 g.add(box);
 const core=new T.Mesh(new T.OctahedronGeometry(.42,0),amber);
 g.add(core);
 for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
  const dims=[.07,.07,.07],pos=[0,0,0];
  dims[axis]=1.52;pos[(axis+1)%3]=a*.76;pos[(axis+2)%3]=b*.76;
  const edge=new T.Mesh(new T.BoxGeometry(...dims),rail);edge.position.set(...pos);g.add(edge);
 }
 g.position.y=1.1;
 return g;
}

// What is standing in the road. The same matte swarm as PIP RUSH: a queue that
// has not moved.
export function buildJam(big){
 const m=new T.Mesh(big?new T.DodecahedronGeometry(1.15,0):new T.IcosahedronGeometry(.72,0),matte);
 m.position.y=big?1.05:.7;return m;
}

export function buildBarrierBlock(){
 return new T.Mesh(new RoundedBoxGeometry(.7,.7,.7,4,.05),forge);
}

export function buildGiantBlock(){
 const g=new T.Group();
 const cube=new T.Mesh(new RoundedBoxGeometry(4.6,4.6,4.6,6,.18),new T.MeshStandardMaterial({color:0xffcf88,emissive:0xff9b24,emissiveIntensity:.75,metalness:.3,roughness:.25}));
 g.add(cube);
 for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
  const dims=[.13,.13,.13],pos=[0,0,0];
  dims[axis]=4.7;pos[(axis+1)%3]=a*2.3;pos[(axis+2)%3]=b*2.3;
  const edge=new T.Mesh(new T.BoxGeometry(...dims),rail);edge.position.set(...pos);g.add(edge);
 }
 return g;
}

export function buildShock(){
 const m=new T.Mesh(new T.RingGeometry(.82,1,48),new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.9,side:T.DoubleSide}));
 m.rotation.x=-Math.PI/2;m.position.y=.08;return m;
}

// A soft mark under a machine, standing in for a shadow map the run cannot
// afford: PIP is several hundred meshes and there are two of him on the course.
export function buildBlob(){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,2,64,64,62);
 g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.55,'rgba(0,0,0,.24)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(2.4,2.4),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.y=.06;return m;
}

// The jets a drift throws out sideways, and the flare a released drift gives
// back. One shared additive material: they are light, not matter.
export function buildDriftSpark(){
 const m=new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshBasicMaterial({color:0xffc25e,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));
 return m;
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

// A kicker across the road. Hit it with speed and the machine leaves the
// ground; the run decides how far.
export function buildRamp(){
 const g=new T.Group();
 const wedge=new T.Mesh(new T.BoxGeometry(HALF_W*2-1,.9,4.6),new T.MeshStandardMaterial({color:0x6b5836,metalness:.7,roughness:.5}));
 // Tilted so the top edge lifts: a wedge, not a step.
 wedge.rotation.x=-.19;wedge.position.y=.42;g.add(wedge);
 const face=new T.Mesh(new T.BoxGeometry(HALF_W*2-1.2,.06,4.4),new T.MeshBasicMaterial({color:0x9df3cd,transparent:true,opacity:.28,blending:T.AdditiveBlending,depthWrite:false}));
 face.rotation.x=-.19;face.position.y=.88;g.add(face);
 for(let i=0;i<4;i++){
  const chev=new T.Mesh(new T.BoxGeometry(HALF_W*2-2.2,.05,.3),new T.MeshBasicMaterial({color:0xa9e7cf,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false}));
  chev.rotation.x=-.19;chev.position.set(0,.72+i*.19,-1.5+i*1);g.add(chev);
 }
 return g;
}

// The chain, running the whole way round outside the lamps: a block every few
// metres, joined by a lit link. It is the guard rail and it is the thing the
// whole world is named after, so it is one instanced mesh and one line, not
// scenery placed by hand.
export function buildChainRail(curve){
 const group=new T.Group();
 const STEP=7,n=Math.floor(SAMPLES/STEP)*2;
 const blockGeo=new RoundedBoxGeometry(1.5,1.5,1.5,3,.07);
 const blockMat=new T.MeshStandardMaterial({color:0x2f3b3f,metalness:.5,roughness:.6});
 const blocks=new T.InstancedMesh(blockGeo,blockMat,n);
 const linkGeo=new T.BoxGeometry(1,.13,.13);
 const linkMat=new T.MeshBasicMaterial({color:0xffb85c,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false});
 const links=new T.InstancedMesh(linkGeo,linkMat,n);
 const m4=new T.Matrix4(),q=new T.Quaternion(),up=new T.Vector3(0,1,0),one=new T.Vector3(1,1,1);
 const v=new T.Vector3(),p=new T.Vector3(),tan=new T.Vector3();
 const prev={'-1':null,'1':null};
 let bi=0,li=0;
 for(let i=0;i<=SAMPLES;i+=STEP){
  const t=(i%SAMPLES)/SAMPLES;
  curve.getPointAt(t,p);curve.getTangentAt(t,tan);
  const y=trackY(t);
  for(const side of [-1,1]){
   v.set(p.x-tan.z*side*(HALF_W+3.6),y+.75,p.z+tan.x*side*(HALF_W+3.6));
   if(i<SAMPLES&&bi<n){
    q.setFromAxisAngle(up,Math.atan2(tan.x,tan.z));
    m4.compose(v,q,one);blocks.setMatrixAt(bi++,m4);
   }
   const was=prev[side];
   if(was&&li<n){
    const mx=(was.x+v.x)/2,my=(was.y+v.y)/2,mz=(was.z+v.z)/2;
    const len=Math.hypot(v.x-was.x,v.z-was.z,v.y-was.y);
    q.setFromAxisAngle(up,Math.atan2(v.x-was.x,v.z-was.z)+Math.PI/2);
    m4.compose(new T.Vector3(mx,my,mz),q,new T.Vector3(len,1,1));
    links.setMatrixAt(li++,m4);
   }
   prev[side]={x:v.x,y:v.y,z:v.z};
  }
 }
 blocks.count=bi;links.count=li;
 group.add(blocks,links);
 return group;
}

// Blocks hanging over the course, slowly turning. Nothing to hit: they are the
// world saying what it is made of.
export function buildFloatingBlocks(curve,list){
 const group=new T.Group();
 const mat=new T.MeshStandardMaterial({color:0xd8b47a,emissive:0xff9b24,emissiveIntensity:.16,metalness:.3,roughness:.4});
 for(const [t,lat,h,size] of list){
  const b=new T.Mesh(new RoundedBoxGeometry(size,size,size,4,size*.05),mat);
  at(curve,t,lat,b.position);b.position.y+=h;
  b.rotation.set(Math.random(),Math.random(),Math.random());
  group.add(b);
  const cage=new T.Mesh(new T.TorusGeometry(size*.95,.07,8,4),rail);
  cage.position.copy(b.position);cage.rotation.x=Math.PI/2;group.add(cage);
 }
 return group;
}

export const ITEMS={
 gear:  {color:0x9fd8ff,label:'ギア加速',      note:'数秒、速度が上がる'},
 shield:{color:0x54e0a4,label:'ブロックバリア',note:'滞留を弾いて通れる'},
 drop:  {color:0xff9b3c,label:'巨大ブロック',  note:'前方の滞留を潰す'},
 laser: {color:0xfff0c4,label:'レーザー',      note:'前方一直線を焼く'},
};

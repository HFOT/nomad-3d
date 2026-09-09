import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The field and everything drawn on it except the figures at the heads of the
// chains. Four chains of up to a couple of hundred blocks each are on screen at
// once, so every block belongs to one instanced mesh per chain and every loose
// transaction to a single instanced mesh shared by the whole field.
export const FIELD=64;   // how far from the centre a head may go
export const SEG=.66;    // one block, and the gap between two of them
export const SEG_GAP=.70;
export const HEAD_GAP=1.15;

// Whose chain it is, read from colour alone: at this camera height that is all
// there is time for. The player is amber because that is the colour PIP already
// carries; the other three are the cyan, green and violet the series uses.
export const HUES=[
 {name:'あなた', color:0xffd79a, emissive:0xffa324},
 {name:'',       color:0x9fd8ff, emissive:0x2f8fd6},
 {name:'',       color:0xa8e6c8, emissive:0x2fbd86},
 {name:'',       color:0xd3b6ff, emissive:0x7a4fd6},
];

function grain(base,ink,line){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 for(let i=0;i<2600;i++){x.globalAlpha=.045+Math.random()*.075;x.fillStyle=i%4?ink:'#33444d';x.fillRect(Math.random()*256,Math.random()*256,2,2);}
 // One joint per tile. The grid is the only thing telling you how fast you are
 // crossing the field, so it is drawn rather than left to the lamps.
 x.globalAlpha=1;x.strokeStyle=line;x.lineWidth=2;x.strokeRect(1,1,254,254);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(26,26);return t;
}

let POOL_TEX=null;
function lightPool(){
 if(POOL_TEX)return POOL_TEX;
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,4,64,64,64);
 g.addColorStop(0,'rgba(150,205,225,.5)');g.addColorStop(.45,'rgba(120,175,200,.14)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return POOL_TEX=t;
}

// The plain the chains are built across: a floor, a rim you cannot cross, and
// lamps far enough apart to steer by.
export function buildField(){
 const group=new T.Group();
 const R=FIELD+1.2;

 const floor=new T.Mesh(new T.CircleGeometry(R,96),new T.MeshStandardMaterial({map:grain('#141c21','#0b1013','#223037'),metalness:.05,roughness:.95}));
 floor.rotation.x=-Math.PI/2;group.add(floor);

 const inlay=new T.MeshStandardMaterial({color:0x715c35,metalness:.8,roughness:.44});

 // The rim. A chain that touches it is finished, so it is a wall and reads as
 // one: solid below, lit along the top edge.
 const wall=new T.Mesh(new T.CylinderGeometry(R,R,3.4,120,1,true),new T.MeshStandardMaterial({color:0x1b2429,roughness:.95,side:T.BackSide}));
 wall.position.y=1.7;group.add(wall);
 const lip=new T.Mesh(new T.TorusGeometry(R,.22,10,140),new T.MeshStandardMaterial({color:0xffc98a,emissive:0xff9b24,emissiveIntensity:.85,metalness:.6,roughness:.35}));
 lip.rotation.x=Math.PI/2;lip.position.y=3.4;group.add(lip);

 const poolTex=lightPool();
 for(let i=0;i<20;i++){
  const a=i*Math.PI/10;
  const px=Math.cos(a)*(R-.5),pz=Math.sin(a)*(R-.5);
  const post=new T.Mesh(new T.CylinderGeometry(.11,.17,4.2,10),new T.MeshStandardMaterial({color:0x232b30,roughness:.9}));
  post.position.set(px,2.1,pz);group.add(post);
  const lamp=new T.Mesh(new T.SphereGeometry(.26,16,12),new T.MeshStandardMaterial({color:0xbbf9ff,emissive:0x48cbff,emissiveIntensity:2.1}));
  lamp.position.set(px,4.3,pz);group.add(lamp);
  const pool=new T.Mesh(new T.PlaneGeometry(26,26),new T.MeshBasicMaterial({map:poolTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
  pool.rotation.x=-Math.PI/2;pool.position.set(Math.cos(a)*(R-8),.14,Math.sin(a)*(R-8));group.add(pool);
 }

 // Brass plates sunk into the floor, placed by hand. They are the only fixed
 // marks out in the middle, which is where a long chain has to judge distance.
 for(const [hx,hz] of [[0,0],[-34,22],[28,-38],[46,34],[-52,-26],[14,58],[-18,-60],[62,-6],[-64,8]]){
  const plate=new T.Mesh(new T.CylinderGeometry(2.3,2.3,.09,30),new T.MeshStandardMaterial({color:0x6d5b36,metalness:.85,roughness:.46}));
  plate.position.set(hx,.05,hz);group.add(plate);
  const ring=new T.Mesh(new T.TorusGeometry(2.4,.08,8,34),inlay);
  ring.rotation.x=Math.PI/2;ring.position.set(hx,.07,hz);group.add(ring);
 }

 return group;
}

// One chain's body: every block of it in a single instanced mesh, so a chain
// two hundred long still costs one draw. The colour lives in the material
// rather than per instance, which is what lets each chain glow as itself.
export function buildBody(hue,max){
 const mesh=new T.InstancedMesh(
  new RoundedBoxGeometry(SEG,SEG,SEG,4,.045),
  new T.MeshStandardMaterial({color:hue.color,emissive:hue.emissive,emissiveIntensity:.22,metalness:.35,roughness:.3}),
  max);
 mesh.frustumCulled=false;   // the chain is longer than its head's bounds
 mesh.castShadow=mesh.receiveShadow=false;
 mesh.count=0;
 return mesh;
}

// Loose transactions lying on the floor. All of them are amber whether they
// were laid out at the start or dropped by a chain that came apart, because in
// both cases they are the same thing: work waiting to be picked up again.
export function buildLoose(max){
 const mesh=new T.InstancedMesh(
  new RoundedBoxGeometry(.3,.3,.3,3,.03),
  new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:.7,metalness:.25,roughness:.18}),
  max);
 mesh.frustumCulled=false;
 mesh.castShadow=mesh.receiveShadow=false;
 mesh.count=0;
 return mesh;
}

// The one thing on the floor that is not a transaction: a gear. Whoever runs
// over it is let off the burn for a few seconds — speed without paying blocks.
export function buildGear(){
 const g=new T.Group();
 const core=new T.Mesh(new T.OctahedronGeometry(.4,0),new T.MeshStandardMaterial({color:0x9fd8ff,emissive:0x48cbff,emissiveIntensity:1.3,roughness:.3}));
 g.add(core);
 const ring=new T.Mesh(new T.TorusGeometry(.62,.05,8,28),new T.MeshBasicMaterial({color:0x9fd8ff,transparent:true,opacity:.7}));
 ring.rotation.x=Math.PI/2;g.add(ring);
 g.position.y=.75;
 return g;
}

export function buildBlobShadow(){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,2,64,64,62);
 g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.55,'rgba(0,0,0,.26)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(2.8,2.8),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.y=.2;return m;
}

// What a chain coming apart looks like from a long way off: a ring on the floor
// where the head was. Built at radius 1 and scaled, so the run only sets a size.
export function buildBurst(){
 const m=new T.Mesh(new T.RingGeometry(.84,1,64),new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.9,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.y=.09;m.visible=false;return m;
}

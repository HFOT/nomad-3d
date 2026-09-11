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

// The stages. Same field, same rules, different night - or day. Everything
// that is a colour on the field comes from here, so a stage is a list of
// colours and nothing else has to know which one is up.
export const STAGES=[
 {id:'night',name:'NIGHT',ja:'夜',exp:.95,env:1,
  bg:0x0f1618,fog:[72,215],hemi:[0xa8c6d4,0x141a16,.85],key:[0xffe0b2,1.25],bloom:.30,
  floor:['#141c21','#0b1013','#223037','#33444d'],wall:0x1b2429,lip:[0xffc98a,0xff9b24,.85],
  post:0x232b30,lamp:[0xbbf9ff,0x48cbff,2.1],pool:'150,205,225',plate:[0x6d5b36,0x715c35]},
 {id:'pop',name:'POP',ja:'ポップ',exp:.68,env:.35,
  bg:0xffd6e2,fog:[80,240],hemi:[0xffffff,0xff9fbd,.7],key:[0xfff4d6,1.1],bloom:.12,
  floor:['#ffb6cf','#ff8fb4','#ff5f95','#5fd9ff'],wall:0xff6f9c,lip:[0xfff28a,0xffd23c,.7],
  post:0xff6f9c,lamp:[0xffffff,0x7fe3ff,1.6],pool:'255,180,210',plate:[0x7fd4ff,0x4fb9ff]},
 {id:'neon',name:'NEON',ja:'ネオン',exp:1,env:.6,
  bg:0x05040c,fog:[60,200],hemi:[0x8a6cff,0x0a0616,.7],key:[0xff5ce6,.9],bloom:.55,
  floor:['#07060f','#120b26','#3b1f9e','#ff2fd0'],wall:0x120a2a,lip:[0xff5ce6,0xff1fd0,1.4],
  post:0x1c1240,lamp:[0xa8fbff,0x22e6ff,2.6],pool:'90,230,255',plate:[0x2a1f66,0x6a4fff]},
 {id:'dawn',name:'DAWN',ja:'夜明け',exp:.75,env:.4,
  bg:0xe8b48c,fog:[70,220],hemi:[0xffe9d2,0x6a4a3a,.75],key:[0xffb56b,1.2],bloom:.18,
  floor:['#c4885f','#a86f4b','#8a5636','#5e3a24'],wall:0xa66f55,lip:[0xfff0c4,0xffb347,.75],
  post:0x6e4a3a,lamp:[0xfff7e6,0xffc46b,1.7],pool:'255,200,140',plate:[0x8a6a3a,0xa8834a]},
];
export const stageById=id=>STAGES.find(s=>s.id===id)||STAGES[0];

function grain(base,ink,line,speck){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 for(let i=0;i<2600;i++){x.globalAlpha=.045+Math.random()*.075;x.fillStyle=i%4?ink:speck;x.fillRect(Math.random()*256,Math.random()*256,2,2);}
 // One joint per tile. The grid is the only thing telling you how fast you are
 // crossing the field, so it is drawn rather than left to the lamps.
 x.globalAlpha=1;x.strokeStyle=line;x.lineWidth=2;x.strokeRect(1,1,254,254);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(26,26);return t;
}

function lightPool(rgb){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,4,64,64,64);
 g.addColorStop(0,'rgba('+rgb+',.5)');g.addColorStop(.45,'rgba('+rgb+',.14)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}

// The plain the chains are built across: a floor, a rim you cannot cross, and
// lamps far enough apart to steer by.
export function buildField(stage){
 const st=stage||STAGES[0];
 const group=new T.Group();
 const R=FIELD+1.2;

 const floor=new T.Mesh(new T.CircleGeometry(R,96),new T.MeshStandardMaterial({map:grain(...st.floor),metalness:.05,roughness:.95}));
 floor.rotation.x=-Math.PI/2;group.add(floor);

 const inlay=new T.MeshStandardMaterial({color:st.plate[1],metalness:.8,roughness:.44});

 // The rim. A chain that touches it is finished, so it is a wall and reads as
 // one: solid below, lit along the top edge.
 const wall=new T.Mesh(new T.CylinderGeometry(R,R,3.4,120,1,true),new T.MeshStandardMaterial({color:st.wall,roughness:.95,side:T.BackSide}));
 wall.position.y=1.7;group.add(wall);
 const lip=new T.Mesh(new T.TorusGeometry(R,.22,10,140),new T.MeshStandardMaterial({color:st.lip[0],emissive:st.lip[1],emissiveIntensity:st.lip[2],metalness:.6,roughness:.35}));
 lip.rotation.x=Math.PI/2;lip.position.y=3.4;group.add(lip);

 const poolTex=lightPool(st.pool);
 for(let i=0;i<20;i++){
  const a=i*Math.PI/10;
  const px=Math.cos(a)*(R-.5),pz=Math.sin(a)*(R-.5);
  const post=new T.Mesh(new T.CylinderGeometry(.11,.17,4.2,10),new T.MeshStandardMaterial({color:st.post,roughness:.9}));
  post.position.set(px,2.1,pz);group.add(post);
  const lamp=new T.Mesh(new T.SphereGeometry(.26,16,12),new T.MeshStandardMaterial({color:st.lamp[0],emissive:st.lamp[1],emissiveIntensity:st.lamp[2]}));
  lamp.position.set(px,4.3,pz);group.add(lamp);
  const pool=new T.Mesh(new T.PlaneGeometry(26,26),new T.MeshBasicMaterial({map:poolTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
  pool.rotation.x=-Math.PI/2;pool.position.set(Math.cos(a)*(R-8),.14,Math.sin(a)*(R-8));group.add(pool);
 }

 // Brass plates sunk into the floor, placed by hand. They are the only fixed
 // marks out in the middle, which is where a long chain has to judge distance.
 for(const [hx,hz] of [[0,0],[-34,22],[28,-38],[46,34],[-52,-26],[14,58],[-18,-60],[62,-6],[-64,8]]){
  const plate=new T.Mesh(new T.CylinderGeometry(2.3,2.3,.09,30),new T.MeshStandardMaterial({color:st.plate[0],metalness:.85,roughness:.46}));
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

// Loose transactions lying on the floor, one kind per chain they came from.
// Colour alone does not carry at this camera height on a block this small, so
// each kind also has its own shape, and each kind is its own instanced mesh:
// a hexagonal coin for Bitcoin, a diamond for Ethereum, the rounded block for
// Cardano, a thin tile for Solana. Weight is how often the floor deals it.
export const KINDS=[
 {id:'btc',name:'Bitcoin', color:0xF7931A,emissive:0xb85e00,weight:.12,
  geo:()=>new T.CylinderGeometry(.21,.21,.13,6)},
 {id:'eth',name:'Ethereum',color:0x627EEA,emissive:0x2f45b8,weight:.18,
  geo:()=>new T.OctahedronGeometry(.24,0)},
 {id:'ada',name:'Cardano', color:0x0033AD,emissive:0x1a4dff,glow:1.3,weight:.25,
  geo:()=>new RoundedBoxGeometry(.3,.3,.3,3,.03)},
 {id:'sol',name:'Solana',  color:0x14F195,emissive:0x0a8f58,weight:.45,
  geo:()=>new T.BoxGeometry(.4,.06,.4)},
];
export function buildLoose(max){
 return KINDS.map(k=>{
  const mesh=new T.InstancedMesh(k.geo(),
   new T.MeshStandardMaterial({color:k.color,emissive:k.emissive,emissiveIntensity:k.glow||.8,metalness:.3,roughness:.2}),
   max);
  mesh.frustumCulled=false;
  mesh.castShadow=mesh.receiveShadow=false;
  mesh.count=0;
  return mesh;
 });
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

// The shield a chain is holding: a blue ring around the head, and a second,
// tilted one so it reads as a sphere from the camera's height. Shown only
// while a shield is held; the run scales it out when the shield takes a hit.
export function buildShield(){
 const g=new T.Group();
 const mat=new T.MeshBasicMaterial({color:0x4d7dff,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false});
 const a=new T.Mesh(new T.TorusGeometry(1.15,.06,8,40),mat);a.rotation.x=Math.PI/2;g.add(a);
 const b=new T.Mesh(new T.TorusGeometry(1.15,.045,8,40),mat);b.rotation.x=Math.PI/2+.9;g.add(b);
 const c=new T.Mesh(new T.TorusGeometry(1.15,.045,8,40),mat);c.rotation.x=Math.PI/2-.9;c.rotation.y=1.2;g.add(c);
 const core=new T.Mesh(new T.SphereGeometry(1.05,20,14),new T.MeshBasicMaterial({color:0x2b5fff,transparent:true,opacity:.12,blending:T.AdditiveBlending,depthWrite:false,side:T.BackSide}));
 g.add(core);
 g.position.y=.9;g.visible=false;
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

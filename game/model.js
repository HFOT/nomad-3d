import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The course PIP runs. Everything that moves is an object in a pool, never a
// scrolling texture: an object's z is the single truth for both the picture and
// the collision test, so what you see is what you hit.
export const ROAD_HALF=3.0;   // where the rails stand
export const LIMIT=2.55;      // how far the jets may carry PIP sideways
export const SPAWN_Z=118;     // props are born here and travel towards -z

const stone=new T.MeshStandardMaterial({color:0x2a3138,metalness:.08,roughness:.92});
const rail=new T.MeshStandardMaterial({color:0x9d7f49,metalness:.82,roughness:.34});
const dark=new T.MeshStandardMaterial({color:0x141b1f,metalness:.55,roughness:.45});
const wood=new T.MeshStandardMaterial({color:0x4c3524,roughness:.84});
const cyan=new T.MeshStandardMaterial({color:0xbbf9ff,emissive:0x48cbff,emissiveIntensity:2.4});
const amber=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:1.3,metalness:.25,roughness:.18});
const forge=new T.MeshStandardMaterial({color:0xc7f0dc,emissive:0x2fbd86,emissiveIntensity:1.15});
const hazard=new T.MeshStandardMaterial({color:0xe2705f,emissive:0x7a2418,emissiveIntensity:.5,roughness:.6});

function grain(base,ink){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,256);
 // Isotropic speckle only. A directional pattern here would fight the props for
 // which way the world is moving, and the props must win.
 for(let i=0;i<4200;i++){x.globalAlpha=.05+Math.random()*.14;x.fillStyle=i%3?ink:'#ffffff';x.fillRect(Math.random()*256,Math.random()*256,2,2);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace; // a canvas is sRGB; without this the road renders washed out
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,90);return t;
}

// The road itself never moves, so it is one piece of geometry laid out long
// enough to reach the fog.
export function buildRoad(){
 const group=new T.Group();
 const surface=new T.Mesh(new T.PlaneGeometry(ROAD_HALF*2,SPAWN_Z+40),new T.MeshStandardMaterial({map:grain('#232a30','#0d1216'),metalness:.06,roughness:.95}));
 surface.rotation.x=-Math.PI/2;surface.position.z=(SPAWN_Z+40)/2-14;surface.receiveShadow=true;group.add(surface);
 for(const s of [-1,1]){
  const kerb=new T.Mesh(new T.BoxGeometry(.34,.22,SPAWN_Z+40),stone);
  kerb.position.set(s*(ROAD_HALF+.17),.11,surface.position.z);kerb.receiveShadow=true;group.add(kerb);
  const strip=new T.Mesh(new T.BoxGeometry(.06,.03,SPAWN_Z+40),rail);
  strip.position.set(s*ROAD_HALF,.23,surface.position.z);group.add(strip);
 }
 // Beyond the kerb the ground drops into the dark, so the road reads as raised.
 const skirt=new T.Mesh(new T.PlaneGeometry(120,SPAWN_Z+40),new T.MeshStandardMaterial({color:0x161c1e,roughness:1}));
 skirt.rotation.x=-Math.PI/2;skirt.position.set(0,-.9,surface.position.z);group.add(skirt);
 return group;
}

// A lamp on each side of the same row: paired, they read as one gate of light
// going past, which is most of the sense of speed.
export function buildLampRow(){
 const group=new T.Group();
 for(const s of [-1,1]){
  const post=new T.Mesh(new T.CylinderGeometry(.05,.07,2.5,12),dark);
  post.position.set(s*(ROAD_HALF+.42),1.25,0);group.add(post);
  const head=new T.Mesh(new T.SphereGeometry(.13,18,12),cyan);
  head.position.set(s*(ROAD_HALF+.42),2.52,0);group.add(head);
  const arm=new T.Mesh(new T.BoxGeometry(.3,.05,.05),rail);
  arm.position.set(s*(ROAD_HALF+.28),2.4,0);group.add(arm);
 }
 return group;
}

// A brass strip across the road. Pure speed cue, no collision.
export function buildMarker(){
 const strip=new T.Mesh(new T.BoxGeometry(ROAD_HALF*2-.4,.02,.24),new T.MeshStandardMaterial({color:0x6d5c3c,metalness:.5,roughness:.62}));
 strip.position.y=.015;return strip;
}

// halfWidth and clear are what the run tests against, so they live with the
// geometry that justifies them rather than in a table somewhere else. clear is
// the height PIP has to be above to pass over it; a pylon is simply too tall.
export function buildObstacle(kind){
 const group=new T.Group();
 if(kind==='crate'){
  const box=new T.Mesh(new RoundedBoxGeometry(1.05,.92,.95,4,.04),wood);
  box.position.y=.46;box.castShadow=true;group.add(box);
  for(const y of [.22,.7])for(const z of [-.48,.48]){
   const band=new T.Mesh(new T.BoxGeometry(1.07,.07,.03),rail);band.position.set(0,y,z);group.add(band);
  }
  return {group,halfWidth:.53,clear:.95};
 }
 if(kind==='pylon'){
  const post=new T.Mesh(new T.CylinderGeometry(.13,.18,2.1,14),dark);
  post.position.y=1.05;post.castShadow=true;group.add(post);
  for(let i=0;i<3;i++){
   const ring=new T.Mesh(new T.TorusGeometry(.2,.025,8,24),i===1?hazard:rail);
   ring.rotation.x=Math.PI/2;ring.position.y=.5+i*.6;group.add(ring);
  }
  const top=new T.Mesh(new T.SphereGeometry(.11,16,12),hazard);top.position.y=2.16;group.add(top);
  return {group,halfWidth:.22,clear:99};
 }
 // barrier: wide and low. Nothing to do but go around it.
 const wall=new T.Mesh(new RoundedBoxGeometry(2.2,.62,.32,4,.03),stone);
 wall.position.y=.31;wall.castShadow=true;group.add(wall);
 for(let i=0;i<7;i++){
  const tooth=new T.Mesh(new T.BoxGeometry(.28,.1,.34),i%2?hazard:rail);
  tooth.position.set(-.93+i*.31,.66,0);group.add(tooth);
 }
 for(const s of [-1,1]){
  const foot=new T.Mesh(new T.BoxGeometry(.16,.34,.5),dark);foot.position.set(s*1.05,.17,0);group.add(foot);
 }
 return {group,halfWidth:1.12,clear:.78};
}

// One transaction, loose on the road, waiting for a courier. Deliberately the
// same amber as the one PIP already carries.
export function buildPickup(){
 const group=new T.Group();
 const core=new T.Mesh(new RoundedBoxGeometry(.3,.3,.3,5,.02),amber);
 core.castShadow=true;group.add(core);
 const shell=new T.Mesh(new RoundedBoxGeometry(.44,.44,.44,5,.02),new T.MeshPhysicalMaterial({color:0xeeb75b,metalness:.05,roughness:.16,transmission:.7,thickness:.14,ior:1.45,clearcoat:1}));
 group.add(shell);
 for(let k=0;k<3;k++){
  const hoop=new T.Mesh(new T.TorusGeometry(.28+k*.02,.006,8,30),amber);
  hoop.rotation.set(k*.7,k*.5,k*.2);group.add(hoop);
 }
 group.add(new T.PointLight(0xffc168,.9,3.2));
 group.position.y=.85;
 return group;
}

// The end of a slot: FORGE's arch. Carry a transaction through it and the block
// is minted with something in it.
export function buildGate(){
 const group=new T.Group();
 for(const s of [-1,1]){
  const pillar=new T.Mesh(new RoundedBoxGeometry(.7,4.4,.7,4,.05),stone);
  pillar.position.set(s*(ROAD_HALF+.55),2.2,0);pillar.castShadow=true;group.add(pillar);
  const brace=new T.Mesh(new T.BoxGeometry(.78,.16,.78),rail);brace.position.set(s*(ROAD_HALF+.55),3.9,0);group.add(brace);
 }
 const lintel=new T.Mesh(new RoundedBoxGeometry(ROAD_HALF*2+1.9,.66,.66,4,.05),stone);
 lintel.position.y=4.6;lintel.castShadow=true;group.add(lintel);
 const bar=new T.Mesh(new T.BoxGeometry(ROAD_HALF*2+1.2,.09,.16),forge);
 bar.position.y=4.2;group.add(bar);
 const lamp=new T.PointLight(0x54e0a4,1.6,12);lamp.position.set(0,4,0);group.add(lamp);
 // The anvil sits off to one side: the block is struck beside the road, not on it.
 const anvil=new T.Mesh(new RoundedBoxGeometry(1.1,.5,.8,4,.05),dark);
 anvil.position.set(ROAD_HALF+1.9,.9,0);group.add(anvil);
 const heat=new T.Mesh(new T.BoxGeometry(.8,.06,.55),forge);heat.position.set(ROAD_HALF+1.9,1.17,0);group.add(heat);
 return group;
}

// The transaction PIP just lost, tumbling away behind. Visible consequence for
// a hit, which the counter alone would not give.
export function buildDropped(){
 const cube=new T.Mesh(new RoundedBoxGeometry(.34,.34,.34,5,.02),amber);
 cube.castShadow=true;return cube;
}

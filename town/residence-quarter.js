import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildResidence,TIERS} from '../residences/model.js';
import {planNetwork,buildNetwork} from '../residences/network.js';

// The stone residences from /residences/ are the town's housing stock. Estates
// scatter into the open wedges first, then every street with a kind takes
// frontage on both sides — the same address rule the old neighborhood used —
// and the aerial flame network routes every PORT_FLAME over the roofs to the
// town's actual Treasury Vault, exactly as the residence kit contract says.
export function buildResidenceQuarter({streets,isWater,exclusions=[],sink=null,obstacles=[]}){
 const root=new T.Group();root.name='ResidenceQuarter';
 const homesGroup=new T.Group();homesGroup.name='ResidenceHomes';root.add(homesGroup);
 let seed=1911;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const frames=streets.map(s=>{const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len=Math.hypot(dx,dz)||1;
  return {ux:dx/len,uz:dz/len,len,cx:(s.a.x+s.b.x)/2,cz:(s.a.z+s.b.z)/2,width:s.width};});
 const distToStreet=(f,x,z)=>{const rx=x-f.cx,rz=z-f.cz,along=Math.max(0,Math.abs(rx*f.ux+rz*f.uz)-f.len/2),across=Math.max(0,Math.abs(-rx*f.uz+rz*f.ux)-f.width/2);return Math.hypot(along,across);};
 const wells=[[48,31],[47,-27],[-45,-28],[-39,3]];// courtyard wells owned by the neighborhood module
 const homes=[],placedLots=[];
 const PAD=.7;// air between neighbouring lots, in metres
 // A lot is the real rotated rectangle from the tier sheet, not a circle around
 // its diagonal: houses can stand shoulder to shoulder down a street the way a
 // terrace actually does, and a slot is judged before the expensive build.
 // (ux,uz) is the width axis; the depth axis is its left normal.
 const lot=(x,z,ux,uz,w,d)=>({x,z,ux,uz,hw:w/2,hd:d/2});
 // A residence's real lot is the footprint it reports after it is built — the
 // measured extent including its service pier, not the tier sheet's nominal
 // block. That is the same box planNetwork tests, so a slot this module
 // accepts is a slot the flame planner also accepts. A probe of each tier is
 // built once to measure it, then handed to the next house of that tier.
 const probes=TIERS.map(()=>null);
 const probe=t=>probes[t]||(probes[t]=buildResidence(t));
 const footprint=t=>probe(t).root.userData.footprint;
 // A root rotated by ry sends local +X to (cos ry, -sin ry).
 const tierLot=(t,x,z,ry,pad=0)=>{const f=footprint(t);return lot(x,z,Math.cos(ry),-Math.sin(ry),f.width+pad,f.depth+pad);};
 // Separating-axis test between two oriented rectangles on the ground plane.
 function overlaps(a,b){
  const dx=b.x-a.x,dz=b.z-a.z;
  for(const [p,q] of [[a,b],[b,a]]){
   for(const [ax,az,half] of [[p.ux,p.uz,p.hw],[-p.uz,p.ux,p.hd]]){
    const reach=Math.abs(q.ux*ax+q.uz*az)*q.hw+Math.abs(-q.uz*ax+q.ux*az)*q.hd;
    if(Math.abs(dx*ax+dz*az)>half+reach)return false;
   }
  }
  return true;
 }
 // Street corridors and landmark lots are rectangles too, so one test serves all.
 const streetLots=frames.map(f=>lot(f.cx,f.cz,f.ux,f.uz,f.len,f.width+.7));
 const boxLots=exclusions.map(b=>{const c=b.getCenter(new T.Vector3()),g=b.getSize(new T.Vector3());return lot(c.x,c.z,1,0,g.x+3,g.z+3);});
 function fits(l,rMin=40,rMax=88){
  const r=Math.hypot(l.x,l.z);if(r<rMin||r>rMax)return false;
  if(boxLots.some(b=>overlaps(l,b)))return false;
  if(streetLots.some(s=>overlaps(l,s)))return false;
  if(placedLots.some(p=>overlaps(l,p)))return false;
  if(wells.some(([wx,wz])=>overlaps(l,lot(wx,wz,1,0,6.6,6.6))))return false;
  // No corner, edge or centre of the lot may stand in a canal.
  for(const [a,b] of [[0,0],[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]){
   const px=l.x+l.ux*a*l.hw-l.uz*b*l.hd,pz=l.z+l.uz*a*l.hw+l.ux*b*l.hd;
   if(isWater(px,pz))return false;
  }
  return true;
 }
 function settle(tier,x,z,ry){
  const lot=tierLot(tier,x,z,ry,PAD);// air between neighbouring lots
  const home=probe(tier);probes[tier]=null;
  home.root.position.set(x,0,z);home.root.rotation.y=ry;
  placedLots.push(lot);
  homes.push(home);homesGroup.add(home.root);
  return home;
 }
 const faceNearestStreet=(x,z)=>{
  let best=null,bd=1e9;for(const f of frames){const d=distToStreet(f,x,z);if(d<bd){bd=d;best=f;}}
  const tx=best?T.MathUtils.clamp(((x-best.cx)*best.ux+(z-best.cz)*best.uz),-best.len/2,best.len/2):0;
  const nx=best?best.cx+best.ux*tx-x:0,nz=best?best.cz+best.uz*tx-z:1;
  return Math.atan2(nx,nz);
 };
 // Estates first: the whale mansion and two colonnade houses claim open
 // ground in the wedges before the street frontage tightens around them.
 for(const tier of [3,2,2]){
  for(let attempt=0;attempt<2500;attempt++){
   const angle=random()*Math.PI*2,r=42+random()*54,x=Math.round(Math.cos(angle)*r*2)/2,z=Math.round(Math.sin(angle)*r*2)/2;
   const ry=faceNearestStreet(x,z);
   if(!fits(tierLot(tier,x,z,ry,PAD),40,98))continue;
   settle(tier,x,z,ry);break;
  }
 }
 // Street frontage: every carriageway with a kind (boulevards stay open as
 // designed, bridges carry no lots) takes stone residences on both sides.
 const gateDirs=[];for(let i=0;i<6;i++){const a=Math.PI-i*Math.PI/3;gateDirs.push([Math.sin(a),Math.cos(a)]);}
 const boulevard=s=>gateDirs.some(([dx,dz])=>Math.abs(s.a.x*dz-s.a.z*dx)<1&&Math.abs(s.b.x*dz-s.b.z*dx)<1);
 const CAP=140;
 streets.forEach((s,i)=>{
  if(!s.kind||s.kind==='bridge'||boulevard(s))return;
  const f=frames[i],px=-f.uz,pz=f.ux;
  for(const side of [-1,1]){
   const ry=Math.atan2(-side*px,-side*pz);// the door faces this carriageway
   let t=-f.len/2+2.5;
   while(t<=f.len/2-2.5&&homes.length<CAP){
    // Wider, central streets carry grander houses; alleys keep small homes.
    const roll=random();
    const want=s.width>=5?(roll<.3?2:roll<.85?1:0):(roll<.6?1:0);
    let placedTier=-1;
    for(let tier=want;tier>=0;tier--){
     // Setback puts the front wall on the building line: the lot's depth axis
     // points at the carriageway, so half the lot depth clears the kerb.
     const setback=s.width/2+(footprint(tier).depth+PAD)/2+.5;
     const x=f.cx+f.ux*t+px*side*setback,z=f.cz+f.uz*t+pz*side*setback;
     if(!fits(tierLot(tier,x,z,ry,PAD),31,98))continue;
     settle(tier,x,z,ry);placedTier=tier;break;
    }
    t+=placedTier>=0?footprint(placedTier).width+1:3.2;
   }
  }
 });
 // Block interiors: whatever ground the frontage left over takes a courtyard
 // house, still facing the nearest carriageway.
 for(let attempt=0;attempt<2600&&homes.length<CAP;attempt++){
  const angle=random()*Math.PI*2,r=34+random()*62,x=Math.round(Math.cos(angle)*r*2)/2,z=Math.round(Math.sin(angle)*r*2)/2;
  const tier=random()<.45?1:0,ry=faceNearestStreet(x,z);
  if(!fits(tierLot(tier,x,z,ry,PAD),33,98))continue;
  settle(tier,x,z,ry);
 }
 for(const p of probes)if(p)p.root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
 root.updateMatrixWorld(true);
 const boxes=homes.map(h=>new T.Box3().setFromObject(h.root));
 // The aerial flame network runs to the town's real Treasury Vault. A failed
 // route never removes houses: the mains are an amenity, not a foundation.
 let network=null;
 if(sink&&homes.length){
  try{
   const plan=planNetwork(homes,sink,{grid:2,clearance:2.6,obstacles});
   network=buildNetwork(plan,{supportOk:(x,z)=>!isWater(x,z)&&!frames.some(f=>distToStreet(f,x,z)<1.1)});
   root.add(network.root);
  }catch(err){console.warn('[TOWN] residence flame network skipped:',err.message);}
 }
 mergeAcrossHomes(homesGroup);
 console.log('[TOWN] residence quarter:',homes.length,'houses',network?'+ flame network':'(no network)');
 // Street furniture wants simple keep-out circles, the same shape the old
 // neighborhood handed it.
 const bounds=placedLots.map(p=>({x:p.x,z:p.z,r:Math.hypot(p.hw,p.hd)}));
 return {root,homes,boxes,bounds,network,tick(t){for(const h of homes)h.tick(t);network?.tick(t);}};
}

// Each residence batches per house, but seventy houses each carrying their own
// clone of the same stone set is still hundreds of draw calls. Materials that
// are the same recipe (colour, maps, surface) collapse into one town-wide mesh
// per recipe; the clockwork gears stay live under their dynamic groups.
function mergeAcrossHomes(group){
 group.updateMatrixWorld(true);
 const recipe=m=>[m.type,m.color?.getHexString(),m.emissive?.getHexString?.()||'',m.emissiveIntensity||0,m.map?.uuid||'',m.bumpMap?.uuid||'',m.roughness,m.metalness].join('|');
 const dynamic=o=>{for(let p=o;p&&p!==group;p=p.parent)if(p.userData.dynamic)return true;return false;};
 // Turning parts cannot join the town-wide batches, but a gear's own rim,
 // spokes and hub share one transform: collapse each gear to a single mesh.
 const spinners=[];group.traverse(o=>{if(o.userData.dynamic)spinners.push(o);});
 for(const spinner of spinners)collapseInPlace(spinner,recipe);
 const buckets=new Map();
 group.traverse(o=>{if(o.isMesh&&!dynamic(o)){const k=recipe(o.material);if(!buckets.has(k))buckets.set(k,{mat:o.material,list:[]});buckets.get(k).list.push(o);}});
 for(const {mat,list} of buckets.values()){
  if(list.length<2)continue;
  const parts=list.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrixWorld);});
  const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  if(!merged)continue;
  const mesh=new T.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  for(const o of list){o.removeFromParent();o.geometry.dispose();}
 }
}

// Batch one moving group's meshes into its own local space, per material
// recipe, so the group keeps turning as a unit.
function collapseInPlace(node,recipe){
 node.updateMatrixWorld(true);
 const inverse=node.matrixWorld.clone().invert(),buckets=new Map();
 node.traverse(o=>{if(o.isMesh){const k=recipe(o.material);if(!buckets.has(k))buckets.set(k,{mat:o.material,list:[]});buckets.get(k).list.push(o);}});
 for(const {mat,list} of buckets.values()){
  if(list.length<2)continue;
  const parts=list.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));});
  const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  if(!merged)continue;
  const mesh=new T.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;node.add(mesh);
  for(const o of list){o.removeFromParent();o.geometry.dispose();}
 }
}

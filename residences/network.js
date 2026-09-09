import * as T from 'three';
import {kit,palette,batchStatic,PORT} from './model.js';

const key=(x,z)=>`${x},${z}`;
// Routes on a configurable overhead service plane; supplied tall obstacles are
// blocked cells. The tree grows toward the treasury, never across a blocked cell.
export function planNetwork(homes,sink,{grid=2,clearance=2.5,obstacles=[],spineZ}={}){
 if(!homes.length)throw Error('No residences');if(!(grid>0&&clearance>0))throw Error('Invalid service grid');
 const lots=homes.map(h=>{h.root.updateMatrixWorld(true);const {width,depth}=h.root.userData.footprint;return new T.Box3(new T.Vector3(-width/2,0,-depth/2),new T.Vector3(width/2,h.maxHeight,depth/2)).applyMatrix4(h.root.matrixWorld);});
 // Lots are tested as the rotated rectangles they actually are: a terrace on a
 // diagonal street is not an overlap just because its axis-aligned bounds meet.
 const ground=homes.map(h=>{const {width,depth}=h.root.userData.footprint,m=h.root.matrixWorld.elements;
  const cx=m[12],cz=m[14],ux=m[0],uz=m[2],vx=m[8],vz=m[10];
  const ul=Math.hypot(ux,uz)||1,vl=Math.hypot(vx,vz)||1;
  return {x:cx,z:cz,ux:ux/ul,uz:uz/ul,hw:width*ul/2,hd:depth*vl/2};});
 const separated=(a,b)=>{const dx=b.x-a.x,dz=b.z-a.z;
  for(const [p,q] of [[a,b],[b,a]])for(const [ax,az,half] of [[p.ux,p.uz,p.hw],[-p.uz,p.ux,p.hd]]){
   const reach=Math.abs(q.ux*ax+q.uz*az)*q.hw+Math.abs(-q.uz*ax+q.ux*az)*q.hd;
   if(Math.abs(dx*ax+dz*az)>half+reach)return true;}
  return false;};
 for(let a=0;a<lots.length;a++)for(let b=a+1;b<lots.length;b++)
  if(lots[a].intersectsBox(lots[b])&&!separated(ground[a],ground[b]))throw Error(`住宅の敷地が重なっています: ${a+1} / ${b+1}`);
 const sources=homes.flatMap((h,i)=>h.ports.map(p=>({id:`${i}/${p.name}`,home:i,position:p.getWorldPosition(new T.Vector3()).toArray(),type:p.userData.type})));
 const height=Math.max(sink[1],...lots.map(b=>b.max.y))+clearance;
 const snap=p=>[Math.round(p[0]/grid),Math.round(p[2]/grid)];const anchor=s=>snap([s.position[0],height,spineZ??s.position[2]]);const target=snap(sink),tree=new Set([key(...target)]),parents=new Map(),edges=[];
 const all=[target,...sources.map(anchor)],minX=Math.min(...all.map(p=>p[0]))-16,maxX=Math.max(...all.map(p=>p[0]))+16,minZ=Math.min(...all.map(p=>p[1]))-16,maxZ=Math.max(...all.map(p=>p[1]))+16;
 const blocked=(x,z)=>obstacles.some(b=>height>=b.min[1]-.5&&height<=b.max[1]+.5&&x*grid>=b.min[0]-.5&&x*grid<=b.max[0]+.5&&z*grid>=b.min[2]-.5&&z*grid<=b.max[2]+.5);
 if(blocked(...target))throw Error('大金庫の接続口が障害物に重なっています');
 const intersects=(a,b,ob)=>{let lo=0,hi=1;for(let i=0;i<3;i++){const delta=b[i]-a[i],mn=ob.min[i]-.5,mx=ob.max[i]+.5;if(Math.abs(delta)<1e-9){if(a[i]<mn||a[i]>mx)return false;continue;}const t1=(mn-a[i])/delta,t2=(mx-a[i])/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;}return true;};
 for(const source of sources){if(source.type!==PORT.type)throw Error('Incompatible flame port');const start=anchor(source),queue=[start],seen=new Map([[key(...start),null]]);let found=null;
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i],k=key(x,z);if(blocked(x,z))continue;if(tree.has(k)){found=k;break;}const next=[[x+1,z],[x-1,z],[x,z+1],[x,z-1]].sort((a,b)=>(Math.abs(a[0]-target[0])+Math.abs(a[1]-target[1]))-(Math.abs(b[0]-target[0])+Math.abs(b[1]-target[1])));for(const [xx,zz] of next){const kk=key(xx,zz);if(xx<minX||xx>maxX||zz<minZ||zz>maxZ||blocked(xx,zz)||seen.has(kk)||obstacles.some(o=>intersects([x*grid,height,z*grid],[xx*grid,height,zz*grid],o)))continue;seen.set(kk,k);queue.push([xx,zz]);}}
  if(found===null)throw Error(`配管経路がありません: ${source.id}`);
  let k=found;while(seen.get(k)!==null){const prev=seen.get(k);parents.set(prev,k);edges.push([prev,k]);tree.add(prev);k=prev;}
  source.node=key(...start);
  const p=source.position,connector=[p,[p[0],height,p[2]],[start[0]*grid,height,p[2]],[start[0]*grid,height,start[1]*grid]];for(let i=1;i<connector.length;i++)if(obstacles.some(o=>intersects(connector[i-1],connector[i],o)))throw Error(`住宅接続口の直上・引込経路が塞がれています: ${source.id}`);
 }
 const position=k=>{const [x,z]=k.split(',').map(Number);return [x*grid,height,z*grid];};
 // Reachability is verified against the directed tree, not visual proximity.
 for(const s of sources){let k=s.node;const visited=new Set();while(k!==key(...target)){if(visited.has(k)||!parents.has(k))throw Error('Disconnected or cyclic network');visited.add(k);k=parents.get(k);}}
 return {version:1,units:'metres',height,grid,sink,root:key(...target),sources,edges:edges.map(([a,b])=>({from:a,to:b,a:position(a),b:position(b)})),nodes:[...tree].map(id=>({id,position:position(id)})),connected:sources.length,lots:lots.map(b=>({min:b.min.toArray(),max:b.max.toArray()}))};
}
export function buildNetwork(plan,{supportOk=()=>true}={}){const root=new T.Group();root.name='CORN_AerialFlameNetwork';root.userData={author:'CORN',portStandard:PORT,plan};const M=palette(),K=kit(root,M),pulses=[];
 function segment(a,b,r){K.rod(a,b,r,M.copper);for(const p of [a,b])K.collar(p,new T.Vector3(...b).sub(new T.Vector3(...a)).normalize().toArray(),r);}
 // Analytic quarter-turns: fillets stay inside the orthogonal polyline envelope.
 function route(points,r){const p=points.map(v=>new T.Vector3(...v)),path=new T.CurvePath();let prev=p[0];for(let i=1;i<p.length-1;i++){const u=p[i-1].clone().sub(p[i]).normalize(),v=p[i+1].clone().sub(p[i]).normalize();if(Math.abs(u.dot(v))>.999)continue;const f=Math.min(.7,p[i].distanceTo(p[i-1])*.35,p[i].distanceTo(p[i+1])*.35),a=p[i].clone().addScaledVector(u,f),b=p[i].clone().addScaledVector(v,f);path.add(new T.LineCurve3(prev,a));path.add(new T.QuadraticBezierCurve3(a,p[i],b));prev=b;}path.add(new T.LineCurve3(prev,p.at(-1)));K.mesh(new T.TubeGeometry(path,Math.max(24,Math.ceil(path.getLength()*5)),r,12,false),M.copper);for(const end of [p[0],p.at(-1)])K.collar(end.toArray(),[0,1,0],r);}
 const degree=new Map(),neighbors=new Map();for(const e of plan.edges){for(const [a,b] of [[e.from,e.to],[e.to,e.from]]){degree.set(a,(degree.get(a)||0)+1);if(!neighbors.has(a))neighbors.set(a,[]);neighbors.get(a).push(b);}}
 const byId=new Map(plan.nodes.map(n=>[n.id,n.position]));const terminals=new Set([plan.root,...plan.sources.map(s=>s.node)]);const corners=new Map();for(const n of plan.nodes){const adj=neighbors.get(n.id)||[];if(adj.length===2&&!terminals.has(n.id)){const u=new T.Vector3(...byId.get(adj[0])).sub(new T.Vector3(...n.position)).normalize(),v=new T.Vector3(...byId.get(adj[1])).sub(new T.Vector3(...n.position)).normalize();if(Math.abs(u.dot(v))<.1)corners.set(n.id,{u,v});}}
 for(const e of plan.edges){const a=new T.Vector3(...e.a),b=new T.Vector3(...e.b),dir=b.clone().sub(a).normalize();if(corners.has(e.from))a.addScaledVector(dir,.55);if(corners.has(e.to))b.addScaledVector(dir,-.55);segment(a.toArray(),b.toArray(),.36);const mid=a.clone().lerp(b,.5);K.box(M.iron,mid.x,mid.y,mid.z+.32,.38,.46,.17);K.box(M.light,mid.x,mid.y,mid.z+.415,.10,.27,.02);}
 for(const [id,{u,v}] of corners){const p=new T.Vector3(...byId.get(id)),a=p.clone().addScaledVector(u,.55),b=p.clone().addScaledVector(v,.55);K.mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(a,p,b),12,.36,12,false),M.copper);}
 const supports=[];for(const n of plan.nodes){const [x,y,z]=n.position;if((degree.get(n.id)||0)>2||terminals.has(n.id)){K.mesh(new T.SphereGeometry(.43,12,8),M.iron,x,y,z);K.ring(x,y,z+.38,.19);}
 // Support the mains from ground only outside residential footprints.
 const inside=plan.lots.some(b=>x>=b.min[0]-.6&&x<=b.max[0]+.6&&z>=b.min[2]-.6&&z<=b.max[2]+.6);
 if(!inside&&supportOk(x,z)&&(Math.round(x/plan.grid)+Math.round(z/plan.grid))%4===0){supports.push(n.position);K.masonry(x,0,z,.92,y-1.1,.92);K.box(M.stone,x,.18,z,1.5,.36,1.5);K.box(M.stone,x,y-1,z,1.35,.25,1.2);K.rod([x,y-1,z],[x,y-.4,z],.13,M.iron);for(const s of [-1,1])K.rod([x,y-2.2,z],[x+s*1.0,y-.42,z],.075,M.iron);K.collar([x,y,z],[0,1,0],.38);}}
 for(let i=0;i<supports.length;i++)for(let j=i+1;j<supports.length;j++){const a=supports[i],b=supports[j],distance=Math.hypot(a[0]-b[0],a[2]-b[2]);if(Math.abs(distance-plan.grid*4)>.01||a[0]!==b[0]&&a[2]!==b[2])continue;const mx=(a[0]+b[0])/2,mz=(a[2]+b[2])/2;
  // Only brace an actual straight main; never place an arch across a courtyard.
  const along=plan.nodes.filter(n=>Math.abs(n.position[0]-mx)<=distance/2+.01&&Math.abs(n.position[2]-mz)<=distance/2+.01&&(a[0]===b[0]?n.position[0]===a[0]:n.position[2]===a[2]));if(along.length<5)continue;
  const arch=new T.Group();arch.position.set(mx,0,mz);arch.rotation.y=a[0]===b[0]?Math.PI/2:0;root.add(arch);const k=kit(arch,M),r=distance/2-.42;k.arch(0,plan.height-r-1.05,-.26,r,.30,.52);k.box(M.iron,0,plan.height-.75,0,distance,.12,.32);
 }
 for(const s of plan.sources){const n=plan.nodes.find(n=>n.id===s.node).position,p=s.position;const points=[p,[p[0],plan.height,p[2]],[n[0],plan.height,p[2]],n].filter((p,i,a)=>!i||new T.Vector3(...p).distanceTo(new T.Vector3(...a[i-1]))>1e-5);route(points,PORT.radius);}
 const target=plan.nodes.find(n=>n.id===plan.root).position;route([target,[plan.sink[0],plan.height,target[2]],[plan.sink[0],plan.height,plan.sink[2]],plan.sink].filter((p,i,a)=>!i||new T.Vector3(...p).distanceTo(new T.Vector3(...a[i-1]))>1e-5),.36);
 batchStatic(root);
 // Small illuminated inspection indicators travel toward the root of the tree.
 for(const s of plan.sources){const points=[new T.Vector3(...s.position)];let id=s.node;points.push(new T.Vector3(...plan.nodes.find(n=>n.id===id).position));while(id!==plan.root){const edge=plan.edges.find(e=>e.from===id);points.push(new T.Vector3(...edge.b));id=edge.to;}points.push(new T.Vector3(...plan.sink));const curve=new T.CurvePath();for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(points[i-1],points[i]));const orb=new T.Mesh(new T.SphereGeometry(.09,8,6),M.light);root.add(orb);pulses.push({orb,curve});}
 return {root,tick(t){pulses.forEach(({orb,curve},i)=>orb.position.copy(curve.getPoint((t*.04+i*.14)%1)));}};
}

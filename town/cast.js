import * as T from 'three';
import * as Nomad from '../nomad/model.js';
import * as Ward from '../ward/model.js';
import * as Quorum from '../quorum/model.js';
import * as Lex from '../lex/model.js';
import * as Catalyst from '../catalyst/model.js';
import * as Treasury from '../treasury/model.js';
import * as Forge from '../forge/model.js';
import {buildMouse} from '../pip/model.js';

// Each walker owns a closed ellipse route: centre, radii, angular speed, phase
// and direction. Routes thread the plaza, the road and the building fronts
// without crossing a footprint (gate ~z22, depot ~(14,-12), canal x>20).
// Territories: everyone patrols their own patch of the town. WARD walks the
// top of the curtain wall itself, all the way around the hexagon.
const ROUTES={
 nomad:   {cx:0,  cz:38,  rx:4.2,rz:20, speed:.16, phase:0,   dir:1},
 ward:    {wall:true,     speed:.0035,phase:.08,dir:1},
 quorum:  {cx:-40, cz:-16, rx:9, rz:7,  speed:.10, phase:1,   dir:1},
 lex:     {cx:38, cz:-14, rx:7,  rz:6,  speed:.09, phase:4,   dir:-1},
 catalyst:{cx:30, cz:32,  rx:8,  rz:8,  speed:.10, phase:3,   dir:-1},
 treasury:{cx:0,cz:-38, rx:9,  rz:6,  speed:.08, phase:5,   dir:1},
 forge:   {cx:-32,cz:-16, rx:7,  rz:6,  speed:.09, phase:2.5, dir:-1},
 pip:     {cx:0,  cz:0,   rx:64, rz:68, speed:.11, phase:.7,  dir:1},
};

const WALL_R=132,WALL_Y=9.75;
const HEX=[];for(let k=0;k<6;k++){const a=Math.PI-k*Math.PI/3;HEX.push([Math.sin(a)*WALL_R,Math.cos(a)*WALL_R]);}
function walk(w,dt){
 w.u+=dt*w.speed;
 if(w.wall){
  const p=((w.phase+w.u*w.dir)%1+1)%1,i=Math.floor(p*6),f=p*6-i;
  const [x1,z1]=HEX[i],[x2,z2]=HEX[(i+1)%6];
  w.root.position.set(x1+(x2-x1)*f,WALL_Y,z1+(z2-z1)*f);
  w.root.rotation.y=Math.atan2((x2-x1)*w.dir,(z2-z1)*w.dir);
  return;
 }
 const a=w.phase+w.u*w.dir;
 w.root.position.set(w.cx+Math.sin(a)*w.rx,0,w.cz+Math.cos(a)*w.rz);
 const dx=Math.cos(a)*w.rx*w.dir,dz=-Math.sin(a)*w.rz*w.dir;
 w.root.rotation.y=Math.atan2(dx,dz);
}

function robotWalker(mod,def){
 const M=mod.createMaterials(def.id==='nomad'?512:256),r=mod.buildRobot(M);// town-scale skins; NOMAD walks beside the camera so he keeps more detail
 const mixer=new T.AnimationMixer(r.root);
 const walkA=mixer.clipAction(r.clips.find(c=>c.name==='Walk'));
 const idleA=mixer.clipAction(r.clips.find(c=>c.name==='Idle'));
 walkA.play();let current=walkA;
 return {...def,...ROUTES[def.id],u:0,root:r.root,manual:false,
  // Player mode borrows a walker: manual=true stops the route, and
  // setMoving() crossfades between the Walk and Idle clips.
  setMoving(m){const next=m?walkA:idleA;if(next===current)return;next.reset().play();current.crossFadeTo(next,.3,true);current=next;},
  update(dt,elapsed,lite){
  mixer.update(dt);
  if(!lite){// distant walkers skip the decorative work
   if(r.rig.flame&&r.rig.fire){r.rig.flame.scale.set(1+.08*Math.sin(elapsed*19),1+.12*Math.sin(elapsed*13),1);r.rig.fire.intensity=2.5+.2*Math.sin(elapsed*17);}
   if(r.ward)r.ward.tick(elapsed,dt,'Walk');
  }
  if(!this.manual)walk(this,dt);
 }};
}

function pipWalker(def,route){
 const figure=buildMouse();
 const mixer=new T.AnimationMixer(figure.root);
 mixer.clipAction(figure.clips.find(c=>c.name==='Run')).play();
 return {...def,...(route||ROUTES[def.id]),u:0,root:figure.root,manual:false,setMoving(){},update(dt,elapsed,lite){
  mixer.update(dt);
  if(!lite)figure.tick(elapsed,'Run',0);
  if(!this.manual)walk(this,dt);
 }};
}

export function loadCast(scene){
 const walkers=[
  robotWalker(Nomad,   {id:'nomad',   name:'NOMAD',   accent:'#d8b669'}),
  robotWalker(Ward,    {id:'ward',    name:'WARD',    accent:'#7fb4dd'}),
  robotWalker(Quorum,  {id:'quorum',  name:'QUORUM',  accent:'#b28fd0'}),
  robotWalker(Lex,     {id:'lex',     name:'LEX',     accent:'#e0cb87'}),
  robotWalker(Catalyst,{id:'catalyst',name:'CATALYST',accent:'#e08d4f'}),
  robotWalker(Treasury,{id:'treasury',name:'TREASURY',accent:'#6fd2f2'}),
  robotWalker(Forge,   {id:'forge',   name:'FORGE',   accent:'#f0a848'}),
  pipWalker(           {id:'pip',     name:'PIP',     accent:'#e2705f'}),
  // The depot's delivery runners: more PIPs streaming blocks out of the
  // courier depot at (26,-20) and around the town.
  pipWalker({id:'pip',name:'PIP',accent:'#e2705f'},{cx:14,cz:-8, rx:16,rz:14,speed:.15,phase:2.1,dir:-1}),
  pipWalker({id:'pip',name:'PIP',accent:'#e2705f'},{cx:20,cz:6,  rx:12,rz:26,speed:.13,phase:4.4,dir:1}),
  pipWalker({id:'pip',name:'PIP',accent:'#e2705f'},{cx:27,cz:-17,rx:8, rz:8, speed:.18,phase:0,  dir:1}),
 ];
 // Real shadow casting across ~3000 character meshes doubles the frame cost,
 // so the cast opts out of the shadow pass and carries a soft blob instead.
 const blobGeo=new T.CircleGeometry(.55,24);
 const blobMat=new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false});
 for(const w of walkers){
  w.root.scale.setScalar(.8);
  w.root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
  const blob=new T.Mesh(blobGeo,blobMat);blob.rotation.x=-Math.PI/2;blob.position.y=.02;w.root.add(blob);
  w.update(0,0);scene.add(w.root);
 }
 return walkers;
}

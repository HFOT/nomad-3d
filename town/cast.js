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
const ROUTES={
 nomad:   {cx:0,  cz:0,   rx:18, rz:18, speed:.11, phase:0,   dir:1},
 ward:    {cx:0,  cz:40,  rx:15, rz:11, speed:.13, phase:2,   dir:-1},
 quorum:  {cx:-18,cz:-13, rx:15, rz:14, speed:.09, phase:1,   dir:1},
 lex:     {cx:-30,cz:11,  rx:13, rz:19, speed:.08, phase:4,   dir:1},
 catalyst:{cx:18, cz:18,  rx:14, rz:15, speed:.10, phase:3,   dir:-1},
 treasury:{cx:24, cz:-14, rx:11, rz:11, speed:.08, phase:5,   dir:1},
 forge:   {cx:-11,cz:-37, rx:19, rz:11, speed:.09, phase:2.5, dir:-1},
 pip:     {cx:0,  cz:0,   rx:40, rz:42, speed:.17, phase:.7,  dir:1},
};

function walk(w,dt){
 w.u+=dt*w.speed;
 const a=w.phase+w.u*w.dir;
 w.root.position.set(w.cx+Math.sin(a)*w.rx,0,w.cz+Math.cos(a)*w.rz);
 const dx=Math.cos(a)*w.rx*w.dir,dz=-Math.sin(a)*w.rz*w.dir;
 w.root.rotation.y=Math.atan2(dx,dz);
}

function robotWalker(mod,def){
 const M=mod.createMaterials(),r=mod.buildRobot(M);
 const mixer=new T.AnimationMixer(r.root);
 mixer.clipAction(r.clips.find(c=>c.name==='Walk')).play();
 return {...def,...ROUTES[def.id],u:0,root:r.root,update(dt,elapsed){
  mixer.update(dt);
  if(r.rig.flame&&r.rig.fire){r.rig.flame.scale.set(1+.08*Math.sin(elapsed*19),1+.12*Math.sin(elapsed*13),1);r.rig.fire.intensity=2.5+.2*Math.sin(elapsed*17);}
  if(r.ward)r.ward.tick(elapsed,dt,'Walk');
  walk(this,dt);
 }};
}

function pipWalker(def){
 const figure=buildMouse();
 const mixer=new T.AnimationMixer(figure.root);
 mixer.clipAction(figure.clips.find(c=>c.name==='Run')).play();
 return {...def,...ROUTES[def.id],u:0,root:figure.root,update(dt,elapsed){
  mixer.update(dt);
  figure.tick(elapsed,'Run',0);
  walk(this,dt);
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

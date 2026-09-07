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
 nomad:   {cx:0,  cz:0,   rx:6,  rz:6,  speed:.20, phase:0,   dir:1},
 ward:    {cx:0,  cz:14,  rx:5,  rz:4,  speed:.22, phase:2,   dir:-1},
 quorum:  {cx:-6, cz:-4,  rx:6,  rz:5,  speed:.16, phase:1,   dir:1},
 lex:     {cx:-10,cz:4,   rx:5,  rz:7,  speed:.14, phase:4,   dir:1},
 catalyst:{cx:6,  cz:6,   rx:5,  rz:6,  speed:.19, phase:3,   dir:-1},
 treasury:{cx:8,  cz:-5,  rx:4,  rz:4,  speed:.13, phase:5,   dir:1},
 forge:   {cx:-4, cz:-12, rx:7,  rz:4,  speed:.15, phase:2.5, dir:-1},
 pip:     {cx:0,  cz:2,   rx:12, rz:13, speed:.34, phase:.7,  dir:1},
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
 for(const w of walkers){w.update(0,0);scene.add(w.root);}
 return walkers;
}

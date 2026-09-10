import * as T from 'three';
import {kit,gearGeometry,batchStatic} from '../residences/model.js';

export function workshop(materials){
 const motions=[],parts=[],connections=[];let serial=0;
 const group=(name,parent)=>{const g=new T.Group();g.name=`${name}_${serial++}`;parent?.add(g);return g;};
 const moving=(g,fn)=>{g.userData.dynamic=true;motions.push({g,fn});return g;};
 function wheel(parent,x,y,z,n=32,module=.09,speed=.3,phase=0){
  const g=group('DriveGear',parent);g.position.set(x,y,z);const k=kit(g,materials),r=n*module/2;
  const source=gearGeometry(n,module),shape=source.parameters.shapes,hole=new T.Path();hole.absarc(0,0,r*.79,0,Math.PI*2,true);shape.holes=[hole];source.dispose();
  k.mesh(new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:24}),materials.brass);k.ring(0,0,.06,r*.81,materials.brass);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;k.rod([Math.cos(a)*.1,Math.sin(a)*.1,.06],[Math.cos(a)*r*.82,Math.sin(a)*r*.82,.06],Math.min(.055,r*.07),materials.brass);}
  k.rod([0,0,-.16],[0,0,.22],.14,materials.iron);k.ring(0,0,.23,.12,materials.brass);
  batchStatic(g);if(speed!==0)moving(g,t=>g.rotation.z=phase+speed*t);else g.rotation.z=phase;g.userData.teeth=n;g.userData.module=module;return g;
 }
 function tube(parent,points,r=.1,mat=materials.copper){const k=kit(parent,materials);for(let i=1;i<points.length;i++){k.rod(points[i-1],points[i],r,mat);if(i<points.length-1)k.mesh(new T.SphereGeometry(r,12,8),mat,...points[i]);}return points;}
 function pipe(parent,a,b,r=.22,energy=true){
  const k=kit(parent,materials),av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),len=v.length(),dir=v.clone().normalize();
  k.rod(a,b,r,energy?materials.glass:materials.copper);if(energy)k.rod(a,b,r*.27,materials.light);
  const u=new T.Vector3(Math.abs(dir.y)>.9?1:0,Math.abs(dir.y)>.9?0:1,0).cross(dir).normalize(),w=dir.clone().cross(u);
  for(const f of [0,.5,1])k.collar(av.clone().addScaledVector(v,f).toArray(),dir.toArray(),r);
  for(let i=0;i<4;i++){const off=u.clone().multiplyScalar(Math.cos(i*Math.PI/2)*r*1.02).addScaledVector(w,Math.sin(i*Math.PI/2)*r*1.02);k.rod(av.clone().add(off).toArray(),bv.clone().add(off).toArray(),.025,materials.brass);}
  if(energy){for(let i=0;i<3;i++){const pulse=group('FlameFlow',parent);k.mesh(new T.SphereGeometry(r*.2,8,6),materials.light,0,0,0,pulse);moving(pulse,t=>{pulse.position.copy(av).addScaledVector(v,(t/6+i/3)%1);pulse.position.addScaledVector(u,Math.cos(t*2+i)*r*.35).addScaledVector(w,Math.sin(t*2+i)*r*.35);});}}
  connections.push({from:a,to:b,radius:r});return len;
 }
 function valve(parent,x,y,z,r=.23){const k=kit(parent,materials);k.rod([x,y,z-.25],[x,y,z+.2],.06,materials.brass);k.ring(x,y,z+.22,r,materials.red);for(let i=0;i<4;i++){const a=i*Math.PI/2;k.rod([x,y,z+.22],[x+r*Math.cos(a),y+r*Math.sin(a),z+.22],.022,materials.red);}}
 function gauge(parent,x,y,z,r=.15){const k=kit(parent,materials);k.mesh(new T.CylinderGeometry(r,r,.055,24),materials.ivory,x,y,z).rotation.x=Math.PI/2;k.ring(x,y,z+.04,r,materials.brass);for(let i=0;i<9;i++){const a=.3+i*2.55/8;k.rod([x+Math.cos(a)*r*.73,y+Math.sin(a)*r*.73,z+.035],[x+Math.cos(a)*r*.9,y+Math.sin(a)*r*.9,z+.035],.007,materials.iron);}k.rod([x,y,z+.06],[x+r*.67*Math.cos(1.1),y+r*.67*Math.sin(1.1),z+.06],.009,materials.red);}
 function bearing(parent,x,y,z){const k=kit(parent,materials);k.box(materials.iron,x,y,z,.47,.47,.21);k.ring(x,y,z+.14,.18,materials.brass);for(const dx of [-.17,.17])for(const dy of [-.17,.17])k.mesh(new T.SphereGeometry(.032,6,4),materials.brass,x+dx,y+dy,z+.14);}
 function finishPart(g){batchStatic(g);parts.push(g);return g;}
 function tick(t){motions.forEach(m=>m.fn(t));}
 function clips(root){const tracks=[],times=Array.from({length:241},(_,i)=>i/10);for(const {g,fn} of motions){const qs=[],ps=[];for(const t of times){fn(t);qs.push(...g.quaternion.toArray());ps.push(...g.position.toArray());}tracks.push(new T.QuaternionKeyframeTrack(g.name+'.quaternion',times,qs),new T.VectorKeyframeTrack(g.name+'.position',times,ps));}tick(0);root.animations=[new T.AnimationClip('Clockwork_24s',24,tracks)];}
 return {group,moving,wheel,tube,pipe,valve,gauge,bearing,finishPart,tick,clips,parts,connections,motions};
}

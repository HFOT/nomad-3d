import * as T from 'three';
import {TIERS,PORT,kit,palette,gearGeometry,batchStatic} from './model.js';

// Four authored compositions share a stone kit, not four scaled boxes.
export function buildResidence(tier=0){
 if(!TIERS[tier])throw Error('Unknown residence tier');
 const spec=TIERS[tier],{w,d,h}=spec,root=new T.Group(),M=palette(),K=kit(root,M),gears=[],tracks=[],ports=[];
 root.name='CORN_Residence_'+spec.id;
 root.userData={author:'CORN',tier:spec.id,units:'metres',footprint:{width:w+1.6,depth:d+2.4},portStandard:PORT,designVersion:2};
 const stones=Array.from({length:6},(_,i)=>{const m=M.stone.clone();m.color.offsetHSL(0,(i%2)*.012,(i-2.5)*.009);return m;});
 const metal=M.iron,gold=new T.MeshStandardMaterial({color:0xb99453,metalness:.72,roughness:.3});
 const darkglass=new T.MeshStandardMaterial({color:0x141f26,roughness:.3,metalness:.22});
 function group(x,y,z,a=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=a;root.add(g);return g;}
 function aperture(path,x,b,w,h){const r=w/2,s=b+h-r;path.moveTo(x-r,b);path.lineTo(x+r,b);path.lineTo(x+r,s);path.absarc(x,s,r,0,Math.PI,false);path.lineTo(x-r,b);path.closePath();}
 // Walls have real arch-shaped apertures and thickness; the course relief is
 // clipped against the openings, so a window is never pasted onto solid stone.
 function facade(parent,width,height,openings){const k=kit(parent,M),shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(width/2,height);shape.lineTo(-width/2,height);shape.closePath();for(const o of openings){const hole=new T.Path();aperture(hole,o.x,o.b,o.w,o.h);shape.holes.push(hole);}k.mesh(new T.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:false,curveSegments:16}),M.joint,0,0,-.34);
  for(let row=0;row<Math.ceil(height/.38);row++){const y0=row*.38,y1=Math.min(height,y0+.38);let intervals=[[-width/2,width/2]];for(const o of openings){if(y1<=o.b||y0>=o.b+o.h)continue;const r=o.w/2,cy=o.b+o.h-r,yy=Math.max(o.b,y0);const hw=yy<=cy?r:Math.sqrt(Math.max(0,r*r-(yy-cy)**2));const l=o.x-hw-.025,rr=o.x+hw+.025;intervals=intervals.flatMap(([a,b])=>b<=l||a>=rr?[[a,b]]:[[a,Math.min(b,l)],[Math.max(a,rr),b]].filter(([a,b])=>b-a>.02));}
   for(const [a,b] of intervals){let x=a;while(x<b-.02){const boundary=(Math.floor((x+(row%2)*.34)/.7)+1)*.7-(row%2)*.34;const ww=Math.min(b-x,Math.max(.06,boundary-x));k.box(stones[(row+Math.floor((x+50)*5))%6],x+ww/2,(y0+y1)/2,.018,ww-.012,y1-y0-.012,.055);x+=ww;}}
  }
  for(const o of openings){const r=o.w/2,cy=o.b+o.h-r; k.arch(o.x,cy,-.04,r,.16,.25);for(const s of [-1,1])k.box(M.stone,o.x+s*(r+.085),o.b+(o.h-r)/2,.045,.17,o.h-r,.29);
   const glassShape=new T.Shape();aperture(glassShape,o.x,o.b+.025,o.w-.05,o.h-.05);k.mesh(new T.ShapeGeometry(glassShape),o.door?M.wood:M.light,0,0,-.16);
   for(const q of [-.3,0,.3]){const xx=o.x+q*o.w;k.rod([xx,o.b+.04,-.09],[xx,cy+Math.sqrt(r*r-(q*o.w)**2)-.035,-.09],.028,metal);}k.rod([o.x-r,o.b+(o.h-r)*.6,-.08],[o.x+r,o.b+(o.h-r)*.6,-.08],.027,metal);
   k.box(M.stone,o.x,o.b-.10,.05,o.w+.43,.16,.57);
   if(o.door){k.ring(o.x+.3,o.b+1,.01,.08,gold);for(const s of [-1,1])k.lantern(o.x+s*(r+.43),o.b+1.9,.28,.45);for(let j=0;j<3;j++)k.box(M.stone,o.x,.045+j*.08,.9-j*.22,o.w+.7-j*.1,.12,.45);}
  }
 }
 function fenestration(width,height,door=false){const result=[],n=Math.max(1,Math.floor(width/2.1));for(let row=0;row<Math.floor((height-.5)/2.8);row++)for(let i=0;i<n;i++){const x=(i-(n-1)/2)*(width/(n+.25));result.push({x,b:row*2.9+.65,w:Math.min(1.1,width*.29),h:row===0&&door&&Math.abs(x)<.1?2.4:1.85,door:row===0&&door&&Math.abs(x)<.1});}return result;}
 function rail(parent,width,depth,y){const k=kit(parent,M);for(const z of [-depth/2,depth/2])k.rail(0,z,width,y);for(const x of [-width/2,width/2]){for(let i=0;i<=Math.ceil(depth/.4);i++){const z=-depth/2+i*depth/Math.ceil(depth/.4);k.rod([x,y,z],[x,y+.75,z],.023,metal);}k.rod([x,y+.75,-depth/2],[x,y+.75,depth/2],.035,gold);}}
 function volume(x,z,width,depth,height,{front,balcony=false}={}){const base=group(x,.25,z),k=kit(base,M);
  for(const [xx,zz,angle,ww,open] of [[0,depth/2,0,width,front??fenestration(width,height,true)],[0,-depth/2,Math.PI,width,fenestration(width,height)],[width/2,0,Math.PI/2,depth,fenestration(depth,height)],[-width/2,0,-Math.PI/2,depth,fenestration(depth,height)]]){const wall=new T.Group();wall.position.set(xx,0,zz);wall.rotation.y=angle;base.add(wall);facade(wall,ww,height,open);}
  for(const yy of [.04,3,height])if(yy<=height)k.box(M.stone,0,yy,0,width,.12,depth);
  for(const yy of [.20,height-.2,height+.02]){k.box(M.stone,0,yy,0,width+.18,.13,depth+.18);}
  // Closed roof deck with inset slate field and parapet; no black void.
  k.box(metal,0,height+.13,0,width+.22,.12,depth+.22);k.box(M.stone,0,height+.21,0,width-.38,.10,depth-.38);
  if(balcony)rail(base,width-.12,depth-.12,height+.29);else for(const s of [-1,1]){k.box(M.stone,s*(width/2-.10),height+.4,0,.24,.35,depth+.14);k.box(M.stone,0,height+.4,s*(depth/2-.10),width,.35,.24);}
  for(const sx of [-1,1])for(const sz of [-1,1]){k.box(M.stone,sx*(width/2-.03),height/2,sz*(depth/2+.02),.26,height,.33);for(const yy of [.15,height-.3])k.box(M.stone,sx*(width/2-.03),yy,sz*(depth/2+.02),.46,.24,.48);}
  for(let i=0;i<Math.floor(width/.43);i++)for(const s of [-1,1])k.box(M.stone,-width/2+.22+i*.43,height-.11,s*depth/2,.16,.24,.27);
  return base;
 }
 function planter(x,y,z,width=.7){K.box(M.stone,x,y+.18,z,width,.36,.65);K.box(M.wood,x,y+.38,z,width-.1,.08,.55);for(let i=0;i<5;i++){const a=i*2.4,r=.10+i*.035;const leaf=K.mesh(new T.IcosahedronGeometry(.23,1),M.leaf,x+Math.cos(a)*r,y+.7+(i%2)*.19,z+Math.sin(a)*r);leaf.scale.set(1,1.45,1);}}
 function tower(x,z,height){K.masonry(x,.25,z,.74,height,.74);for(const yy of [.38,height-.13,height+.3])K.box(M.stone,x,yy,z,1,.22,1);K.lantern(x,height+.48,z,1.05);}
 K.box(M.joint,0,.06,0,w+1.25,.12,d+1.9);for(let x=-w/2-.4;x<w/2+.4;x+=.65)for(let z=-d/2-.6;z<d/2+.9;z+=.65)K.box(stones[(Math.floor((x+30)*10)+Math.floor((z+30)*10))%6],x,.15,z,.63,.15,.63);
 const frontZ=d/2-.25;
 if(tier===0){volume(-.18,-.4,w-.65,d-.85,3.55,{front:[{x:-.48,b:.35,w:1.3,h:2.65,door:true},{x:1,b:1.05,w:.55,h:1.55}]});tower(w/2-.43,frontZ,4.7);planter(-1.35,4.4,-1.1);planter(-1.3,.3,frontZ+.5);}
 if(tier===1){volume(-.55,-.7,w-1.3,d-1.4,5.9,{front:[{x:-.65,b:.35,w:1.4,h:2.6,door:true},{x:1.1,b:1,w:.85,h:1.65},{x:-.9,b:3.5,w:.95,h:1.95},{x:1,b:3.5,w:.95,h:1.95}],balcony:true});volume(.55,-1,2.6,2.8,7.3,{front:[{x:0,b:6.1,w:.75,h:1.05}]});tower(w/2-.5,frontZ,7.6);planter(-1.6,6.65,1.25,1.3);planter(-2.25,.3,frontZ+.5);}
 if(tier===2){volume(-.8,-1,5.8,5.2,7.9,{front:[{x:-.5,b:.35,w:1.4,h:2.65,door:true},{x:1.55,b:.9,w:.9,h:1.7},{x:-1.65,b:3.55,w:1,h:2.2},{x:.4,b:3.55,w:1.15,h:2.2},{x:0,b:6.3,w:.95,h:1.15}]});volume(-3,-.3,2.0,6.3,4.55,{balcony:true});volume(2.6,-.7,2.5,6.1,6.2,{balcony:true});tower(3.65,frontZ,8.9);for(const x of [-3.3,-2.7])planter(x,5.1,1.8);planter(2.7,6.8,1.6,1.1);}
 if(tier===3){volume(0,-.6,5.4,8.7,10.5,{front:[{x:0,b:.35,w:1.75,h:3.2,door:true},{x:0,b:4.1,w:2.0,h:4.9}]});for(const s of [-1,1]){volume(s*5,-2,4.45,5.7,7.45,{balcony:true});for(const yy of [.3,3.9]){for(let j=0;j<3;j++){const x=s*5-2.13+j*2.13;K.masonry(x,yy,3.55,.34,2.15,.46);K.box(M.stone,x,yy+2.12,3.55,.5,.16,.6);}for(let j=0;j<2;j++)K.arch(s*5-1.065+j*2.13,yy+2.22,3.30,.86,.22,.48);K.box(M.stone,s*5,yy+3.2,2.35,4.65,.22,3.15);const terrace=group(s*5,0,2.4);rail(terrace,4.25,2.45,yy+.08);}tower(s*7.1,3.6,s>0?11.0:9.6);for(const x of [s*4.1,s*5.6])planter(x,7.99,.3,1.1);}planter(-2.4,.3,4.8,1.3);planter(2.4,.3,4.8,1.3);}
 // Every building's mechanism occupies its service pier, with visible shafts.
 const px=w/2-.43,pz=frontZ+.54,py=[5.95,8.85,10.2,12.25][tier];
 const count=tier===3?3:1;for(let i=0;i<count;i++){const x=px-.7-i*.62;
  K.rod([x,.55,pz],[x,py,pz],PORT.radius,M.copper);for(let y=.8;y<py;y+=1.25){K.collar([x,y,pz],[0,1,0]);K.box(metal,x,y,pz-.28,.44,.10,.63);}
  const socket=new T.Object3D();socket.name='PORT_FLAME_'+i;socket.position.set(x,py,pz);socket.userData={...PORT,id:socket.name};root.add(socket);ports.push(socket);K.collar(socket.position.toArray(),[0,1,0]);
  K.box(metal,x,1.25,pz+.06,.57,.92,.48);K.box(M.light,x,1.25,pz+.31,.13,.60,.025);
 }
 const gx=px-.72,gy=Math.min(h-1,3.45),gz=pz+.42,module=.065,counts=[20,12];
 K.box(metal,gx-.46,gy,gz-.16,1.88,1.55,.22);
 for(let i=0;i<2;i++){const n=counts[i],x=gx-i*(32*module/2),g=group(x,gy,gz);g.name='GEAR_'+spec.id+'_'+i;g.userData.dynamic=true;const k=kit(g,M);k.mesh(gearGeometry(n,module),gold);for(let j=0;j<6;j++){const a=j*Math.PI/3;k.rod([0,0,.06],[Math.cos(a)*n*module*.39,Math.sin(a)*n*module*.39,.06],.037,M.copper);}k.ring(0,0,.13,n*module*.13,metal);K.rod([x,gy,gz-.4],[x,gy,gz+.2],.08,metal);const speed=i?-20/12:1,phase=i?Math.PI+Math.PI/n:0;gears.push({g,speed,phase});const times=[],values=[];for(let j=0;j<=120;j++){const a=phase+speed*j/120*Math.PI*6;times.push(j/5);values.push(0,0,Math.sin(a/2),Math.cos(a/2));}tracks.push(new T.QuaternionKeyframeTrack(g.name+'.quaternion',times,values));}
 for(const s of [-1,1])K.rod([gx-1.25,gy+s*.7,gz-.04],[gx+.48,gy+s*.7,gz-.04],.045,gold);
 K.ring(px-.7,1.25,pz+.38,.23,gold);for(let j=0;j<4;j++){const a=j*Math.PI/2;K.rod([px-.7,1.25,pz+.38],[px-.7+Math.cos(a)*.23,1.25+Math.sin(a)*.23,pz+.38],.028,gold);}
 root.animations=[new T.AnimationClip('Clockwork',24,tracks)];batchStatic(root);root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root);root.userData.maxHeight=bounds.max.y;root.userData.footprint={width:2*Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))+.1,depth:2*Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z))+.1};
 return {root,ports,spec,gears,maxHeight:bounds.max.y,tick(t){for(const {g,speed,phase} of gears)g.rotation.z=phase+speed*t*Math.PI/4;}};
}

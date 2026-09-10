import * as T from 'three';
import {kit,batchStatic} from '../residences/model.js';

export function buildMachines(parent,M,W){
 const machines=[];
 function cabinet(name,x){const g=W.group(name,parent);g.position.set(x,.62,1);g.userData={component:name,author:'CORN',units:'metres'};const k=kit(g,M);k.box(M.iron,0,.16,0,2.55,.32,2.3);k.box(M.brass,0,.34,0,2.6,.06,2.35);for(const a of [-1,1])for(const b of [-1,1]){k.box(M.iron,a*1.08,.49,b*.9,.2,.3,.2);k.ring(a*1.08,.5,b*.9+.11,.07,M.brass);}machines.push(g);return {g,k};}
 function column(k,x,z,h){k.rod([x,.4,z],[x,h,z],.07,M.iron);for(const y of [.58,1,h-.3,h]){k.mesh(new T.CylinderGeometry(.12,.12,.08,12),M.brass,x,y,z);}for(const y of [1.3,2.2,3.1])k.mesh(new T.CylinderGeometry(.048,.048,.034,6),M.brass,x,y,z+.075).rotation.x=Math.PI/2;}
 // A twin-rail helix with visible lift chain, catch basin and recirculation chute.
 {
  const {g,k}=cabinet('HelixBallMachine',-3.65);for(const x of [-1,1])for(const z of [-.85,.85])column(k,x,z,4.05);
  k.box(M.iron,0,.72,0,2.2,.43,1.95);k.box(M.brass,0,.96,0,2.23,.08,1.98);
  k.rod([0,1.05,0],[0,3.75,0],.09,M.brass);
  const spiral=(r,a)=>[Math.cos(a)*r,3.58-a/(Math.PI*6)*2.2,Math.sin(a)*r];
  for(const r of [.71,.9]){const pts=Array.from({length:193},(_,i)=>new T.Vector3(...spiral(r,i*Math.PI*6/192)));k.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),192,.022,6,false),M.brass);}
  for(let i=0;i<39;i++){const a=i*Math.PI*6/38;k.rod(spiral(.69,a),spiral(.92,a),.018,M.iron);if(i%3===0)k.rod([0,spiral(.8,a)[1]-.08,0],spiral(.8,a),.015,M.iron);}
  for(let i=0;i<5;i++){const ball=W.group('RollingBall',g);k.mesh(new T.SphereGeometry(.073,16,10),i%2?M.ivory:M.light,0,0,0,ball);W.moving(ball,t=>{const a=((t/12+i/5)%1)*Math.PI*6;ball.position.set(...spiral(.805,a));ball.position.y+=.062;});}
  for(const x of [-.23,.23])k.rod([x,1,-.91],[x,3.92,-.91],.028,M.iron);
  for(let j=0;j<28;j++)k.box(M.brass,0,1.05+j*.1,-.94,.12,.034,.04);
  for(const y of [1.15,3.77])W.wheel(g,0,y,-.99,16,.045,.55);
  for(let i=0;i<6;i++){const scoop=W.group('LiftBucket',g);k.box(M.brass,0,0,0,.2,.045,.17,scoop);W.moving(scoop,t=>scoop.position.set(0,1.08+((t/8+i/6)%1)*2.65,-.85));}
  W.tube(g,[[.85,1.37,0],[.95,1.15,-.55],[0,1.04,-.84]],.05,M.brass);
  k.box(M.iron,0,4.12,0,2.22,.42,1.9);for(let i=0;i<7;i++){k.box(M.ivory,-.72+i*.24,4.12,.961,.17,.2,.025);k.ring(-.72+i*.24,4.12,.98,.054,M.brass);}
  for(const x of [-.7,0,.7])W.gauge(g,x,3.9,.97,.085);
  k.box(M.iron,0,1.02,1.12,1.8,.12,.35);for(let i=0;i<5;i++)k.mesh(new T.SphereGeometry(.067,12,8),M.brass,-.6+i*.3,1.12,1.17);
  W.finishPart(g);
 }
 // Three independent drums on a common horizontal axle. Separate removable rear cover.
 {
  const {g,k}=cabinet('ThreeReelMachine',0);
  for(const x of [-1.03,1.03])for(const z of [-.72,.75])column(k,x,z,3.85);
  k.box(M.iron,0,.76,0,2.26,.7,1.75);for(const x of [-.83,.83]){k.box(M.brass,x,.77,.9,.08,.52,.07);W.gauge(g,x,.8,.95,.12);}
  k.box(M.brass,0,1.16,0,2.3,.07,1.8);
  const drumY=2.35,drumR=1.02;
  k.rod([-1.3,drumY,0],[1.3,drumY,0],.09,M.iron);
  for(let index=0;index<3;index++){
   const reel=W.group('SymbolReel',g);reel.position.set((index-1)*.66,drumY,0);
   k.mesh(new T.CylinderGeometry(drumR,drumR,.59,64,1,true),M.ivory,0,0,0,reel).rotation.z=Math.PI/2;
   for(const xx of [-.31,.31]){const ring=k.mesh(new T.TorusGeometry(drumR,.038,8,64),M.brass,xx,0,0,reel);ring.rotation.y=Math.PI/2;}
   for(let j=0;j<10;j++){
    const a=j*Math.PI/5,symbol=W.group('ReelSymbol',reel);symbol.position.set(0,Math.sin(a)*(drumR+.012),Math.cos(a)*(drumR+.012));symbol.rotation.x=-a;
    if(j%3===0){const shape=new T.Shape();for(let v=0;v<10;v++){const b=v*Math.PI/5+Math.PI/2,r=v%2?.105:.205;shape[v?'lineTo':'moveTo'](Math.cos(b)*r,Math.sin(b)*r);}shape.closePath();k.mesh(new T.ExtrudeGeometry(shape,{depth:.019,bevelEnabled:false}),M.brass,0,0,0,symbol);}
    else {k.ring(0,0,.009,.15,M.brass,symbol);if(j%3===1)k.ring(0,0,.012,.075,M.brass,symbol);else k.box(M.brass,0,0,.012,.14,.14,.018,symbol).rotation.z=Math.PI/4;}
    k.box(M.brass,0,.275,.0,.5,.014,.014,symbol);
   }
   batchStatic(reel);W.moving(reel,t=>reel.rotation.x=t*Math.PI*(index+1)/6);
  }
  for(const x of [-1.16,1.16]){
   const mount=W.group('ReelSideDrive',g);mount.position.set(x,drumY,0);mount.rotation.y=Math.PI/2;
   W.wheel(mount,0,0,0,32,.055,-Math.PI/6);W.bearing(mount,0,0,.23);
   for(let j=0;j<8;j++){const a=j*Math.PI/4;k.rod([x,drumY,0],[x,drumY+Math.sin(a)*1.07,Math.cos(a)*1.07],.022,M.brass);}
  }
  k.box(M.iron,0,3.52,0,2.45,.28,1.93);k.box(M.brass,0,3.68,0,2.52,.06,2);
  for(let i=0;i<9;i++)k.ring(-.96+i*.24,3.52,.99,.07,M.brass);
  k.box(M.iron,0,1.08,1.23,2.0,.17,.62);for(let i=0;i<3;i++)k.mesh(new T.CylinderGeometry(.09,.09,.055,16),i===1?M.red:M.brass,-.48+i*.48,1.2,1.32);
  k.box(M.wood,0,.68,1.0,.8,.15,.18);k.box(M.brass,0,.69,1.11,.7,.05,.04);
  const lever=W.group('ReelLever',g);lever.position.set(1.3,1.8,.3);k.rod([0,0,0],[0,.7,.3],.04,M.brass,lever);k.mesh(new T.SphereGeometry(.11,16,10),M.red,0,.7,.3,lever);W.moving(lever,t=>lever.rotation.x=.3*Math.sin(t*Math.PI/3));
  // Rear service bank: transfer gears, engaging forks, individual spring barrels.
  for(let i=0;i<3;i++){const x=(i-1)*.65;W.wheel(g,x,2.35,-1.07,18,.037,(i+1)*Math.PI/6);k.rod([x,1.35,-.8],[x,2.35,-.8],.034,M.brass);const spring=Array.from({length:145},(_,j)=>{const a=j/144*Math.PI*18;return new T.Vector3(x+Math.cos(a)*.085,1.4+j/144*.5,-.82+Math.sin(a)*.085);});k.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(spring),144,.012,5,false),M.brass);}
  W.finishPart(g);
 }
 // Glass cylindrical prize cabinet, rail trolley, winch drum and articulated claw.
 {
  const {g,k}=cabinet('PrizeCraneMachine',3.65);const r=1.02;
  for(const y of [.67,.85,3.65,3.93]){k.mesh(new T.CylinderGeometry(r+.07,r+.07,.16,40),M.iron,0,y,0);const ring=k.mesh(new T.TorusGeometry(r+.085,.035,6,48),M.brass,0,y+.07,0);ring.rotation.x=Math.PI/2;}
  k.mesh(new T.CylinderGeometry(r,r,2.75,48,1,true),M.glass,0,2.24,0);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;column(k,Math.sin(a)*r,Math.cos(a)*r,3.72);}
  for(let i=0;i<18;i++){const a=i*2.399,rp=.25+.55*(i%3)/2;const prize=k.mesh(i%2?new T.DodecahedronGeometry(.14):new T.BoxGeometry(.22,.22,.22),[M.brass,M.blue,M.ivory,M.red][i%4],Math.sin(a)*rp,.99+(i%4)*.11,Math.cos(a)*rp);prize.rotation.set(i*.3,i*.7,i*.1);}
  for(const z of [-.31,.31])k.rod([-.8,3.52,z],[.8,3.52,z],.036,M.iron);
  const trolley=W.group('CraneTrolley',g);k.box(M.brass,0,0,0,.5,.14,.74,trolley);for(const x of [-.2,.2])for(const z of [-.31,.31])k.ring(x,-.02,z,.08,M.iron,trolley);
  W.moving(trolley,t=>trolley.position.set(Math.sin(t*Math.PI/12)*.45,3.48,0));
  const winch=W.group('WinchDrum',trolley);winch.position.y=.12;k.mesh(new T.CylinderGeometry(.13,.13,.35,20),M.iron,0,0,0,winch).rotation.z=Math.PI/2;for(let i=0;i<9;i++){const ring=k.mesh(new T.TorusGeometry(.135,.012,5,20),M.brass,-.16+i*.04,0,0,winch);ring.rotation.y=Math.PI/2;}W.moving(winch,t=>winch.rotation.x=t*Math.PI/3);
  const claw=W.group('PrizeClaw',trolley);k.mesh(new T.SphereGeometry(.14,16,10),M.brass,0,0,0,claw);k.rod([0,0,0],[0,.18,0],.05,M.iron,claw);
  W.moving(claw,t=>claw.position.y=-.75-.55*(1-Math.cos(t*Math.PI/6)));
  const cable=W.group('CraneCable',trolley);k.rod([0,0,0],[0,-1,0],.012,M.iron,cable);W.moving(cable,t=>cable.scale.y=.75+.55*(1-Math.cos(t*Math.PI/6)));
  // Scale animation of cable is baked separately in model.js.
  for(let i=0;i<4;i++){const finger=W.group('ClawFinger',claw),a=i*Math.PI/2;finger.rotation.y=a;const hinge=W.group('ClawHinge',finger);hinge.position.x=.1;k.rod([0,0,0],[.17,-.23,0],.024,M.brass,hinge);k.rod([.17,-.23,0],[.09,-.43,0],.022,M.brass,hinge);k.rod([.09,-.43,0],[-.01,-.46,0],.02,M.brass,hinge);W.moving(hinge,t=>hinge.rotation.z=.28+.42*Math.sin(t*Math.PI/6));}
  k.box(M.iron,0,1.04,1.13,1.5,.14,.42);k.rod([-.3,1.1,1.13],[-.3,1.35,1.13],.024,M.brass);k.mesh(new T.SphereGeometry(.07,12,8),M.red,-.3,1.37,1.13);k.mesh(new T.CylinderGeometry(.08,.08,.04,16),M.brass,.3,1.14,1.2);k.box(M.wood,0,.51,1.15,.65,.22,.035);
  W.finishPart(g);
 }
 return machines;
}

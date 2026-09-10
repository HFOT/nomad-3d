import * as T from 'three';
import {palette,kit,batchStatic,PORT} from '../residences/model.js';
import {workshop} from './mechanics.js';
import {buildMachines} from './machines.js';

/** Metres, Y up, entrance +Z. Rear/service layout inferred from the concept. */
export function buildArcade(){
 const M=palette();M.brass=new T.MeshStandardMaterial({color:0xb28b4b,metalness:.78,roughness:.36});M.ivory=new T.MeshStandardMaterial({color:0xf1d69b,roughness:.52});M.glass=new T.MeshPhysicalMaterial({color:0xf6c46b,transparent:true,opacity:.13,roughness:.12,metalness:.05,depthWrite:false,side:T.DoubleSide});M.blue=new T.MeshStandardMaterial({color:0x172f46,roughness:.92,side:T.DoubleSide});M.red=new T.MeshStandardMaterial({color:0x702b21,roughness:.5,metalness:.35});
 M.brass.roughness=.52;
 const W=workshop(M),root=W.group('CORN_ClockworkArcade');root.userData={author:'CORN',units:'metres',building:'Clockwork Arcade',dimensions:[27,16.6,23],footprint:{width:27,depth:23},reference:'concept.png',rearLayout:'authored inference; not visible in the reference',network:PORT};
 const layers={};for(const id of ['foundation','front','sides','rear','roof','interior','drive','pipes','machines'])layers[id]=W.group(id,root);
 const K=id=>kit(layers[id],M);
 // Arch openings are actual holes, not dark paint on a solid wall.
 function wall(parent,width,height,depth,holes=[]){
  const k=kit(parent,M),shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(width/2,height);shape.lineTo(-width/2,height);shape.closePath();
  for(const h of holes){const p=new T.Path();p.moveTo(h.x-h.rx,h.bottom);p.lineTo(h.x-h.rx,h.spring);for(let i=0;i<=40;i++){const a=Math.PI-i*Math.PI/40;p.lineTo(h.x+Math.cos(a)*h.rx,h.spring+Math.sin(a)*h.ry);}p.lineTo(h.x+h.rx,h.bottom);p.closePath();shape.holes.push(p);}
  k.mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:32}),M.stone,0,0,-depth/2);
  // Course stones are clipped to the opening across their full row height.
  for(let y=.02;y<height;y+=.31){const hh=Math.min(.292,height-y);let intervals=[[-width/2,width/2]];
   for(const h of holes){if(y+hh<h.bottom||y>h.spring+h.ry)continue;const yy=Math.max(0,y-h.spring),half=yy<=0?h.rx:h.rx*Math.sqrt(Math.max(0,1-(yy/h.ry)**2));const cut=[h.x-half-.015,h.x+half+.015];intervals=intervals.flatMap(([a,b])=>cut[0]>=b||cut[1]<=a?[[a,b]]:[[a,Math.max(a,cut[0])],[Math.min(b,cut[1]),b]].filter(([c,d])=>d-c>.03));}
   for(const [a,b] of intervals)for(let x=a;x<b-.015;){const w=Math.min((Math.round(y/.31)%2&&x===a)?.32:.67,b-x);for(const side of [-1,1])k.box(M.stone,x+w/2,y+hh/2,side*(depth/2+.015),Math.max(.01,w-.014),hh,.045);x+=w;}
  }
 }
 function archBand(parent,x,spring,z,rx,ry,thick=.3,depth=.38){const k=kit(parent,M);for(let i=0;i<39;i++){const a=i*Math.PI/39+.004,b=(i+1)*Math.PI/39-.004,shape=new T.Shape();shape.moveTo(Math.cos(a)*rx,Math.sin(a)*ry);shape.lineTo(Math.cos(a)*(rx+thick),Math.sin(a)*(ry+thick));shape.lineTo(Math.cos(b)*(rx+thick),Math.sin(b)*(ry+thick));shape.lineTo(Math.cos(b)*rx,Math.sin(b)*ry);shape.closePath();k.mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),M.stone,x,spring,z-depth/2);}}
 function rail(parent,a,b,y){const k=kit(parent,M),v=new T.Vector3(...b).sub(new T.Vector3(...a)),n=Math.ceil(v.length()/.28);for(let j=0;j<=n;j++){const p=new T.Vector3(...a).addScaledVector(v,j/n);k.rod([p.x,y,p.z],[p.x,y+.88,p.z],.024,M.iron);if(j%3===0){const ring=k.ring(p.x,y+.55,p.z,.09,M.brass);if(Math.abs(v.z)>Math.abs(v.x))ring.rotation.y=Math.PI/2;}}for(const h of [.16,.91])k.rod([a[0],y+h,a[2]],[b[0],y+h,b[2]],.035,M.brass);}
 const floor=K('foundation');floor.box(M.joint,0,-.21,-1,27,.4,21);
 for(let x=-13;x<13;x+=.72)for(let z=-11;z<9;z+=.72)floor.box(M.stone,x,.005,z,.703,.045,.703);
 for(let i=0;i<3;i++)floor.box(M.stone,0,.12+i*.16,4.75-i*.45,18.9-i*.25,.23,1.45);
 floor.box(M.stone,0,.4,-2,18,.4,12.8);
 const front=layers.front;front.position.set(0,.6,4);
 wall(front,13.5,13.05,.64,[{x:0,bottom:.015,spring:2.35,rx:5.95,ry:3.3},{x:0,bottom:6.75,spring:6.92,rx:5.8,ry:5.0}]);
 archBand(front,0,2.35,.18,5.95,3.3,.34,.8);archBand(front,0,6.92,.18,5.8,5,.34,.8);
 const fk=kit(front,M);for(const y of [6.05,6.35,12.7,13.04])fk.box(M.stone,0,y,0,13.8,.16,.94);
 for(let i=0;i<3;i++)fk.box(M.stone,0,13.2+i*.16,0,5.2-i*.35,.18,.86);
 for(let x=-6.5;x<6.6;x+=.36)fk.box(M.stone,x,12.57,.37,.17,.18,.2);
 // Iron mullions in the upper arch, leaving real visibility into the machine hall.
 for(let x=-5.4;x<=5.4;x+=1.8){const top=6.92+5*Math.sqrt(1-(x/5.8)**2);fk.rod([x,6.76,.14],[x,top,.14],x===0?.10:.065,M.iron);for(let y=7;y<top;y+=1.1)fk.mesh(new T.SphereGeometry(.046,8,6),M.brass,x,y,.22);}
 for(const y of [7,9.15]){const half=5.8*Math.sqrt(1-((y-6.92)/5)**2);fk.rod([-half,y,.16],[half,y,.16],.068,M.iron);}
 for(let i=1;i<8;i++){const a=i*Math.PI/8;fk.rod([0,6.92,.12],[Math.cos(a)*5.76,6.92+Math.sin(a)*4.96,.12],.027,M.iron);}
 const glass=new T.Shape();glass.moveTo(-5.75,6.77);glass.lineTo(5.75,6.77);for(let i=0;i<=48;i++){const a=i*Math.PI/48;glass.lineTo(Math.cos(a)*5.75,6.92+Math.sin(a)*4.95);}glass.closePath();fk.mesh(new T.ShapeGeometry(glass),M.glass,0,0,.03);
 rail(front,[-5.65,0,.44],[5.65,0,.44],6.72);
 // Two flanking towers and octagonal beacons.
 for(const side of [-1,1]){
  const tower=W.group('LanternTower',layers.sides);tower.position.set(side*7.35,.6,3.05);const k=kit(tower,M);
  k.masonry(0,0,0,2.55,13.1,2.55);for(const y of [.2,5.95,12.8,13.15])k.box(M.stone,0,y,0,2.8,.22,2.8);
  k.window(0,9.7,1.32,.43,1.65);k.window(0,7.6,1.32,.37,1.28);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,r=1.05;k.rod([Math.cos(a)*r,13.25,Math.sin(a)*r],[Math.cos(a)*r,15,Math.sin(a)*r],.065,M.iron);k.rod([Math.cos(a)*r,14.8,Math.sin(a)*r],[Math.cos(b)*r,14.8,Math.sin(b)*r],.06,M.brass);}
  k.mesh(new T.CylinderGeometry(1.02,1.02,1.48,8),M.glass,0,14.05,0);k.mesh(new T.CylinderGeometry(.27,.37,1.2,12),M.light,0,14.02,0);
  for(const y of [13.3,14.95])k.mesh(new T.CylinderGeometry(1.23,1.23,.17,8),M.iron,0,y,0);
  k.mesh(new T.ConeGeometry(1.5,.68,8),M.iron,0,15.36,0);k.mesh(new T.SphereGeometry(.13,12,8),M.brass,0,15.76,0);
  // Cloth banners with geometric cog insignia.
  const banner=new T.Shape();banner.moveTo(-.55,0);banner.lineTo(.55,0);banner.lineTo(.55,-2.65);banner.lineTo(0,-3.03);banner.lineTo(-.55,-2.65);banner.closePath();k.mesh(new T.ShapeGeometry(banner),M.blue,0,5.3,1.35);
  k.rod([-.76,5.4,1.4],[.76,5.4,1.4],.034,M.iron);k.ring(0,3.9,1.38,.31,M.brass);k.ring(0,3.9,1.38,.2,M.brass);for(let i=0;i<12;i++){const a=i*Math.PI/6;const o=k.box(M.brass,Math.cos(a)*.35,3.9+Math.sin(a)*.35,1.39,.085,.085,.02);o.rotation.z=a;}
  k.lantern(0,1.72,1.65,.65);
 }
 // Side arcade walls: three large holes each, orientation inherited by the group.
 for(const side of [-1,1]){const g=W.group('SideArcade',layers.sides);g.position.set(side*8,.6,-2.4);g.rotation.y=side*Math.PI/2;
  wall(g,10.5,6.2,.55,[-3.5,0,3.5].map(x=>({x,bottom:.02,spring:2.6,rx:1.38,ry:1.8})));for(const x of [-3.5,0,3.5])archBand(g,x,2.6,.19,1.38,1.8,.23,.68);const k=kit(g,M);k.box(M.stone,0,6.2,0,10.8,.23,.85);
  rail(g,[-5.1,0,.15],[5.1,0,.15],6.35);
 }
 for(const side of [-1,1]){const upper=W.group('UpperSideWindows',layers.sides);upper.position.set(side*6.45,7,-2.1);upper.rotation.y=side*Math.PI/2;wall(upper,10.7,5.4,.4,[-3.4,0,3.4].map(x=>({x,bottom:.8,spring:2.8,rx:.94,ry:1.3})));const k=kit(upper,M);for(const x of [-3.4,0,3.4]){archBand(upper,x,2.8,.12,.94,1.3,.18,.5);for(const dx of [-.45,0,.45])k.rod([x+dx,.8,.08],[x+dx,2.8+1.3*Math.sqrt(1-(dx/.94)**2),.08],.025,M.iron);}k.box(M.stone,0,5.4,0,10.9,.2,.7);}
 layers.rear.position.set(0,.6,-7.6);wall(layers.rear,16,11.85,.55,[{x:0,bottom:.02,spring:2.4,rx:1.3,ry:1.3},...[-5,0,5].map(x=>({x,bottom:7.3,spring:8.7,rx:1,ry:1.2}))]);
 const rk=K('rear');for(const x of [-5,0,5])archBand(layers.rear,x,8.7,0,1,1.2,.22,.7);
 // Side roofs, main flat dark roof and visible load-bearing timber/iron rafters.
 const roof=K('roof');roof.box(M.iron,0,12.45,-1.85,13.2,.24,11.25);for(let z=-7;z<=3;z+=.7)roof.box(M.iron,0,12.6,z,13.3,.08,.045);
 for(const x of [-7.15,7.15])roof.box(M.iron,x,7.05,-2.5,1.75,.15,10);
 const inside=K('interior');for(let x=-7.5;x<8;x+=.75)for(let z=-7.2;z<3.8;z+=.75)inside.box((Math.round(x/.75)+Math.round(z/.75))%3===0?M.joint:M.stone,x,.616,z,.733,.027,.733);
 // Walkable rear mezzanine and side service galleries, main void intentionally open.
 inside.box(M.iron,0,6.74,-6.45,15.4,.2,2);for(const x of [-6.6,6.6])inside.box(M.iron,x,6.74,-1.9,1.45,.2,7.25);
 rail(layers.interior,[-7.5,0,-5.43],[7.5,0,-5.43],6.85);for(const x of [-5.86,5.86])rail(layers.interior,[x,0,-5.5],[x,0,1.7],6.85);
 for(const x of [-6.5,6.5])for(const z of [-5.7,-1.8,2]){inside.rod([x,.65,z],[x,6.8,z],.105,M.iron);for(const y of [.78,5.85,6.45])inside.mesh(new T.CylinderGeometry(.2,.2,.15,12),M.brass,x,y,z);inside.rod([x,5.7,z],[x,6.65,z+.6],.05,M.iron);}
 for(const z of [-6,-2.5,1.0]){inside.box(M.iron,0,6.52,z,13.5,.22,.22);for(let x=-6;x<6;x+=1.5){inside.rod([x,6.57,z],[x+.75,7.15,z],.037,M.brass);inside.rod([x+.75,7.15,z],[x+1.5,6.57,z],.037,M.brass);}}
 // Bolted gussets and grated floor access covers beneath the distribution header.
 for(const x of [-6.5,0,6.5])for(const z of [-6,-2.5,1]){inside.box(M.iron,x,6.49,z+.14,.42,.4,.035);for(const dx of [-.14,.14])for(const dy of [-.13,.13])inside.mesh(new T.SphereGeometry(.026,6,4),M.brass,x+dx,6.49+dy,z+.17);}
 for(const x of [-3,0,3]){inside.box(M.iron,x,.645,-3.7,1.8,.045,.65);for(let j=0;j<15;j++)inside.box(M.brass,x-.83+j*.119,.67,-3.7,.018,.018,.6);}
 // Two-flight staircase at rear-left. All 36 treads/risers and handrails modeled.
 for(let flight=0;flight<2;flight++){const x=-4.6+flight*1.3;for(let i=0;i<18;i++){const z=flight===0?-1.0-i*.24:-5.32+i*.24,y=.63+flight*3.11+(i+1)*3.11/18;inside.box(M.wood,x,y,z,1.13,.1,.26);inside.box(M.iron,x,y-.07,z-.1,1.15,.15,.035);}for(const s of [-1,1]){const z0=flight===0?-1:-5.32,z1=flight===0?-5.32:-1;inside.rod([x+s*.58,.65+flight*3.11,z0],[x+s*.58,3.76+flight*3.11,z1],.045,M.iron);inside.rod([x+s*.58,1.55+flight*3.11,z0],[x+s*.58,4.66+flight*3.11,z1],.027,M.brass);for(let i=0;i<10;i++){const z=z0+(z1-z0)*i/9,y=.65+flight*3.11+3.11*i/9;inside.rod([x+s*.58,y,z],[x+s*.58,y+.9,z],.02,M.iron);}}}
 inside.box(M.iron,-3.95,3.73,-5.48,2.5,.14,.7);inside.box(M.iron,-3.3,6.8,-.6,1.3,.18,.9);
 // Upper landing bridge links the stairs back to the left maintenance gallery.
 inside.box(M.iron,-4.8,6.76,-.6,3.1,.16,.85);rail(layers.interior,[-6.3,0,-.15],[-2.7,0,-.15],6.86);
 // Rear workshop: accessible benches, spare cogs, labelled-by-shape drawers, control manifold.
 for(const x of [-1.7,3.7]){inside.box(M.wood,x,1.55,-6.1,3.5,.15,.95);for(const dx of [-1.4,1.4])inside.box(M.iron,x+dx,.99,-6.1,.1,1.1,.7);for(let i=0;i<5;i++){inside.box(M.iron,x-1.3+i*.65,1.13,-5.72,.57,.54,.05);inside.rod([x-1.4+i*.65,1.2,-5.65],[x-1.2+i*.65,1.2,-5.65],.025,M.brass);}W.gauge(layers.interior,x,2.2,-7.25,.22);}
 for(let i=0;i<5;i++)W.valve(layers.interior,1+i*.62,3,-7.1,.17);
 // Individually modeled service tools and spare components (not painted textures).
 for(const x of [-2.8,-1.9,-1,2.6,3.5,4.4]){inside.rod([x,1.65,-6.05],[x+.3,1.65,-6.05],.026,M.iron);const wrench=inside.mesh(new T.TorusGeometry(.066,.017,6,16,Math.PI*1.55),M.brass,x+.34,1.65,-6.05);wrench.rotation.x=Math.PI/2;inside.box(M.iron,x,1.72,-6.4,.25,.12,.2);inside.rod([x,1.68,-6.5],[x,1.91,-6.5],.035,M.brass);}
 for(const x of [2,3.3,4.6]){inside.box(M.wood,x,4.13,-7.02,1.05,.1,.5);const g=W.group('SpareGear',layers.interior);g.position.set(x,4.45,-6.94);W.wheel(g,0,0,0,20,.032,0);}
 W.tube(layers.interior,[[.65,2.8,-7],[4,2.8,-7],[4,5.65,-7],[6,5.65,-7]],.09);
 for(const x of [-5.5,0,5.5])for(const z of [-5,0]){inside.rod([x,5.6,z],[x,4.9,z],.018,M.iron);inside.lantern(x,4.15,z,.55);}
 // Central flywheel with concentric flame rings and physically meshing satellite gears.
 const drive=layers.drive,d=kit(drive,M),masterY=9.9,masterZ=3.15;
 const master=W.wheel(drive,0,masterY,masterZ,80,.0625,Math.PI/12);master.name='MainFlywheel';
 const mk=kit(master,M);mk.ring(0,0,.2,2.08,M.light);mk.ring(0,0,.21,1.9,M.brass);for(let i=0;i<16;i++){const a=i*Math.PI/8;mk.rod([Math.cos(a)*1.75,Math.sin(a)*1.75,.16],[Math.cos(a)*2.25,Math.sin(a)*2.25,.16],.025,M.brass);}batchStatic(master);
 for(const a of [0,Math.PI,Math.PI*7/6,Math.PI*11/6]){const r=3.25,x=Math.cos(a)*r,y=masterY+Math.sin(a)*r;
  if(y>12.1||y<7)continue;const g=W.wheel(drive,x,y,masterZ,24,.0625,-80/24*Math.PI/12,a*(1+80/24)+Math.PI+Math.PI/24);W.bearing(drive,x,y,masterZ-.3);d.rod([x,y,2.72],[x,y,-5.8],.075,M.iron);}
 for(const a of [Math.PI*25/180,Math.PI*155/180]){const r=2.9375,x=Math.cos(a)*r,y=masterY+Math.sin(a)*r;W.wheel(drive,x,y,masterZ,14,.0625,-80/14*Math.PI/12,a*(1+80/14)+Math.PI+Math.PI/14);W.bearing(drive,x,y,masterZ-.3);d.rod([x,y,2.7],[x,9.9,2.7],.06,M.iron);}
 for(const x of [-3.8,3.8]){d.box(M.iron,x,9.35,2.65,.16,4.9,.2);d.box(M.brass,x,6.94,2.65,.5,.12,.5);d.rod([x,8.8,2.65],[x>0?2.7:-2.7,9.9,2.65],.045,M.iron);}
 for(const z of [2.65,-6.5])d.box(M.iron,0,9.64,z,8,.18,.2);
 d.rod([0,masterY,3.65],[0,masterY,-6.75],.17,M.iron);for(const z of [2.75,-2,-6.5]){W.bearing(drive,0,masterY,z);d.box(M.iron,0,masterY-.44,z,.15,.6,.2);}
 // Main line shaft above the games: gears, supports and descending power couplings.
 d.rod([-6.2,5.7,1],[6.2,5.7,1],.11,M.iron);
 for(const x of [-3.65,0,3.65]){
  const bracket=W.group('LineShaftBearing',drive);bracket.position.set(x,5.7,1);bracket.rotation.y=Math.PI/2;W.bearing(bracket,0,0,0);
  d.rod([x,5.75,1],[x,6.5,1],.05,M.iron);
  const powered=W.group('MachinePowerCoupling',drive);powered.position.set(x,5.28,1);powered.rotation.x=Math.PI/2;W.wheel(powered,0,0,0,28,.05,Math.PI/3);
  d.rod([x,4.55,1],[x,5.5,1],.09,M.brass);for(const y of [4.6,4.9,5.2])d.mesh(new T.CylinderGeometry(.22,.22,.08,24),M.iron,x,y,1);
 }
 // Rear flywheel/line-shaft transmission, guarded dual belt.
 for(const [y,r] of [[9.9,.9],[5.7,.9]]){const g=W.group('TransmissionPulley',drive);g.position.set(0,y,-6);const k=kit(g,M);for(const z of [-.06,.06])k.ring(0,0,z,r,M.brass);for(let i=0;i<8;i++){const a=i*Math.PI/4;k.rod([0,0,0],[Math.cos(a)*r,Math.sin(a)*r,0],.04,M.iron);}batchStatic(g);W.moving(g,t=>g.rotation.z=t*Math.PI/12);}
 for(const x of [-.9,.9])d.rod([x,5.7,-6],[x,9.9,-6],.035,M.wood);
 d.rod([0,5.7,-6],[0,5.7,1],.085,M.iron);
 // Pipe header has standardized upward ports, continuous branches, supports and pressure controls.
 const pipes=layers.pipes,p=kit(pipes,M),ports=[];
 for(const side of [-1,1]){
  W.pipe(pipes,[side*6.15,8.15,3.4],[side*11,8.15,3.4],.28);
  W.tube(pipes,[[side*6.15,8.15,3.4],[side*5.65,8.15,3.4],[side*5.65,5.7,3.4],[side*5.65,5.7,1]],.22);
  W.valve(pipes,side*5.65,7.6,3.63,.28);W.gauge(pipes,side*5.65,7.1,3.69,.18);
  W.pipe(pipes,[side*11,8.15,3.4],[side*11,9,3.4],.22);
  const port=W.group(side<0?'FlamePort_West':'FlamePort_East',root);port.position.set(side*11,9,3.4);port.userData={...PORT,direction:[0,1,0],role:'bidirectional',source:'arcade'};ports.push(port);
  p.masonry(side*10.65,.1,3.4,.75,7.55,.9);p.box(M.stone,side*10.65,7.7,3.4,1.25,.22,1.35);p.rod([side*10.65,7.8,3.4],[side*10.65,8.15,3.4],.08,M.iron);
 }
 // Two pressure equalizers with sight glass and bolted crowns on the right facade.
 for(const x of [5.05,5.8]){W.pipe(pipes,[x,8.35,4.52],[x,10.05,4.52],.24);W.tube(pipes,[[x,8.35,4.52],[x,8.15,4.52],[5.65,8.15,3.4]],.14);W.gauge(pipes,x,8.55,4.84,.13);p.box(M.iron,x,8.06,4.15,.18,.2,1);}
 W.tube(pipes,[[-5.65,5.7,1],[-5.65,6.15,1],[5.65,6.15,1],[5.65,5.7,1]],.14);
 for(const x of [-3.65,0,3.65]){W.tube(pipes,[[x,6.15,1],[x,6.15,-.15],[x,4.62,-.15]],.085);W.valve(pipes,x,5.35,-.01,.14);W.gauge(pipes,x+.23,5.36,.0,.11);}
 const machines=buildMachines(layers.machines,M,W);
 for(const id of Object.keys(layers))if(id!=='machines')batchStatic(layers[id]);
 W.clips(root);
 // Export changing cable length as well as the moving trolley and articulated fingers.
 const cable=W.motions.find(m=>m.g.name.startsWith('CraneCable'));if(cable){const times=[],values=[];for(let i=0;i<=240;i++){times.push(i/10);cable.fn(i/10);values.push(...cable.g.scale.toArray());}root.animations[0].tracks.push(new T.VectorKeyframeTrack(cable.g.name+'.scale',times,values));}
 W.tick(0);
 function setCutaway(value){layers.front.visible=!value;layers.roof.visible=!value;layers.sides.visible=!value;}
 return {root,layers,machines,ports,maxHeight:16.6,spec:{id:'arcade',name:'からくり遊技館',w:27,d:23,h:16.6},materials:M,tick:W.tick,setCutaway,motions:W.motions,connections:W.connections};
}

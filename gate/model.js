import * as T from 'three';import{RoundedBoxGeometry}from'three/addons/geometries/RoundedBoxGeometry.js';import{materials}from'./materials.js';
export function buildGate(sharedM){const root=new T.Group();root.name='SPOWatchGate';root.userData={author:'CORN',description:'Fictional Cardano SPO gatehouse; three simulated relay lights'};const M=sharedM||materials();let id=0;const lights=[],flames=[],doors=[];
function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name='GatePart'+id++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
function box(p,m,x,y,z,w,h,d){return mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.075),m,x,y,z);}
function rod(p,m,a,b,r=.025){const av=new T.Vector3(...a),v=new T.Vector3(...b).sub(av),o=mesh(p,new T.CylinderGeometry(r,r,v.length(),16),m);o.position.copy(av).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(p,x,y,z,r,t=.025){return mesh(p,new T.TorusGeometry(r,t,10,40),M.brass,x,y,z);}
function stone(p,x,y,z,w,h,d){const o=box(p,M.stone,x,y,z,w,h,d);o.material=M.stone.clone();o.material.color.offsetHSL(0,0,Math.sin(x*21+y*33+z*11)*.025);return o;}
function lantern(x,y,z,scale=1){const p=new T.Group();p.position.set(x,y,z);p.scale.setScalar(scale);root.add(p);mesh(p,new T.CylinderGeometry(.20,.22,.07,24),M.brass,0,-.31,0);mesh(p,new T.CylinderGeometry(.23,.2,.065,24),M.brass,0,.33,0);mesh(p,new T.ConeGeometry(.24,.18,24),M.brass,0,.45,0);mesh(p,new T.SphereGeometry(.035,12,8),M.brass,0,.57,0);mesh(p,new T.CylinderGeometry(.173,.173,.57,28,1,true),M.glass);for(let j=0;j<6;j++){const a=j*Math.PI/3;rod(p,M.brass,[Math.cos(a)*.18,-.3,Math.sin(a)*.18],[Math.cos(a)*.18,.33,Math.sin(a)*.18],.012);}const f=new T.Group();p.add(f);flames.push(f);
const outer=M.flame.clone();outer.transparent=true;outer.opacity=.55;outer.depthWrite=false;outer.emissiveIntensity=2.1;
const core=M.flame.clone();core.color.set(0xe6fbff);core.emissive.set(0xa5e9ff);core.emissiveIntensity=3.2;
for(let k=0;k<2;k++){const g=new T.SphereGeometry(1,24,32),o=mesh(f,g,k?core:outer);o.castShadow=false;o.userData.base=new Float32Array(g.attributes.position.array);o.userData.layer=k;}
mesh(p,new T.CylinderGeometry(.07,.08,.025,24),M.brass,0,-.20,0);rod(p,M.dark,[0,-.20,0],[0,-.165,0],.008);const l=new T.PointLight(0x53caff,2.8*scale,3.5*scale);p.add(l);lights.push(l);const handle=ring(p,0,.59,0,.09,.012);return p;}
// Plinth and individually laid cobbles.
stone(root,0,-.07,0,8.8,.38,4.8);for(let x=-4.2;x<4.3;x+=.35)for(let z=-2.2;z<2.3;z+=.34)stone(root,x,.145,z,.334,.075,.326);
// A solid extruded arch has no backplate across the passage.
const wallShape=new T.Shape();wallShape.moveTo(-2.2,.2);wallShape.lineTo(-1.3,.2);wallShape.lineTo(-1.3,1.95);wallShape.absarc(0,1.95,1.3,Math.PI,0,true);wallShape.lineTo(1.3,.2);wallShape.lineTo(2.2,.2);wallShape.lineTo(2.2,4.2);wallShape.lineTo(-2.2,4.2);wallShape.closePath();mesh(root,new T.ExtrudeGeometry(wallShape,{depth:1.15,bevelEnabled:false}),M.mortar,0,0,-.5);
for(const z of [-.54,.70])for(let row=0;row<16;row++){const y=.32+row*.245;for(let j=0;j<10;j++){const x=-2.13+j*.445+(row%2)*.12;if(x>2.12)continue;const inside=Math.abs(x)<1.5&&y<1.96+Math.sqrt(Math.max(0,1.5**2-x*x));if(inside)continue;stone(root,x,y,z,.425,.232,.14);}}
// Wedge voussoirs follow the arch on both faces, with a deep vault between them.
for(let j=0;j<25;j++){const a=j/25*Math.PI,b=(j+1)/25*Math.PI;const sh=new T.Shape();sh.moveTo(Math.cos(a)*1.3,1.95+Math.sin(a)*1.3);sh.absarc(0,1.95,1.3,a,b,false);sh.lineTo(Math.cos(b)*1.54,1.95+Math.sin(b)*1.54);sh.absarc(0,1.95,1.54,b,a,true);sh.closePath();mesh(root,new T.ExtrudeGeometry(sh,{depth:1.35,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:1}),M.stone,0,0,-.61);}
for(const side of [-1,1])for(let y=.36;y<1.95;y+=.24)stone(root,side*1.42,y,.07,.24,.23,1.38);
// Round west watchtower, solid mortar backing and radial ashlar courses.
const tx=-2.65;mesh(root,new T.CylinderGeometry(.86,.94,4.35,48),M.mortar,tx,2.37,0);
for(let row=0;row<18;row++)for(let j=0;j<22;j++){const a=(j+(row%2)*.5)/22*Math.PI*2,o=stone(root,tx+Math.cos(a)*.91,.32+row*.24,Math.sin(a)*.91,.275,.23,.15);o.rotation.y=-a+Math.PI/2;}
for(const y of [.34,3.75,4.55])mesh(root,new T.CylinderGeometry(1.03,1.03,.12,48),M.stone,tx,y,0);
mesh(root,new T.ConeGeometry(1.18,1.27,48),M.slate,tx,5.22,0);for(let row=0;row<8;row++){const r=1.17*(1-row/8),rr=ring(root,tx,4.61+row*.15,0,r,.012);rr.rotation.x=Math.PI/2;}rod(root,M.brass,[tx,5.75,0],[tx,6.04,0],.027);
// Square east tower with roofed observation balcony.
const sx=2.64;box(root,M.mortar,sx,2.30,0,1.65,4.2,1.7);
for(const face of [0,1,2,3])for(let row=0;row<17;row++)for(let j=0;j<4;j++){const a=-.65+j*.43,y=.32+row*.245;const f=new T.Group();f.position.set(sx,0,0);f.rotation.y=face*Math.PI/2;root.add(f);stone(f,a,y,.89,.415,.23,.16);}
stone(root,sx,4.43,0,1.96,.20,1.96);box(root,M.wood,sx,4.55,.55,2.08,.10,2.12);
for(const x of [sx-.86,sx+.86])for(const z of [-.65,1.5]){rod(root,M.brass,[x,4.57,z],[x,5.64,z],.035);rod(root,M.brass,[x,4.84,z],[x,5.0,z],.05);}
for(const z of [-.65,1.5]){rod(root,M.brass,[sx-.88,5.03,z],[sx+.88,5.03,z],.022);for(let j=0;j<9;j++)rod(root,M.brass,[sx-.8+j*.2,4.58,z],[sx-.8+j*.2,5.03,z],.012);}
const roofGeo=new T.ConeGeometry(1.62,1.1,4);const roof=mesh(root,roofGeo,M.slate,sx,6.1,.35);roof.rotation.y=Math.PI/4;rod(root,M.brass,[sx,6.55,.35],[sx,6.9,.35],.028);
// Windows recessed into stone surrounds; warm amber inspection rooms.
const amber=new T.MeshStandardMaterial({color:0xb67c3f,emissive:0xff9b34,emissiveIntensity:.22,roughness:.85});
const windowGlass=new T.MeshPhysicalMaterial({color:0xc2c8b7,transparent:true,opacity:.19,roughness:.12,metalness:.08,clearcoat:1,depthWrite:false});
for(const [x,y,z,w] of [[tx,2.9,.99,.30],[tx,3.95,.99,.26],[sx,3.45,.99,.54],[sx,1.3,.99,.32]]){
 box(root,M.dark,x,y,z+.025,w+.13,.72,.035);
 box(root,amber,x,y,z+.047,w,.60,.012);
 // Slender interior shelf and a shaded curtain interrupt the uniform glow.
 box(root,M.wood,x,y-.14,z+.067,w,.023,.018);
 for(const side of [-1,1]){
  stone(root,x+side*(w/2+.085),y,z+.075,.13,.80,.20);
  box(root,M.wood,x+side*(w/2+.014),y,z+.177,.035,.64,.042);
 }
 stone(root,x,y+.405,z+.07,w+.30,.13,.24);stone(root,x,y-.405,z+.13,w+.34,.12,.34);
 const pane=box(root,windowGlass,x,y,z+.198,w-.012,.60,.008);pane.castShadow=false;
 rod(root,M.brass,[x,y-.30,z+.217],[x,y+.30,z+.217],.009);
 rod(root,M.brass,[x-w/2,y+.06,z+.217],[x+w/2,y+.06,z+.217],.008);
 const l=new T.PointLight(0xffb866,.28,1);l.position.set(x,y,z+.26);root.add(l);
}
// Heavy matched doors swing on real hinge axes, maintaining their arch profiles.
for(const side of [-1,1]){const door=new T.Group();door.name=side<0?'WestDoor':'EastDoor';door.position.set(side*1.28,.22,.15);root.add(door);doors.push({door,side});for(let j=0;j<9;j++){const worldX=side*(1.21-j*.143),height=1.72+Math.sqrt(Math.max(0,1.25**2-worldX**2));const x=worldX-side*1.28;box(door,M.wood,x,height/2,0,.139,height,.14);for(const y of [.30,1.12])box(door,M.brass,x,y,.086,.145,.07,.025);}
for(const y of [.35,1.15,1.85]){rod(door,M.brass,[0,y,-.1],[0,y+.16,-.1],.045);for(let j=0;j<8;j++)mesh(door,new T.SphereGeometry(.018,8,6),M.brass,-side*(.12+j*.14),y,.11);}ring(door,-side*1.05,.95,.12,.08,.018);}
// Three independent relay lanterns; central shield medallion.
lantern(0,5.08,.1,1.6);lantern(-1.87,3.6,.92,.73);lantern(1.80,4.12,.92,.75);
mesh(root,new T.CylinderGeometry(.49,.49,.10,48),M.brass,0,3.93,.91).rotation.x=Math.PI/2;ring(root,0,3.93,1.00,.40,.025);for(let j=0;j<8;j++){const a=j*Math.PI/4;rod(root,M.brass,[0,3.93,1.015],[Math.cos(a)*.36,3.93+Math.sin(a)*.36,1.015],.019);}
for(const side of [-1,1]){rod(root,M.brass,[side*1.9,.5,.95],[side*1.9,2.65,.95],.033);rod(root,M.brass,[side*1.9,2.65,.95],[side*1.65,2.65,.95],.033);for(const y of [.6,1.5,2.45]){const r=ring(root,side*1.9,y,.95,.05,.012);r.rotation.x=Math.PI/2;}}
// Crest banners, benches, lamps and low planting around the towers.
const cloth=new T.MeshStandardMaterial({color:0x223858,roughness:.95,side:T.DoubleSide});for(const side of [-1,1]){rod(root,M.brass,[side*3.55,1.0,.2],[side*3.55,3.2,.2],.025);rod(root,M.brass,[side*3.55,3.15,.2],[side*4.08,3.15,.2],.018);box(root,cloth,side*3.83,2.56,.20,.45,1.12,.016);ring(root,side*3.83,2.65,.225,.12,.008);}
for(const side of [-1,1]){stone(root,side*2.7,.32,1.28,1.6,.27,.43);for(let j=0;j<35;j++){const o=mesh(root,new T.SphereGeometry(1,6,4),M.leaf,side*2.7+Math.sin(j*12)*.66,.5+(j%4)*.035,1.28+Math.cos(j*9)*.14);o.scale.set(.12,.04,.07);}}
// Lantern pedestals physically connect each beacon to the gatehouse.
stone(root,0,4.25,.1,.72,.18,.72);rod(root,M.brass,[0,4.30,.1],[0,4.57,.1],.12);
for(const [x,y] of [[-1.87,3.6],[1.80,4.12]]){rod(root,M.brass,[x,y-.6,.72],[x,y-.6,.92],.055);rod(root,M.brass,[x,y-.6,.92],[x,y-.24,.92],.045);}
// Slate shingles laid in overlapping courses on the round tower.
for(let row=0;row<10;row++){const radius=1.18*(1-row/10),count=Math.max(8,Math.floor(radius*42));for(let j=0;j<count;j++){const a=(j+(row%2)*.5)/count*Math.PI*2;const tile=box(root,M.slate,tx+Math.cos(a)*radius,4.61+row*.12,Math.sin(a)*radius,.18,.035,.20);tile.rotation.set(0,-a+Math.PI/2,0);tile.rotateX(.78);}}
// Pyramidal roof uses four individually shingled slopes.
for(let face=0;face<4;face++){const frame=new T.Group();frame.position.set(sx,0,.35);frame.rotation.y=face*Math.PI/2;root.add(frame);for(let row=0;row<9;row++){const r=1.14*(1-row/9),y=5.56+row*.122;for(let x=-r+.13;x<r-.06;x+=.17){const tile=box(frame,M.slate,x,y,r,.175,.027,.18);tile.rotation.x=.76;}}rod(frame,M.brass,[-1.16,5.55,1.16],[1.16,5.55,1.16],.024);}
// Parapet walk links the towers; crenels frame the central beacon.
stone(root,0,4.21,.05,4.45,.12,1.36);for(const z of [-.65,.72]){stone(root,0,4.35,z,4.5,.22,.16);for(let x=-2.05;x<2.1;x+=.48)stone(root,x,4.57,z,.28,.23,.23);}
// Rear access ladder, wall bench, door reinforcement and upper stair hatch.
for(const x of [sx-.25,sx+.25])rod(root,M.brass,[x,.25,-1.02],[x,4.6,-1.02],.025);for(let y=.35;y<4.6;y+=.25)rod(root,M.brass,[sx-.25,y,-1.02],[sx+.25,y,-1.02],.018);
box(root,M.wood,sx,4.62,-.35,.65,.05,.55);ring(root,sx,4.66,-.35,.06,.014).rotation.x=Math.PI/2;
for(const {door,side} of doors){for(const z of [-.09,.10])for(const y of [.55,1.55]){box(door,M.brass,-side*.64,y,z,1.2,.07,.025);for(let j=0;j<8;j++)mesh(door,new T.SphereGeometry(.019,8,6),M.brass,-side*(.12+j*.14),y,z+(z>0?.02:-.02));}}
for(const side of [-1,1]){box(root,M.wood,side*2.4,.65,-1.3,1.2,.09,.35);for(const dx of [-.45,.45])box(root,M.brass,side*2.4+dx,.43,-1.3,.06,.45,.26);}
// Fine masonry relief, matched to the courier depot's finished blocks.
root.traverse(o=>{if(!o.isMesh||o.material.roughness<.94||o.geometry.type!=='RoundedBoxGeometry')return;const p=o.geometry.attributes.position;const salt=o.position.x*19+o.position.y*31+o.position.z*13;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=Math.sin(x*37+y*23+z*29+salt)*.004;p.setXYZ(i,x+d,y+d*.6,z+d);}o.geometry.computeVertexNormals();});

// Enclosed upper watch room sits inside the balcony, with deep glazed arched bays.
const room=new T.Group();room.position.set(sx,0,0);root.add(room);
for(const side of [-1,1]){
 stone(room,side*.59,5.11,.33,.24,1.02,1.5);
 stone(room,0,5.57,.33,1.42,.16,1.5);
 stone(room,0,4.66,.33,1.42,.12,1.5);
}
stone(room,0,5.11,-.35,1.2,.94,.18);
const warmGlass=new T.MeshPhysicalMaterial({color:0xedba65,emissive:0xb16b20,emissiveIntensity:.4,roughness:.2,metalness:.05});
box(room,M.dark,0,5.07,1.01,.91,.78,.08);box(room,warmGlass,0,5.07,1.06,.79,.67,.018);
for(const x of [-.26,0,.26])rod(room,M.brass,[x,4.73,1.085],[x,5.40,1.085],.015);
rod(room,M.brass,[-.41,5.05,1.085],[.41,5.05,1.085],.014);
for(let j=0;j<13;j++){const a=j/12*Math.PI;const o=stone(room,Math.cos(a)*.49,5.13+Math.sin(a)*.49,1.09,.14,.16,.14);o.rotation.z=a-Math.PI/2;}
const roomLight=new T.PointLight(0xffbf68,2,2.8);roomLight.position.set(0,5.12,.95);room.add(roomLight);
// Deep stacked cornices and carved imposts frame the broad gateway.
for(const z of [-.69,.80]){
 for(const y of [3.57,3.69,4.06]){stone(root,-1.4,y,z,1.68,.10,.20);stone(root,1.4,y,z,1.68,.10,.20);}
 for(const side of [-1,1]){stone(root,side*1.57,1.94,z,.38,.13,.28);stone(root,side*1.63,.38,z,.42,.20,.30);}
 for(let j=0;j<29;j++){const a=j/28*Math.PI;const o=stone(root,Math.cos(a)*1.64,1.95+Math.sin(a)*1.64,z,.17,.10,.13);o.rotation.z=a-Math.PI/2;}
}
// Shield plate, concentric precision metal rings and restrained radial engraving.
ring(root,0,3.93,.96,.47,.014);ring(root,0,3.93,.975,.34,.01);
for(let j=0;j<16;j++){const a=j/16*Math.PI*2;mesh(root,new T.SphereGeometry(.017,8,6),M.brass,Math.cos(a)*.44,3.93+Math.sin(a)*.44,.986);}
const shield=new T.Shape();shield.moveTo(-.12,.18);shield.lineTo(.12,.18);shield.lineTo(.105,-.06);shield.quadraticCurveTo(.06,-.16,0,-.21);shield.quadraticCurveTo(-.06,-.16,-.105,-.06);shield.closePath();mesh(root,new T.ExtrudeGeometry(shield,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}),M.brass,0,3.93,1.00);
// Separate instrument circuits reach the lamps through elbows and junction boxes.
for(const side of [-1,1]){
 const pts=[[side*1.98,2.2,1.05],[side*1.98,2.92,1.05],[side*1.76,2.98,1.05],[side*1.72,3.2,1.05]];
 mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),28,.029,10,false),M.brass);
 box(root,M.brass,side*1.98,2.22,1.05,.16,.22,.08);box(root,M.dark,side*1.98,2.22,1.10,.11,.14,.025);
 for(const y of [2.33,2.7,2.9]){const r=ring(root,side*1.98,y,1.05,.04,.01);r.rotation.x=Math.PI/2;}
}
// Larger side beacons mounted on broad stone plinths, as on the concept gate.
for(let j=1;j<flames.length;j++){const p=flames[j].parent;p.scale.multiplyScalar(1.24);stone(root,p.position.x,p.position.y-.47,p.position.z,.46,.12,.42);}
// Hand-cut stone corbels beneath the balcony and upper tower cornice.
// A continuous bearing beam touches the deck underside (y=4.50).
box(root,M.wood,sx,4.45,1.42,2.06,.12,.23);
for(let j=0;j<6;j++){
 const x=sx-.82+j*.328;
 // Each stepped corbel starts inside the tower wall, then reaches the beam.
 stone(root,x,4.06,.93,.21,.20,.30);
 stone(root,x,4.21,1.055,.23,.14,.55);
 stone(root,x,4.335,1.18,.25,.15,.80);
}
// Side bearers also bridge the wall and the deck overhang.
for(const side of [-1,1])box(root,M.wood,sx+side*.88,4.455,.49,.16,.11,1.91);
for(const side of [-1,1])for(const y of [.6,1.35,2.1,2.85,3.6]){stone(root,sx+side*.84,y,.91,.25,.32,.18);}
// Arrow-slit detail and bronze hood on the round tower windows.
for(const y of [2.9,3.95]){stone(root,tx,y+.43,1.00,.48,.13,.23);stone(root,tx,y-.40,1.0,.45,.10,.23);}

// Rounded hip caps cover the shingle edges and remove exposed tile corners.
for(const a of [Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4])rod(root,M.brass,[sx,6.67,.35],[sx+Math.cos(a)*1.64,5.56,.35+Math.sin(a)*1.64],.035);
// A substantial base anchors the central beacon; decorative cage remains visible above the parapet.
stone(root,0,4.52,.1,.76,.20,.72);mesh(root,new T.CylinderGeometry(.25,.32,.18,32),M.brass,0,4.64,.1);
// Door planks have recessed seams; long strap ends taper into decorative bosses.
for(const {door,side} of doors){for(const y of [.55,1.55]){const boss=mesh(door,new T.SphereGeometry(1,16,10),M.brass,-side*1.15,y,.13);boss.scale.set(.075,.065,.02);}for(let j=0;j<9;j++){const x=-side*(.10+j*.14);for(const y of [.25,1.1,1.9])mesh(door,new T.SphereGeometry(.012,8,6),M.brass,x,y,.09);}}
// Layered circular tower base and footings add weight at street level.
for(const [y,r] of [[.25,1.08],[.40,1.02],[.55,.98]])mesh(root,new T.CylinderGeometry(r,r,.13,48),M.stone,tx,y,0);
for(const z of [-.90,.92]){stone(root,sx,.3,z,1.98,.20,.25);stone(root,sx,.5,z,1.84,.12,.22);}
// The watchroom's side window and rear access communicate its inhabitable depth.
box(root,M.brass,sx+.73,5.14,.30,.06,.55,.43);box(root,warmGlass,sx+.77,5.14,.30,.012,.45,.33);rod(root,M.brass,[sx+.79,4.92,.30],[sx+.79,5.36,.30],.014);
// Low-growing flowers provide small color accents instead of identical leaf clusters.
const flower=new T.MeshStandardMaterial({color:0x8a749d,roughness:.9});for(const side of [-1,1])for(let j=0;j<16;j++){const x=side*2.7+Math.sin(j*5)*.60,z=1.38+Math.cos(j*7)*.13,y=.63+Math.sin(j*3)*.05;rod(root,M.leaf,[x,.49,z],[x,y,z],.006);mesh(root,new T.SphereGeometry(.024,7,5),flower,x,y,z);}
return gateController(root,doors,lights,flames);
}
function gateController(root,doors,lights,flames){
let openness=.28,target=.28,health=3;
return{root,doors,lights,setOpen(v){target=v?1:0;},setHealth(v){health=v;},tick(t,dt=.016){openness=T.MathUtils.damp(openness,target,4,dt);doors.forEach(({door,side})=>door.rotation.y=side*openness*1.36);flames.forEach((f,i)=>{f.visible=i<health;f.children.forEach(o=>{const pos=o.geometry.attributes.position,base=o.userData.base,k=o.userData.layer;for(let j=0;j<pos.count;j++){const yy=(base[j*3+1]+1)/2;const taper=(1-yy)*(.75+yy);const height=k?.24:.40;pos.setXYZ(j,base[j*3]*taper*(k?.040:.070)+Math.sin(t*9+yy*6+i)*yy*yy*.022,-.17+yy*height*(1+.07*Math.sin(t*12+i)),base[j*3+2]*taper*(k?.026:.048)+Math.cos(t*7+yy*5+i)*yy*yy*.012);}pos.needsUpdate=true;o.geometry.computeVertexNormals();});lights[i].intensity=i<health?2.7+.3*Math.sin(t*17+i):0;});},get state(){return{openness,health};}};
}
export function cloneGate(source){
 const root=source.root.clone(true),original=[],copies=[];source.root.traverse(o=>original.push(o));root.traverse(o=>copies.push(o));const map=new Map(original.map((o,i)=>[o,copies[i]]));
 const materials=new Map();root.traverse(o=>{if(o.isMesh&&o.material.emissive?.getHex()){if(!materials.has(o.material))materials.set(o.material,o.material.clone());o.material=materials.get(o.material);}if(o.isMesh&&o.userData.base)o.geometry=o.geometry.clone();});
 const flames=[];root.traverse(o=>{if(o.children.some(c=>c.isMesh&&c.userData.base))flames.push(o);});
 return gateController(root,source.doors.map(({door,side})=>({door:map.get(door),side})),source.lights.map(l=>map.get(l)),flames);
}

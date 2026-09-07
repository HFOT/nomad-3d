import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export function buildDepot(){
const root=new T.Group(),exterior=new T.Group(),roof=new T.Group();root.name='CourierDepot';root.userData.author='CORN';root.add(exterior,roof);let n=0;
const stone=new T.MeshStandardMaterial({color:0x999080,roughness:.95}),wood=new T.MeshStandardMaterial({color:0x503626,roughness:.85}),brass=new T.MeshStandardMaterial({color:0xa58042,metalness:.78,roughness:.36}),slate=new T.MeshStandardMaterial({color:0x253441,metalness:.18,roughness:.72}),dark=new T.MeshStandardMaterial({color:0x182020,roughness:.6}),glow=new T.MeshStandardMaterial({color:0xffd176,emissive:0xffa029,emissiveIntensity:.7});
function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name='DepotPart'+n++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
const box=(p,m,x,y,z,w,h,d)=>mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.09),m,x,y,z);
function rod(p,m,a,b,r=.025){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),o=mesh(p,new T.CylinderGeometry(r,r,v.length(),12),m);o.position.set(...a).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(p,x,y,z,r){return mesh(p,new T.TorusGeometry(r,.035,8,32),brass,x,y,z);}
function lamp(p,x,y,z){box(p,brass,x,y-.16,z,.22,.045,.22);box(p,brass,x,y+.18,z,.25,.05,.25);mesh(p,new T.ConeGeometry(.18,.14,8),brass,x,y+.26,z);for(const a of [-1,1])for(const b of [-1,1])rod(p,brass,[x+a*.09,y-.16,z+b*.09],[x+a*.09,y+.18,z+b*.09],.012);const f=mesh(p,new T.SphereGeometry(1,12,12),glow,x,y,z);f.scale.set(.038,.13,.038);const l=new T.PointLight(0xffbc69,1.5,3);l.position.set(x,y,z);p.add(l);}
// Individually staggered masonry, with true openings rather than window decals.
const mortar=new T.MeshStandardMaterial({color:0x736b5d,roughness:1});
function wall(p,axis,fixed,min,max,ymax,openings=[]){
// Recessed continuous mortar grid follows the same real door and window openings.
for(let yy=.18;yy<ymax-.08;yy+=.04){let run=null;const step=.025,stop=max+.20;for(let xx=min-.22;xx<=stop+step;xx+=step){const filled=xx<=stop&&!openings.some(f=>f(xx,yy)||f(xx,yy+.04));if(filled&&run===null)run=xx;if(!filled&&run!==null){const len=xx-run,mid=run+len/2;mesh(p,new T.BoxGeometry(axis==='x'?.19:len,.043,axis==='x'?len:.19),mortar,axis==='x'?fixed:mid,yy+.02,axis==='x'?mid:fixed);run=null;}}}
for(let row=0;row<Math.ceil(ymax/.25);row++){const y=.3+row*.25;if(y>ymax-.10)continue;for(let a=min;a<max;a+=.47){const x=a+(row%2)*.235;if(x>max)continue;if(openings.some(f=>f(x,y)||f(x-.20,y)||f(x+.20,y)))continue;const o=box(p,stone,axis==='x'?fixed:x,y,axis==='x'?x:fixed,axis==='x'?.28:.445,.235,axis==='x'?.445:.28);o.material=stone.clone();o.material.color.offsetHSL(0,0,Math.sin(row*33+a*27)*.035);}}}
box(root,stone,0,.02,0,6.8,.35,5.4);for(let i=0;i<17;i++)for(let j=0;j<13;j++)box(root,stone,-3.2+i*.4,.215,-2.4+j*.4,.385,.06,.385);
const archHole=(cx,width,bottom,spring)=>(x,y)=>Math.abs(x-cx)<width/2&&y>bottom&&y<spring+Math.sqrt(Math.max(0,(width/2)**2-(x-cx)**2));
wall(exterior,'z',1.6,-2,2,4.25,[archHole(-1.25,.72,.25,1.55),archHole(.5,1.8,.7,1.4),archHole(-.95,.95,2.65,3.35),archHole(.75,.95,2.65,3.35)]);
wall(root,'z',-1.6,-2,2,4.25);wall(root,'x',-2,-1.4,1.4,4.25);wall(exterior,'x',2,-1.4,1.4,4.25,[archHole(.5,.95,.7,1.45)]);
function arch(cx,z,width,spring,p=exterior){for(let i=0;i<15;i++){const a=i/14*Math.PI;const o=box(p,stone,cx+Math.cos(a)*(width/2+.1),spring+Math.sin(a)*(width/2+.1),z,.24,.20,.36);o.rotation.z=a-Math.PI/2;}for(const side of [-1,1])box(p,stone,cx+side*(width/2+.1),spring-.40,z,.18,.8,.36);}
arch(-1.25,1.63,.72,1.55);arch(.5,1.63,1.8,1.4);arch(-.95,1.63,.95,3.35);arch(.75,1.63,.95,3.35);
for(const x of [-.95,.75]){box(exterior,wood,x,3.14,1.58,.035,1.12,.04);box(exterior,wood,x,3.1,1.58,.9,.035,.04);box(exterior,brass,x,2.61,1.77,1.1,.08,.4);}
// Deep timber door, planks and hardware fit the pedestrian opening.
for(let j=0;j<6;j++)box(exterior,wood,-1.55+j*.12,1.05,1.64,.112,1.47,.085);
for(const y of [.55,1.4])box(exterior,brass,-1.25,y,1.70,.68,.045,.04);ring(exterior,-1.06,1.0,1.73,.05);
// Subtle mineral grain, useful at close viewing distances.
const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');let seed=123;const img=ctx.createImageData(128,128);for(let i=0;i<img.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=145+(seed/4294967296)*80;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}ctx.putImageData(img,0,0);const tex=new T.CanvasTexture(cv);root.traverse(o=>{if(o.isMesh&&o.material.roughness>.9){o.material.bumpMap=tex;o.material.bumpScale=.028;o.material.map=tex;}});
// Split upper floor leaves a usable stairwell along the west wall.
box(root,wood,.35,2.35,.45,3.25,.16,2.15);box(root,wood,-.05,2.35,-1.08,2.45,.16,.9);box(root,wood,-1.55,2.35,-1.1,.65,.16,.85);
for(let z=-1.35;z<=1.4;z+=.45)box(root,wood,.35,2.20,z,3.3,.16,.12);
for(let i=0;i<14;i++){const z=1.30-i*.17,y=.35+i*.145;box(root,wood,-1.5,y,z,.65,.14,.20);rod(root,wood,[-1.84,y,z],[-1.84,y+.55,z],.02);}rod(root,brass,[-1.84,.9,1.3],[-1.84,2.78,-.91],.025);
box(root,wood,.45,.80,1.35,1.8,.12,.55);box(root,brass,.45,.53,1.58,1.8,.45,.045);
function shelf(x,y,z){for(let j=0;j<4;j++){box(root,wood,x,y+j*.3,z,1.5,.055,.36);for(let k=0;k<5;k++){const cube=box(root,glow,x-.60+k*.30,y+.13+j*.3,z,.16,.18,.16);cube.material=glow.clone();cube.material.emissiveIntensity=.4+(k+j)%3*.35;}}for(const a of [-.77,.77])box(root,brass,x+a,y+.45,z,.04,1.12,.38);}
shelf(.1,.45,-1.3);shelf(.1,2.55,-1.3);shelf(.55,2.55,.65);
// The long ridge runs along the facade, matching the approved concept.
const pitch=.86;
for(const x of [-2,-.9,.9,2]){rod(roof,wood,[x,4.2,-1.9],[x,5.87,0],.07);rod(roof,wood,[x,5.87,0],[x,4.2,1.9],.07);rod(roof,wood,[x,4.25,-1.85],[x,4.25,1.85],.06);}
for(const side of [-1,1]){
 for(let row=0;row<12;row++)for(let col=0;col<20;col++){
  const z=side*(.07+row*.163),x=-2.27+col*.237+(row%2)*.045;
  if(side===1&&Math.abs(x)<.47&&z>.64&&z<1.66)continue;
  const tile=box(roof,slate,x,5.91-Math.abs(z)*pitch,z,.248,.045,.24);tile.rotation.x=side*Math.atan(pitch);tile.material=slate.clone();tile.material.color.offsetHSL(0,0,Math.sin(row*31+col*17)*.012);
 }
 rod(roof,brass,[-2.42,4.19,side*1.98],[2.42,4.19,side*1.98],.055);
 for(const x of [-2.33,2.33])rod(roof,brass,[x,5.95,0],[x,4.2,side*2.0],.038);
}
rod(roof,brass,[-2.45,5.95,0],[2.45,5.95,0],.045);
for(const x of [-2.08,2.08]){const sh=new T.Shape();sh.moveTo(-1.72,4.22);sh.lineTo(0,5.76);sh.lineTo(1.72,4.22);sh.closePath();const g=mesh(roof,new T.ExtrudeGeometry(sh,{depth:.15,bevelEnabled:false}),stone,x,0,0);g.rotation.y=Math.PI/2;}
for(const x of [-2.15,2.15])rod(root,brass,[x,4.22,1.63],[x,.3,1.63],.048);
// Covered dispatch deck and working roller conveyor.
box(root,wood,2.65,.48,0,1.3,.15,3.5);for(const x of [2.15,3.2])for(const z of [-1.6,1.6]){rod(root,brass,[x,.25,z],[x,2.5,z],.035);rod(root,wood,[x,.28,z],[x-.4,.48,z-.3],.045);}box(exterior,slate,2.68,2.55,0,1.7,.10,3.8);
for(const z of [-1.5,1.5])rod(root,brass,[2.12,1.0,z],[3.24,1.0,z],.02);
box(root,dark,2.45,.95,.5,2.1,.10,.55);for(let i=0;i<20;i++)rod(root,brass,[1.48+i*.10,1.03,.24],[1.48+i*.10,1.03,.76],.035);
const parcels=[];for(let i=0;i<5;i++)parcels.push(box(root,glow,1.5+i*.35,1.18,.5,.22,.22,.22));
const gears=[];for(const [x,y,r] of [[2.08,1.65,.25],[2.48,1.65,.15]]){const g=new T.Group();g.position.set(x,y,.9);root.add(g);ring(g,0,0,0,r);for(let i=0;i<16;i++){const a=i/16*Math.PI*2,o=box(g,brass,Math.cos(a)*r,Math.sin(a)*r,0,.09,.06,.06);o.rotation.z=a; }for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(g,brass,[0,0,0],[Math.cos(a)*r,Math.sin(a)*r,0],.018);}gears.push(g);}
// Caged cargo lift in rear corner, guided on two rails.
for(const x of [1.25,1.8])rod(root,brass,[x,.4,-.95],[x,4.0,-.95],.03);const lift=new T.Group();root.add(lift);box(lift,brass,1.52,0,-.95,.7,.07,.65);box(lift,glow,1.52,.18,-.95,.24,.3,.24);for(const x of [1.2,1.84])rod(lift,brass,[x,0,-1.22],[x,.65,-1.22],.02);
const crane=new T.Group();crane.position.set(-1.55,5.55,-.15);roof.add(crane);rod(crane,brass,[0,0,0],[0,.8,0],.08);rod(crane,brass,[0,.7,0],[-1.5,.9,0],.05);rod(crane,brass,[0,.2,0],[-1.45,.88,0],.025);const rope=rod(crane,dark,[-1.5,.9,0],[-1.5,-.6,0],.013);const cargo=box(crane,wood,-1.5,-.65,0,.35,.35,.35);
for(const [x,y,z] of [[-.7,1.7,1.9],[.7,3.2,0],[2.8,1.7,-1],[-.1,1.5,-.4]])lamp(root,x,y,z);
for(let i=0;i<3;i++)box(root,stone,-1.25,.20+i*.10,1.95-i*.15,1,.13,.4);

// Surface maps contain multiple scales of grain and directional wood fibers.
function surface(kind){
 const size=512,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);
 function hash(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let f=0;for(let k=0;k<5;k++)f+=noise(x/(90/2**k),y/(90/2**k))/(2**k);
  const pore=hash(x,y),edge=Math.min(x,y,511-x,511-y)/512;
  let v=kind==='wood'?110+65*noise(x*.12+noise(x*.015,y*.015)*5,y*.008)+20*Math.sin(x*.48+noise(x*.03,y*.018)*10):120+f*62+pore*18;
  if(kind==='metal')v=100+f*55+(pore>.992?65:0);
  const grime=(1-Math.min(1,edge*18))*.17;v*=1-grime;
  const i=(y*size+x)*4;im.data[i]=v;im.data[i+1]=v*(kind==='metal'?.94:.97);im.data[i+2]=v*.90;im.data[i+3]=255;
 }ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.anisotropy=8;tex.colorSpace=T.SRGBColorSpace;return tex;
}
const rockMap=surface('stone'),grain=surface('wood'),patina=surface('metal');
const mats=new Set();root.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(mats.has(m))return;mats.add(m);if(m.roughness>.9){m.color.set(0xc5b79e);m.map=rockMap;m.bumpMap=rockMap;m.bumpScale=.065;}if(m===wood){m.color.set(0x75563a);m.map=grain;m.bumpMap=grain;m.bumpScale=.035;}if(m===slate){m.color.set(0x566475);m.map=rockMap;m.bumpMap=rockMap;m.bumpScale=.032;}if(m===brass){m.color.set(0xb28b4b);m.map=patina;m.roughnessMap=patina;m.roughness=.65;m.bumpMap=patina;m.bumpScale=.007;}});
// Continuous cornices, joint covers and riveted structural metalwork.
for(const y of [.38,2.38,4.19]){box(exterior,brass,0,y,1.81,4.28,.075,.10);box(exterior,brass,2.18,y,0,.10,.075,3.4);for(let x=-1.9;x<2;x+=.24)mesh(exterior,new T.SphereGeometry(.018,8,6),brass,x,y,1.87);}
for(const x of [-1.9,1.95])for(let y=.5;y<4.1;y+=.5)box(exterior,stone,x,y,1.71,.30,.28,.21);
// Overhanging pictogram sign and actual double-sided mounting bracket.
rod(exterior,brass,[-1.85,3,1.8],[-2.8,3,1.8],.035);rod(exterior,brass,[-1.85,3.4,1.8],[-2.6,3,1.8],.02);
box(exterior,brass,-2.5,2.53,1.81,.72,.77,.065);box(exterior,dark,-2.5,2.53,1.85,.65,.70,.045);
const emblem=box(exterior,brass,-2.5,2.53,1.89,.19,.19,.04);emblem.rotation.z=Math.PI/4;for(const side of [-1,1])for(let j=0;j<3;j++){const wing=box(exterior,brass,-2.5+side*(.15+j*.048),2.54+j*.055,1.9,.12,.022,.025);wing.rotation.z=-side*.55;}
// Small roof dormer, glazed window, and two live signal terminals.
box(roof,wood,.0,5.04,1.27,.78,.68,.75);box(roof,dark,0,5.05,1.67,.59,.49,.04);box(roof,glow,0,5.06,1.70,.45,.40,.018);box(roof,wood,0,5.06,1.73,.035,.46,.035);box(roof,wood,0,5.05,1.73,.52,.035,.035);
for(const side of [-1,1]){const o=box(roof,slate,side*.24,5.45,1.28,.60,.07,.85);o.rotation.z=-side*.5;rod(roof,brass,[side*.38,5.4,-.65],[side*.38,6.12,-.65],.036);for(const y of [5.5,5.6,5.7]){const r=ring(roof,side*.38,y,-.65,.067);r.rotation.x=Math.PI/2;}mesh(roof,new T.SphereGeometry(.085,20,12),brass,side*.38,6.15,-.65);}
const electric=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:21},(_,i)=>new T.Vector3(-.38+i*.038,6.15+Math.sin(i*4)*.04,-.65))),new T.LineBasicMaterial({color:0x8feaff,toneMapped:false}));roof.add(electric);
// Wooden dispatch planks, braced supports and detailed docking fingers.
for(let z=-1.65;z<1.7;z+=.12)box(root,wood,2.66,.575,z,1.25,.025,.105);
for(const z of [-1.1,0,1.1]){box(root,wood,3.5,.5,z,.55,.10,.65);rod(root,brass,[3.15,.18,z],[3.7,.48,z],.028);for(const zz of [-.26,.26])rod(root,brass,[3.2,.6,z+zz],[3.7,.6,z+zz],.018);}
// Weathered planters and compact foliage soften the masonry.
const leaf=new T.MeshStandardMaterial({color:0x425b36,roughness:1});for(const [x,z] of [[-2.3,1.9],[1.8,2.1]]){mesh(root,new T.CylinderGeometry(.17,.12,.24,16),wood,x,.38,z);for(let j=0;j<22;j++){const a=j*2.4,o=mesh(root,new T.SphereGeometry(1,6,4),leaf,x+Math.sin(a)*.14,.55+(j%5)*.025,z+Math.cos(a)*.14);o.scale.set(.10,.025,.045);o.rotation.z=a;}}

// Glazing sits within the arch and catches the warm interior lighting.
const glass=new T.MeshPhysicalMaterial({color:0xd4b780,transparent:true,opacity:.17,roughness:.18,metalness:.05,depthWrite:false});
for(const x of [-.95,.75]){const shape=new T.Shape();shape.moveTo(-.43,0);shape.lineTo(.43,0);shape.lineTo(.43,.66);shape.absarc(0,.66,.43,0,Math.PI,false);shape.closePath();const pane=mesh(exterior,new T.ShapeGeometry(shape,24),glass,x,2.65,1.67);pane.castShadow=false;for(const xx of [-.22,.22])box(exterior,brass,x+xx,3.06,1.70,.018,.80,.025);lamp(root,x,3.2,.9);const warm=new T.PointLight(0xffa34b,2.2,2.4);warm.position.set(x,3.3,1.2);root.add(warm);}
roof.traverse(o=>{if(o.isMesh&&o.material.metalness===.18){o.material.map=rockMap;o.material.bumpMap=rockMap;o.material.bumpScale=.023;}});
for(let i=0;i<10;i++){const z=-1.6+i*.35;rod(exterior,brass,[2.1,2.47,z],[3.46,2.47,z],.015);}

// Deep foundation descending into the canal, masonry embankment and bridge.
const waterfront=new T.Group();root.add(waterfront);
for(let row=0;row<4;row++)for(let col=0;col<18;col++)box(waterfront,stone,-3.3+col*.39,-.18-row*.22,2.62,.375,.21,.25);
for(let j=0;j<16;j++){const z=-1.8+j*.36,y=.22+.65*Math.sin(j/15*Math.PI);box(waterfront,stone,-4.15,y,z,1.30,.14,.35);for(const side of [-1,1]){box(waterfront,stone,-4.15+side*.67,y+.20,z,.16,.4,.35);if(j%3===0)box(waterfront,brass,-4.15+side*.67,y+.44,z,.20,.055,.23);}}
// Stone arch barrel, visible under the walkway.
for(let j=0;j<23;j++){const a=j/22*Math.PI,o=box(waterfront,stone,-4.15,-.68+Math.sin(a)*.78,.85+Math.cos(a)*2.55,1.25,.23,.38);o.rotation.x=-Math.cos(a)*.27;}
for(const x of [-4.8,-3.5]){rod(waterfront,brass,[x,.55,3.2],[x,1.8,3.2],.03);lamp(waterfront,x,1.92,3.2);}
// Sorting-room furniture and counter detail fill the actual interior.
shelf(.35,.48,.10);
for(let i=0;i<5;i++){box(root,wood,-.22+i*.31,.51,1.65,.28,.30,.04);box(root,brass,-.22+i*.31,.52,1.68,.09,.025,.026);}
for(const x of [-.35,1.3])rod(root,brass,[x,.35,1.1],[x,.75,1.1],.033);
for(let i=0;i<7;i++)box(root,brass,.65,.91+i*.025,1.35,.25,.012,.19);
// Curved canopy supports are continuous structural brackets.
for(const z of [-1.55,1.55]){const curve=new T.CatmullRomCurve3([new T.Vector3(2.1,2.5,z),new T.Vector3(2.65,2.44,z),new T.Vector3(3.1,2.1,z),new T.Vector3(3.2,1.72,z)]);mesh(exterior,new T.TubeGeometry(curve,28,.035,10,false),brass);}
const rivetGeo=new T.SphereGeometry(.015,8,6);for(const z of [-1.65,1.65])for(let i=0;i<9;i++)mesh(exterior,rivetGeo,brass,2.05+i*.16,2.57,z);
// Moss grows primarily in damp joints around the waterline.
const moss=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),leaf,360);waterfront.add(moss);for(let i=0;i<360;i++){const x=-3.3+(i*1.618%1)*6.6,z=2.69+Math.sin(i*9)*.04;const matrix=new T.Matrix4();matrix.compose(new T.Vector3(x,-.2+(i%4)*.11,z),new T.Quaternion(),new T.Vector3(.045+Math.abs(Math.sin(i))*.05,.018,.025));moss.setMatrixAt(i,matrix);}

// Brass-edged front panels, visible hinges, and glazing muntins.
for(const x of [-.95,.75]){for(const y of [2.75,3.0,3.25])box(exterior,wood,x,y,1.73,.87,.018,.024);}
for(let j=0;j<6;j++){box(root,brass,.45,.48+j*.055,1.625,1.55,.008,.014);}
for(const x of [-2.03,2.03])for(let y=.65;y<4.0;y+=.55){box(exterior,brass,x,y,1.72,.045,.18,.035);mesh(exterior,new T.SphereGeometry(.021,8,6),brass,x,y,1.75);}
for(const x of [2.15,3.2])for(const z of [-1.6,1.6]){for(const y of [.58,1.02,2.4]){const ringPart=ring(exterior,x,y,z,.055);ringPart.rotation.x=Math.PI/2;}mesh(exterior,new T.SphereGeometry(.057,12,8),brass,x,2.53,z);}

// Individual stone blocks have chipped edges and broad, low-amplitude surface relief.
root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.material.roughness<.94||o.geometry.type!=='RoundedBoxGeometry')return;
 const geo=o.geometry,pos=geo.attributes.position;const bounds=new T.Box3().setFromBufferAttribute(pos),size=bounds.getSize(new T.Vector3());
 const salt=o.position.x*19+o.position.y*31+o.position.z*13;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const f=Math.sin(x*37+y*23+z*29+salt)*Math.sin(x*13-z*17+salt);const amount=Math.min(.013,Math.min(size.x,size.y,size.z)*.035);pos.setXYZ(i,x+f*amount,y+Math.sin(x*31+z*21+salt)*amount,z+f*amount);}
 geo.computeVertexNormals();
});
// Arched brass tracery remains part of the facade, not painted onto the glass.
for(const x of [-.95,.75]){
 const arc=new T.EllipseCurve(0,0,.36,.36,0,Math.PI,false,0);const pts=arc.getPoints(36).map(v=>new T.Vector3(x+v.x,3.35+v.y,1.76));mesh(exterior,new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,.014,8,false),brass);
 for(const a of [Math.PI/4,Math.PI/2,Math.PI*3/4])rod(exterior,brass,[x,3.35,1.76],[x+Math.cos(a)*.36,3.35+Math.sin(a)*.36,1.76],.012);
 for(const side of [-1,1]){box(exterior,wood,x+side*.57,3.14,1.74,.14,.91,.075);for(let j=0;j<10;j++){const slat=box(exterior,wood,x+side*.57,2.75+j*.078,1.79,.13,.025,.055);slat.rotation.x=.25;}}
}
// Bolted corner plates and real pulleys make the hoist read as a machine.
for(const x of [0,-1.5]){const pulley=ring(crane,x,.9,0,.11);box(crane,brass,x,.9,-.06,.05,.24,.025);rod(crane,brass,[x,.9,-.08],[x,.9,.08],.025);}
for(let j=0;j<16;j++){const link=mesh(crane,new T.TorusGeometry(.028,.006,6,12),brass,-1.5,.83-j*.075,0);link.rotation.y=(j%2)*Math.PI/2;}
for(const side of [-1,1]){box(crane,brass,-1.5+side*.16,-.65,0,.018,.36,.36);box(crane,brass,-1.5,-.65,side*.16,.36,.36,.018);}
// Payloads use a glass shell and a recessed luminous core.
const amberGlass=new T.MeshPhysicalMaterial({color:0xd5a044,roughness:.16,metalness:.08,transparent:true,opacity:.42,depthWrite:false,clearcoat:1});
for(const p of parcels){p.material=amberGlass;box(p,glow,0,0,0,.12,.12,.12);for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){const pos=[0,0,0],dim=[.008,.008,.008];pos[(axis+1)%3]=a*.11;pos[(axis+2)%3]=b*.11;dim[axis]=.22;box(p,brass,...pos,...dim);}}
// Aged copper flashing seals the dormer junction with the slate plane.
for(const side of [-1,1]){const strip=box(roof,brass,side*.45,4.83,1.33,.055,.025,.84);strip.rotation.x=.30;}
// Recessed maintenance panels, hinges, pipe unions on the side wall.
box(exterior,wood,2.17,3.1,-.6,.08,.65,.45);for(const z of [-.81,-.39])box(exterior,brass,2.23,3.1,z,.025,.63,.025);
for(const y of [.7,1.5,2.3,3.1,3.9])for(const x of [-2.15,2.15]){const union=ring(exterior,x,y,1.63,.065);union.rotation.x=Math.PI/2;}

// Solid dormer cheeks and overlapping flashing close the roof cutout on all sides.
for(const side of [-1,1]){
 box(roof,wood,side*.415,5.0,1.26,.09,.67,.88);
 const flashing=box(roof,brass,side*.49,4.91,1.15,.20,.026,.96);flashing.rotation.x=Math.atan(.86);
}
box(roof,wood,0,5.23,.79,.85,.48,.12);
const apron=box(roof,brass,0,4.57,1.57,1.02,.035,.36);apron.rotation.x=Math.atan(.86);
// Back pan tucks under the upslope tiles and behind the dormer roof.
const backPan=box(roof,slate,0,5.39,.64,1.03,.045,.40);backPan.rotation.x=Math.atan(.86);
return {root,exterior,roof,tick(t){electric.geometry.attributes.position.array.forEach((v,i,a)=>{if(i%3===1)a[i]=6.15+Math.sin(i*4+Math.floor(t*15))*.045;});electric.geometry.attributes.position.needsUpdate=true;parcels.forEach((p,i)=>p.position.x=1.5+(t*.35+i*.38)%1.9);gears.forEach((g,i)=>g.rotation.z=t*(i?-1.667:1));lift.position.y=.5+(Math.sin(t*.6)*.5+.5)*1.9;crane.rotation.y=Math.sin(t*.25)*.2;cargo.position.y=-.65+Math.sin(t*.8)*.15;rope.scale.y=(.9-cargo.position.y-.175)/1.5;rope.position.y=(.9+cargo.position.y+.175)/2;},cut(v){exterior.visible=!v;roof.visible=!v;}};
}

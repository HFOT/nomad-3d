import * as T from 'three';import{RoundedBoxGeometry}from'three/addons/geometries/RoundedBoxGeometry.js';import{materials}from'./materials.js';
export function buildAssembly(){const root=new T.Group(),roof=new T.Group();root.add(roof);root.name='DRepAssembly';root.userData.author='CORN';const M=materials(),purple=new T.MeshStandardMaterial({color:0x463357,roughness:.9,side:T.DoubleSide}),fire=new T.MeshStandardMaterial({color:0xe9caff,emissive:0x9e52e8,emissiveIntensity:2.5});let serial=0;const flames=[];
function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name='AssemblyPart'+serial++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
const box=(p,m,x,y,z,w,h,d)=>mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.08),m,x,y,z);
function rod(p,m,a,b,r=.025){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),o=mesh(p,new T.CylinderGeometry(r,r,v.length(),16),m);o.position.set(...a).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(p,x,y,z,r,t=.025){return mesh(p,new T.TorusGeometry(r,t,10,48),M.brass,x,y,z);}
function lamp(x,y,z,s=1,p=root){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);p.add(g);for(const yy of [-.22,.23])mesh(g,new T.CylinderGeometry(.15,.17,.05,24),M.brass,0,yy,0);mesh(g,new T.ConeGeometry(.19,.14,24),M.brass,0,.32,0);mesh(g,new T.CylinderGeometry(.13,.13,.42,24,1,true),M.glass);for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(g,M.brass,[Math.cos(a)*.14,-.2,Math.sin(a)*.14],[Math.cos(a)*.14,.23,Math.sin(a)*.14],.012);}const f=mesh(g,new T.SphereGeometry(1,20,16),fire);f.scale.set(.035,.15,.035);flames.push(f);const l=new T.PointLight(0xc88dff,1.5*s,3*s);g.add(l);return g;}
box(root,M.stone,0,0,0,9,.32,7.4);for(let x=-4.3;x<4.4;x+=.39)for(let z=-3.45;z<3.5;z+=.39)box(root,M.stone,x,.19,z,.375,.065,.375);
// Tiered semi-circular chamber faces the public square (+Z).
for(let row=0;row<5;row++){const r=1.35+row*.43,y=.3+row*.25;const stepShape=new T.Shape();stepShape.moveTo(r+.23,0);stepShape.absarc(0,0,r+.23,0,Math.PI,false);stepShape.lineTo(-(r-.23),0);stepShape.absarc(0,0,r-.23,Math.PI,0,true);stepShape.closePath();const stage=mesh(root,new T.ExtrudeGeometry(stepShape,{depth:y-.20,bevelEnabled:false}),M.stone,0,y,0);stage.rotation.x=Math.PI/2;stage.rotation.z=Math.PI;
for(let j=0;j<7+row*2;j++){const a=Math.PI/2+(j+.5)/(7+row*2)*Math.PI;const chair=new T.Group();chair.position.set(Math.sin(a)*r,y+.17,Math.cos(a)*r);chair.rotation.y=a+Math.PI;root.add(chair);box(chair,M.wood,0,0,0,.32,.09,.32);box(chair,purple,0,.06,.01,.27,.05,.26);box(chair,M.wood,0,.25,-.14,.32,.43,.07);for(const side of [-1,1])rod(chair,M.brass,[side*.145,-.13,-.12],[side*.145,.34,-.12],.012);}}
// Rear curved masonry wall, continuous backing, front left open.
mesh(root,new T.CylinderGeometry(3.62,3.62,4.45,72,1,true,Math.PI/2,Math.PI),M.mortar,0,2.4,0);
for(let row=0;row<18;row++)for(let j=0;j<36;j++){const a=Math.PI/2+(j+.5+(row%2)*.18)/36*Math.PI,x=Math.sin(a)*3.62,z=Math.cos(a)*3.62;const o=box(root,M.stone,x,.34+row*.24,z,.325,.23,.24);o.rotation.y=a;}
// Facade towers and deeply articulated front arch.
for(const side of [-1,1]){const x=side*3.40;box(root,M.mortar,x,2.5,.05,1.03,4.6,1.18);for(let row=0;row<19;row++)for(let j=0;j<3;j++)for(const z of [-.60,.70])box(root,M.stone,x-.34+j*.34,.34+row*.24,z,.325,.23,.18);for(const y of [.35,1.65,3.55,4.70])box(root,M.stone,x,y,.05,1.25,.14,1.45);mesh(root,new T.ConeGeometry(.87,.60,4),M.slate,x,5.06,.05).rotation.y=Math.PI/4;lamp(x,5.70,.05,1.1);box(root,purple,x,3.31,.85,.61,1.62,.035);for(const xx of [-.31,.31])rod(root,M.brass,[x+xx,2.5,.88],[x+xx,4.12,.88],.009);ring(root,x,3.45,.90,.18,.014);}
const arch=new T.Shape();arch.moveTo(-2.95,2.65);arch.absarc(0,2.65,2.95,Math.PI,0,true);arch.lineTo(3.20,2.65);arch.absarc(0,2.65,3.20,0,Math.PI,false);arch.closePath();mesh(root,new T.ExtrudeGeometry(arch,{depth:.40,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2}),M.stone,0,0,.25);
for(let j=0;j<31;j++){const a=j/30*Math.PI;const o=box(root,M.brass,Math.cos(a)*3.08,2.65+Math.sin(a)*3.08,.68,.025,.23,.025);o.rotation.z=a-Math.PI/2;}
// Rear half dome, open front permits view into chamber.
const domeGeo=new T.SphereGeometry(3.66,64,24,Math.PI,Math.PI,0,Math.PI/2);const dome=mesh(roof,domeGeo,M.slate,0,4.55,0);dome.scale.y=.44;dome.material.side=T.DoubleSide;
for(let j=0;j<13;j++){const a=Math.PI/2+j/12*Math.PI,points=[];for(let k=0;k<=24;k++){const b=k/24*Math.PI/2;points.push(new T.Vector3(Math.sin(a)*Math.sin(b)*3.70,4.55+Math.cos(b)*1.63,Math.cos(a)*Math.sin(b)*3.70));}mesh(roof,new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.027,8,false),M.brass);}
mesh(roof,new T.CylinderGeometry(.65,.75,.42,32),M.stone,0,6.25,-.15);mesh(roof,new T.ConeGeometry(.84,.53,32),M.slate,0,6.73,-.15);lamp(0,7.22,-.15,.65,roof);
// Suspended balance, joints and pans; no unsupported floating components.
const beam=new T.Group();beam.position.set(0,4.37,-.48);beam.scale.set(1.55,1.16,1.3);root.add(beam);rod(root,M.brass,[0,5.80,-.48],[0,4.37,-.48],.032);ring(root,0,4.37,-.48,.16,.032);rod(beam,M.brass,[-1.30,0,0],[1.30,0,0],.045);
for(const side of [-1,1]){for(const z of [-.20,.20])rod(beam,M.brass,[side*1.2,0,0],[side*1.2,-.68,z],.012);const pan=mesh(beam,new T.CylinderGeometry(.33,.18,.08,32),M.brass,side*1.2,-.73,0);ring(beam,side*1.2,-.69,0,.33,.012).rotation.x=Math.PI/2;}
lamp(0,-.24,0,.70,beam);
// Speaker's desk and circular floor seal sit below the balance.
box(root,M.wood,0,.53,.05,.64,.70,.48);box(root,M.brass,0,.9,.05,.78,.075,.57);ring(root,0,.255,1.6,.67,.026).rotation.x=Math.PI/2;
for(let j=0;j<12;j++){const a=j*Math.PI/6;box(root,M.brass,Math.cos(a)*.54,.256,1.6+Math.sin(a)*.54,.045,.013,.06);}
for(let i=0;i<4;i++)box(root,M.stone,0,.19+i*.075,2.84-i*.19,5.6-i*.24,.13,.42);
for(const side of [-1,1])for(let j=0;j<3;j++)lamp(side*(2.8-j*.42),1.25+j*.22,-1.2-j*.6,.58);

// Capstones and relief pilasters articulate the rear chamber.
for(let j=0;j<19;j++){const a=Math.PI/2+j/18*Math.PI;for(const y of [.35,2.0,4.52]){const o=box(root,M.stone,Math.sin(a)*3.62,y,Math.cos(a)*3.62,.62,.12,.31);o.rotation.y=a;}}
for(const side of [-1,1])for(const y of [.8,1.5,2.2,2.9,3.6,4.3]){box(root,M.stone,side*3.92,y,.69,.19,.32,.23);box(root,M.brass,side*3.40,y,.79,.64,.025,.028);}
// Curved aisle handrails and row-end lamps.
for(const side of [-1,1]){const pts=[];for(let j=0;j<6;j++){pts.push(new T.Vector3(side*(1.18+j*.43),.72+j*.25,-.15));}mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts),28,.023,10,false),M.brass);}
// Timber ceiling ribs connect the masonry to the roof crown.
for(let j=0;j<9;j++){const a=Math.PI/2+j/8*Math.PI;rod(roof,M.wood,[Math.sin(a)*3.46,4.47,Math.cos(a)*3.46],[0,6.05,-.08],.045);}

// Tower side masonry closes the formerly bare backing surfaces.
for(const side of [-1,1]){const cx=side*3.4;for(const dx of [-.54,.54])for(let row=0;row<19;row++)for(let j=0;j<4;j++)box(root,M.stone,cx+dx,.34+row*.24,-.47+j*.31,.16,.23,.294);}
// Recessed doorways and glazed upper windows read as inhabitable towers.
const glazing=new T.MeshPhysicalMaterial({color:0xc9b7a0,transparent:true,opacity:.18,roughness:.15,clearcoat:1,depthWrite:false});
const amber=new T.MeshStandardMaterial({color:0xae7940,emissive:0xffa84f,emissiveIntensity:.28});
for(const side of [-1,1]){
 const x=side*3.4;
 box(root,M.dark,x,1.01,.81,.65,1.23,.06);
 for(let j=0;j<6;j++)box(root,M.wood,x-.255+j*.102,1.01,.86,.096,1.17,.055);
 for(const y of [.61,1.35])box(root,M.brass,x,y,.90,.60,.055,.025);
 ring(root,x+side*.19,.96,.94,.043,.012);
 for(let j=0;j<15;j++){const a=j/14*Math.PI;const stone=box(root,M.stone,x+Math.cos(a)*.40,1.49+Math.sin(a)*.40,.86,.115,.14,.18);stone.rotation.z=a-Math.PI/2;}
 for(const dx of [-.39,.39])box(root,M.stone,x+dx,.98,.86,.15,1.1,.19);
 box(root,M.dark,x,4.23,.81,.52,.49,.03);box(root,amber,x,4.23,.84,.44,.41,.025);
 const pane=box(root,glazing,x,4.23,.90,.45,.42,.01);pane.castShadow=false;
 rod(root,M.brass,[x,4.01,.92],[x,4.45,.92],.009);
 box(root,M.stone,x,3.96,.88,.64,.08,.24);
 const light=new T.PointLight(0xffbd70,.8,1.9);light.position.set(x,4.22,1.0);root.add(light);
}
// Layered arch trim and exposed keystone support the front roof edge.
for(const radius of [2.91,3.23]){const pts=[];for(let j=0;j<=64;j++){const a=j/64*Math.PI;pts.push(new T.Vector3(Math.cos(a)*radius,2.65+Math.sin(a)*radius,.72));}mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,.025,10,false),M.brass);}
box(root,M.stone,0,5.76,.61,.35,.40,.31);
for(const side of [-1,1]){box(root,M.stone,side*2.97,2.67,.54,.36,.17,.53);box(root,M.stone,side*3.0,.36,.46,.40,.22,.56);}
// Individual slate patches follow the dome curvature rather than a smooth shell.
for(let row=0;row<15;row++){
 const polar=.13+row*.095,r=3.69*Math.sin(polar),y=4.55+1.64*Math.cos(polar),count=Math.max(8,Math.floor(r*15));
 for(let j=0;j<count;j++){
  const a=Math.PI+(j+.5)/count*Math.PI,geo=new T.PlaneGeometry(1,1,2,2),pos=geo.attributes.position;
  for(let k=0;k<pos.count;k++){const aa=a+pos.getX(k)*Math.PI/count*.98,pp=polar+pos.getY(k)*.101;pos.setXYZ(k,-Math.cos(aa)*3.70*Math.sin(pp),4.55+1.65*Math.cos(pp),Math.sin(aa)*3.70*Math.sin(pp));}
  geo.computeVertexNormals();mesh(roof,geo,M.slate);
 }
}
// Brass rails, row-end panels, writing desks and fasteners give each seat a purpose.
for(let row=0;row<5;row++){
 const r=1.35+row*.43,y=.3+row*.25,count=7+row*2;
 for(let j=0;j<count;j++){const a=Math.PI/2+(j+.5)/count*Math.PI;const desk=new T.Group();desk.position.set(Math.sin(a)*(r-.18),y+.39,Math.cos(a)*(r-.18));desk.rotation.y=a;root.add(desk);box(desk,M.wood,0,0,0,.30,.035,.13);box(desk,M.brass,0,.024,.043,.27,.012,.014);for(const side of [-1,1])rod(desk,M.brass,[side*.13,-.32,0],[side*.13,0,0],.009);}
}
// More substantial balance with split suspension and actual chain links.
for(const side of [-1,1]){
 for(let j=0;j<12;j++){const r=mesh(beam,new T.TorusGeometry(.016,.004,6,10),M.brass,side*1.2,-.025-j*.052,0);r.rotation.y=(j%2)*Math.PI/2;}
 ring(beam,side*1.2,-.71,0,.32,.016).rotation.x=Math.PI/2;
 for(const y of [.13,-.13])rod(beam,M.brass,[side*.10,y,0],[side*1.18,0,0],.012);
}
// Replace ellipsoid flames with tapered, deforming two-layer volumes.
const flameMeshes=[];
for(const original of flames){original.visible=false;const group=new T.Group();original.parent.add(group);for(let layer=0;layer<2;layer++){const mat=fire.clone();mat.transparent=true;mat.opacity=layer?.9:.46;mat.depthWrite=false;mat.emissiveIntensity=layer?3:1.8;const geo=new T.SphereGeometry(1,20,24),o=mesh(group,geo,mat);o.castShadow=false;o.userData.base=new Float32Array(geo.attributes.position.array);o.userData.layer=layer;flameMeshes.push(o);}}
function animateFire(t){for(let i=0;i<flameMeshes.length;i++){const o=flameMeshes[i],p=o.geometry.attributes.position,b=o.userData.base,inner=o.userData.layer;for(let j=0;j<p.count;j++){const u=(b[j*3+1]+1)/2,w=(1-u)*(.8+u);p.setXYZ(j,b[j*3]*w*(inner?.028:.047)+Math.sin(t*9+u*5+i)*u*u*.014,-.12+u*(inner?.20:.32),b[j*3+2]*w*(inner?.025:.038));}p.needsUpdate=true;o.geometry.computeVertexNormals();}}
// Slight stone edge wear and material variation match the completed gatehouse.
root.traverse(o=>{if(!o.isMesh||o.material!==M.stone||o.geometry.type!=='RoundedBoxGeometry')return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=Math.sin(x*31+y*29+z*19+o.position.y*17)*.0035;p.setXYZ(i,x+d,y+d*.5,z+d);}o.geometry.computeVertexNormals();});

// Monumental undercroft: every existing part rises on a deep structural podium.
const superstructure=new T.Group();superstructure.name='RaisedAssembly';const existing=[...root.children];existing.forEach(o=>superstructure.add(o));superstructure.position.y=.85;root.add(superstructure);
box(root,M.mortar,0,.22,0,9,.95,7.4);
for(const z of [-3.72,3.72])for(let row=0;row<4;row++)for(let j=0;j<23;j++)box(root,M.stone,-4.3+j*.39,-.12+row*.24,z,.374,.23,.20);
for(const x of [-4.52,4.52])for(let row=0;row<4;row++)for(let j=0;j<19;j++)box(root,M.stone,x,-.12+row*.24,-3.50+j*.39,.20,.23,.374);
for(let step=0;step<9;step++){const y=.03+step*.105,z=5.48-step*.22;box(root,M.stone,0,y,z,6.9-step*.10,.13,.36);for(const side of [-1,1])box(root,M.stone,side*(3.56-step*.05),y+.21,z,.22,.43,.36);}
// Radial buttresses carry the great rear dome down to the foundation.
for(let j=0;j<9;j++){const a=Math.PI/2+j/8*Math.PI,frame=new T.Group();frame.rotation.y=a;superstructure.add(frame);box(frame,M.stone,0,.62,3.86,.46,.88,.65);box(frame,M.stone,0,2.17,3.78,.34,2.45,.45);box(frame,M.stone,0,3.62,3.71,.26,.51,.30);box(frame,M.stone,0,1.04,3.88,.56,.14,.73);}
// Massive engaged pillars and broad capitals flank the public opening.
for(const side of [-1,1]){const x=side*2.88;box(superstructure,M.stone,x,1.45,.83,.34,2.35,.46);box(superstructure,M.stone,x,.34,.83,.54,.23,.66);box(superstructure,M.stone,x,2.65,.83,.62,.22,.70);for(const dx of [-.09,.09])box(superstructure,M.brass,x+dx,1.45,1.07,.012,2.0,.012);}

// Paired exposed clockwork transmissions drive the suspended balance shaft.
const clockwork=[];
function gear(x,y,z,r,teeth,direction){const g=new T.Group();g.position.set(x,y,z);superstructure.add(g);clockwork.push({g,direction,ratio:24/teeth});ring(g,0,0,0,r*.84,.045);mesh(g,new T.CylinderGeometry(r*.21,r*.21,.14,24),M.brass).rotation.x=Math.PI/2;for(let j=0;j<teeth;j++){const a=j/teeth*Math.PI*2,o=box(g,M.brass,Math.cos(a)*r,Math.sin(a)*r,0,.095,.07,.10);o.rotation.z=a;}
for(let j=0;j<8;j++){const a=j*Math.PI/4;rod(g,M.brass,[Math.cos(a)*r*.16,Math.sin(a)*r*.16,0],[Math.cos(a)*r*.81,Math.sin(a)*r*.81,0],.026);}rod(superstructure,M.dark,[x,y,z-.28],[x,y,z+.19],.055);ring(superstructure,x,y,z+.17,r*.20,.023);box(superstructure,M.dark,x,y,z-.25,r*.48,r*.48,.14);return g;}
for(const side of [-1,1]){
 gear(side*2.57,2.95,.86,.48,24,side);
 gear(side*2.57,3.66,.86,.24,12,-side);
 gear(side*2.57,4.20,.86,.30,15,side);
 rod(superstructure,M.brass,[side*2.57,4.20,.55],[side*2.57,5.22,.55],.045);
 const conduit=new T.CatmullRomCurve3([new T.Vector3(side*2.6,.65,.85),new T.Vector3(side*2.6,2.55,.85),new T.Vector3(side*2.25,2.65,.85)]);mesh(superstructure,new T.TubeGeometry(conduit,32,.044,12,false),M.brass);
 for(const y of [.8,1.45,2.1]){const collar=ring(superstructure,side*2.6,y,.85,.069,.014);collar.rotation.x=Math.PI/2;}
 // Stone-backed bearing brackets tie the transmission to the arch piers.
 box(superstructure,M.stone,side*2.78,2.95,.61,.52,.27,.60);
}
rod(superstructure,M.brass,[-2.57,5.22,.55],[2.57,5.22,.55],.05);
gear(0,5.22,.62,.33,16,-1);
rod(superstructure,M.brass,[0,5.22,.40],[0,5.22,-.48],.048);
// A crown escapement is visible above the central keystone.
gear(0,5.70,.87,.25,12,1);rod(superstructure,M.brass,[0,5.22,.45],[0,5.70,.45],.027);

const balanceGold=new T.MeshPhysicalMaterial({color:0xffce62,metalness:.92,roughness:.21,clearcoat:.55,clearcoatRoughness:.18});
beam.traverse(o=>{if(o.isMesh&&o.material===M.brass)o.material=balanceGold;});
// Broad golden dish lips and a substantial central crest catch the light.
for(const side of [-1,1]){const lip=ring(beam,side*1.2,-.68,0,.34,.025);lip.rotation.x=Math.PI/2;lip.material=balanceGold;mesh(beam,new T.SphereGeometry(.065,20,12),balanceGold,side*1.3,0,0);}
const crest=mesh(beam,new T.SphereGeometry(1,24,16),balanceGold,0,0,.07);crest.scale.set(.115,.17,.045);
const goldKey=new T.SpotLight(0xffe3a4,35,9,.60,.8,1.4);goldKey.position.set(-2,6.7,4.3);goldKey.target=beam;superstructure.add(goldKey);
return{root,roof,setOpen(v){roof.visible=!v;},setHealth(){},doors:[],lights:[],tick(t){clockwork.forEach(({g,direction,ratio})=>g.rotation.z=t*.28*direction*ratio);animateFire(t);beam.rotation.z=Math.sin(t*.45)*.055;flames.forEach((f,i)=>{f.scale.y=.15*(1+.12*Math.sin(t*12+i));f.rotation.z=Math.sin(t*7+i)*.10;});},get state(){return{roofOpen:!roof.visible};}};
}

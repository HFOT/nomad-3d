import * as T from 'three';
import { addWard } from './ward.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// All surfaces, articulation and textures are authored here; no remote model assets.
let seed=71031;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const clamp=T.MathUtils.clamp;
export function createMaterials(texSize){
  function texture(kind,base,size=texSize||1024){
    const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,size,size);
    const im=g.getImageData(0,0,size,size),d=im.data;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;let n=(rand()-.5)*(kind==='cloth'?29:kind==='leather'?24:15);if(kind==='cloth')n+=((x%4===0?1:-.3)+(y%4===0?1:-.3))*10;for(let k=0;k<3;k++)d[i+k]=clamp(d[i+k]+n,0,255)}g.putImageData(im,0,0);
    if(kind==='paint'||kind==='ivory'||kind==='brass'){
      for(let i=0;i<1900;i++){let x=rand()*size,y=rand()*size,r=rand()*3+.3;g.fillStyle=kind==='ivory'?`rgba(93,65,32,${rand()*.25})`:`rgba(42,33,21,${rand()*.65})`;g.beginPath();g.ellipse(x,y,r,r*(.25+rand()),rand()*6.28,0,6.28);g.fill();if(kind==='paint'&&i%6===0){g.strokeStyle='#b4a48277';g.lineWidth=.7;g.beginPath();g.moveTo(x-r,y+r);g.lineTo(x+r*2,y+r*.8);g.stroke()}}
      for(let i=0;i<105;i++){let x=rand()*size,y=rand()*size;g.strokeStyle=kind==='ivory'?'#55432925':'#e3d5a335';g.lineWidth=rand()*1.4+.3;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*34,y+rand()*12);g.stroke()}
    }
    if(kind==='leather'){for(let i=0;i<1200;i++){const x=rand()*size,y=rand()*size;g.strokeStyle='#d8a77518';g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*10,y+rand()*3);g.stroke()}}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;return tex;
  }
  function normalFromTexture(tex,kind){
    const c=tex.image,w=c.width,h=c.height,src=c.getContext('2d').getImageData(0,0,w,h).data;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),img=ctx.createImageData(w,h);const strength=kind==='cloth'?1.1:kind==='leather'?.65:.28;
    const height=(x,y)=>{const i=(((y+h)%h)*w+(x+w)%w)*4;return(src[i]+src[i+1]+src[i+2])/765};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(height(x-1,y)-height(x+1,y))*strength,dy=(height(x,y-1)-height(x,y+1))*strength,inv=1/Math.sqrt(dx*dx+dy*dy+1),i=(y*w+x)*4;img.data[i]=(dx*inv*.5+.5)*255;img.data[i+1]=(dy*inv*.5+.5)*255;img.data[i+2]=(inv*.5+.5)*255;img.data[i+3]=255}ctx.putImageData(img,0,0);const n=new T.CanvasTexture(canvas);n.wrapS=n.wrapT=T.RepeatWrapping;n.anisotropy=8;return n;
  }
  const make=(name,color,metalness,roughness,kind)=>{const mat=new T.MeshStandardMaterial({color:kind?0xffffff:color,metalness,roughness});mat.name=name;if(kind){mat.map=texture(kind,color);mat.normalMap=normalFromTexture(mat.map,kind)}return mat};
  return {
    ivory:make('Aged warm porcelain','#d4c8a6',.2,.46,'ivory'),teal:make('Chipped petrol enamel','#41404c',.62,.43,'paint'),darkTeal:make('Deep petrol trim','#24232d',.65,.42,'paint'),
    iron:make('Graphite steel','#353937',.83,.39),dark:make('Recessed black metal','#151c1b',.6,.5),brass:make('Patinated brass','#8e723e',.82,.36,'brass'),edge:make('Polished brass edges','#b49a62',.84,.26),rubber:make('Worn boot rubber','#242622',.08,.92),
    cloth:make('Woven ochre scarf','#d1cbb5',0,.98,'cloth'),clothDark:make('Ochre seams','#172335',0,1),leather:make('Weathered brown leather','#51372c',0,.82,'leather'),leatherLight:make('Backpack flap leather','#684838',0,.79,'leather'),thread:make('Linen stitching','#ae9570',0,.95),
    eye:new T.MeshPhysicalMaterial({name:'Obsidian optical glass',color:0x060d0d,metalness:.15,roughness:.09,clearcoat:1,clearcoatRoughness:.06}),
    glass:new T.MeshPhysicalMaterial({name:'Lantern amber glass',color:0xf5c680,metalness:0,roughness:.13,transmission:.92,thickness:0,ior:1.46,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false}),
    flame:new T.MeshStandardMaterial({name:'Warm flame',color:0xffdda0,emissive:0xff941f,emissiveIntensity:5,roughness:1}),wick:make('Cotton wick','#302a21',0,1),
    stone:make('Weathered sandstone','#55584a',.03,.99,'leather'),moss:make('Soft olive moss','#536038',0,1),grass:make('Grass tips','#829057',0,1)
  };
}
export function buildRobot(M){
  const root=new T.Group();root.name='LEX';const rig={};let serial=0;
  function group(parent,name,x=0,y=0,z=0){const o=new T.Group();o.name=name||'Assembly_'+serial++;o.position.set(x,y,z);parent.add(o);return o}
  function mesh(parent,geo,mat,x=0,y=0,z=0,name){const o=new T.Mesh(geo,mat);o.name=name||'Part_'+serial++;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
  const sphere=(p,m,x,y,z,sx,sy=sx,sz=sx)=>{const o=mesh(p,new T.SphereGeometry(1,32,22),m,x,y,z);o.scale.set(sx,sy,sz);return o};
  const box=(p,m,x,y,z,w,h,d,r=.04)=>mesh(p,new RoundedBoxGeometry(w,h,d,3,r),m,x,y,z);
  const cyl=(p,m,x,y,z,r,h,axis='y',r2=r)=>{const o=mesh(p,new T.CylinderGeometry(r,r2,h,36),m,x,y,z);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o};
  const torus=(p,m,x,y,z,r,t,axis='z')=>{const o=mesh(p,new T.TorusGeometry(r,t,10,48),m,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o};
  function curve(p,m,pts,r=.01){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(...a))),Math.max(12,pts.length*8),r,6,false),m)}
  function rod(p,m,a,b,r){const A=new T.Vector3(...a),B=new T.Vector3(...b),o=cyl(p,m,0,0,0,r,A.distanceTo(B));o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return o}
  function screw(p,x,y,z,r=.031,axis='z'){const g=group(p,null,x,y,z);if(axis==='x')g.rotation.y=Math.PI/2;if(axis==='y')g.rotation.x=-Math.PI/2;cyl(g,M.brass,0,0,0,r,.018,'z');const slot=box(g,M.dark,0,0,.011,r*1.12,.007,.005,.001);slot.rotation.z=.4;return g}
  function axle(p,x,y,z,r=.14){cyl(p,M.iron,x,y,z,r,.22,'x');for(const s of [-1,1]){torus(p,M.brass,x+s*.124,y,z,r*.75,.02,'x');cyl(p,M.dark,x+s*.13,y,z,r*.58,.019,'x');cyl(p,M.edge,x+s*.143,y,z,r*.22,.02,'x');}}
  function stitches(p,points,count=25){const c=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));for(let i=0;i<count;i++){const a=c.getPoint(i/count),b=c.getPoint((i+.48)/count);rod(p,M.thread,a.toArray(),b.toArray(),.004)}}
  function lathe(p,m,profile,x,y,z,sx=1,sz=1){const points=profile.map(a=>new T.Vector3(a[0],a[1],0));const path=new T.CatmullRomCurve3(points,false,'centripetal');const sampled=path.getPoints(profile.length*6).map(v=>new T.Vector2(Math.max(0,v.x),v.y));const o=mesh(p,new T.LatheGeometry(sampled,80),m,x,y,z);o.scale.set(sx,1,sz);return o}

  // Hip / torso hierarchy. Every rigid limb is an independently animated node.
  const body=rig.body=group(root,'Body',0,1.40,0);
  sphere(body,M.dark,0,-.13,0,.37,.22,.29);
  cyl(body,M.iron,0,.06,0,.22,.27);for(let i=0;i<4;i++)torus(body,M.brass,0,-.04+i*.06,0,.225,.017,'y');
  const torso=group(body,'Torso',0,.56,0);torso.scale.set(1.25,1.08,1.18);
  lathe(torso,M.teal,[[0,-.54],[.32,-.52],[.52,-.43],[.64,-.22],[.63,.08],[.56,.31],[.44,.49],[.25,.53],[0,.53]],0,0,0,1,.77);
  const rim=torus(torso,M.brass,0,-.41,0,.485,.025,'y');rim.scale.z=.77;
  for(const x of [-.42,.42])for(const y of [-.25,.23])screw(torso,x,y,.36,.034);
  box(torso,M.darkTeal,0,-.04,.462,.27,.28,.031,.045);
  curve(torso,M.edge,[[-.085,.04,.485],[-.085,-.075,.487],[0,-.1,.49],[.085,-.075,.487],[.085,.04,.485]],.008);
  for(let i=0;i<5;i++)box(torso,M.dark,-.15+i*.07,-.34,.407,.025,.055,.015,.006);
  const plate=box(torso,M.brass,.28,-.21,.409,.14,.065,.018,.01);plate.rotation.z=-.07;
  for(let i=0;i<3;i++)box(torso,M.dark,.245+i*.03,-.21,.42,.008,.027,.006,.002);

  const neck=group(body,'Neck',0,1.13,0);cyl(neck,M.iron,0,0,0,.22,.3);for(let i=0;i<5;i++)torus(neck,M.dark,0,-.12+i*.05,0,.225,.019,'y');
  const head=rig.head=group(body,'Head',0,1.86,.01);head.scale.set(.86,.88,.90);
  lathe(head,M.ivory,[[0,-.68],[.35,-.66],[.60,-.55],[.78,-.35],[.85,-.05],[.84,.22],[.74,.5],[.54,.70],[.27,.81],[0,.85]],0,0,0,1,.88);
  const bottomRim=torus(head,M.dark,0,-.605,0,.61,.019,'y');bottomRim.scale.z=.83;
  // Recessed lens sockets and convex glass. The optical axes turn slightly outward.
  for(const s of [-1,1]){
    const e=group(head,'Optic_'+(s<0?'L':'R'),s*.355,-.15,.69);e.rotation.y=s*.16;e.scale.set(.65,.65,.65);
    sphere(e,M.dark,0,0,0,.227,.25,.078);
    const rim=torus(e,M.brass,0,0,.034,.204,.025);rim.scale.y=1.095;
    const inn=torus(e,M.edge,0,0,.061,.181,.008);inn.scale.y=1.095;
    const lens=sphere(e,M.eye,0,0,.045,.179,.198,.101);lens.name='Lens_'+s;
    for(const a of [-.9,1.5,3.5])screw(e,Math.cos(a)*.222,Math.sin(a)*.244,.011,.012);
    // Fine mechanical eyelids live above each glass lens, with visible hinge studs.

  }
  const mouth=box(head,M.dark,0,-.435,.695,.15,.035,.03,.015);mouth.rotation.x=.18;
  box(head,M.brass,0,-.457,.685,.13,.007,.018,.002);
  for(const s of [-1,1]){
    const ear=group(head,'Ear_'+s,s*.836,-.035,-.025);
    cyl(ear,M.dark,0,0,0,.264,.07,'x');cyl(ear,M.brass,s*.045,0,0,.234,.07,'x');cyl(ear,M.iron,s*.089,0,0,.197,.067,'x');torus(ear,M.edge,s*.128,0,0,.15,.012,'x');cyl(ear,M.dark,s*.134,0,0,.12,.016,'x');
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;screw(ear,s*.132,Math.sin(a)*.178,Math.cos(a)*.178,.02,'x')}
    curve(head,M.brass,[[s*.75,.40,-.04],[s*.81,.25,-.03],[s*.85,.09,-.025]],.017);
  }
  // Off-centre inspection plate and repaired seam on the ceramic shell.
  const temple=group(head,'TempleRepair',-.55,.40,.44);temple.rotation.set(-.38,-.55,-.1);
  box(temple,M.brass,0,0,0,.14,.22,.025,.025);box(temple,M.dark,0,0,.017,.061,.12,.012,.015);for(const y of [-.077,.077])screw(temple,0,y,.024,.019);
  curve(head,M.leather,[[.33,.69,.30],[.365,.60,.42],[.345,.55,.49],[.39,.46,.56]],.003);
  const antenna=rig.antenna=group(head,'Antenna',0,.835,-.08);antenna.scale.set(1,.18,1);
  cyl(antenna,M.brass,0,0,0,.067,.052);cyl(antenna,M.dark,0,.06,0,.038,.09);rod(antenna,M.iron,[0,.07,0],[.01,.39,0],.018);sphere(antenna,M.brass,.01,.42,0,.067,.077,.067);sphere(antenna,M.cloth,.01,.441,.019,.056,.051,.047);

  // Scarf: layered fabric tube, folds, hand-built flowing ribbon and frayed hem.
  const scarf=group(body,'Scarf',0,1.13,.015);scarf.scale.set(1.45,1.25,1.35);scarf.visible=false;
  const collarV=[],collarUV=[],collarI=[];
  for(let i=0;i<=96;i++)for(let j=0;j<=16;j++){const a=i/96*Math.PI*2,v=j/16,r=.40+.048*Math.sin(v*Math.PI)+.009*Math.sin(a*9+v*5)+.008*Math.sin(a*21-v*8);collarV.push(Math.cos(a)*r*1.14,-.065+v*.29+.025*Math.sin(a*3+v*4),Math.sin(a)*r*.9);collarUV.push(i/96*2,v)}
  for(let i=0;i<96;i++)for(let j=0;j<16;j++){const a=i*17+j;collarI.push(a,a+1,a+17,a+1,a+18,a+17)}
  const collarG=new T.BufferGeometry();collarG.setAttribute('position',new T.Float32BufferAttribute(collarV,3));collarG.setAttribute('uv',new T.Float32BufferAttribute(collarUV,2));collarG.setIndex(collarI);collarG.computeVertexNormals();const collarM=M.cloth.clone();collarM.side=T.DoubleSide;mesh(scarf,collarG,collarM);
  for(let i=0;i<2;i++){const t=torus(scarf,M.cloth,0,-.045+i*.24,0,.40,.04,'y');t.scale.set(1.14,1,.90);t.rotation.z=.04}
  sphere(scarf,M.cloth,-.30,.08,.25,.15,.11,.12);
  const tail=rig.scarf=group(scarf,'ScarfTail',-.31,.07,.12);
  const vertices=[],uv=[],idx=[],rows=32,cols=8;
  for(let i=0;i<=rows;i++){const t=i/rows;for(let j=0;j<=cols;j++){const u=j/cols-.5;vertices.push(-t*.77,.04+Math.sin(t*3.7)*.12-t*.10+u*.24,.05-t*.05+Math.sin(t*7+u*5)*.044+u*.04);uv.push(j/cols,t)}}
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const fabric=M.cloth.clone();fabric.side=T.DoubleSide;mesh(tail,geo,fabric);
  for(let j=0;j<14;j++){const u=j/13-.5;curve(tail,M.cloth,[[-.75,-.11+u*.24,.05],[-.8,-.12+u*.24,.04],[-.85-rand()*.05,-.13+u*.24,.06+rand()*.02]],.004)}
  const frontTail=rig.frontScarf=group(scarf,'FrontScarf',.30,-.04,.25);frontTail.rotation.z=.29;
  box(frontTail,M.cloth,0,-.24,0,.19,.53,.062,.035);for(let i=0;i<7;i++)curve(frontTail,M.clothDark,[[-.074+i*.024,-.02,.033],[-.068+i*.024,-.26,.035],[-.079+i*.024,-.49,.038]],.0025);
  for(let i=0;i<10;i++)rod(frontTail,M.cloth,[-.083+i*.018,-.495,0],[-.09+i*.018,-.56-rand()*.04,.013],.004);

  // Backpack / bedroll / straps / pockets / bottle.
  const pack=group(body,'ExpeditionPack',0,.55,-.69);pack.rotation.x=.06;pack.scale.set(1.22,1.08,1.35);
  box(pack,M.leather,0,0,-.05,.98,.96,.47,.15);
  box(pack,M.leatherLight,0,.34,-.15,1.03,.30,.50,.13);
  curve(pack,M.dark,[[-.44,.36,-.397],[0,.405,-.42],[.44,.36,-.397]],.018);
  stitches(pack,[[-.41,-.33,-.29],[-.42,.12,-.3],[-.38,.25,-.385],[0,.3,-.41],[.38,.25,-.385],[.42,.12,-.3],[.41,-.33,-.29]],60);
  const roll=group(pack,'Bedroll',0,.61,-.075);cyl(roll,M.leatherLight,0,0,0,.21,1.13,'x');
  for(const s of [-1,1]){cyl(roll,M.leather,s*.57,0,0,.199,.015,'x');for(let k=0;k<4;k++)torus(roll,M.leatherLight,s*.58,0,0,.055+k*.039,.011,'x');const band=torus(roll,M.leather,s*.35,0,0,.213,.03,'x');band.scale.x=1.5;screw(roll,s*.35,.19,.11,.025,'y')}
  for(const s of [-1,1]){
    box(pack,M.leather,s*.32,-.03,-.30,.11,.74,.045,.025);
    const b=torus(pack,M.brass,s*.32,-.15,-.335,.065,.009);b.scale.set(.7,1.1,1);rod(pack,M.edge,[s*.32,-.205,-.347],[s*.32,-.11,-.347],.005);
    box(pack,M.leatherLight,s*.54,-.12,-.03,.25,.4,.33,.07);box(pack,M.leather,s*.54,.035,-.02,.26,.12,.35,.04);
    screw(pack,s*.54,-.03,.16,.025);
    const strap=group(torso,'ShoulderStrap_'+s);curve(strap,M.leather,[[s*.30,-.42,.36],[s*.36,-.03,.44],[s*.36,.34,.28],[s*.33,.51,-.04],[s*.32,.3,-.56]],.038);
    for(let i=0;i<8;i++)screw(strap,s*.30,-.36+i*.07,.407,.006);
    const buckle=torus(strap,M.brass,s*.36,.02,.465,.071,.011);buckle.scale.set(.68,1.12,1);
  }
  const bottle=group(pack,'Canteen',-.71,-.22,.02);bottle.rotation.z=-.13;sphere(bottle,M.teal,0,0,0,.15,.21,.1);cyl(bottle,M.brass,0,.19,0,.049,.06);cyl(bottle,M.dark,0,.24,0,.055,.035);box(bottle,M.leather,0,0,.102,.054,.33,.025,.01);
  curve(pack,M.leather,[[-.55,-.3,-.03],[-.62,-.56,-.03],[-.53,-.76,.02]],.009);sphere(pack,M.brass,-.53,-.78,.02,.048,.055,.048);

  // Legs with rotating hip and knee axles, paired piston rods, toe caps and sole tread.
  for(const s of [-1,1]){
    const leg=rig['leg'+s]=group(root,'Hip_'+s,s*.39,1.28,0);leg.scale.set(1.25,.76,1.20);axle(leg,0,0,0,.17);
    box(leg,M.iron,0,-.25,0,.15,.39,.18,.03);cyl(leg,M.brass,s*.10,-.24,.05,.035,.31);
    sphere(leg,M.teal,0,-.16,.033,.18,.20,.16);
    for(const z of [-.1,.12])rod(leg,M.edge,[-s*.10,-.15,z],[-s*.10,-.43,z],.025);
    const knee=rig['knee'+s]=group(leg,'Knee_'+s,0,-.49,0);axle(knee,0,0,0,.15);
    box(knee,M.dark,0,-.19,0,.16,.30,.16,.02);box(knee,M.teal,0,-.17,.085,.25,.27,.09,.045);
    for(const x of [-.12,.12])rod(knee,M.iron,[x,-.05,-.045],[x,-.34,-.045],.025);
    box(knee,M.dark,0,-.43,0,.15,.34,.15,.025);box(knee,M.teal,0,-.37,.065,.24,.40,.11,.05);
    for(const x of [-.12,.12])rod(knee,M.edge,[x,-.18,-.045],[x,-.55,-.045],.023);
    const ankle=rig['foot'+s]=group(knee,'Foot_'+s,0,-.68,.025);ankle.scale.set(1.15,1.3,1.1);cyl(ankle,M.brass,0,.03,0,.135,.15,'x');
    box(ankle,M.rubber,0,-.28,.13,.48,.12,.73,.075);box(ankle,M.leather,0,-.21,.13,.47,.05,.715,.035);
    sphere(ankle,M.teal,0,-.12,.14,.239,.174,.365);
    const toeGeo=new T.SphereGeometry(1,40,20,0,Math.PI*2,0,1.14);toeGeo.rotateX(Math.PI/2);const toe=mesh(ankle,toeGeo,M.teal,0,-.119,.14);toe.scale.set(.242,.178,.371);
    box(ankle,M.darkTeal,0,.10,-.03,.40,.34,.32,.065);
    for(let j=0;j<2;j++){box(ankle,M.leather,0,.21-j*.13,.141,.40,.056,.034,.012);const b=torus(ankle,M.brass,s*.115,.21-j*.13,.165,.046,.008);b.scale.set(.72,1,1);}
    for(let j=0;j<5;j++){box(ankle,M.rubber,0,-.342,-.13+j*.135,.42,.035,.058,.006)}
    for(const x of [-.18,.18])for(const z of [.1,.24,.37])screw(ankle,x,-.18,z,.012,'y');
    stitches(ankle,[[-.2,-.19,.35],[-.22,-.19,.10],[-.19,-.16,-.12],[0,-.16,-.22],[.19,-.16,-.12],[.22,-.19,.10],[.2,-.19,.35]],30);
  }

  // Arms: shoulder bearing, bicep armour, flexible elbow cables, individually built digits.
  for(const s of [-1,1]){
    const arm=rig['arm'+s]=group(body,'Shoulder_'+s,s*.80,.87,0);arm.scale.set(1.16,.93,1.13);axle(arm,0,0,0,.22);
    sphere(arm,M.iron,0,-.09,0,.17,.2,.18);
    const armor=sphere(arm,M.iron,s*.065,-.28,.025,.145,.20,.155);armor.rotation.z=s*.10;
    rod(arm,M.brass,[-s*.085,-.16,.145],[-s*.085,-.44,.145],.032);
    screw(arm,0,-.26,.20,.03);
    const elbow=rig['elbow'+s]=group(arm,'Elbow_'+s,0,-.52,0);axle(elbow,0,0,0,.135);
    box(elbow,M.teal,0,-.24,0,.255,.36,.25,.065);
    for(const z of [-.115,.115])rod(elbow,M.iron,[s*.11,-.07,z],[s*.11,-.33,z],.026);
    for(let i=0;i<3;i++)torus(elbow,M.dark,0,-.34-i*.031,0,.115,.02,'y');
    curve(elbow,M.dark,[[-s*.1,.05,-.08],[-s*.19,-.06,-.12],[-s*.18,-.21,-.11],[-s*.09,-.30,-.10]],.023);
    const hand=rig['hand'+s]=group(elbow,'Hand_'+s,0,-.425,0);hand.scale.setScalar(1.15);box(hand,M.iron,0,-.08,.015,.24,.20,.13,.045);box(hand,M.darkTeal,0,-.075,.088,.23,.18,.045,.025);
    for(let f=0;f<4;f++){
      const digit=group(hand,'Finger_'+s+'_'+f,-.086+f*.058,-.165,.02);digit.rotation.x=s===1?-1.0:-.23;
      for(let j=0;j<3;j++){const ph=group(digit,null,0,-j*.055,j===2?.008:0);sphere(ph,M.brass,0,0,0,.028,.027,.03);box(ph,M.iron,0,-.028,.008,.049,.052,.049,.013)}
    }
    const thumb=group(hand,'Thumb_'+s,s*.145,-.065,.02);thumb.rotation.z=s*.7;thumb.rotation.x=-.8;
    for(let j=0;j<2;j++){sphere(thumb,M.brass,0,-j*.065,0,.034);box(thumb,M.iron,0,-j*.065-.037,0,.059,.057,.058,.015)}
    screw(hand,0,-.065,.117,.022);
  }

  // Lantern hangs from the raised right hand. Pivot is at the handle's uppermost point.
  const lantern=rig.lantern=group(rig.hand1,'Lantern',0,-.22,.03);
  curve(lantern,M.iron,[[-.19,-.31,0],[-.21,-.09,0],[-.16,.07,0],[0,.14,0],[.16,.07,0],[.21,-.09,0],[.19,-.31,0]],.016);
  cyl(lantern,M.brass,0,-.37,0,.15,.055);cyl(lantern,M.edge,0,-.42,0,.20,.035);
  lathe(lantern,M.brass,[[0,-.48],[.20,-.48],[.19,-.45],[.12,-.41],[.075,-.36],[.065,-.32],[0,-.32]],0,0,0);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;box(lantern,M.dark,Math.cos(a)*.123,-.406,Math.sin(a)*.123,.025,.035,.026,.005)}
  lathe(lantern,M.glass,[[.13,-1.04],[.18,-.99],[.19,-.83],[.155,-.57],[.12,-.49]],0,0,0);
  for(const s of [-1,1])curve(lantern,M.brass,[[s*.23,-1.04,0],[s*.255,-.88,0],[s*.225,-.65,0],[s*.185,-.43,0]],.019);
  for(const y of [-.60,-.88,-1.015])torus(lantern,M.edge,0,y,0,y===-.60?.173:.203,.014,'y');
  cyl(lantern,M.brass,0,-1.07,0,.235,.075);cyl(lantern,M.edge,0,-1.12,0,.257,.032);cyl(lantern,M.brass,0,-1.015,0,.132,.055);
  cyl(lantern,M.iron,0,-.97,0,.044,.065);cyl(lantern,M.wick,0,-.935,0,.018,.035);
  const flame=rig.flame=group(lantern,'Flame',0,-.84,0);sphere(flame,M.flame,0,0,0,.042,.102,.04);const tip=mesh(flame,new T.ConeGeometry(.034,.14,24),M.flame,.012,.088,0);tip.rotation.z=-.17;
  const fire=new T.PointLight(0xffaa46,2.5,4,2);fire.name='LanternLight';fire.position.set(0,-.78,0);lantern.add(fire);rig.fire=fire;
  const ward=addWard({root,rig,M,helpers:{mesh,sphere,box,cyl,torus,curve,rod}});
  root.userData={title:'LEX — Field companion 01',author:'CORN',units:'meters',animation:'Rigid hierarchical articulation, four baked looping clips'};
  // Carry an explicit tangent basis into GLB; normal-map appearance is portable.
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry;if(o.material.normalMap){
    if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.computeTangents();
    const a=g.attributes.tangent,n=g.attributes.normal,v=new T.Vector3(),normal=new T.Vector3();
    for(let i=0;i<a.count;i++){v.set(a.getX(i),a.getY(i),a.getZ(i));if(!Number.isFinite(v.lengthSq())||v.lengthSq()<1e-10){normal.fromBufferAttribute(n,i);v.set(Math.abs(normal.x)<.9?1:0,Math.abs(normal.x)<.9?0:1,0).cross(normal)}v.normalize();a.setXYZW(i,v.x,v.y,v.z,a.getW(i)<0?-1:1)}
  }else if(!o.material.map){g.deleteAttribute('uv')}});
  ward.setState({health:1,shared:false,latency:120});
  const rest=new Map();root.traverse(o=>rest.set(o.uuid,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));
  function pose(mode,t){
    const lookTime=t;if(mode==='Look')t=t*2/3;
    for(const o of Object.values(rig)){const r=rest.get(o.uuid);if(r){o.position.copy(r.position);o.quaternion.copy(r.quaternion);o.scale.copy(r.scale)}}
    const breath=Math.sin(t*Math.PI*.5),walk=mode==='Walk',cycle=t*Math.PI;
    body.position.y=1.40+(walk?.045*Math.cos(cycle*2):.016*breath);
    body.rotation.z=walk?.045*Math.sin(cycle):.009*breath;body.rotation.y=walk?.065*Math.sin(cycle):.015*Math.sin(t*Math.PI*.5);
    rig.head.rotation.y=mode==='Look'?.43*Math.sin(lookTime*Math.PI/3):.065*Math.sin(t*Math.PI*.5);
    rig.head.rotation.z=mode==='Look'?.07*Math.sin(lookTime*Math.PI*2/3):-.025+.015*breath;
    rig.head.rotation.x=.018*Math.sin(t*Math.PI*.5);
    for(const s of [-1,1]){
      const phase=cycle+(s<0?Math.PI:0),swing=Math.sin(phase);
      rig['leg'+s].rotation.x=walk?.47*swing:0;
      rig['knee'+s].rotation.x=walk?.62*Math.max(0,-swing):-.035;
      rig['foot'+s].rotation.x=walk?-.20*swing-.25*Math.max(0,-swing):.035;
      rig['arm'+s].rotation.z=s===1?.30:-.13;rig['arm'+s].rotation.x=walk?-.25*swing:.035*Math.sin(t*Math.PI*.5+s);
      rig['elbow'+s].rotation.x=s===1?-.65:-.13;
      rig['elbow'+s].rotation.z=s===1?1.25:0;
      rig['hand'+s].rotation.x=s===1?.30:0;
    }
    if(mode==='Wave'){rig['arm-1'].rotation.z=-2.02+.075*Math.sin(t*Math.PI);rig['arm-1'].rotation.x=.10;rig['elbow-1'].rotation.z=-.32+.22*Math.sin(t*Math.PI*2);rig['elbow-1'].rotation.x=-.35;rig['hand-1'].rotation.z=.20*Math.sin(t*Math.PI*2);rig.head.rotation.z=-.07+.035*Math.sin(t*Math.PI);}
    if(mode==='Guard'){rig.arm1.rotation.z=-.45;rig.arm1.rotation.x=-.45;rig.elbow1.rotation.z=.15;rig.elbow1.rotation.x=-1.35;rig.head.rotation.x=.07;rig.head.rotation.y=.04*Math.sin(t*Math.PI*.5);}
    rig.scarf.rotation.y=.09*Math.sin(t*Math.PI+(walk?1:0));rig.scarf.rotation.x=.1*Math.sin(t*Math.PI+.7);rig.frontScarf.rotation.x=.07*Math.sin(t*Math.PI+.5);
    rig.antenna.rotation.z=.03*Math.sin(t*Math.PI); ward.animate(t);
    // Counter-rotate lantern so gravity remains vertical despite the articulated arm.
    root.updateMatrixWorld(true);const q=new T.Quaternion();rig.hand1.getWorldQuaternion(q);q.normalize();lantern.quaternion.copy(q.invert());lantern.rotateZ((walk?.12:.035)*Math.sin(t*Math.PI));lantern.rotateX(.028*Math.sin(t*Math.PI+.8));
  }
  const animated=Object.values(rig).filter(o=>o!==rig.fire&&o!==rig.flame);
  const clips=[];
  for(const [name,duration] of [['Idle',4],['Walk',2],['Wave',4],['Look',6],['Guard',4]]){
    const samples=Math.round(duration*30),times=[],values=new Map(animated.map(o=>[o,{p:[],q:[]}]));
    for(let i=0;i<=samples;i++){let t=i/30;times.push(t);pose(name,t);for(const o of animated){const v=values.get(o);v.p.push(...o.position.toArray());v.q.push(...o.quaternion.clone().normalize().toArray())}}
    const tracks=[];for(const o of animated){const v=values.get(o);tracks.push(new T.VectorKeyframeTrack(o.name+'.position',times,v.p),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,v.q))}clips.push(new T.AnimationClip(name,duration,tracks));
  }
  pose('Idle',0);root.animations=clips;
  return {root,rig,clips,pose,ward,helpers:{mesh,sphere,box,cyl,torus,curve,rod}};
}

export function buildGround(M){
  const group=new T.Group();group.name='Mossy sandstone plinth';
  function rock(x,y,z,sx,sy,sz){const geo=new T.DodecahedronGeometry(1,1);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),n=1+.08*Math.sin(v.x*14+v.z*11)*Math.cos(v.y*17);p.setXYZ(i,v.x*n,v.y*n,v.z*n)}geo.computeVertexNormals();const o=new T.Mesh(geo,M.stone);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.y=rand()*5;o.castShadow=o.receiveShadow=true;group.add(o);}
  rock(0,-.16,0,1.5,.25,1.02);rock(-.88,-.23,.45,.64,.18,.50);rock(.8,-.26,.42,.65,.17,.51);rock(.05,-.3,-.65,1.14,.12,.48);
  const mossGeo=new T.IcosahedronGeometry(1,0),moss=new T.InstancedMesh(mossGeo,M.moss,420),matrix=new T.Matrix4(),q=new T.Quaternion();
  for(let i=0;i<420;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand()),x=Math.cos(a)*r*1.35,z=Math.sin(a)*r*.90;matrix.compose(new T.Vector3(x,-.005-r*.09,z),q,new T.Vector3(.035+rand()*.075,.014+rand()*.025,.035+rand()*.06));moss.setMatrixAt(i,matrix);moss.setColorAt(i,new T.Color().setHSL(.20+rand()*.045,.23+rand()*.2,.14+rand()*.13))}moss.receiveShadow=true;group.add(moss);
  const blades=[];for(let i=0;i<600;i++){const a=rand()*6.28,r=.5+rand()*.48,x=Math.cos(a)*r*1.34,z=Math.sin(a)*r*.84,y=-.01-r*.07,h=.025+rand()*.1;blades.push(x-.004,y,z,x+.004,y,z,x+.018*(rand()-.5),y+h,z+.018)}const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(blades,3));bg.computeVertexNormals();const gm=M.grass.clone();gm.side=T.DoubleSide;const grass=new T.Mesh(bg,gm);group.add(grass);return group;
}

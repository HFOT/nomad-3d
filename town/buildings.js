import * as T from 'three';

// Procedural town buildings. Everything shares the gate's material set (passed
// in as M) so the whole town reads as one masonry tradition. Each builder
// returns {root} or {root, tick} and leaves merging to town/merge.js.
export function makeBuilders(M){
 function g(p,x=0,y=0,z=0){const o=new T.Group();o.position.set(x,y,z);p.add(o);return o;}
 function m(p,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function box(p,mat,x,y,z,w,h,d){return m(p,new T.BoxGeometry(w,h,d),mat,x,y,z);}
 function cyl(p,mat,x,y,z,r1,r2,h,seg=20){return m(p,new T.CylinderGeometry(r1,r2,h,seg),mat,x,y,z);}
 function stone(p,x,y,z,w,h,d){const o=box(p,M.stone,x,y,z,w,h,d);o.material=M.stone.clone();o.material.color.offsetHSL(0,0,Math.sin(x*19+y*31+z*13)*.03);return o;}
 const windowLit=hex=>new T.MeshStandardMaterial({color:0xffe6b8,emissive:hex,emissiveIntensity:1.6});
 const warm=()=>windowLit(0xffa324);

 // ---- The great lighthouse: the town's heart, cycling through the six signal colours.
 function buildLighthouse(colors){
  const root=new T.Group();root.name='GreatLighthouse';
  const tiers=[[5.2,4.6,3,1.5],[4.4,3.9,8,7],[3.6,3.2,8,15],[2.9,2.6,6,22]];
  for(const [r1,r2,h,y] of tiers){
   cyl(root,M.stone,0,y+h/2,0,r2,r1,h,26).material=M.stone;
   cyl(root,M.brass,0,y+h,0,r2+.18,r2+.18,.35,26);
  }
  // A spiral of small lit windows climbs the shaft.
  const lit=warm();
  for(let j=0;j<9;j++){const a=j*1.1,rr=4.3-j*.22,y=6+j*2.2;
   const w=box(root,lit,Math.sin(a)*rr,y,Math.cos(a)*rr,.5,.8,.5);w.rotation.y=a;w.castShadow=false;}
  // Fire room: brass columns under a slate cone, glass drum, the great flame.
  const y0=28;
  cyl(root,M.stone,0,y0+.3,0,3.1,2.9,.6,26);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;cyl(root,M.brass,Math.sin(a)*2.4,y0+2,Math.cos(a)*2.4,.16,.16,3,10);}
  cyl(root,M.glass,0,y0+2,0,2.2,2.2,2.8,26);
  cyl(root,M.slate,0,y0+4.3,0,.4,3.4,1.8,26);
  cyl(root,M.brass,0,y0+5.4,0,.12,.3,1.2,12);
  const flameMat=new T.MeshStandardMaterial({color:0xfff1d8,emissive:0xffa324,emissiveIntensity:3});
  const flame=m(root,new T.SphereGeometry(1,20,14),flameMat,0,y0+2,0);flame.scale.set(1,1.6,1);flame.castShadow=false;
  const fire=new T.PointLight(0xffa324,3,60);fire.position.set(0,y0+2,0);root.add(fire);
  // Two opposed beams sweep the town, blending through the signal colours.
  const beamMat=new T.MeshBasicMaterial({color:0xffa324,transparent:true,opacity:.16,depthWrite:false,toneMapped:false});
  const pivot=g(root,0,y0+2,0);
  for(const s of [1,-1]){
   const beam=m(pivot,new T.ConeGeometry(3.2,34,18,1,true),beamMat,0,0,s*17);
   beam.rotation.x=-s*Math.PI/2;beam.castShadow=false;
  }
  const cols=colors.map(c=>new T.Color(c)),mix=new T.Color();
  return{root,tick(t){
   flameMat.emissiveIntensity=2.6+.5*Math.sin(t*11)+.25*Math.sin(t*23);
   flame.scale.set(1+.06*Math.sin(t*17),1.6+.12*Math.sin(t*13),1+.06*Math.cos(t*15));
   fire.intensity=2.6+.5*Math.sin(t*9);
   pivot.rotation.y=t*.35;
   const u=(t/10*cols.length)%cols.length,i=Math.floor(u);
   mix.copy(cols[i]).lerp(cols[(i+1)%cols.length],u-i);
   beamMat.color.copy(mix);fire.color.copy(mix).lerp(new T.Color(0xffa324),.5);
  }};
 }

 // ---- Civic halls: three distinct stone silhouettes north of the plaza.
 // Fronts face +z (toward the plaza when placed on the north side).
 function buildHall(kind){
  const root=new T.Group();root.name='Hall_'+kind;
  if(kind==='assembly'){// governance: colonnade front, central dome, violet windows
   const lit=windowLit(0xb48af0);
   stone(root,0,.5,0,16,1,12);
   stone(root,0,4,0,14,6,10);
   for(let j=0;j<4;j++)cyl(root,M.stone,-4.5+j*3,4,5.6,.5,.55,6,12);
   stone(root,0,7.4,5.6,15,.8,1.6);
   box(root,M.slate,0,8.2,0,14.6,1,10.6);
   m(root,new T.SphereGeometry(3.4,24,16,0,Math.PI*2,0,Math.PI/2),M.slate,0,8.6,0);
   cyl(root,M.brass,0,12.2,0,.1,.25,1.4,10);
   for(const s of [-1,1])for(let j=0;j<3;j++){const w=box(root,lit,s*7.05,4.4,-3+j*3,.14,1.8,1.1);w.castShadow=false;}
   for(let j=0;j<2;j++){const w=box(root,lit,-1.5+j*3,5.4,5.05,1.1,1.6,.14);w.castShadow=false;}
  }else if(kind==='vault'){// treasury: thick walls, tiny windows, round brass door, cyan glow
   const lit=windowLit(0x4ad8f0);
   stone(root,0,.5,0,12,1,10);
   stone(root,0,3.8,0,10,6.6,8);
   box(root,M.slate,0,7.6,0,10.8,1.2,8.8);
   stone(root,0,8.8,0,7,1.6,5.6);
   box(root,M.slate,0,9.9,0,7.6,.7,6.2);
   cyl(root,M.brass,0,3.2,4.05,2.1,2.1,.4,28).rotation.x=Math.PI/2;
   cyl(root,M.dark,0,3.2,4.22,1.7,1.7,.2,28).rotation.x=Math.PI/2;
   cyl(root,M.brass,0,3.2,4.34,.5,.5,.25,16).rotation.x=Math.PI/2;
   for(const s of [-1,1])for(let j=0;j<2;j++){const w=box(root,lit,s*5.05,5.2,-2+j*3,.14,.9,.7);w.castShadow=false;}
   const w2=box(root,lit,0,9,2.85,1.2,.8,.14);w2.castShadow=false;
  }else{// archive: three tall arched windows, book-spine cornice, amber glow
   const lit=windowLit(0xffb84a);
   stone(root,0,.5,0,13,1,10);
   stone(root,0,4.2,0,11,7,8);
   box(root,M.slate,0,8.1,0,11.8,.9,8.8);
   for(let j=0;j<7;j++){const b=box(root,M.wood,-4.2+j*1.4,9,.5,1.1,1.6-(j%3)*.25,5.5);b.rotation.z=(j%2?.04:-.04);}
   for(let j=0;j<3;j++){
    const x=-3+j*3;
    const w=box(root,lit,x,4.4,4.05,1.5,3.4,.16);w.castShadow=false;
    cyl(root,M.stone,x,6.1,4.05,.95,.95,.5,18).rotation.x=Math.PI/2;
   }
   box(root,M.wood,0,2,4.15,1.8,3,.3);
  }
  return{root};
 }

 // ---- Shops. Bright awned storefronts for the main street; dim, signless
 // fronts with cold lantern light for the back alley. Front faces +z.
 function buildShop(seed,shady){
  let s=seed>>>0;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const root=new T.Group();root.name=shady?'ShadyShop':'Shop';
  const w=4+rand()*1.2,d=3.6+rand(),h=2.6+rand()*.8;
  stone(root,0,.3,0,w+.6,.6,d+.4);
  box(root,M.wood,0,.6+h/2,0,w,h,d);
  for(const x of [-w/2+.15,w/2-.15])box(root,M.dark,x,.6+h/2,d/2-.02,.22,h,.22);
  box(root,M.slate,0,.6+h+.45,0,w+.8,.9,d+.8).rotation.x=0;
  m(root,new T.BoxGeometry(w+1,.16,1.6),shady?M.dark:M.wood,0,.6+h*.72,d/2+.75).rotation.x=-.35;
  if(shady){
   const lit=windowLit(0x4ac8b8);
   const win=box(root,lit,-w*.22,1.6,d/2+.02,.9,.7,.1);win.castShadow=false;
   box(root,M.dark,w*.22,1.4,d/2+.05,1,1.7,.12);
   const lamp=m(root,new T.SphereGeometry(.12,10,8),lit,w/2-.3,2.1,d/2+.4);lamp.castShadow=false;
  }else{
   const lit=warm();
   const win=box(root,lit,-w*.2,1.5,d/2+.02,1.4,1,.1);win.castShadow=false;
   box(root,M.wood,w*.25,1.3,d/2+.05,.9,1.8,.12);
   for(const x of [-w/2+.4,w/2-.4]){const l=m(root,new T.SphereGeometry(.14,10,8),lit,x,2.4,d/2+.5);l.castShadow=false;}
   box(root,M.wood,w/2+.45,1,d/2+.3,.5,.9,.08);
  }
  return{root};
 }
 function buildStall(seed){
  let s=seed>>>0;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const root=new T.Group();root.name='Stall';
  const cloth=new T.MeshStandardMaterial({color:rand()<.5?0x9e3438:0x38609e,roughness:.95});
  box(root,M.wood,0,.55,0,2.2,.5,1.3);
  for(const sx of [-1,1])for(const sz of [-1,1])box(root,M.wood,sx*.95,1.2,sz*.5,.12,1.6,.12);
  m(root,new T.BoxGeometry(2.7,.1,1.9),cloth,0,2.05,0).rotation.z=.08;
  box(root,warm(),0,.95,.35,.5,.3,.3).castShadow=false;
  return{root};
 }

 // ---- Houses: small gabled homes in three variants, warm windows, some chimneys.
 function buildHouse(seed){
  let s=seed>>>0;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const root=new T.Group();root.name='House';
  const two=rand()<.35,w=3.4+rand()*1.4,d=3+rand()*1.2,h=two?4.4:2.6;
  stone(root,0,.25,0,w+.5,.5,d+.4);
  box(root,rand()<.5?M.wood:M.stone,0,.5+h/2,0,w,h,d);
  const roofH=1.4+rand()*.6;
  const roof=m(root,new T.CylinderGeometry(.01,Math.max(w,d)*.62,roofH,4),M.slate,0,.5+h+roofH/2,0);roof.rotation.y=Math.PI/4;roof.scale.set(w/Math.max(w,d),1,d/Math.max(w,d));
  const lit=warm();
  const win=box(root,lit,-w*.18,1.5,d/2+.02,.8,.7,.08);win.castShadow=false;
  if(two){const w2=box(root,lit,w*.2,3.2,d/2+.02,.7,.7,.08);w2.castShadow=false;}
  box(root,M.wood,w*.24,1.2,d/2+.04,.8,1.6,.1);
  if(rand()<.5)box(root,M.stone,w*.3,.5+h+roofH*.6,-d*.15,.5,roofH*1.2,.5);
  return{root};
 }
 // ---- Forge works: an open smithy with a glowing hearth and a fat chimney.
 function buildForgeWorks(){
  const root=new T.Group();root.name='ForgeWorks';
  stone(root,0,.3,0,9,.6,7);
  for(const sx of [-1,1])for(const sz of [-1,1])box(root,M.wood,sx*3.8,2.2,sz*2.8,.35,3.6,.35);
  m(root,new T.BoxGeometry(10,.3,8),M.slate,0,4.3,0).rotation.z=.06;
  stone(root,-2.6,1.5,-1.5,2.6,2.4,2.2);
  const ember=new T.MeshStandardMaterial({color:0xffd0a0,emissive:0xff5a20,emissiveIntensity:2});
  const glow=box(root,ember,-2.6,1.9,-.35,1.6,.8,.12);glow.castShadow=false;
  const hearthLight=new T.PointLight(0xff6a28,1.2,10);hearthLight.position.set(-2.4,2,0);root.add(hearthLight);
  cyl(root,M.stone,-2.6,5.4,-1.5,.7,.9,5,10);
  box(root,M.wood,1.6,1,0,2.4,.8,1.2);
  cyl(root,M.dark,1.6,1.55,0,.45,.5,.3,10);
  return{root,tick(t){ember.emissiveIntensity=1.6+.6*Math.sin(t*7)+.3*Math.sin(t*17);hearthLight.intensity=1+.4*Math.sin(t*9);}};
 }


 // ---- Lite landmarks. The town is a light hub: clicking a landmark opens its
 // full ARCHITECTURE page, so these only echo the real silhouettes cheaply.
 function buildArchiveLite(){
  const root=new T.Group();root.name='ArchiveLite';
  const lit=warm();
  const cool=new T.MeshStandardMaterial({color:0xb8e7ff,emissive:0x36b9ff,emissiveIntensity:1.8});
  const books=new T.MeshStandardMaterial({color:0x6e4c30,roughness:.92});
  // two stone storeys, like the real lower halls
  cyl(root,M.stone,0,.35,0,9.5,9.5,.7,40);
  cyl(root,M.stone,0,3.6,0,8.9,9.3,6,40);
  cyl(root,M.brass,0,6.8,0,9.4,9.4,.45,40);
  cyl(root,M.stone,0,9.6,0,8.2,8.6,5,40);
  cyl(root,M.slate,0,12.3,0,8.9,8.9,.5,40);
  for(let j=0;j<12;j++){const a=j*Math.PI/6,w=box(root,lit,Math.sin(a)*8.75,3.8,Math.cos(a)*8.75,1.1,2.4,.35);w.rotation.y=a;w.castShadow=false;}
  box(root,M.dark,0,3.1,9.15,3.4,4.8,.8);
  const arch=box(root,cool,0,3.2,9.2,2.2,3.6,.5);arch.castShadow=false;
  // five catalogue tiers: slowly turning book drums inside crystal sleeves
  const tiers=[[7.6,15.8],[6.7,21.6],[5.8,27.2],[4.9,32.4],[4.0,37.2]];
  const spin=[];
  for(const [r,y] of tiers){
   spin.push(cyl(root,books,0,y,0,r-.7,r-.7,4.6,28));
   cyl(root,M.glass,0,y,0,r+.35,r+.35,5.4,28).castShadow=false;
   cyl(root,M.brass,0,y+2.85,0,r+.42,r+.42,.22,28);
  }
  cyl(root,M.brass,0,40.6,0,.6,2.2,3.4,20);
  const orb=m(root,new T.SphereGeometry(1.7,20,14),cool,0,43.2,0);orb.castShadow=false;
  const lamp=new T.PointLight(0x66d4ff,2,60);lamp.position.set(0,43.2,0);root.add(lamp);
  // short ceremonial steps toward the south boulevard (climbable at town scale)
  for(let j=0;j<6;j++){const h=(6-j)*.32;box(root,M.stone,0,h/2-.05,9.6+j*.5,4.6,h,.55);}
  return{root,tick(t){for(let i=0;i<spin.length;i++)spin[i].rotation.y=t*(i%2?-.05:.04);orb.material.emissiveIntensity=1.5+.5*Math.sin(t*2);}};
 }
 function buildDepotLite(){
  const root=new T.Group();root.name='DepotLite';
  const lit=warm();
  stone(root,0,.4,0,12,.8,9);
  box(root,M.wood,0,3,0,10.5,4.4,7.5);
  box(root,M.slate,0,5.6,0,11.4,1,8.4);
  box(root,M.dark,0,2.2,3.8,3.4,3.2,.3);
  for(const x of [-3.4,3.4]){const w=box(root,lit,x,3.2,3.79,1.3,1.2,.12);w.castShadow=false;}
  // the crane, sketched: mast, jib, cable, one crate
  cyl(root,M.brass,5.4,4.5,-2.5,.22,.28,8,12);
  box(root,M.brass,7.3,8.2,-2.5,4.2,.3,.3);
  cyl(root,M.dark,9.2,6.7,-2.5,.05,.05,3,8);
  box(root,M.wood,9.2,4.9,-2.5,.9,.9,.9);
  const lamp=new T.PointLight(0xffa324,1.2,25);lamp.position.set(0,4.5,4.5);root.add(lamp);
  return{root};
 }

 return{buildLighthouse,buildHall,buildShop,buildStall,buildHouse,buildForgeWorks,buildArchiveLite,buildDepotLite,helpers:{g,m,box,cyl,stone,windowLit,warm}};
}

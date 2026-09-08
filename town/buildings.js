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

 return{buildLighthouse,helpers:{g,m,box,cyl,stone,windowLit,warm}};
}

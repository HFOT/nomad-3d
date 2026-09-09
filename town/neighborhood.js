import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A masonry/timber kit with recessed windows, pitched roofs and usable lanes.
// Static parts are batched per material once, with no per-house draw overhead.
export function buildNeighborhood(exclusions=[],streets=[]){
 const root=new T.Group();root.name='Living quarters';
 const buckets=new Map();let seed=471;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function texture(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#817968';g.fillRect(0,0,512,512);for(let y=0;y<512;y+=32)for(let x=-32;x<512;x+=64){const v=105+random()*55;g.fillStyle=`rgb(${v},${v*.92},${v*.79})`;g.fillRect(x+(y%64?32:0)+1,y+1,62,30);}for(let i=0;i<24000;i++){g.fillStyle=random()<.5?'#ffffff0b':'#0000000c';g.fillRect(random()*512,random()*512,1,2);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
 const tex=texture(),M={stone:new T.MeshStandardMaterial({color:0xc5ba9e,map:tex,bumpMap:tex,bumpScale:.12,roughness:.94}),wood:new T.MeshStandardMaterial({color:0x38261a,roughness:.86}),trim:new T.MeshStandardMaterial({color:0x967044,roughness:.73}),roof:new T.MeshStandardMaterial({color:0x283943,roughness:.76,metalness:.16}),dark:new T.MeshStandardMaterial({color:0x131718,roughness:.68}),gold:new T.MeshStandardMaterial({color:0xa78345,roughness:.34,metalness:.8}),window:new T.MeshStandardMaterial({color:0xffdca0,emissive:0xffab48,emissiveIntensity:.8,roughness:.24}),red:new T.MeshStandardMaterial({color:0x783d31,roughness:.98,side:T.DoubleSide}),cream:new T.MeshStandardMaterial({color:0xbca787,roughness:.98,side:T.DoubleSide}),soil:new T.MeshStandardMaterial({color:0x3c3825,roughness:1}),leaf:new T.MeshStandardMaterial({color:0x4c5838,roughness:1})};
 tex.anisotropy=8;
 const grain=document.createElement('canvas');grain.width=grain.height=256;const gx=grain.getContext('2d');gx.fillStyle='#a89475';gx.fillRect(0,0,256,256);for(let i=0;i<1600;i++){gx.strokeStyle=i%2?'#3a25152b':'#ead6af29';gx.beginPath();const x=random()*256;gx.moveTo(x,0);gx.bezierCurveTo(x+random()*8,80,x-random()*8,170,x,256);gx.stroke();}const woodMap=new T.CanvasTexture(grain);woodMap.colorSpace=T.SRGBColorSpace;M.wood.map=woodMap;M.trim.map=woodMap;M.wood.bumpMap=woodMap;M.wood.bumpScale=.025;
 const object=new T.Object3D();let transform=new T.Matrix4();const bounds=[];
 function part(geo,mat,x,y,z,rx=0,ry=0,rz=0){object.position.set(x,y,z);object.rotation.set(rx,ry,rz);object.updateMatrix();geo.applyMatrix4(object.matrix).applyMatrix4(transform);if(!buckets.has(mat))buckets.set(mat,[]);buckets.get(mat).push(geo);}
 const box=(mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>part(new T.BoxGeometry(w,h,d),mat,x,y,z,rx,ry,rz);
 function window(x,y,z,w=1.05,h=1.3){box(M.dark,x,y,z,w+.25,h+.25,.22);box(M.window,x,y,z+.125,w,h,.035);for(const s of [-1,1])box(M.trim,x+s*(w/2+.08),y,z+.20,.12,h+.35,.2);for(const s of [-1,1])box(M.trim,x,y+s*(h/2+.07),z+.21,w+.4,.13,.23);box(M.wood,x,y,z+.23,.07,h,.09);box(M.wood,x,y+.1,z+.23,w,.075,.09);box(M.stone,x,y-h/2-.2,z+.15,w+.55,.19,.6);}
 function house(x,z,a,shop=false,shady=false){
  if(exclusions.some(b=>x>b.min.x-4&&x<b.max.x+4&&z>b.min.z-4&&z<b.max.z+4))return;
  for(let k=0;k<6;k++){
   const angle=Math.PI-k*Math.PI/3,dx=Math.sin(angle),dz=Math.cos(angle),r=x*dx+z*dz,lateral=x*dz-z*dx;
   if(r>18&&r<119&&Math.abs(lateral)<8.1)return;
   if(r>28&&r<96&&Math.abs(lateral-10.5)<4.8)return;
  }
  transform=new T.Matrix4().makeRotationY(a);transform.setPosition(x,0,z);
  const w=4.7+random()*.6,d=5.1+random()*.9,h=5+random()*1.3;
  bounds.push({x,z,r:Math.hypot(w,d)/2});
  box(M.stone,0,.25,0,w+.4,.5,d+.4);box(M.stone,0,h/2+.5,0,w,h,d);
  for(const sx of [-1,1])for(const sz of [-1,1])box(M.wood,sx*w/2,h/2+.5,sz*d/2,.22,h,.22);
  for(const y of [1,3.25,h+.5]){box(M.wood,0,y,d/2+.04,w+.2,.2,.2);box(M.wood,0,y,-d/2-.04,w+.2,.2,.2);}
  window(-w*.25,4.35,d/2+.05);window(w*.25,4.35,d/2+.05);
  // Back windows and shutters make the alley a finished elevation too.
  box(M.dark,0,3.9,-d/2-.08,1.4,1.3,.2);for(const s of [-1,1])box(M.trim,s*.4,3.9,-d/2-.2,.7,1.35,.1);
  box(M.dark,w*.23,1.65,d/2+.12,1.15,2.3,.18);box(M.wood,w*.23,1.65,d/2+.23,.98,2.15,.10);for(let j=0;j<5;j++)box(M.trim,w*.23-.43+j*.21,1.65,d/2+.29,.025,2.04,.03);part(new T.SphereGeometry(.055,8,6),M.gold,w*.23+.3,1.6,d/2+.34);
  window(-w*.25,1.9,d/2+.06,shop?1.65:1.05,1.45);
  box(M.stone,w*.23,.25,d/2+.65,1.7,.25,.75);
  // Closed triangular gables, two pitched roof slopes, individual overlapping
  // slate courses and a continuous ridge cap (no floating roof slabs).
  const roofY=h+.65,rise=1.8,half=w/2+.48,len=Math.hypot(half,rise),angle=Math.atan2(rise,half);
  const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();
  for(const s of [-1,1])part(new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false}),M.stone,0,roofY,s*d/2);
  for(const s of [-1,1]){box(M.roof,s*half/2,roofY+rise/2,0,len,.16,d+1,0,0,-s*angle);for(let row=0;row<7;row++){const f=(row+.5)/7;for(let j=0;j<9;j++){const zz=-(d+.7)/2+j*(d+.7)/8;box(M.roof,s*half*f,roofY+rise*(1-f)+.12,zz,len/7+.08,.065,(d+.8)/9-.025,0,0,-s*angle);}}}
  box(M.gold,0,roofY+rise+.12,0,.17,.18,d+1.12);
  box(M.stone,-w*.26,roofY+1.7,-d*.22,.65,2.1,.75);box(M.dark,-w*.26,roofY+2.8,-d*.22,.8,.18,.9);
  if(shop){const cloth=shady||random()<.35?M.red:M.cream;
   const canopy=new T.PlaneGeometry(w+.5,2.15,16,8),cp=canopy.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i),u=(cp.getY(i)+1.075)/2.15;cp.setXYZ(i,x,3.12-u*.35-.13*Math.sin(Math.PI*u)+.018*Math.sin(x*17),d/2+u*2.15);}canopy.computeVertexNormals();part(canopy,cloth,0,0,0);
   for(const s of [-1,1])box(M.wood,s*(w/2+.18),1.4,d/2+1.85,.1,2.8,.1);box(cloth,0,2.67,d/2+2.08,w+.5,.32,.06);box(M.wood,-w*.17,.85,d/2+1.25,2.2,.14,.75);for(let j=0;j<5;j++)box(M.trim,-1.15+j*.43,1.04,d/2+1.3,.31,.25,.47);}
  // Rainwater downpipe, brackets and ground barrel.
  part(new T.CylinderGeometry(.07,.07,h,8),M.gold,-w/2+.15,h/2+.4,d/2+.16);
  for(const y of [1.2,3.3,5])box(M.dark,-w/2+.15,y,d/2+.16,.2,.09,.26);
  part(new T.CylinderGeometry(.38,.34,.85,12),M.wood,-w/2-.6,.45,d/2-.4);for(const y of [.18,.7])part(new T.TorusGeometry(.365,.035,5,12),M.gold,-w/2-.6,y,d/2-.4,Math.PI/2);
 }
 // Houses take their addresses from the street network itself: every road or
 // alley (boulevards excepted — they stay open as designed) gets frontage on
 // both sides at a fixed setback, facing the carriageway. A slot that would
 // stand in another street, the canals, a landmark lot or a neighbour is
 // skipped, so blocks form between streets and nothing is ever paved under.
 const frames=streets.map(s=>{const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len=Math.hypot(dx,dz);return{ux:dx/len,uz:dz/len,len,cx:(s.a.x+s.b.x)/2,cz:(s.a.z+s.b.z)/2};});
 const gateDirs=[];for(let i=0;i<6;i++){const a=Math.PI-i*Math.PI/3;gateDirs.push([Math.sin(a),Math.cos(a)]);}
 const boulevard=s=>gateDirs.some(([dx,dz])=>Math.abs(s.a.x*dz-s.a.z*dx)<1&&Math.abs(s.b.x*dz-s.b.z*dx)<1);
 const distToStreet=(s,f,x,z)=>{const rx=x-f.cx,rz=z-f.cz,al=Math.max(0,Math.abs(rx*f.ux+rz*f.uz)-f.len/2),ac=Math.max(0,Math.abs(-rx*f.uz+rz*f.ux)-s.width/2);return Math.hypot(al,ac);};
 const inStreet=(x,z,margin)=>streets.some((s,i)=>distToStreet(s,frames[i],x,z)<margin);
 const RAD=3.9;
 function tryHouse(x,z,a,shop,shady){
  const r=Math.hypot(x,z);if(r<32||r>96)return false;
  if(inStreet(x,z,RAD+.2))return false;
  if(bounds.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+RAD-.5))return false;// neighbours sit one step apart
  const before=bounds.length;house(x,z,a,shop,shady);return bounds.length>before;
 }
 streets.forEach((s,i)=>{
  if(!s.kind||boulevard(s))return;
  const f=frames[i],px=-f.uz,pz=f.ux,mid=Math.hypot(f.cx,f.cz);
  // the wider, more central streets read as commercial: awnings and stalls
  const shop=s.width>=5&&mid<80,shady=s.kind==='alley'&&s.width<3.5;
  const setback=s.width/2+RAD+.7,step=7.6;
  for(const side of [-1,1]){
   const a=Math.atan2(-side*px,-side*pz);
   for(let t=-f.len/2+4.6;t<=f.len/2-4.6;t+=step)tryHouse(f.cx+f.ux*t+px*side*setback,f.cz+f.uz*t+pz*side*setback,a,shop,shady);
  }
 });
 transform.identity();
 // Courtyard wells, raised planting beds, and benches near the lane
 // intersections; each settles just off the carriageway.
 function settle(x,z){for(let k=0;k<3;k++){let moved=false;streets.forEach((s,i)=>{const f=frames[i],rx=x-f.cx,rz=z-f.cz,al=rx*f.ux+rz*f.uz,ac=-rx*f.uz+rz*f.ux;if(Math.abs(al)<f.len/2&&Math.abs(ac)<s.width/2+2.6){const push=(s.width/2+2.6-Math.abs(ac))*(ac<0?-1:1);x+=-f.uz*push;z+=f.ux*push;moved=true;}});if(!moved)break;}return[x,z];}
 for(const [x0,z0] of [[48,31],[47,-27],[-45,-28],[-39,3]]){const [x,z]=settle(x0,z0);
  part(new T.CylinderGeometry(1.2,1.35,.65,20),M.stone,x,.36,z);part(new T.CylinderGeometry(.86,.86,.04,20),M.dark,x,.7,z);part(new T.TorusGeometry(1.1,.18,8,24),M.stone,x,.77,z,Math.PI/2);
  for(const s of [-1,1])box(M.wood,x+s*1.1,1.65,z,.15,2.2,.15);box(M.wood,x,2.7,z,2.4,.15,.16);
  for(const dx of [-5,5]){box(M.stone,x+dx,.25,z,2.6,.45,1.6);box(M.soil,x+dx,.5,z,2.25,.1,1.25);for(let j=0;j<3;j++)part(new T.IcosahedronGeometry(.48,1),M.leaf,x+dx-.65+j*.65,.8,z);box(M.wood,x+dx,.68,z+2,2.2,.13,.6);for(const s of [-1,1])box(M.dark,x+dx+s*.8,.3,z+2,.13,.6,.4);}
 }
 for(const [mat,geos] of buckets){const parts=geos.map(g=>g.index?g.toNonIndexed():g);const g=mergeGeometries(parts);const m=new T.Mesh(g,mat);m.castShadow=m.receiveShadow=true;root.add(m);for(const geo of geos)geo.dispose();}
 root.userData.buildings=bounds.length;return {root,bounds};
}

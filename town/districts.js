import * as T from 'three';
import {buildStreetSurface} from './street-surface.js';
import {stoneSurface} from './groundwork.js';
import {buildCanalCrossings} from './canal-crossings.js';
import {LOTS} from './landmarks.js';

// The city is deliberately built before its landmark architecture.  These are
// permanent public works: roads, canals, quays, bridges, lamps and the plinths
// that reserve land for each institution.  Individual buildings can be placed
// on the lots without having to redraw the city around them.
export function buildDistrictInfrastructure(M){
  const root=new T.Group();root.name='HexCityInfrastructure';
  const animated=[];
  const streetSegments=[];
  const pavingCanvas=document.createElement('canvas');pavingCanvas.width=pavingCanvas.height=512;
  const pc=pavingCanvas.getContext('2d');pc.fillStyle='#665e51';pc.fillRect(0,0,512,512);
  for(let row=0;row<16;row++)for(let col=-1;col<9;col++){
    const x=col*64+(row%2)*32,y=row*32,v=130+23*Math.sin(row*12.8+col*21.6);
    pc.fillStyle=`rgb(${v+14},${v+5},${v-10})`;pc.fillRect(x+1.5,y+1.3,61,29.4);
    pc.fillStyle='#e2dac240';pc.fillRect(x+2,y+2,59,1.5);pc.fillStyle='#29261f44';pc.fillRect(x+3,y+28,58,2);
  }
  const pavingMap=new T.CanvasTexture(pavingCanvas);pavingMap.colorSpace=T.SRGBColorSpace;pavingMap.wrapS=pavingMap.wrapT=T.RepeatWrapping;pavingMap.anisotropy=8;
  const stone=new T.MeshStandardMaterial({color:0x82796b,roughness:.91,metalness:.03});
  const road=stoneSurface('street');road.color.setHex(0xded1b9);
  const alley=new T.MeshStandardMaterial({color:0x5c5651,roughness:1});
  const curb=new T.MeshStandardMaterial({color:0x544d45,roughness:.9,metalness:.04});
  const brass=new T.MeshStandardMaterial({color:0x9a7138,metalness:.83,roughness:.27});
  const iron=new T.MeshStandardMaterial({color:0x211d1c,metalness:.72,roughness:.29});
  const water=new T.MeshStandardMaterial({color:0x092531,metalness:.82,roughness:.17,transparent:true,opacity:.94});
  const wc=document.createElement('canvas');wc.width=wc.height=128;const wx=wc.getContext('2d'),wi=wx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4;wi.data[k]=128+24*Math.sin(x*.42+y*.27);wi.data[k+1]=128+19*Math.cos(y*.51-x*.18);wi.data[k+2]=250;wi.data[k+3]=255;}wx.putImageData(wi,0,0);const wave=new T.CanvasTexture(wc);wave.wrapS=wave.wrapT=T.RepeatWrapping;wave.repeat.set(18,18);water.normalMap=wave;water.normalScale=new T.Vector2(.32,.32);
  const glass=new T.MeshPhysicalMaterial({color:0xffd99a,emissive:0xff8a26,emissiveIntensity:.55,roughness:.08,metalness:.05,transparent:true,opacity:.52,transmission:.1,depthWrite:false});
  const fire=new T.MeshStandardMaterial({color:0xffefcf,emissive:0xff8625,emissiveIntensity:3.0,roughness:.28});
  const fireOuter=new T.MeshStandardMaterial({color:0xff9a35,emissive:0xff5a12,emissiveIntensity:2.0,transparent:true,opacity:.75,depthWrite:false});
  const mesh=(geo,mat,x=0,y=0,z=0,parent=root)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
  const box=(mat,x,y,z,w,h,d,parent=root)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);
  const cyl=(mat,x,y,z,r1,r2,h,seg=16,parent=root)=>mesh(new T.CylinderGeometry(r1,r2,h,seg),mat,x,y,z,parent);
  const path=(a,b,width,mat,y=.105)=>{
    if(mat===road||mat===alley){streetSegments.push({a:a.clone(),b:b.clone(),width,kind:mat===road?'road':'alley'});return new T.Group();}
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),o=box(mat,(a.x+b.x)/2,y,(a.z+b.z)/2,width,.08,len);
    o.rotation.y=Math.atan2(dx,dz);
    if(mat===road){const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width/4,uv.getY(i)*len/4);uv.needsUpdate=true;}
    return o;
  };
  const point=(angle,r)=>new T.Vector3(Math.sin(angle)*r,0,Math.cos(angle)*r);
  // Living-quarter frontages and the service alley share the same physical
  // street network; intersections terminate at a public lane, never at a wall.
  for(const [x,z1,z2,w] of [[-39,0,75,8],[-55,9,74,3.4]]){
    path(new T.Vector3(x,0,z1),new T.Vector3(x,0,z2),w,x===-39?road:alley,.13);
  }
  for(const z of [4,28,51,73])path(new T.Vector3(-55,0,z),new T.Vector3(-39,0,z),3,alley,.12);
  for(const [cx,cz] of [[47,47]]){
    for(const dz of [-15,-5,5,15])path(new T.Vector3(cx-17,0,cz+dz),new T.Vector3(cx+17,0,cz+dz),3,alley,.12);
    for(const dx of [-18,18])path(new T.Vector3(cx+dx,0,cz-17),new T.Vector3(cx+dx,0,cz+17),3.5,road,.12);
  }
  for(let k=0;k<6;k++){
    const a=Math.PI-(k+.5)*Math.PI/3,p=point(a,88),side=new T.Vector3(Math.cos(a),0,-Math.sin(a));
    path(point(a,62),point(a,109),3.6,road,.14);
    path(p.clone().addScaledVector(side,-18),p.clone().addScaledVector(side,18),5,road,.15);
  }
  // Civic entrances meet the public ring via generous approach streets.
  path(new T.Vector3(-28,0,-38),new T.Vector3(-46,0,-52),6.5,road,.16);
  path(new T.Vector3(28,0,-38),new T.Vector3(46,0,-52),6.5,road,.16);
  path(new T.Vector3(29,0,0),new T.Vector3(64,0,0),5.5,road,.16);

  // The formal centre is an empty constitutional forecourt.  Its double curb
  // protects an unbuilt plot while a water ring keeps every district connected.
  const plaza=new T.Mesh(new T.RingGeometry(16.5,17.35,72),brass);plaza.rotation.x=-Math.PI/2;plaza.position.y=.135;plaza.receiveShadow=true;root.add(plaza);
  const innerCurb=new T.Mesh(new T.RingGeometry(17.35,18.15,72),curb);innerCurb.rotation.x=-Math.PI/2;innerCurb.position.y=.12;root.add(innerCurb);
  const canal=new T.Mesh(new T.RingGeometry(23.2,28.4,96),water);canal.rotation.x=-Math.PI/2;canal.position.y=.075;canal.receiveShadow=true;root.add(canal);
  const canalRail=new T.Mesh(new T.RingGeometry(28.35,29.0,96),stone);canalRail.rotation.x=-Math.PI/2;canalRail.position.y=.13;root.add(canalRail);
  const canalInnerRail=new T.Mesh(new T.RingGeometry(22.55,23.2,96),stone);canalInnerRail.rotation.x=-Math.PI/2;canalInnerRail.position.y=.13;root.add(canalInnerRail);
  for(const [r1,r2,mat,y] of [[118,124,water,.09],[116.8,118,stone,.18],[124,125.2,stone,.18]]){const m=new T.Mesh(new T.RingGeometry(r1,r2,6,1,Math.PI/2),mat);m.rotation.x=-Math.PI/2;m.position.y=y;root.add(m);}

  // Six boulevards make the defensive geometry usable.  Each runs gate →
  // bridge → central forecourt, with a narrow blue service-water branch beside it.
  const GATE_R=131,BRIDGE_R=25.7;
  for(let i=0;i<6;i++){
    const a=Math.PI-i*Math.PI/3,dir=point(a,1),perp=new T.Vector3(dir.z,0,-dir.x);
    const gate=point(a,GATE_R),edge=point(a,BRIDGE_R+2),inside=point(a,15.8);
    path(gate,edge,8.4,road,.115);
    path(point(a,117),point(a,128),9.3,stone,.27);
    for(const side of [-1,1]){path(point(a,117).addScaledVector(perp,side*4.45),point(a,128).addScaledVector(perp,side*4.45),.17,brass,.85);for(let r=117;r<=128;r+=2.2){const p=point(a,r).addScaledVector(perp,side*4.45);cyl(brass,p.x,.53,p.z,.10,.14,1,10);}}
    path(point(a,BRIDGE_R-2),inside,8.4,road,.115);
    // Raised, brass-pinned bridge deck where the boulevard crosses the ring canal.
    const bridge=path(point(a,22.2),point(a,29.3),9.3,stone,.30);bridge.name='CanalBridge';
    for(const s of [-1,1]){
      const rail=path(point(a,22.2).addScaledVector(perp,s*4.35),point(a,29.3).addScaledVector(perp,s*4.35),.24,brass,.82);
      rail.name='BridgeRail';
      for(let k=0;k<4;k++){const p=point(a,23.2+k*1.85).addScaledVector(perp,s*4.35);cyl(brass,p.x,.62,p.z,.12,.15,.9,10);}
    }
    for(const r of [22.6,24.6,26.6,28.6]){const p=point(a,r);const pin=cyl(brass,p.x,.37,p.z,.38,.38,.14,16);pin.name='BridgePin';}
    // Masonry bridge abutments descend to the water bed. Voussoirs follow a
    // shallow arch on both elevations, with a supported deck and keystone.
    for(const side of [-1,1]){
      for(const r of [22.2,29.3]){const p=point(a,r).addScaledVector(perp,side*3.8);const ab=box(stone,p.x,-.69,p.z,1.15,1.75,1.5);ab.rotation.y=a;}
      for(let j=0;j<15;j++){
        const u=j/14, r=22.4+u*6.7, p=point(a,r).addScaledVector(perp,side*4.1);
        const v=box(stone,p.x,-.55+.34*Math.sin(u*Math.PI),p.z,.44,.42,.49);v.rotation.y=a;
      }
    }
    // Service water channels split inside every wedge.  They form future
    // drainage and energy routes, not decorative blue stripes.
    const channelA=point(a,25.8).addScaledVector(perp,10.5),channelB=point(a,91).addScaledVector(perp,10.5);
    const ch=path(channelA,channelB,2.3,water,.09);ch.name='DistrictCanal';
    for(const s of [-1,1])path(channelA.clone().addScaledVector(perp,s*1.42),channelB.clone().addScaledVector(perp,s*1.42),.32,stone,.18);
    // Crossings are generated from actual streets below; no orphan bridge slabs.
  }

  // A secondary hexagonal lane creates real back streets: the pieces do not
  // merely trace a circle, they become short, walkable segments between plots.
  const laneR=67;
  const lane=[];for(let i=0;i<6;i++)lane.push(point(Math.PI-i*Math.PI/3,laneR));
  for(let i=0;i<6;i++){
    const a=lane[i],b=lane[(i+1)%6];path(a,b,4.1,alley,.115);
    const d=b.clone().sub(a),len=d.length(),n=Math.floor(len/4.4);
    const tangent=d.normalize(),side=new T.Vector3(tangent.z,0,-tangent.x);
    // Close-spaced curb blocks make this read as a service lane from overhead
    // and provide believable drainage boundaries from the ground.
  }

  // Dead ends read as unfinished streets. Every road or alley end that meets
  // nothing is walked forward along its own line: if another street, the canal
  // quay or the forecourt ring lies ahead, the segment grows to meet it; a
  // building lot stops the walk; and where nothing lies ahead a small turning
  // court makes the terminus deliberate.
  resolveDeadEnds(streetSegments,LOTS);
  // Continuous pedestrian circuits close the centre and the outer promenade.
  // Bridges enter the same street registry so geometry and walking tests agree.
  for(let k=0;k<24;k++){const a=k*Math.PI/12,b=(k+1)*Math.PI/12;streetSegments.push({a:point(a,21.3),b:point(b,21.3),width:2.5,kind:'promenade'});}
  for(let k=0;k<6;k++){
    const a=Math.PI-k*Math.PI/3,b=Math.PI-(k+1)*Math.PI/3;
    streetSegments.push({a:point(a,114.5),b:point(b,114.5),width:3,kind:'promenade'});
    streetSegments.push({a:point(a,22.2),b:point(a,29.3),width:8.4,kind:'bridge'});
  }
  const streets=buildStreetSurface(streetSegments,road,stone);root.add(streets);
  const crossings=buildCanalCrossings(streetSegments,stone,brass);root.add(crossings);
  function lantern(x,z,scale=1){
    const g=new T.Group();g.name='FlameStreetLantern';g.position.set(x,0,z);root.add(g);
    cyl(iron,0,.10,0,.44,.52,.2,14,g);cyl(brass,0,1.5,0,.08,.11,2.8,10,g);
    cyl(brass,0,2.92,0,.38,.48,.16,12,g);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;const bar=box(iron,Math.sin(a)*.33,3.28,Math.cos(a)*.33,.06,.72,.06,g);bar.rotation.y=-a;}
    const globe=cyl(glass,0,3.30,0,.31,.31,.62,16,g);globe.castShadow=false;
    const flameShape=new T.LatheGeometry([new T.Vector2(0,-.15),new T.Vector2(.13,-.10),new T.Vector2(.17,0),new T.Vector2(.12,.12),new T.Vector2(.065,.23),new T.Vector2(0,.39)],16);
    const outer=mesh(flameShape,fireOuter,0,3.19,0,g);outer.scale.set(.85,1,.85);outer.castShadow=false;
    const core=mesh(flameShape.clone(),fire,0,3.15,0,g);core.scale.set(.52,.8,.52);core.castShadow=false;
    cyl(brass,0,3.68,0,.20,.38,.13,12,g);cyl(brass,0,3.86,0,.07,.18,.26,10,g);
    g.scale.setScalar(scale);
    const light=new T.PointLight(0xff9e36,.55*scale,10*scale);light.position.y=3.28;/* local light pools use ground decals; avoid dozens of scene-wide light uniforms */
    const pool=new T.Mesh(new T.CircleGeometry(2.3,20),new T.MeshBasicMaterial({color:0xffa951,transparent:true,opacity:.09,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.y=.19;g.add(pool);
    animated.push(t=>{const w=.84+.16*Math.sin(t*8+x*.21+z*.13)+.07*Math.sin(t*17+x);core.scale.y=.9*w;outer.scale.y=.95*(.85+.15*Math.sin(t*11+z));outer.rotation.z=.09*Math.sin(t*6+x);fire.emissiveIntensity=2.7+.5*Math.sin(t*12+x);light.intensity=.42*scale+.16*Math.sin(t*9+z);});
  }
  // Boulevard lanterns are deliberately sparse so the future buildings carry
  // their own identity; pedestrian lanes receive smaller lamps.
  for(let i=0;i<6;i++){
    const a=Math.PI-i*Math.PI/3,dir=point(a,1),perp=new T.Vector3(dir.z,0,-dir.x);
    for(let r=36;r<112;r+=18){const p=point(a,r).addScaledVector(perp,(Math.floor(r/18)%2?4.9:-4.9));lantern(p.x,p.z,1);}
    for(let r=43;r<82;r+=20){const p=point(a,r).addScaledVector(perp,12.4);lantern(p.x,p.z,.72);}
  }
  for(const z of [6,22,38,54,70]){lantern(-42.5,z,.85);lantern(-35.5,z+5,.85);lantern(-55,z,.67);}

  // Canal water receives a small physical drift; all flame behavior is native
  // to each lantern rather than a screen-space visual effect.
  function isWater(x,z){const r=Math.hypot(x,z);let bridge=false,hexR=0,branch=false;
    for(let k=0;k<6;k++){const a=Math.PI-k*Math.PI/3,along=x*Math.sin(a)+z*Math.cos(a),across=x*Math.cos(a)-z*Math.sin(a);if(along>0&&Math.abs(across)<4.65)bridge=true;if(along>25.8&&along<91&&Math.abs(across-10.5)<1.15)branch=true;const n=a-Math.PI/6;hexR=Math.max(hexR,(x*Math.sin(n)+z*Math.cos(n))/Math.cos(Math.PI/6));}
    const roadCrossing=streetSegments.some(s=>{const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,l2=dx*dx+dz*dz,t=((x-s.a.x)*dx+(z-s.a.z)*dz)/l2;if(t<0||t>1)return false;return Math.abs((x-s.a.x)*dz-(z-s.a.z)*dx)/Math.sqrt(l2)<s.width/2;});
    return (branch&&!roadCrossing)||(!bridge&&!roadCrossing&&((r>23.2&&r<28.4)||(hexR>118&&hexR<124)));
  }
  root.traverse(o=>{if(o.isMesh&&o.material===water)o.position.y=-.65;});
  return {root,isWater,streets:streetSegments,tick(t){wave.offset.set(t*.008,t*.004);water.color.setHSL(.55,.64,.10+.008*Math.sin(t*.55));for(const f of animated)f(t);}};
}

function resolveDeadEnds(segs,lots){
 const frame=s=>{const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len=Math.hypot(dx,dz);return{ux:dx/len,uz:dz/len,len,cx:(s.a.x+s.b.x)/2,cz:(s.a.z+s.b.z)/2};};
 const inside=(s,f,x,z,pad=0)=>{const rx=x-f.cx,rz=z-f.cz,al=rx*f.ux+rz*f.uz,ac=-rx*f.uz+rz*f.ux;return Math.abs(al)<=f.len/2+pad&&Math.abs(ac)<=s.width/2+pad;};
 // Ends that already belong somewhere: the forecourt (inside the plaza ring),
 // the canal zone with its bridges, and the outer quay.
 const onQuay=(x,z)=>{const r=Math.hypot(x,z);return r<=18.4||(r>=21.5&&r<=30);};
 const inLot=(x,z)=>lots.some(l=>Math.hypot(x-l.x,z-l.z)<l.r);
 const frames=segs.map(frame),courts=[],n=segs.length;
 const loose=(i,E)=>{if(Math.hypot(E.x,E.z)>=100||onQuay(E.x,E.z))return false;// moat banks and the wall zone end where they end
  for(let j=0;j<n;j++)if(j!==i&&inside(segs[j],frames[j],E.x,E.z,.6))return false;return true;};
 // Pass one grows streets to meet what lies ahead; pass two, on whatever is
 // still loose after every extension, lays the turning courts.
 for(let i=0;i<n;i++){
  const s=segs[i];
  for(const end of [0,1]){
   const f=frames[i],E=end?s.b:s.a,dx=end?f.ux:-f.ux,dz=end?f.uz:-f.uz;
   if(!loose(i,E))continue;
   let hit=-1;
   for(let t=1;t<=48&&hit<0;t+=.5){
    const x=E.x+dx*t,z=E.z+dz*t;
    if(inLot(x,z))break;
    if(onQuay(x,z)){hit=t;break;}
    for(let j=0;j<n;j++)if(j!==i&&inside(segs[j],frames[j],x,z)){hit=t;break;}
   }
   if(hit>0){const t=hit+.6;if(end)s.b.set(E.x+dx*t,0,E.z+dz*t);else s.a.set(E.x+dx*t,0,E.z+dz*t);frames[i]=frame(s);}
  }
 }
 for(let i=0;i<n;i++){
  const s=segs[i],f=frames[i];
  for(const end of [0,1]){
   const E=end?s.b:s.a,dx=end?f.ux:-f.ux,dz=end?f.uz:-f.uz,w=s.width;
   if(loose(i,E))courts.push({a:new T.Vector3(E.x-dx*w*.35,0,E.z-dz*w*.35),b:new T.Vector3(E.x+dx*w*.75,0,E.z+dz*w*.75),width:w*2.1});
  }
 }
 segs.push(...courts);
}

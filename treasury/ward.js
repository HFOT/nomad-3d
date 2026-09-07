import * as T from 'three';
// TREASURY — the community vault as a sleek machine, kept deliberately simple:
//   rounds  : withdrawals approved by DRep votes -> the mechanical chest counter
//             CATALYST wears, in digital cyan
//   energyM : ADA held, in millions -> the whole glossy suit slides from blue
//             metallic into flowing rainbow, and the gears on its back speed up
// Energy arrives as motes rising around it, drunk by the light horns and manifold.
export function addWard({root,rig,M,helpers:H}){
 const {sphere,box,cyl,torus,rod,curve}=H;
 const group=(p,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
 for(const name of ['ExpeditionPack','TempleRepair'])root.getObjectByName(name)?.removeFromParent();
 rig.antenna.visible=false;
 const gold=new T.MeshStandardMaterial({name:'Brass fittings',color:0xdfb969,metalness:.85,roughness:.24});
 const cyan=new T.MeshStandardMaterial({name:'Data glow',color:0xbdf2ff,emissive:0x2bb8ff,emissiveIntensity:4});
 const chroma=new T.MeshPhysicalMaterial({name:'Treasury chroma',color:0x2f6fb2,metalness:1,roughness:.3,clearcoat:.7,clearcoatRoughness:.15,iridescence:0,iridescenceIOR:1.9,iridescenceThicknessRange:[120,320]});

 // Black visor with a stream of analysis running across it.
 const hudCanvas=document.createElement('canvas');hudCanvas.width=1024;hudCanvas.height=128;
 {const g=hudCanvas.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,1024,128);
  g.font='700 30px Consolas,monospace';
  const glyphs='0123456789ABCDEF∆ΣΞ%+·ADA<>≡';
  for(let row=0;row<3;row++)for(let x=0;x<1024;x+=24){if(Math.random()<.8){
   g.fillStyle='rgba('+(110+(Math.random()*145|0))+',225,255,'+(0.3+Math.random()*.7).toFixed(2)+')';
   g.fillText(glyphs[Math.random()*glyphs.length|0],x,42+row*38);}}}
 const hudTex=new T.CanvasTexture(hudCanvas);hudTex.wrapS=T.RepeatWrapping;hudTex.colorSpace=T.SRGBColorSpace;
 const hudMat=new T.MeshStandardMaterial({name:'Analysis visor',color:0x04070b,roughness:.4,metalness:.1,emissive:0x9fe8ff,emissiveIntensity:1.5,emissiveMap:hudTex});
 // A solid VR headset: a real box over the eyes, nothing shows through.
 // The front face is the screen, streaming the analysis feed.
 const goggles=group(rig.head,'TechGoggles',0,-.13,0);
 const strap=torus(goggles,M.dark,0,.04,-.02,.80,.045,'y');strap.rotation.x=.05;
 const headset=group(goggles,'Headset',0,0,.58);
 box(headset,M.dark,0,0,0,1.16,.46,.50,.12);
 box(headset,chroma,0,0,.245,1.06,.38,.03,.012);
 const screen=new T.Mesh(new T.PlaneGeometry(.98,.30),hudMat);screen.name='HeadsetScreen';screen.position.set(0,0,.268);headset.add(screen);
 const scanline=box(headset,cyan,0,0,.274,.96,.014,.004,.002);scanline.name='VisorScanline';
 for(const s of [-1,1]){box(headset,chroma,s*.60,0,-.10,.10,.34,.30,.04);sphere(headset,cyan,s*.44,-.13,.272,.018)}

 // One clean crown band riding the dome (the head group is scaled down, so the
 // ring needs extra radius to clear the shell).
 torus(rig.head,chroma,0,.47,0,.90,.062,'y');
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;sphere(rig.head,gold,Math.cos(a)*.90,.47,Math.sin(a)*.90,.028)}
 // Buffalo horns of light: twin luminous curves sweeping out and up from the
 // crown. They are made of energy — and they are the mouths that drink it.
 const hornCore=new T.MeshStandardMaterial({name:'Light horn core',color:0xdff4ff,emissive:0x9fe8ff,emissiveIntensity:3,transparent:true,opacity:.92,depthWrite:false});
 const hornGlow=new T.MeshBasicMaterial({name:'Light horn glow',color:0x2bb8ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.22});
 const hornTips=[];
 for(const s of [-1,1]){
  const A=[s*.58,.30,.06],B=[s*.96,.16,.10],C=[s*1.10,.54,.04],D=[s*1.04,.92,-.04];
  curve(rig.head,hornCore,[A,B,C],.060);
  curve(rig.head,hornCore,[C,D],.036);
  curve(rig.head,hornGlow,[A,B,C],.092);
  curve(rig.head,hornGlow,[C,D],.062);
  const tip=group(rig.head,'HornTip',D[0],D[1],D[2]);
  sphere(tip,cyan,0,.03,0,.03);
  hornTips.push(tip);
 }

 // Chest counter, inherited from CATALYST.
 const counter=group(rig.body,'ApprovalCounter',0,.60,.62);
 box(counter,M.dark,0,0,0,.60,.34,.10,.03);
 torus(counter,M.edge,0,0,.045,.31,.018);
 const segOn=new T.MeshStandardMaterial({name:'Counter lit segment',color:0xbdf2ff,emissive:0x2bb8ff,emissiveIntensity:4});
 const segOff=new T.MeshStandardMaterial({name:'Counter dark segment',color:0x101820,roughness:.9});
 const DIGITS=[[1,1,1,1,1,1,0],[0,1,1,0,0,0,0],[1,1,0,1,1,0,1],[1,1,1,1,0,0,1],[0,1,1,0,0,1,1],[1,0,1,1,0,1,1],[1,0,1,1,1,1,1],[1,1,1,0,0,0,0],[1,1,1,1,1,1,1],[1,1,1,1,0,1,1]];
 function makeDigit(x){
  const g=group(counter,'Digit',x,0,.055);const L=.095,t=.026,d=.018;
  return [
   box(g,segOff,0,.112,0,L,t,d,.006),   box(g,segOff,.060,.057,0,t,L,d,.006),
   box(g,segOff,.060,-.057,0,t,L,d,.006),box(g,segOff,0,-.112,0,L,t,d,.006),
   box(g,segOff,-.060,-.057,0,t,L,d,.006),box(g,segOff,-.060,.057,0,t,L,d,.006),
   box(g,segOff,0,0,0,L,t,d,.006),
  ];
 }
 const digitTens=makeDigit(-.105),digitOnes=makeDigit(.105);
 function showRounds(n){
  n=T.MathUtils.clamp(Math.round(n)||0,0,99);
  const draw=(segs,v,blank)=>segs.forEach((s,i)=>s.material=(!blank&&DIGITS[v][i])?segOn:segOff);
  draw(digitTens,Math.floor(n/10),n<10);draw(digitOnes,n%10,false);
 }

 // The gear train on the back: a flywheel and two pinions, never idle.
 function gearWheel(parent,name,x,y,r,teeth,thick,mat){
  const g=group(parent,name,x,y,0);
  cyl(g,mat,0,0,0,r,thick,'z');
  for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2;const tooth=box(g,mat,Math.cos(a)*(r+.038),Math.sin(a)*(r+.038),0,.085,.06,thick*.92,.01);tooth.rotation.z=a;}
  cyl(g,gold,0,0,0,r*.22,thick*1.5,'z');
  return g;
 }
 const machine=group(rig.body,'VaultEngine',0,.28,-.86);
 box(machine,M.iron,0,0,.14,1.30,1.50,.10,.03);
 for(const s of [-1,1])rod(rig.body,M.leather,[s*.40,1.26,-.60],[s*.40,-.28,-.86],.045);
 const fly=gearWheel(machine,'Flywheel',0,.10,.42,18,.10,chroma);fly.position.z=-.10;
 const pinA=gearWheel(machine,'PinionA',-.52,.62,.22,10,.09,gold);pinA.position.z=-.10;
 const pinB=gearWheel(machine,'PinionB',.52,-.42,.22,10,.09,gold);pinB.position.z=-.10;
 torus(machine,cyan,0,.10,-.16,.50,.014,'z');
 // Two simple intakes, one per side, curving up like short snorkels. What they
 // drink runs down into the fuel tanks.
 const manifoldTips=[];
 for(const s of [-1,1]){
  curve(machine,chroma,[[s*.28,.60,-.06],[s*.46,.92,-.08],[s*.54,1.16,-.10]],.055);
  const tip=group(machine,'IntakeMouth',s*.54,1.16,-.10);
  cyl(tip,gold,0,.05,0,.078,.08);
  cyl(tip,M.dark,0,.098,0,.054,.02);
  torus(tip,cyan,0,.092,0,.064,.012,'y');
  manifoldTips.push(tip);
  curve(machine,M.iron,[[s*.54,1.08,-.10],[s*.68,.84,-.06],[s*.72,.60,-.02]],.032);
 }
 // Transparent fuel tanks: the liquid inside IS the funding. Its level reads
 // the amount at a glance, it drives the gears, and the engine burns it.
 const tankGlass=new T.MeshPhysicalMaterial({name:'Tank glass',color:0xd8ecf4,roughness:.06,metalness:0,transparent:true,opacity:.22,transmission:.6,thickness:0,depthWrite:false,side:T.DoubleSide});
 const fuelMat=new T.MeshStandardMaterial({name:'Liquid ADA fuel',color:0xffd98c,emissive:0xffa028,emissiveIntensity:2.2,transparent:true,opacity:.94});
 const tanks=[];
 for(const s of [-1,1]){
  const tank=group(machine,'FuelTank'+(s<0?'L':'R'),s*.72,.08,-.02);
  cyl(tank,gold,0,.52,0,.148,.05);
  cyl(tank,gold,0,-.52,0,.148,.05);
  cyl(tank,tankGlass,0,0,0,.135,1.0);
  const fuel=cyl(tank,fuelMat,0,-.48,0,.108,.94);fuel.geometry.translate(0,.5,0);fuel.scale.y=0;
  const bubbles=[sphere(tank,fuelMat,0,0,0,.016),sphere(tank,fuelMat,.04,0,0,.011)];
  curve(machine,M.iron,[[s*.72,-.46,-.02],[s*.55,-.74,-.02],[s*.18,-.88,-.02]],.032);
  tanks.push({fuel,bubbles});
 }
 // Rocket engine under the pack: the thrust that keeps the vault aloft.
 const rocket=group(machine,'RocketEngine',0,-.92,-.02);
 cyl(rocket,M.iron,0,.10,0,.13,.16);
 cyl(rocket,M.iron,0,-.06,0,.14,.18,'y',.26);
 torus(rocket,gold,0,-.16,0,.255,.022,'y');
 cyl(rocket,cyan,0,-.13,0,.20,.03);
 // A layered, believable plume: white-hot core, blue mantle, faint outer veil,
 // and shock diamonds down the axis. This flame is what carries the character.
 const plume=group(rocket,'RocketPlume',0,-.18,0);
 const coreMat=new T.MeshStandardMaterial({name:'Plume core',color:0xf3fbff,emissive:0xdff4ff,emissiveIntensity:9,transparent:true,opacity:.95,depthWrite:false});
 const midMat=new T.MeshStandardMaterial({name:'Plume mantle',color:0x9adcff,emissive:0x3ec2ff,emissiveIntensity:5,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide});
 const outMat=new T.MeshStandardMaterial({name:'Plume veil',color:0x7fb4ff,emissive:0x1b6bff,emissiveIntensity:2.2,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
 const lobe=(mat,r,len)=>{const pts=[[0,0],[r*.55,-.06*len],[r,-.30*len],[r*.72,-.62*len],[r*.34,-.85*len],[0,-len]].map(([x,y])=>new T.Vector2(Math.max(0,x),y));const m=new T.Mesh(new T.LatheGeometry(pts,28),mat);plume.add(m);return m};
 const core=lobe(coreMat,.10,.55);
 const mid=lobe(midMat,.16,.85);
 const outer=lobe(outMat,.23,1.15);
 const shocks=[];
 for(let i=0;i<3;i++)shocks.push(sphere(plume,coreMat,0,-.28-i*.20,0,.05-.011*i,.075-.014*i,.05-.011*i));
 const rocketLight=new T.PointLight(0x66ccff,1.4,3,2);rocketLight.position.y=-.55;rocket.add(rocketLight);

 // Hover: the boots end in exhaust ports; this machine does not stand.
 const jetMat=new T.MeshStandardMaterial({name:'Hover jet',color:0x9adcff,emissive:0x2bb8ff,emissiveIntensity:1.5,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});
 const jets=[];
 for(const s of [-1,1]){
  const port=group(rig['foot'+s],'ExhaustPort'+(s<0?'L':'R'),0,-.16,.02);
  cyl(port,M.iron,0,.03,0,.16,.08);
  torus(port,cyan,0,-.02,0,.125,.013,'y');
  const flame=new T.Mesh(new T.CylinderGeometry(.05,.14,.36,20,1,true),jetMat);flame.name='HoverJet';flame.position.y=-.22;port.add(flame);
  const jl=new T.PointLight(0x4fc3ff,.5,1.2,2);jl.position.y=-.25;port.add(jl);
  jets.push({flame,jl});
 }

 // Energy rises out of thin air around the base and streams to the antlers;
 // the senders stay unseen.
 const pylons=group(root,'EnergyField');
 const anchors=[];
 for(let i=0;i<6;i++){
  const a=i/6*Math.PI*2+.4;
  anchors.push(new T.Vector3(Math.cos(a)*1.85,.15,Math.sin(a)*1.85));
 }
 const motes=[];
 for(let i=0;i<10;i++){const m=sphere(pylons,cyan,0,0,0,.018);m.visible=false;motes.push({m,anchor:anchors[i%6],offset:i/10})}

 // Empty hands: the vault carries everything on its back.
 rig.lantern.clear();

 // Translucent holo screens floating around the character: live analysis,
 // rendered in light. Additive blending keeps everything but the ink invisible.
 function holoCanvas(draw){const c=document.createElement('canvas');c.width=256;c.height=160;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,256,160);g.strokeStyle='rgba(120,220,255,.85)';g.lineWidth=3;g.strokeRect(6,6,244,148);draw(g);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex}
 const screens=group(root,'HoloScreens');
 const holoDefs=[
  {size:[.94,.60],pos:[1.60,1.95,.60],rot:-.60,draw:g=>{g.fillStyle='rgba(140,230,255,.9)';for(let i=0;i<9;i++){const h=20+Math.random()*90;g.fillRect(20+i*25,140-h,16,h)}}},
  {size:[.98,.62],pos:[-1.65,1.50,.50],rot:.60,draw:g=>{g.fillStyle='rgba(140,230,255,.85)';g.font='700 19px Consolas,monospace';for(let r=0;r<6;r++)g.fillText('ADA '+(Math.random()*99).toFixed(2)+'M  ∆'+(Math.random()*9).toFixed(1)+'%',16,36+r*21)}},
  {size:[.84,.54],pos:[1.05,2.75,-.30],rot:-.35,draw:g=>{g.strokeStyle='rgba(140,230,255,.95)';g.lineWidth=4;g.beginPath();let y=120;g.moveTo(16,y);for(let x=16;x<=240;x+=16){y=110-Math.random()*70;g.lineTo(x,y)}g.stroke();g.font='700 24px Consolas,monospace';g.fillStyle='rgba(200,245,255,1)';g.fillText('TREASURY',18,34)}},
 ];
 const holos=holoDefs.map(d=>{
  const m=new T.Mesh(new T.PlaneGeometry(d.size[0],d.size[1]),
   new T.MeshBasicMaterial({name:'Holo screen',map:holoCanvas(d.draw),transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,opacity:.85}));
  m.name='HoloScreen';m.position.set(d.pos[0],d.pos[1],d.pos[2]);m.rotation.y=d.rot;
  m.userData.base={y:d.pos[1],rot:d.rot};screens.add(m);return m;
 });

 // rounds: withdrawals approved so far. energyM: ADA held, in millions (0-100).
 const state={rounds:4,energyM:50};
 let speed=0;
 function setState(v={}){
  if(v.rounds!==undefined&&Number.isFinite(Number(v.rounds)))state.rounds=T.MathUtils.clamp(Number(v.rounds),0,99);
  if(v.energyM!==undefined&&Number.isFinite(Number(v.energyM)))state.energyM=T.MathUtils.clamp(Number(v.energyM),0,100);
  showRounds(state.rounds);
  const q=state.energyM/100;
  tanks.forEach(({fuel})=>fuel.scale.y=q);
  fuelMat.emissiveIntensity=1.4+2.2*q;
  chroma.iridescence=q;
  chroma.roughness=.3-.18*q;
  chroma.iridescenceThicknessRange=[120,280+q*620];
  root.userData.simulation={...state,note:'Illustrative values; treasury withdrawals are approved by DRep votes with CC review'};
 }
 function tick(t,dt=0){
  const q=state.energyM/100;
  // One chroma for the whole shell: still blue when low, flowing rainbow when rich.
  const sweep=t*.08*q*q;
  M.teal.color.setHSL((.58+sweep)%1,.5+.28*q,.40+.08*q);
  M.teal.roughness=.26-.14*q;
  M.darkTeal.color.setHSL((.60+sweep)%1,.5+.28*q,.30+.06*q);
  M.rubber.color.setHSL((.585+sweep)%1,.4+.3*q,.22+.08*q);
  chroma.color.setHSL((.58+sweep)%1,.55+.2*q,.36+.12*q);
  // Never idle: the gears turn even when empty, and race toward full.
  const targetSpeed=2.5+q*14;
  speed=T.MathUtils.lerp(speed,targetSpeed,dt?1-Math.exp(-dt*2):1);
  const spin=speed*(dt||0);
  fly.rotation.z-=spin;
  pinA.rotation.z+=spin*(.42/.22);
  pinB.rotation.z+=spin*(.42/.22);
  segOn.emissiveIntensity=3.4+.6*Math.sin(t*6);
  cyan.emissiveIntensity=3.4+.8*Math.sin(t*8)+q*1.2;
  scanline.position.y=.10*Math.sin(t*1.7);
  hudTex.offset.x=-(t*.05)%1;
  if(dt>0){
   // Hover ride: applied after the mixer, so the baked clips stay untouched.
   rig.body.position.y+=.26+.05*Math.sin(t*2.1);
   rig.body.rotation.z+=.010*Math.sin(t*.9);
   rig.body.rotation.x+=.007*Math.sin(t*1.3+1);
   // Feet stay level while hovering: damp whatever rotation the clips gave them.
   for(const sd of [-1,1])rig['foot'+sd].rotation.x*=.15;
  }
  jets.forEach(({flame,jl},i)=>{const k=1+.3*Math.sin(t*(17+i*3))+.15*Math.sin(t*29+i);flame.scale.set(1,k,1);jetMat.opacity=.16+.06*Math.sin(t*23);jl.intensity=.3+.1*k;});
  const burn=1+.14*Math.sin(t*21)+.08*Math.sin(t*33)+q*.45;
  core.scale.set(1+.05*Math.sin(t*41),1+.16*Math.sin(t*31)+q*.35,1+.05*Math.cos(t*37));
  mid.scale.set(1+.07*Math.sin(t*23+1),burn,1+.07*Math.cos(t*29+1));
  outer.scale.set(1+.10*Math.sin(t*17+2),1+.24*Math.sin(t*19+2)+q*.5,1+.10*Math.cos(t*15+2));
  plume.rotation.y=t*2.2;
  shocks.forEach((d,i)=>d.visible=Math.sin(t*26+i*2.1)>-.35);
  rocketLight.intensity=1.2+.55*burn+.25*Math.sin(t*47);
  hornCore.emissiveIntensity=2.6+.7*Math.sin(t*3.1)+q*1.6;
  tanks.forEach(({bubbles},k)=>bubbles.forEach((b,i)=>{
   const lvl=q*.94,f=(t*(.30+.12*i)+i*.5+k*.33)%1;
   b.visible=lvl>.10;b.position.y=-.48+f*lvl;b.position.x=.035*Math.sin(t*3+i*2+k);
  }));
  hornGlow.opacity=.18+.06*Math.sin(t*5.3)+q*.10;
  holos.forEach((h,i)=>{
   h.position.y=h.userData.base.y+.06*Math.sin(t*1.1+i*2.1);
   h.rotation.y=h.userData.base.rot+.07*Math.sin(t*.7+i*1.4);
   h.material.opacity=.85+.13*Math.sin(t*9+i*2.6);
  });
  const active=state.energyM>0||state.rounds>0;
  const ports=[...hornTips,...manifoldTips].map(d=>{const v=new T.Vector3();d.getWorldPosition(v);pylons.worldToLocal(v);return v});
  motes.forEach(({m,anchor,offset},i)=>{
   if(!active){m.visible=false;return}
   const target=ports[i%ports.length];
   const f=(t*(.16+q*.22)+offset)%1;
   const lift=Math.sin(f*Math.PI);
   m.position.set(
    T.MathUtils.lerp(anchor.x,target.x,f),
    T.MathUtils.lerp(anchor.y,target.y,f)+lift*.5,
    T.MathUtils.lerp(anchor.z,target.z,f));
   m.scale.setScalar(.018*(1+.6*lift)*(1-f*.45));
   m.visible=true;
  });
 }
 setState({});
 return {state,setState,tick,animate(){}};
}

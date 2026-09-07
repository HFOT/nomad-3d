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

 // The suit shell is the body itself: closed cross-sections, no overlay plates.
 const clearMeshes=g=>{for(const o of [...g.children])if(o.isMesh)g.remove(o);};
 clearMeshes(rig.body);rig.body.getObjectByName('Torso').clear();rig.body.getObjectByName('Neck').clear();clearMeshes(rig.body.getObjectByName('Scarf'));
 function shell(parent,name,profile,mat=chroma,zOffset=0){
  const verts=[],uv=[],idx=[],N=48;
  // Each ring: y, half-width, half-depth, z centre. Rounded rectangular sections.
  profile.forEach(([y,w,d,zc=0],k)=>{for(let j=0;j<=N;j++){const a=j/N*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a);verts.push(Math.sign(cs)*Math.pow(Math.abs(cs),.72)*w,y,Math.sign(sn)*Math.pow(Math.abs(sn),.72)*d+zc+zOffset);uv.push(j/N,k/(profile.length-1));if(k<profile.length-1&&j<N){const n=k*(N+1)+j;idx.push(n,n+N+1,n+1,n+1,n+N+1,n+N+2);}}});
  for(const [k,reverse] of [[0,true],[profile.length-1,false]]){const r=profile[k],c=verts.length/3;verts.push(0,r[0],(r[3]||0)+zOffset);uv.push(.5,.5);for(let j=0;j<N;j++){const v=k*(N+1)+j;if(reverse)idx.push(c,v,v+1);else idx.push(c,v+1,v);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);return m;
 }
 shell(rig.body,'IntegralChest',[[.40,.47,.30],[.44,.54,.35],[.58,.64,.42],[.83,.69,.43],[.96,.64,.38],[1.07,.47,.29],[1.10,.32,.235]]);
 shell(rig.body,'WaistJoint',[[.00,.31,.23],[.47,.44,.29]],M.dark);
 for(let i=0;i<3;i++){const y=.08+i*.105,w=.34+i*.045;shell(rig.body,'AbdomenShell'+i,[[y,w,.265],[y+.02,w+.015,.28],[y+.09,w+.026,.29],[y+.098,w+.014,.275]]);}
 shell(rig.body,'PelvicHousing',[[-.30,.22,.20],[-.23,.38,.26],[-.08,.42,.29],[.04,.34,.25]]);
 cyl(rig.body,M.dark,0,1.13,0,.215,.12);torus(rig.body,M.iron,0,1.12,0,.245,.022,'y');
 for(const side of [-1,1]){
  // Surface-conforming chest channels; very shallow, never floating off the shell.
  curve(rig.body,M.dark,[[side*.18,1.02,.294],[side*.37,.94,.372],[side*.48,.81,.43]],.008);
  curve(rig.body,cyan,[[side*.25,.955,.375],[side*.39,.935,.386]],.008);
  const arm=rig['arm'+side],elbow=rig['elbow'+side],leg=rig['leg'+side],knee=rig['knee'+side],foot=rig['foot'+side],hand=rig['hand'+side];
  for(const g of [arm,elbow,leg,knee,foot,hand])clearMeshes(g);
  sphere(arm,M.dark,0,0,0,.155);sphere(elbow,M.dark,0,0,0,.108);sphere(leg,M.dark,0,0,0,.145);sphere(knee,M.dark,0,0,0,.12);
  shell(arm,'UpperArmMonocoque'+side,[[-.45,.105,.11],[-.40,.145,.145],[-.20,.18,.17],[-.09,.225,.20],[.04,.23,.205],[.12,.17,.16]]);
  shell(elbow,'ForearmMonocoque'+side,[[-.395,.10,.095],[-.37,.12,.12],[-.24,.165,.16],[-.12,.17,.17],[-.065,.125,.13]]);
  shell(leg,'ThighMonocoque'+side,[[-.435,.115,.12],[-.39,.145,.15],[-.21,.185,.18],[-.09,.195,.185],[-.035,.155,.15]]);
  shell(knee,'ShinMonocoque'+side,[[-.62,.105,.105],[-.57,.125,.14],[-.42,.15,.18],[-.20,.17,.19],[-.055,.145,.17]]);
  shell(foot,'IntegratedBoot'+side,[[-.31,.20,.29,.11],[-.29,.23,.33,.12],[-.19,.23,.34,.13],[-.12,.21,.30,.12],[.03,.17,.19,.02],[.13,.13,.13,0]]);
  shell(foot,'BootSole'+side,[[-.35,.205,.30,.11],[-.31,.22,.32,.12]],M.dark);
  shell(hand,'PalmHousing'+side,[[-.17,.105,.065],[-.14,.125,.08],[-.02,.12,.08],[.015,.085,.06]]);
  for(const joint of [elbow,knee]){for(const x of [-1,1]){cyl(joint,M.iron,x*.115,0,0,.073,.025,'x');cyl(joint,M.dark,x*.13,0,0,.039,.009,'x');}}
  // Engraved joint seams wrap around the circumference at the shell boundaries.
  for(const [joint,y,r] of [[elbow,-.35,.117],[leg,-.39,.144],[knee,-.55,.127]]){const band=torus(joint,M.dark,0,y,0,r,.006,'y');band.scale.z=1.06;}
  for(let f=0;f<4;f++){const digit=hand.getObjectByName('Finger_'+side+'_'+f);clearMeshes(digit);box(digit,chroma,0,-.043,.003,.047,.077,.047,.012);box(digit,M.dark,0,-.083,.003,.043,.012,.043,.003);box(digit,chroma,0,-.105,.008,.041,.036,.04,.010);}
 }

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
 // A fitted rear harness and articulated temple arms support the headset.
 curve(goggles,M.dark,[[-.69,.02,.43],[-.84,.03,.06],[-.73,.03,-.40],[0,.03,-.71],[.73,.03,-.40],[.84,.03,.06],[.69,.02,.43]],.065);
 box(goggles,M.iron,0,.03,-.75,.27,.20,.10,.035);
 for(const side of [-1,1]){
  box(goggles,chroma,side*.79,.015,.24,.12,.20,.47,.035);
  box(goggles,M.rubber,side*.54,0,.54,.18,.34,.18,.055);
  // One ear cup per side, seated on the harness line where the ear was:
  // headset, harness and ear are a single device.
  cyl(goggles,M.dark,side*.845,.06,.02,.235,.11,'x');
  torus(goggles,chroma,side*.905,.06,.02,.185,.026,'x');
  cyl(goggles,M.iron,side*.925,.06,.02,.12,.03,'x');
  sphere(goggles,cyan,side*.945,.06,.02,.022);
 }
 // Solid dog-leg hinge bridges the temple arm to the front housing.
 for(const side of [-1,1]){
  box(goggles,M.iron,side*.70,.012,.36,.29,.19,.20,.032);
  box(goggles,chroma,side*.70,.012,.40,.25,.13,.15,.025);
  cyl(goggles,M.iron,side*.79,.012,.40,.066,.035,'x');
  cyl(goggles,M.dark,side*.81,.012,.40,.030,.014,'x');
 }
 const headset=group(goggles,'Headset',0,0,.58);
 box(headset,M.dark,0,0,0,1.16,.46,.50,.12);
 box(headset,chroma,0,0,.245,1.06,.38,.03,.012);
 const screen=new T.Mesh(new T.PlaneGeometry(.98,.30),hudMat);screen.name='HeadsetScreen';screen.position.set(0,0,.268);headset.add(screen);
 for(const y of [-.168,.168])box(headset,M.iron,0,y,.285,1.04,.035,.07,.01);
 for(const x of [-.505,.505])box(headset,M.iron,x,0,.285,.035,.34,.07,.01);
 for(const x of [-.47,.47])for(const y of [-.15,.15])cyl(headset,gold,x,y,.326,.011,.012,'z');
 for(const side of [-1,1]){box(headset,M.iron,side*.55,0,-.30,.16,.30,.16,.035);for(let i=0;i<4;i++)box(headset,M.dark,side*.657,-.09+i*.06,-.10,.012,.023,.18,.003);}
 const scanline=box(headset,cyan,0,0,.274,.96,.014,.004,.002);scanline.name='VisorScanline';
 for(const s of [-1,1]){box(headset,chroma,s*.60,0,-.10,.10,.34,.30,.04);sphere(headset,cyan,s*.44,-.13,.272,.018)}

 // Buffalo horns of light: twin luminous curves sweeping out and up from the
 // crown. They are made of energy — and they are the mouths that drink it.
 const hornCore=new T.MeshStandardMaterial({name:'Light horn core',color:0xdff4ff,emissive:0x9fe8ff,emissiveIntensity:3,transparent:true,opacity:.92,depthWrite:false});
 const hornGlow=new T.MeshBasicMaterial({name:'Light horn glow',color:0x2bb8ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.22});
 const hornGlass=new T.MeshPhysicalMaterial({name:'Clear crystal horn shell',color:0xb9e5f5,metalness:0,roughness:.10,transmission:.72,thickness:.14,ior:1.46,transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide,clearcoat:1,clearcoatRoughness:.08});
 const hornTips=[];
 for(const side of [-1,1]){
  // Angular digital antlers: paired faceted rails and a luminous circuit inset.
  // Rooted at mid-face height and rising in one sweep: out, up, tip leaning
  // back in. No dip, less sideways sprawl, more mass.
  const pts=[[side*.47,.32,.32],[side*.79,.68,.31],[side*.99,.94,.20],[side*1.07,1.19,.11],[side*.99,1.43,.04],[side*.85,1.65,-.01]].map(p=>new T.Vector3(...p));
  const path=new T.CatmullRomCurve3(pts),frames=path.computeFrenetFrames(64,false);
  const vertices=[],indices=[];
  for(let i=0;i<=64;i++){const u=i/64,c=path.getPointAt(u),r=.137*Math.pow(1-u,.65)+.004;for(let j=0;j<=24;j++){const a=j/24*Math.PI*2,v=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);vertices.push(v.x,v.y,v.z);if(i<64&&j<24){const n=i*25+j;indices.push(n,n+25,n+1,n+1,n+25,n+26);}}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
  const shell=new T.Mesh(geo,hornGlass);shell.name='CrystalHorn'+side;shell.renderOrder=2;rig.head.add(shell);
  const neon=new T.Mesh(new T.TubeGeometry(path,80,.027,12,false),hornCore);neon.name='InternalNeon'+side;rig.head.add(neon);
  // No joint hardware: the horn simply grows out of the porcelain, its root
  // buried in the shell so the crystal emerges clean.
  const d=pts[5],tip=group(rig.head,'HornTip'+side,d.x,d.y,d.z);sphere(tip,cyan,0,0,0,.018);hornTips.push(tip);
 }

 // Chest counter, inherited from CATALYST.
 const counter=group(rig.body,'ApprovalCounter',0,.69,.443);
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
  // Annular web, six solid spokes, hub and a through axle.
 torus(g,mat,0,0,0,r*.80,r*.18);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(g,mat,[Math.cos(a)*r*.18,Math.sin(a)*r*.18,0],[Math.cos(a)*r*.79,Math.sin(a)*r*.79,0],r*.095);}
 cyl(g,M.iron,0,0,0,r*.25,thick*1.8,'z');
 torus(g,gold,0,0,-thick*.95,r*.17,.012);
 cyl(g,M.dark,0,0,-thick*1.12,r*.09,.035,'z');
  for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2;const tooth=box(g,mat,Math.cos(a)*(r+.038),Math.sin(a)*(r+.038),0,.085,.06,thick*.92,.01);tooth.rotation.z=a;}
  cyl(g,gold,0,0,0,r*.22,thick*1.5,'z');
  return g;
 }
 const machine=group(rig.body,'VaultEngine',0,.28,-.86);
 // A load-bearing enclosed engine casing, with a recessed service face.
 box(machine,M.iron,0,0,.16,1.34,1.52,.46,.09);
 box(machine,M.dark,0,0,-.088,1.16,1.32,.055,.045);
 for(const x of [-.61,.61])box(machine,chroma,x,0,-.15,.12,1.44,.14,.035);
 for(const y of [-.68,.68])box(machine,chroma,0,y,-.15,1.16,.12,.14,.035);
 for(const x of [-.59,.59])for(const y of [-.65,.65]){cyl(machine,gold,x,y,-.235,.036,.035,'z');box(machine,M.dark,x,y,-.255,.037,.008,.004,.001);}
 for(const side of [-1,1]){for(let i=0;i<6;i++)box(machine,M.dark,side*.678,-.40+i*.14,.17,.015,.06,.26,.009);box(machine,gold,side*.61,.73,.13,.12,.09,.28,.015);}
 // Real mounting blocks transfer the pack load to the torso.
 for(const x of [-.43,.43]){box(machine,M.iron,x,0,.43,.18,1.02,.17,.035);for(const y of [-.4,.4])cyl(machine,gold,x,y,.53,.045,.04,'z');}
 for(const s of [-1,1])rod(rig.body,M.leather,[s*.40,1.26,-.60],[s*.40,-.28,-.86],.045);
 const fly=gearWheel(machine,'Flywheel',0,.10,.42,18,.10,chroma);fly.position.z=-.29;
 const pinA=gearWheel(machine,'PinionA',-.49,.59,.22,10,.09,gold);pinA.position.z=-.29;
 const pinB=gearWheel(machine,'PinionB',.49,-.39,.22,10,.09,gold);pinB.position.z=-.29;
 torus(machine,cyan,0,.10,-.385,.50,.014,'z');
 for(const [x,y,r] of [[0,.10,.11],[-.49,.59,.07],[.49,-.39,.07]]){cyl(machine,gold,x,y,-.16,r,.22,'z');torus(machine,M.iron,x,y,-.21,r*.92,.019);}
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
  const fuel=cyl(tank,fuelMat,0,-.48,0,.108,.94);fuel.geometry.translate(0,.47,0);fuel.scale.y=0;
  for(const y of [-.37,.37]){torus(tank,gold,0,y,0,.145,.014,'y');box(tank,M.iron,-s*.14,y,.07,.14,.09,.15,.015);}
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])rod(tank,gold,[Math.cos(a)*.143,-.49,Math.sin(a)*.143],[Math.cos(a)*.143,.49,Math.sin(a)*.143],.009);
  for(let i=0;i<=8;i++)box(tank,gold,.065,-.43+i*.107,-.14,.025,.007,.009,.001);
  const bubbles=[sphere(tank,fuelMat,0,0,0,.016),sphere(tank,fuelMat,.04,0,0,.011)];
  curve(machine,M.iron,[[s*.72,-.46,-.02],[s*.55,-.74,-.02],[s*.18,-.88,-.02]],.032);
  tanks.push({fuel,bubbles});
 }
 // Rocket engine under the pack: the thrust that keeps the vault aloft.
 const rocket=group(machine,'RocketEngineL',-.36,-.92,-.02);rocket.scale.setScalar(.82);
 cyl(rocket,M.iron,0,.10,0,.13,.16);
 const bellProfile=[[.13,.04],[.15,-.02],[.20,-.10],[.26,-.16],[.225,-.16],[.168,-.08],[.115,.015],[.13,.04]].map(([r,y])=>new T.Vector2(r,y));
 const bell=new T.Mesh(new T.LatheGeometry(bellProfile,48),M.iron);bell.name='HollowRocketBell';bell.castShadow=bell.receiveShadow=true;rocket.add(bell);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(rocket,gold,[Math.cos(a)*.145,.015,Math.sin(a)*.145],[Math.cos(a)*.248,-.14,Math.sin(a)*.248],.008);}
 torus(rocket,M.dark,0,-.08,0,.175,.016,'y');
 torus(rocket,gold,0,-.16,0,.255,.022,'y');
 cyl(rocket,cyan,0,.015,0,.108,.022);
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

 // Second fully modelled thruster shares the same assembly, with its own light.
 const rocketR=rocket.clone(true);rocketR.name='RocketEngineR';rocketR.position.x=.36;machine.add(rocketR);
 const rightPlume=rocketR.getObjectByName('RocketPlume');
 for(const x of [-.36,.36]){box(machine,M.iron,x,-.78,.04,.26,.20,.30,.035);curve(machine,gold,[[x,-.53,.14],[x,-.71,.18],[x,-.89,.04]],.018);}

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
  chroma.roughness=.36-.08*q;
  chroma.iridescenceThicknessRange=[120,280+q*620];
  root.userData.simulation={...state,note:'Illustrative values; treasury withdrawals are approved by DRep votes with CC review'};
 }
 function tick(t,dt=0){
  const q=state.energyM/100;
  // One chroma for the whole shell: still blue when low, flowing rainbow when rich.
  const sweep=t*.08*q*q;
  M.teal.color.setHSL((.58+sweep)%1,.5+.28*q,.40+.08*q);
  M.teal.roughness=.36-.08*q;
  M.darkTeal.color.setHSL((.60+sweep)%1,.5+.28*q,.30+.06*q);
  M.rubber.color.setHSL((.585+sweep)%1,.4+.3*q,.22+.08*q);
  chroma.color.setHSL((.58+sweep)%1,.55+.2*q,.36+.12*q);
  // Never idle: the gears turn even when empty, and race toward full.
  const targetSpeed=2.5+q*14;
  speed=T.MathUtils.lerp(speed,targetSpeed,dt?1-Math.exp(-dt*2):1);
  const spin=speed*(dt||0);
  fly.rotation.z-=spin;
  pinA.rotation.z+=spin*(18/10);
  pinB.rotation.z+=spin*(18/10);
  segOn.emissiveIntensity=3.4+.6*Math.sin(t*6);
  cyan.emissiveIntensity=3.4+.8*Math.sin(t*8)+q*1.2;
  scanline.position.y=.10*Math.sin(t*1.7);
  hudTex.offset.x=-(t*.05)%1;
  if(dt>0){
   // Hover ride: applied after the mixer, so the baked clips stay untouched.
   root.position.y=.26+.05*Math.sin(t*2.1);
   rig.body.rotation.z+=.010*Math.sin(t*.9);
   rig.body.rotation.x+=.007*Math.sin(t*1.3+1);
   // Feet stay level while hovering: damp whatever rotation the clips gave them.
   for(const sd of [-1,1])rig['foot'+sd].rotation.x*=.15;
  }

  const burn=1+.14*Math.sin(t*21)+.08*Math.sin(t*33)+q*.45;
  core.scale.set(1+.05*Math.sin(t*41),1+.16*Math.sin(t*31)+q*.35,1+.05*Math.cos(t*37));
  mid.scale.set(1+.07*Math.sin(t*23+1),burn,1+.07*Math.cos(t*29+1));
  outer.scale.set(1+.10*Math.sin(t*17+2),1+.24*Math.sin(t*19+2)+q*.5,1+.10*Math.cos(t*15+2));
  plume.rotation.y=t*2.2;rightPlume.rotation.y=-t*2.2;rightPlume.scale.y=1+.09*Math.sin(t*27);
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

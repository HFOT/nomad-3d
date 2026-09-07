import * as T from 'three';
export function addWard({root,rig,M,helpers:H}){
 const {sphere,box,cyl,torus,rod}=H;
 const group=(p,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
 for(const name of ['ExpeditionPack','TempleRepair'])root.getObjectByName(name)?.removeFromParent();
 rig.antenna.visible=false;rig.lantern.clear();
 const gold=new T.MeshStandardMaterial({color:0xdfb969,metalness:.82,roughness:.27});
 const glow=new T.MeshStandardMaterial({color:0xffedbe,emissive:0xffc76b,emissiveIntensity:5});
 const violet=new T.MeshStandardMaterial({color:0x33313e,metalness:.45,roughness:.48});
 const flames=[];
 const glass=new T.MeshPhysicalMaterial({name:'Warm lantern glass',color:0xffddad,roughness:.12,metalness:0,transparent:true,opacity:.24,transmission:.55,thickness:0,depthWrite:false,side:T.DoubleSide});
 function lantern(parent,name,x,y,z,size=1,warning=false){
  const g=group(parent,name,x,y,z);g.scale.setScalar(size);
  cyl(g,gold,0,0,0,.105,.035);torus(g,gold,0,.022,0,.098,.009,'y');
  cyl(g,glass,0,.15,0,.089,.245);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(g,gold,[Math.cos(a)*.094,.02,Math.sin(a)*.094],[Math.cos(a)*.094,.282,Math.sin(a)*.094],.007)}
  cyl(g,gold,0,.29,0,.11,.027);cyl(g,gold,0,.322,0,.045,.042,'y',.105);sphere(g,gold,0,.354,0,.018);
  cyl(g,M.dark,0,.046,0,.03,.025);cyl(g,M.wick,0,.066,0,.009,.028);
  const mat=new T.MeshStandardMaterial({name:name+' flame',color:0xffbb4b,emissive:0xff7c19,emissiveIntensity:5,roughness:.5});
  const fire=group(g,name+'Fire',0,.075,0);
  const points=[[0,0],[.02,.012],[.027,.038],[.023,.067],[.013,.10],[.007,.13],[0,.16]].map(([r,h])=>new T.Vector2(r,h));
  const flame=new T.Mesh(new T.LatheGeometry(points,24),mat);fire.add(flame);
  const hot=new T.MeshStandardMaterial({name:name+' hot core',color:0xfff3d4,emissive:0xffdc83,emissiveIntensity:9});
  sphere(fire,hot,0,.039,.006,.012,.037,.012);
  let light=null;if(size>=1){light=new T.PointLight(0xffb354,.65,2,2);light.position.y=.16;g.add(light)}
  flames.push({fire,mat,hot,light,warning});return g;
 }

 // A single oversized lantern carries two distinct, interweaving flames.
 const highLamp=lantern(rig.head,'KnowledgeLantern',0,.99,-.04,3.45);
 cyl(rig.head,gold,0,.91,-.04,.24,.10);
 const first=flames[0];first.twin=-1;
 const secondFire=first.fire.clone(true);secondFire.name='KnowledgeSecondFlame';highLamp.add(secondFire);
 const secondMat=first.mat.clone(),secondHot=first.hot.clone();secondFire.traverse(o=>{if(o.isMesh)o.material=o.material===first.mat?secondMat:secondHot});
 flames.push({fire:secondFire,mat:secondMat,hot:secondHot,light:null,twin:1});
 first.fire.scale.set(.65,1,.65);secondFire.scale.set(.65,1,.65);
 // A giant bound volume is carried on the back, with exposed page edges and clasps.
 const archive=group(rig.body,'GreatArchive',0,1.04,-.99);
 box(archive,M.ivory,0,0,0,1.36,2.03,.35,.025);
 for(const z of [-.23,.23]){box(archive,violet,0,0,z,1.55,2.20,.09,.035);for(const x of [-.64,.64])box(archive,gold,x,0,z-.053,.024,1.95,.014,.003);for(const y of [-.94,.94])box(archive,gold,0,y,z-.053,1.28,.024,.014,.003);}
 box(archive,violet,-.76,0,0,.13,2.20,.53,.04);
 for(let i=0;i<5;i++)box(archive,gold,-.78,-.80+i*.40,0,.025,.055,.54,.006);
 for(let i=0;i<26;i++)box(archive,M.thread,.689,-.94+i*.075,0,.006,.005,.32,.001);
 for(const y of [-.6,.6]){box(archive,M.leather,.72,y,0,.17,.15,.57,.02);box(archive,gold,.72,y,-.30,.13,.12,.04,.01);}
 torus(archive,gold,0,0,-.29,.35,.018);box(archive,gold,0,0,-.30,.028,.52,.015,.004);
 for(const x of [-.5,.5])rod(rig.body,M.leather,[x,.2,-.69],[x,1.48,-.69],.045);
 // Green ceremonial mantle, ivory stole and brass embroidered seams.
 for(let i=0;i<16;i++){const a=.15+i/15*(Math.PI-.3);const x=Math.cos(a)*.64,z=-Math.sin(a)*.55;const panel=box(rig.body,violet,x,.23,z,.20,1.40,.12,.04);panel.rotation.z=-x*.12;rod(rig.body,gold,[x,-.42,z-.065],[x,.86,z-.065],.008)}
 for(const x of [-.40,.40]){box(rig.body,M.ivory,x,.53,.49,.15,.68,.07,.025);for(let i=0;i<5;i++)box(rig.body,gold,x,.31+i*.10,.535,.085,.012,.006,.001)}
 // Formal constitutional regalia: layered ivory collar, paired stoles and a charter seal.
 const regalia=group(rig.body,'ConstitutionalRegalia');
 for(const side of [-1,1]){
  const collar=box(regalia,M.ivory,side*.48,1.02,.34,.50,.13,.46,.05);collar.rotation.z=side*-.20;
  rod(regalia,gold,[side*.25,.97,.57],[side*.72,.88,.48],.014);
  const stole=group(regalia,'JudicialStole'+side,side*.46,.50,.59);stole.rotation.z=side*.10;
  box(stole,M.ivory,0,0,0,.20,.96,.055,.022);
  for(const x of [-.081,.081])box(stole,gold,x,0,.032,.012,.88,.009,.002);
  for(let j=0;j<7;j++){const y=.34-j*.115;box(stole,gold,0,y,.037,.10,.011,.006,.001);sphere(stole,gold,0,y-.033,.039,.011);}
  for(let j=0;j<5;j++)rod(stole,gold,[-.07+j*.035,-.48,0],[-.07+j*.035,-.60,0],.006);
 }
 // A monumental clasp on the carried constitution: open book surrounded by laurel leaves.
 const charter=group(archive,'CharterEmblem',0,.12,-.315);
 for(const side of [-1,1]){const cover=box(charter,gold,side*.115,0,0,.215,.30,.025,.006);cover.rotation.y=side*-.18;box(charter,M.ivory,side*.115,0,-.022,.18,.25,.012,.003);
 for(let j=0;j<7;j++){const a=-1.1+j*.34;const leaf=sphere(charter,gold,side*(.29+.10*Math.cos(a)),Math.sin(a)*.43,-.025,.033,.074,.012);leaf.rotation.z=side*(.5+a*.35);}}
 box(archive,gold,0,-.68,-.31,.78,.18,.025,.008);
 for(let j=0;j<6;j++)box(archive,M.dark,-.27+j*.108,-.68,-.328,.045,.07,.008,.002);
 // A segmented meridian on the lantern represents the scope of the charter.
 const meridian=torus(highLamp,gold,0,.155,0,.126,.004,'y');
 for(let j=0;j<12;j++){const a=j*Math.PI/6;sphere(highLamp,gold,Math.cos(a)*.126,.155,Math.sin(a)*.126,.006);}
 // Open constitutional folio, with visible binding, pages, ribbon and seal.
 const book=group(rig['hand-1'],'ConstitutionFolio',-.02,-.16,.14);book.rotation.set(-.25,0,-.16);
 for(const side of [-1,1]){const page=group(book,'ConstitutionPage'+side,side*.23,0,0);page.rotation.y=-side*.20;box(page,violet,0,0,0,.45,.61,.09,.025);for(let j=0;j<4;j++)box(page,M.ivory,0,0,.05+j*.012,.40,.56,.011,.003);for(let j=0;j<8;j++)box(page,gold,0,.20-j*.052,.103,.29-(j%3)*.03,.006,.005,.001);for(const y of [-.26,.26])box(page,gold,0,y,.106,.34,.012,.01,.003)}
 box(book,M.clothDark,.18,-.30,.13,.047,.30,.015,.004);cyl(book,gold,.18,-.14,.14,.075,.02,'z');torus(book,M.brass,.18,-.14,.155,.055,.008);
 // Open satellite books slowly circle the archivist; their pages gently flutter.
 const orbit=group(root,'OrbitingLibrary');const satellites=[];
 for(let i=0;i<5;i++){const g=book.clone(true);g.name='FlyingBook'+i;g.scale.setScalar(.66+(i%2)*.10);orbit.add(g);satellites.push(g);}
 // Bare flame hovers over the open palm, without a lantern enclosure.
 for(let i=0;i<4;i++){const finger=root.getObjectByName('Finger_1_'+i);if(finger)finger.rotation.x=-.18;}
 const magic=group(rig['hand1'],'PalmFlame',0,-.22,.24);
 const spellMat=new T.MeshStandardMaterial({name:'Constitution palm fire',color:0xffcc79,emissive:0xffa132,emissiveIntensity:5});
 const spellHot=new T.MeshStandardMaterial({color:0xfff2ce,emissive:0xffd98a,emissiveIntensity:8});
 const spellFire=group(magic,'ReviewLanternFire',0,0,0);
 const spellPoints=[[0,0],[.05,.025],[.072,.08],[.058,.15],[.03,.23],[.012,.31],[0,.38]].map(([r,h])=>new T.Vector2(r,h));
 spellFire.add(new T.Mesh(new T.LatheGeometry(spellPoints,32),spellMat));sphere(spellFire,spellHot,0,.10,0,.028,.084,.028);
 const spellLight=new T.PointLight(0xffbe72,.8,2,2);spellLight.position.y=.14;magic.add(spellLight);
 flames.push({fire:spellFire,mat:spellMat,hot:spellHot,light:spellLight});
 const sparks=[];for(let i=0;i<8;i++){const spark=sphere(magic,spellMat,0,0,0,.008);sparks.push(spark);}
 const core=group(rig.body,'ConstitutionSeal',0,.57,.65);cyl(core,M.dark,0,0,0,.255,.08,'z');torus(core,gold,0,0,.06,.24,.026);
 const sealMat=new T.MeshStandardMaterial({color:0xffdc9b,emissive:0xffba55,emissiveIntensity:2.3});
 const symbols={};for(const name of ['review','yes','no','abstain'])symbols[name]=group(core,'Vote_'+name,0,0,.10);
 torus(symbols.review,sealMat,0,0,0,.12,.016);rod(symbols.review,sealMat,[.08,-.08,0],[.16,-.16,0],.018);
 rod(symbols.yes,sealMat,[-.13,0,0],[-.03,-.09,0],.019);rod(symbols.yes,sealMat,[-.03,-.09,0],[.14,.12,0],.019);
 for(const s of [-1,1])rod(symbols.no,sealMat,[-.11,s*.11,0],[.11,-s*.11,0],.018);
 rod(symbols.abstain,sealMat,[-.13,0,0],[.13,0,0],.02);
 // Term clock is not a concentration meter.
 const clock=group(rig.body,'TermClock',.58,-.12,.38);cyl(clock,M.ivory,0,0,0,.14,.04,'z');torus(clock,gold,0,0,.027,.14,.016);const hand=group(clock,'TermHand',0,0,.055);rod(hand,M.dark,[0,0,0],[0,.10,0],.009);for(let i=0;i<12;i++){const a=i*Math.PI/6;sphere(clock,gold,Math.sin(a)*.114,Math.cos(a)*.114,.05,.008)}
 const state={vote:'review',confidence:true,term:100};
 function setState(v){if(['review','yes','no','abstain'].includes(v.vote))state.vote=v.vote;if(typeof v.confidence==='boolean')state.confidence=v.confidence;if(v.term!==undefined)state.term=T.MathUtils.clamp(Number(v.term)||0,0,100);root.userData.simulation={...state,note:'Illustrative CC review; no live votes; no-confidence and expiry are distinct'};}
 function tick(t,dt){const active=state.confidence&&state.term>0;const color={review:0xffbb55,yes:0x72dfbc,no:0xff6030,abstain:0x9db4d8}[state.vote];Object.entries(symbols).forEach(([k,g])=>g.visible=active&&k===state.vote);sealMat.color.setHex(active?color:0x626b69);sealMat.emissive.setHex(color);sealMat.emissiveIntensity=active?2:0;hand.rotation.z=-(1-state.term/100)*Math.PI*2;symbols.review.rotation.z=.09*Math.sin(t*.8);
 magic.quaternion.copy(rig.hand1.getWorldQuaternion(new T.Quaternion()).normalize().invert());
 sparks.forEach((spark,i)=>{const a=t*1.5+i*Math.PI/4;const h=(t*.18+i/8)%1;spark.visible=active;spark.position.set(Math.cos(a)*(.11-h*.06),h*.44,Math.sin(a)*(.11-h*.06));});
 satellites.forEach((g,i)=>{const a=t*.14+i*Math.PI*2/5;g.position.set(Math.cos(a)*1.85,1.9+(i%3)*.59+.11*Math.sin(t*1.2+i),Math.sin(a)*1.28);g.lookAt(0,2.75,0);g.rotateZ(.08*Math.sin(t*.8+i));g.children.slice(0,2).forEach((page,j)=>page.rotation.y=(j===0?1:-1)*(.22+.08*Math.sin(t*1.8+i)));});
 flames.forEach((f,i)=>{const pulse=1+.08*Math.sin(t*13+i*2)+.035*Math.sin(t*21+i);f.fire.visible=active;f.fire.scale.set(f.twin?.62:1,pulse,f.twin?.62:1);if(f.twin){f.fire.position.x=f.twin*.032*Math.cos(t*.85);f.fire.position.z=f.twin*.018*Math.sin(t*.85);f.fire.rotation.y=t*.3*f.twin;}f.fire.rotation.z=.09*Math.sin(t*5+i);const fireColor=f.twin?(f.twin===-1?0xffa132:0x62cfff):color;f.mat.color.setHex(fireColor);f.mat.emissive.setHex(fireColor);f.mat.emissiveIntensity=active?4.5*pulse:0;f.hot.emissiveIntensity=active?8*pulse:0;if(f.light){f.light.color.setHex(color);f.light.intensity=active?.65*pulse:0;}});
 }
 setState({});return {state,setState,tick,animate(){}};
}

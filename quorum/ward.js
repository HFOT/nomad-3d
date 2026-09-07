import * as T from 'three';
export function addWard({root,rig,M,helpers:H}){
 const {sphere,box,cyl,torus,rod}=H;
 const group=(p,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
 for(const name of ['ExpeditionPack','TempleRepair'])root.getObjectByName(name)?.removeFromParent();
 rig.antenna.visible=false;rig.lantern.clear();
 const gold=new T.MeshStandardMaterial({color:0xdfb969,metalness:.82,roughness:.27});
 const glow=new T.MeshStandardMaterial({color:0xffedbe,emissive:0xffc76b,emissiveIntensity:5});
 const violet=new T.MeshStandardMaterial({color:0x574069,metalness:.45,roughness:.48});
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
 const crown=group(rig.head,'MandateCrown',0,.76,0);
 torus(crown,gold,0,0,0,.47,.035,'y');
 const spires=[];
 for(let i=0;i<10;i++){const a=i*Math.PI/5;const g=group(crown,'CrownSpire'+i,Math.cos(a)*.47,0,Math.sin(a)*.47);cyl(g,gold,0,.15,0,.026,.30);g.lanternAssembly=lantern(g,'CrownLantern'+i,0,.30,0,.65);spires.push(g)}
 // Scholar's twin optical rims and bridge; no eyebrows.
 for(const s of [-1,1])torus(rig.head,gold,s*.355,-.15,.725,.155,.012);
 rod(rig.head,gold,[-.18,-.15,.75],[.18,-.15,.75],.011);
 // A layered purple mantle and stitched gold edging.
 for(let i=0;i<14;i++){const a=Math.PI*.12+i/13*Math.PI*.76;const x=Math.cos(a)*.64,z=-Math.sin(a)*.55;const p=box(rig.body,violet,x,.25,z,.22,1.35,.10,.04);p.rotation.z=-x*.15;rod(rig.body,gold,[x,-.4,z-.06],[x,.87,z-.06],.01)}
 const core=group(rig.body,'DelegationHeart',0,.57,.64);
 cyl(core,M.dark,0,0,0,.24,.10,'z');torus(core,gold,0,0,.065,.24,.025);
 const iris=group(core,'MandateIris',0,0,.09);
 for(let i=0;i<10;i++){const a=i*Math.PI/5;sphere(iris,glow,Math.cos(a)*.15,Math.sin(a)*.15,0,.025)}
 sphere(core,glow,0,0,.11,.07);const light=new T.PointLight(0xffcc77,1.5,2);light.position.z=.25;core.add(light);
 // Open ledger: two covers, layered pages, engraved votes.
 const book=group(rig['hand-1'],'MandateLedger',0,-.19,.15);book.rotation.set(-.4,0,-.12);
 for(const s of [-1,1]){const page=group(book,'LedgerWing'+s,s*.16,0,0);page.rotation.y=s*-.24;box(page,violet,0,0,0,.32,.43,.08,.02);box(page,M.ivory,0,0,.05,.28,.39,.035,.005);for(let j=0;j<6;j++)box(page,gold,0,.13-j*.05,.073,.20,.007,.006,.001)}
 // A balanced staff: voting authority is carried, not weaponised.
 const staff=group(rig.lantern,'DeliberationScales',0,-.10,0);
 cyl(staff,gold,0,-.27,0,.032,1.55);lantern(staff,'ScalesCentralLantern',0,.52,0,1.15);
 const beam=group(staff,'ScaleBeam',0,.43,0);rod(beam,gold,[-.46,0,0],[.46,0,0],.024);
 for(const s of [-1,1]){for(const z of [-.10,.10])rod(beam,gold,[s*.40,0,0],[s*.40,-.34,z],.008);const dish=sphere(beam,gold,s*.40,-.35,0,.18,.027,.14);lantern(beam,'ScalePanLantern'+s,s*.40,-.32,0,.48)}
 const avatar=group(root,'MandateGrowth');for(const child of [...root.children])if(child!==avatar)avatar.add(child);
 const holders=group(root,'HolderConstellation');const motes=[];
 for(let i=0;i<36;i++){const a=i/36*Math.PI*2;const anchor=group(holders,'Holder'+i,Math.cos(a)*1.80,.06,Math.sin(a)*1.80);cyl(anchor,gold,0,0,0,.048,.028);sphere(anchor,glow,0,.07,0,.028);const m=sphere(holders,glow,0,0,0,.018);motes.push({m,a})}
 const warningMaterial=new T.MeshStandardMaterial({color:0xffb14b,emissive:0xff6829,emissiveIntensity:0});
 const warning=torus(core,warningMaterial,0,0,.085,.285,.014);
 const beacon=lantern(crown,'WarningLantern',0,.035,0,.8,true);
 const state={power:1,concentration:32};let power=1;
 function setState(v){if(v.power!==undefined)state.power=Number.isFinite(Number(v.power))?Math.max(.1,Number(v.power)||1):state.power;if(v.concentration!==undefined)state.concentration=T.MathUtils.clamp(Number(v.concentration)||0,0,100);root.userData.simulation={...state,note:'Illustrative values; Target15 is top-ten aggregate share, not an individual cap'};}
 function tick(t,dt){power=T.MathUtils.lerp(power,state.power,1-Math.exp(-dt*3));const growth=1+Math.log2(1+power)*.17;avatar.scale.setScalar(growth);spires.forEach((g,i)=>{g.scale.y=1+Math.log2(1+power)*.24+(state.concentration/100)*.6;g.lanternAssembly.scale.y=.65/g.scale.y});iris.rotation.z=t*.18;beam.rotation.z=.07*Math.sin(t);motes.forEach(({m,a},i)=>{const f=(t*(.12+.015*Math.log2(1+power))+i/36)%1;const r=1.8*(1-f);m.position.set(Math.cos(a)*r,.12+f*(2.1*growth),Math.sin(a)*r+.5*f);m.scale.setScalar(.018*(.6+Math.sin(f*Math.PI)))});}
 const animateState=tick;
 function update(t,dt){animateState(t,dt);const alert=state.concentration>15;warning.visible=alert;warningMaterial.emissiveIntensity=alert?3+2*Math.pow(Math.sin(t*2.8),4):0;
 flames.forEach((f,i)=>{const pulse=1+.09*Math.sin(t*13+i*2.1)+.035*Math.sin(t*23+i);const warningPulse=f.warning&&alert?1+.6*Math.pow(Math.sin(t*2.8),4):1;f.fire.scale.set(1+.06*Math.sin(t*9+i),pulse,1);f.fire.rotation.z=.09*Math.sin(t*5+i);f.mat.emissive.setHex(f.warning&&alert?0xff4313:0xff8b23);f.mat.emissiveIntensity=4.5*pulse*warningPulse;f.hot.emissiveIntensity=8*pulse;if(f.light)f.light.intensity=.65*pulse;});}
 setState({});return {state,setState,tick:update,animate(){},spires};
}


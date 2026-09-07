import * as T from 'three';

// WARD equipment and simulated relay state. No inference about a real operator.
export function addWard({root,rig,M,helpers:H}){
  const {mesh,sphere,box,cyl,torus,curve,rod}=H;
  // Rounded guardian armour follows the reference's compact, substantial silhouette.
  for(const s of [-1,1]){
    const shoulder=rig['arm'+s];sphere(shoulder,M.teal,s*.03,-.08,.015,.245,.205,.235);
    const trim=torus(shoulder,M.brass,s*.035,-.08,.18,.19,.013);trim.scale.y=.83;
    const knee=rig['knee'+s];sphere(knee,M.teal,0,-.23,.06,.205,.26,.19);
    torus(knee,M.brass,0,-.09,.18,.115,.017);cyl(knee,M.brass,0,-.09,.18,.084,.05,'z');
    const boot=rig['foot'+s];torus(boot,M.brass,0,-.14,.30,.15,.011).scale.set(1.35,.65,1);
  }
  let n=0;
  const group=(p,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name||`WardAssembly_${n++}`;g.position.set(x,y,z);p.add(g);return g};
  const glow=(name,color=0x62d5ff)=>new T.MeshStandardMaterial({name,color,emissive:color,emissiveIntensity:1.8,roughness:.3,metalness:.15});
  const darkGlass=new T.MeshPhysicalMaterial({name:'Relay smoked glass',color:0x294b64,roughness:.18,metalness:.1,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide,transmission:.45,thickness:0});
  const lights=[],plates=[],paths=[],gears=[];
  const state={health:1,shared:false,latency:120};let currentHealth=1;
  // The original porcelain face and optical lenses are intentionally retained.
  for(const name of ['Bedroll','Canteen','TempleRepair'])root.getObjectByName(name)?.removeFromParent();
  rig.lantern.clear();rig.lantern.name='ShieldPivot';
  const rack=rig.relayRack=group(rig.body,'RelayRack',0,0,0);
  rack.scale.y=.87;
  box(rack,M.darkTeal,0,.60,-.86,.94,.95,.34,.12);
  for(const x of [-.33,.33]){box(rack,M.brass,x,.58,-1.055,.075,.78,.032,.02);for(let i=0;i<5;i++)sphere(rack,M.edge,x,.29+i*.14,-1.079,.015)}
  for(let i=0;i<6;i++)box(rack,M.dark,0,.29+i*.1,-1.046,.36,.026,.017,.008);
  const independent=group(rack,'IndependentRelayRoutes'),shared=group(rack,'SharedRelayRoutes');
  const positions=[[-.95,3.30,-.39],[0,3.65,-.61],[.95,3.30,-.39]];
  function cable(parent,points,index){
    const spline=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const hose=mesh(parent,new T.TubeGeometry(spline,60,.045,10,false),M.darkTeal);hose.name=`RelayCable_${n++}`;
    for(let i=0;i<=24;i++){const t=i/24,p=spline.getPoint(t),collar=torus(parent,M.brass,p.x,p.y,p.z,.046,.008);collar.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),spline.getTangent(t).normalize())}
    const beads=[];for(let i=0;i<3;i++){const b=sphere(parent,glow(`Signal_${n++}`),0,0,0,.029);beads.push(b)}
    paths.push({spline,beads,index,parent});return spline;
  }
  positions.forEach(([x,y,z],i)=>{
    const lamp=group(rack,`RelayTower_${i+1}`,x,y,z);cyl(lamp,M.brass,0,0,0,.16,.085);torus(lamp,M.edge,0,.047,0,.164,.017,'y');
    cyl(lamp,darkGlass,0,.25,0,.136,.40);const flameMat=glow(`RelayLight_${i+1}`);const flame=sphere(lamp,flameMat,0,.23,0,.030,.10,.030);
    const coreMaterial=glow(`Relay incandescent core ${i+1}`,0xd9f5ff);
    const nucleus=sphere(lamp,coreMaterial,0,.19,0,.020,.057,.020);
    for(let j=0;j<4;j++){const a=j/4*Math.PI*2;rod(lamp,M.brass,[Math.cos(a)*.145,.065,Math.sin(a)*.145],[Math.cos(a)*.145,.44,Math.sin(a)*.145],.012)}
    cyl(lamp,M.brass,0,.46,0,.175,.06);cyl(lamp,M.brass,0,.515,0,.082,.05,'y',.165);sphere(lamp,M.edge,0,.56,0,.034);
    const foot=cyl(lamp,M.iron,0,-.105,0,.073,.14);torus(lamp,M.edge,0,-.06,0,.077,.011,'y');
    const light=new T.PointLight(0x66d7ff,1.8,3,2);light.position.y=.23;lamp.add(light);lights.push({lamp,flame,nucleus,material:flameMat,coreMaterial,light});
    // Turn behind the head above its crown, then descend outside its animated envelope.
    cable(independent,[[x,y-.16,z],[x*1.08,3.08,-.91],[x*1.13,2.76,-1.20],[x*1.13,1.80,-1.20],[x*.53,1.14,-1.10],[x*.53,.98,-.98]],i);
    cable(shared,[[x,y-.16,z],[x*.76,3.03,-.65],[0,2.89,-.78]],i);
    cyl(independent,M.brass,x*.53,.98,-.99,.071,.075,'z');
  });
  cable(shared,[[0,2.89,-.78],[-.12,2.30,-1.02],[0,1.48,-1.16],[0,1.00,-1.01]],-1);
  sphere(shared,M.brass,0,2.89,-.78,.13);torus(shared,M.edge,0,2.89,-.67,.1,.018);
  const commonHub=group(shared,'CommonManagementHub',0,1.01,-1.10);cyl(commonHub,M.brass,0,0,0,.19,.13,'z');torus(commonHub,M.edge,0,0,-.073,.15,.015);cyl(commonHub,M.dark,0,0,-.09,.11,.016,'z');
  // Three independent gear trains remain individually legible on the back.
  for(let i=0;i<3;i++){
    const gear=rig['relayGear'+i]=group(rack,`RelayGear_${i}`,(-1+i)*.26,.66,-1.083);gears.push(gear);
    cyl(gear,M.brass,0,0,0,.105,.035,'z');torus(gear,M.edge,0,0,-.023,.075,.01);cyl(gear,M.dark,0,0,-.025,.035,.016,'z');
    for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const tooth=box(gear,M.brass,Math.cos(a)*.112,Math.sin(a)*.112,0,.034,.023,.032,.004);tooth.rotation.z=a}
  }
  // Chest core is protected behind a bronze inspection window.
  const core=group(rig.body,'ChainCore',0,.58,.595);core.scale.setScalar(1.25);cyl(core,M.dark,0,0,0,.237,.065,'z');torus(core,M.brass,0,0,.046,.218,.024);torus(core,M.edge,0,0,.071,.184,.009);
  sphere(core,darkGlass,0,0,.06,.185,.185,.055);const coreMat=glow('Chain heartbeat');sphere(core,coreMat,0,0,.064,.037);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;sphere(core,coreMat,Math.cos(a)*.103,Math.sin(a)*.103,.064,.027)}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;sphere(core,M.edge,Math.cos(a)*.217,Math.sin(a)*.217,.072,.015)}
  // Six independently retractable solid shield sectors. The face points outward.
  const shield=group(rig.lantern,'SegmentedShield',0,-.25,.08);shield.scale.setScalar(1/1.15);
  cyl(shield,M.iron,0,0,-.055,.65,.085,'z');torus(shield,M.brass,0,0,.022,.755,.027);cyl(shield,M.brass,0,0,.085,.195,.12,'z');torus(shield,M.edge,0,0,.159,.147,.014);cyl(shield,M.darkTeal,0,0,.159,.109,.025,'z');
  for(let i=0;i<6;i++){
    const a0=i*Math.PI/3+.04,a1=(i+1)*Math.PI/3-.04,a=(a0+a1)/2;
    const shape=new T.Shape();shape.moveTo(Math.cos(a0)*.23,Math.sin(a0)*.23);shape.lineTo(Math.cos(a0)*.72,Math.sin(a0)*.72);shape.absarc(0,0,.72,a0,a1,false);shape.lineTo(Math.cos(a1)*.23,Math.sin(a1)*.23);shape.absarc(0,0,.23,a1,a0,true);shape.closePath();
    const sector=group(shield,`ShieldPlate_${i}`,0,0,.055);mesh(sector,new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelThickness:.012,bevelSize:.01,bevelSegments:3,curveSegments:16}),M.teal);
    const mat=glow(`ShieldSeam_${i}`);for(const angle of [a0+.035,a1-.035])rod(sector,mat,[Math.cos(angle)*.26,Math.sin(angle)*.26,.078],[Math.cos(angle)*.68,Math.sin(angle)*.68,.078],.008);
    const rimPoints=[];for(let k=0;k<=12;k++){const t=a0+(a1-a0)*k/12;rimPoints.push([Math.cos(t)*.697,Math.sin(t)*.697,.077])}curve(sector,M.edge,rimPoints,.009);
    for(const angle of [a0+.10,a1-.10])sphere(sector,M.brass,Math.cos(angle)*.642,Math.sin(angle)*.642,.083,.019);
    plates.push({sector,material:mat,angle:a,index:i%3});
  }
  // Fabric cape: a curved mesh with folds, backing the relay machinery.
  const cape=group(rig.body,'GuardianCape',0,1.04,-.88);const v=[],uv=[],idx=[];
  for(let y=0;y<=24;y++)for(let x=0;x<=24;x++){const t=y/24,u=x/24-.5;v.push(u*(1.0+t*.42),-t*1.42,-.09-t*.22+Math.sin(u*23+t*3)*.035);uv.push(x/24,t)}
  for(let y=0;y<24;y++)for(let x=0;x<24;x++){const a=y*25+x;idx.push(a,a+25,a+1,a+1,a+25,a+26)}const cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(v,3));cg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cg.setIndex(idx);cg.computeVertexNormals();const cm=M.cloth.clone();cm.side=T.DoubleSide;mesh(cape,cg,cm);
  const healthFor=i=>T.MathUtils.clamp(currentHealth*3-i,0,1);
  function setState(values){Object.assign(state,values);state.health=T.MathUtils.clamp(Number(state.health),0,1);state.latency=T.MathUtils.clamp(Number(state.latency),20,1000);independent.visible=!state.shared;shared.visible=state.shared;root.userData.relayDemo={...state,source:'Simulated values; not live operator measurements'};}
  function animate(t){rig.relayRack.rotation.z=.012*Math.sin(t*Math.PI);gears.forEach((g,i)=>g.rotation.z=t*Math.PI*(i%2?-1:1));}
  function tick(t,dt){
    currentHealth=T.MathUtils.damp(currentHealth,state.health,5,dt);
    lights.forEach((o,i)=>{
      const h=healthFor(i),healthy=currentHealth>.6&&h>.66;
      const color=new T.Color(healthy?0x49c9ff:0xffa832);
      const flicker=1+.055*Math.sin(t*13.7+i*2.3)+.025*Math.sin(t*23.1+i*.8)+.02*Math.sin(t*4.3+i);
      o.material.color.copy(color);o.material.emissive.copy(color);
      o.material.emissiveIntensity=h<.03?0:h*6.0*flicker;
      o.coreMaterial.color.set(healthy?0xdff7ff:0xffecd1);o.coreMaterial.emissive.copy(o.coreMaterial.color);o.coreMaterial.emissiveIntensity=h*12*flicker;
      o.flame.visible=o.nucleus.visible=h>.03;o.flame.scale.y=.10*(1+.10*Math.sin(t*7.3+i));o.flame.position.x=.006*Math.sin(t*5.7+i);
      o.light.color.copy(color);o.light.intensity=h*1.8*flicker;
    });
    coreMat.emissiveIntensity=.18+currentHealth*1.65+Math.sin(t*2.5)*.09*currentHealth;
    plates.forEach(p=>{const h=healthFor(p.index),gap=(1-h)*.105;p.sector.position.set(Math.cos(p.angle)*gap,Math.sin(p.angle)*gap,.055-(1-h)*.055);p.material.emissiveIntensity=h*1.9;p.material.color.set(h<.05?0x1c3544:0x60d3fc);p.material.emissive.set(h<.05?0x000000:0x60d3fc)});
    paths.forEach(p=>{const h=p.index<0?currentHealth:healthFor(p.index);p.beads.forEach((b,j)=>{b.visible=h>.05;if(b.visible){const f=(t/(1+state.latency/200)+j/3)%1;b.position.copy(p.spline.getPoint(f));b.material.emissiveIntensity=h*1.5}})});
  }
  setState(state);tick(0,1);
  return {state,setState,tick,animate,lights,plates,paths,independent,shared,coreMat};
}

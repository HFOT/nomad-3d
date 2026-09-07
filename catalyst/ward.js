import * as T from 'three';
// CATALYST — a funded project builder. Three readable signals:
//   rounds : how many times funding was received  -> mechanical chest counter
//   total  : how much in all                      -> gold coins racked on the back
//   tier   : wood/bronze/silver/gold/platinum/diamond -> helmet, medal and rack caps
export function addWard({root,rig,M,helpers:H}){
 const {sphere,box,cyl,torus,rod}=H;
 const group=(p,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
 for(const name of ['ExpeditionPack','TempleRepair'])root.getObjectByName(name)?.removeFromParent();
 rig.antenna.visible=false;
 const gold=new T.MeshStandardMaterial({name:'Coin gold',color:0xdfb969,metalness:.85,roughness:.24});
 const wood=new T.MeshStandardMaterial({name:'Site timber',color:0x6d4f2e,metalness:0,roughness:.85});
 const glow=new T.MeshStandardMaterial({name:'Lamp glow',color:0xffedbe,emissive:0xffc76b,emissiveIntensity:5});

 // Funding tiers, humblest first. One material each; decorated meshes swap between them.
 const TIER_ORDER=['wood','bronze','silver','gold','platinum','diamond'];
 const tiers={
  wood:new T.MeshStandardMaterial({name:'Tier wood',color:0x5e4322,metalness:0,roughness:.92}),
  bronze:new T.MeshStandardMaterial({name:'Tier bronze',color:0xb4763a,metalness:.9,roughness:.35}),
  silver:new T.MeshStandardMaterial({name:'Tier silver',color:0xcfd6dd,metalness:.95,roughness:.2}),
  gold:new T.MeshStandardMaterial({name:'Tier gold',color:0xe6c273,metalness:.9,roughness:.22}),
  platinum:new T.MeshStandardMaterial({name:'Tier platinum',color:0xeef2f7,metalness:1,roughness:.1}),
  diamond:new T.MeshPhysicalMaterial({name:'Tier diamond',color:0xdff2ff,metalness:.1,roughness:.03,clearcoat:1,clearcoatRoughness:.03,transmission:.55,thickness:.3,transparent:true,opacity:.9}),
 };
 const tierMeshes=[];
 const tinted=m=>{tierMeshes.push(m);return m};

 // Builder's helmet with a head lamp: the series' lantern, worn where the work is.
 const helm=group(rig.head,'BuilderHelm',0,.30,.02);
 tinted(sphere(helm,tiers.gold,0,.16,0,.82,.5,.82));
 tinted(cyl(helm,tiers.gold,0,.02,0,.92,.05));
 tinted(box(helm,tiers.gold,0,.48,0,.14,.09,1.05,.03));
 cyl(helm,M.iron,0,.20,.76,.09,.10,'z');
 cyl(helm,glow,0,.20,.82,.068,.03,'z');
 const headlamp=new T.PointLight(0xffc37a,.9,2.5,2);headlamp.position.set(0,.20,.95);helm.add(headlamp);
 const gem=group(helm,'DiamondCapstone',0,.62,0);
 const gemMesh=new T.Mesh(new T.OctahedronGeometry(.13),tiers.diamond);gemMesh.name='CapstoneGem';gem.add(gemMesh);
 sphere(gem,glow,0,0,0,.03);

 // Chest counter: how many rounds of funding this builder has delivered.
 const counter=group(rig.body,'RoundCounter',0,.60,.62);
 box(counter,M.dark,0,0,0,.60,.34,.10,.03);
 torus(counter,M.edge,0,0,.045,.31,.018);
 const segOn=new T.MeshStandardMaterial({name:'Counter lit segment',color:0xffd98c,emissive:0xffa028,emissiveIntensity:4});
 const segOff=new T.MeshStandardMaterial({name:'Counter dark segment',color:0x241a10,roughness:.9});
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

 // Tier medal under the counter.
 const medal=group(rig.body,'TierMedal',0,.24,.66);
 box(medal,M.cloth,0,.10,-.02,.15,.16,.03,.008);
 tinted(cyl(medal,tiers.gold,0,-.04,0,.13,.035,'z'));
 sphere(medal,gold,0,-.04,.025,.045);

 // The back rack: every coin ever granted, stacked in the open where it can be counted.
 const vault=group(rig.body,'CoinVault',0,.28,-.90);
 box(vault,wood,0,-.60,0,1.34,.11,.56,.02);
 box(vault,wood,0,.74,0,1.34,.09,.56,.02);
 for(const s of [-1,1]){
  box(vault,wood,s*.62,.06,0,.10,1.42,.52,.02);
  tinted(box(vault,tiers.gold,s*.62,.83,0,.13,.10,.55,.02));
  rod(rig.body,M.leather,[s*.40,1.30,-.62],[s*.40,-.32,-.88],.045);
 }
 const columns=[];
 for(let c=0;c<3;c++){
  const col=[];const cx=(c-1)*.41;
  for(let i=0;i<12;i++){
   const coin=cyl(vault,gold,cx+(i%2?.015:-.012),-.515+i*.096,(c%2?.05:-.03),.165,.075);
   coin.rotation.y=i*.7+c;col.push(coin);
  }
  columns.push(col);
 }
 const sacks=group(vault,'OverflowSacks',0,.92,0);
 for(const s of [-1,1]){sphere(sacks,M.leatherLight,s*.30,.06,0,.21,.17,.19);cyl(sacks,M.clothDark,s*.30,.22,0,.05,.07)}
 function showTotal(totalUsd){
  // One coin for roughly every $100K granted; the rack tops out where diamond begins.
  const coins=totalUsd>0?Math.max(1,Math.min(36,Math.round(totalUsd/100000))):0;
  columns.forEach((col,c)=>{const n=Math.min(12,Math.max(0,Math.ceil((coins-c)/3)));col.forEach((coin,i)=>coin.visible=i<n)});
  sacks.visible=totalUsd>=2500000;
 }

 // In hand: a mason's hammer and the rolled project blueprint. Building, not counting.
 rig.lantern.clear();
 const hammer=group(rig.lantern,'BuilderHammer',0,-.30,0);
 cyl(hammer,wood,0,-.05,0,.05,.95);
 box(hammer,M.iron,0,.44,0,.46,.19,.19,.03);
 cyl(hammer,M.edge,0,.44,0,.075,.48,'x');
 const plan=group(rig['hand-1'],'ProjectBlueprint',0,-.20,.14);plan.rotation.set(-.35,0,1.30);
 cyl(plan,M.ivory,0,0,0,.075,.58);
 for(const y of [-.20,.20])torus(plan,gold,0,y,0,.075,.012,'y');
 cyl(plan,M.clothDark,0,0,0,.081,.09);

 // Cumulative USD-equivalent thresholds, shaped on the public per-person Catalyst
 // record (1,478 funded people): median $66K, top 10% $500K+, top 0.5% $2.5M+.
 const TIER_STEPS=[['diamond',2500000],['platinum',1000000],['gold',500000],['silver',150000],['bronze',50000],['wood',0]];
 const state={rounds:7,totalUsd:600000,tier:'gold'};
 function setState(v={}){
  if(v.rounds!==undefined&&Number.isFinite(Number(v.rounds)))state.rounds=T.MathUtils.clamp(Number(v.rounds),0,99);
  if(v.totalUsd!==undefined&&Number.isFinite(Number(v.totalUsd)))state.totalUsd=Math.max(0,Number(v.totalUsd));
  state.tier=TIER_STEPS.find(([,min])=>state.totalUsd>=min)[0];
  const mat=tiers[state.tier];
  for(const m of tierMeshes)m.material=mat;
  gem.visible=state.tier==='diamond';
  showRounds(state.rounds);
  showTotal(state.totalUsd);
  root.userData.simulation={...state,note:'Illustrative values shaped like the public per-person Catalyst record; not live data'};
 }
 function tick(t){
  segOn.emissiveIntensity=3.6+.5*Math.sin(t*2.2);
  headlamp.intensity=.9+.08*Math.sin(t*11)+.04*Math.sin(t*19);
  medal.rotation.x=.06*Math.sin(t*.9);
  gemMesh.rotation.y=t*.5;
  vault.rotation.x=.008*Math.sin(t*.7);
 }
 setState({});
 return {state,setState,tick,animate(){}};
}

import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// The forge mechanism: everything that makes FORGE a block producer rather
// than a statue. The body in model.js is the frame; this is what runs inside it.
//
// One cycle = one slot. Transactions arrive at the tray (this is where PIP
// hands them over), pile up in the hopper on the back, and each cycle a
// capacity-limited batch rides the chute into the chest furnace, gets struck,
// and leaves as one sealed block that clips onto the chain behind. Whatever
// does not fit stays in the hopper for the next slot — a mempool backlog.
//
// A slot with nothing waiting still forges: an empty block, dimmer and quicker.
// That is not a failure state, it is how the chain keeps its beat.
const PERIOD=3.4;           // seconds per slot, chosen to read rather than to be accurate
const MEMPOOL_MAX=48;       // how many cubes the hopper can show before it just reads as "full"
const CHAIN=6,STEP=.60,CHAIN_X=-.66,CHAIN_Y=.94,CHAIN_Z=1.46;

let seed=4242;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const ease=x=>x*x*(3-2*x);
const span=(u,a,b)=>T.MathUtils.clamp((u-a)/(b-a),0,1);

export function addWard({root,rig,M,helpers}){
  const {group,mesh,box,cyl,torus,rod}=helpers;
  const torso=rig.torso;
  const state={inflow:26,pending:14,height:11562318,lastCount:0,capacity:12,spill:0};

  // ---- Hopper: the mempool. A cage, deliberately open, so a backlog is visible
  // from across the room instead of hidden inside the machine.
  const hopper=group(torso,'Mempool',.64,1.02,-.26);hopper.rotation.z=-.10;
  const CAGE_R=.50;
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const bar=cyl(hopper,M.brass,Math.cos(a)*CAGE_R,0,Math.sin(a)*CAGE_R,.022,.86);bar.castShadow=false}
  for(const y of [-.40,0,.44])torus(hopper,M.edge,0,y,0,CAGE_R,.026,'y');
  const funnel=mesh(hopper,new T.CylinderGeometry(CAGE_R,.17,.34,32,1,true),M.iron,0,-.58,0);funnel.material.side=T.DoubleSide;
  cyl(hopper,M.dark,0,-.80,0,.17,.20);
  // Mounting struts down to the shoulders, so the cage reads as bolted on.
  rod(torso,M.iron,[.34,.86,-.26],[.68,.46,-.16],.050);
  rod(torso,M.iron,[.62,.62,-.54],[.74,.44,-.14],.040);
  rod(torso,M.iron,[.30,.72,.02],[.66,.44,.06],.036);

  // The slot clock rides the hopper rim: one sweep of the hand is one slot.
  const clock=group(hopper,'SlotClock',0,.50,0);
  torus(clock,M.brass,0,0,0,CAGE_R+.04,.030,'y');
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(clock,M.edge,Math.cos(a)*(CAGE_R+.04),0,Math.sin(a)*(CAGE_R+.04),i%3?.03:.05,.02,i%3?.07:.11,.008)}
  const hand=group(clock,'SlotHand',0,.03,0);
  box(hand,M.seal,0,0,-(CAGE_R+.04)/2,.045,.022,CAGE_R+.04,.01);
  cyl(clock,M.steel,0,.04,0,.07,.05);
  const clockRing=torus(clock,M.seal,0,.03,0,CAGE_R+.11,.016,'y');

  // ---- Waiting transactions. Amber cubes, the same ones the courier carries.
  const cubeGeo=new RoundedBoxGeometry(.15,.15,.15,3,.016);
  const waiting=[];
  for(let i=0;i<MEMPOOL_MAX;i++){
    const cube=mesh(hopper,cubeGeo,M.packet,0,0,0);cube.castShadow=false;
    const a=rand()*Math.PI*2,r=.10+Math.sqrt(rand())*(CAGE_R-.20);
    waiting.push({cube,a,r,h:rand(),spin:.4+rand()*.9,tilt:rand()*Math.PI});
  }

  // ---- Chute: an open rail, not a pipe. The batch has to be seen travelling.
  // It leaves the hopper spout, runs around the right flank, and enters the door.
  const chute=new T.CatmullRomCurve3([
    new T.Vector3(.63,.20,-.26),new T.Vector3(.72,.08,-.06),new T.Vector3(.72,-.04,.24),
    new T.Vector3(.56,-.08,.46),new T.Vector3(.30,-.06,.64),new T.Vector3(.06,-.05,.72),
  ]);
  const frames=chute.computeFrenetFrames(48,false);
  const railAt=(n,b)=>new T.CatmullRomCurve3(Array.from({length:49},(_,i)=>chute.getPointAt(i/48).clone().addScaledVector(frames.normals[i],n).addScaledVector(frames.binormals[i],b)));
  for(const [n,b] of [[.14,0],[-.07,.12],[-.07,-.12]])mesh(torso,new T.TubeGeometry(railAt(n,b),48,.020,6,false),M.brass);
  for(let i=1;i<12;i++){
    const u=i/12,rib=torus(torso,M.edge,0,0,0,.145,.014);
    rib.position.copy(chute.getPointAt(u));
    rib.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),chute.getTangentAt(u));
  }

  // The batch in transit gets its own cubes. Reusing the hopper cubes would put
  // the same transaction in two places at once — waiting and already gone.
  const batch=[];
  for(let i=0;i<24;i++){const cube=mesh(torso,cubeGeo,M.packet,0,0,0);cube.castShadow=false;cube.visible=false;batch.push(cube)}

  // ---- Furnace: where the batch is compressed into one block.
  const furnace=group(torso,'Furnace',0,-.05,.60);
  box(furnace,M.iron,0,0,0,.72,.72,.24,.04);
  torus(furnace,M.brass,0,0,.13,.30,.030);
  const glow=box(furnace,M.ember,0,0,.10,.50,.50,.03,.02);
  const doors=[];
  for(const s of [-1,1]){
    const door=group(furnace,'Door_'+s,0,0,.15);
    box(door,M.plate,s*.14,0,0,.30,.56,.09,.02);
    box(door,M.edge,s*.27,0,.05,.03,.52,.02,.01);
    cyl(door,M.brass,s*.06,0,.06,.035,.04,'z');
    doors.push({door,s});
  }
  const fire=new T.PointLight(0xff7a20,0,3.4,2);fire.position.set(0,0,.22);furnace.add(fire);
  // Capacity gauge beside the door: how full this block is against the limit.
  const gauge=group(torso,'BlockGauge',.50,-.05,.50);gauge.rotation.y=-.5;
  box(gauge,M.dark,0,0,0,.09,.56,.05,.015);
  const gaugeBar=box(gauge,M.seal,0,-.26,.03,.05,.50,.02,.008);gaugeBar.scale.y=.02;
  for(let i=1;i<4;i++)box(gauge,M.edge,0,-.26+i*.125,.04,.07,.012,.02,.004);

  // ---- Chest readout. One canvas, redrawn only when the numbers change.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=224;
  const ctx=canvas.getContext('2d');
  const readout=new T.CanvasTexture(canvas);readout.colorSpace=T.SRGBColorSpace;
  const panel=mesh(torso,new T.PlaneGeometry(.74,.32),new T.MeshStandardMaterial({color:0x060a0b,emissive:0xffffff,emissiveMap:readout,emissiveIntensity:1.05,roughness:.5,metalness:.2}),0,.42,.665);
  panel.rotation.x=-.16;
  const frame=box(torso,M.brass,0,.42,.60,.82,.40,.05,.02);frame.rotation.x=-.16;
  function draw(){
    ctx.fillStyle='#050809';ctx.fillRect(0,0,512,224);
    ctx.fillStyle='#1a2a28';for(let y=0;y<224;y+=4)ctx.fillRect(0,y,512,1);
    ctx.fillStyle='#7c8f8a';ctx.font='600 26px "Segoe UI",sans-serif';ctx.fillText('BLOCK HEIGHT',22,42);
    ctx.fillStyle='#8fe9c4';ctx.font='700 62px "Segoe UI",monospace';ctx.fillText(state.height.toLocaleString('en-US'),22,106);
    ctx.fillStyle='#7c8f8a';ctx.font='600 24px "Segoe UI",sans-serif';ctx.fillText('TX IN BLOCK',22,152);ctx.fillText('MEMPOOL',282,152);
    ctx.fillStyle=state.lastCount?'#ffd08a':'#5d6b68';ctx.font='700 44px "Segoe UI",monospace';
    ctx.fillText(state.lastCount?String(state.lastCount):'EMPTY',22,198);
    ctx.fillStyle=state.spill>0?'#ff9a6a':'#8fe9c4';ctx.fillText(String(Math.floor(state.pending)),282,198);
    readout.needsUpdate=true;
  }
  draw();

  // ---- The chain. Bolted to the world, not to the body: the ledger does not
  // sway when the smith does.
  const blockGeo=new RoundedBoxGeometry(.44,.44,.44,3,.035);
  function makeBlock(){
    const g=group(root,null,0,CHAIN_Y,0);
    mesh(g,blockGeo,M.block);
    for(const s of [-1,1])for(const e of [-1,1])box(g,M.seal,s*.225,e*.225,0,.03,.03,.42,.008);
    const bars=[];
    for(let i=0;i<5;i++)bars.push(box(g,M.seal,-.15+i*.075,-.05,.23,.042,.15,.02,.006));
    for(const s of [-1,1])cyl(g,M.brass,s*.29,0,0,.05,.16,'x');
    return {g,bars,rehash(){for(const b of bars)b.visible=rand()>.42}};
  }
  const chain=[];for(let i=0;i<CHAIN;i++){const b=makeBlock();b.rehash();b.g.position.set(CHAIN_X-i*STEP,CHAIN_Y,CHAIN_Z);chain.push(b)}
  const links=[];
  for(let i=0;i<CHAIN;i++){const l=cyl(root,M.iron,0,CHAIN_Y,CHAIN_Z,.035,STEP-.44,'x');links.push(l)}
  const hot=makeBlock();hot.g.visible=false;
  // The freshly sealed block runs hot and cools as it joins the chain.
  const hotShell=new T.MeshStandardMaterial({color:0x7a4a2c,emissive:0xff5a12,emissiveIntensity:2.2,roughness:.6,metalness:.5});
  hot.g.children[0].material=hotShell;

  // ---- Sparks, thrown from the door at the moment of the strike.
  const sparks=[];
  const sparkGeo=new T.BoxGeometry(.02,.02,.10);
  for(let i=0;i<26;i++){const s=mesh(torso,sparkGeo,M.spark,0,0,0);s.castShadow=false;s.visible=false;sparks.push({m:s,v:new T.Vector3(),life:0})}

  // ---- The packet on the tray: the handover itself. It rides from the open
  // hand up into the hopper at the top of every cycle.
  const courier=group(root,'HandoverPacket',0,0,0);
  mesh(courier,new RoundedBoxGeometry(.24,.24,.24,4,.02),M.packet);
  for(const axis of [0,1,2])for(const a of [-1,1])for(const b of [-1,1]){
    const dims=[.012,.012,.012],pos=[0,0,0];dims[axis]=.235;pos[(axis+1)%3]=a*.118;pos[(axis+2)%3]=b*.118;
    box(courier,M.edge,...pos,...dims,.004);
  }

  const trayAnchor=group(rig['hand-1'],'TrayAnchor',0,.06,.20);

  let cycle=0,taken=0,flash=0,arrived=0;
  const trayPoint=new T.Vector3(),hopPoint=new T.Vector3(),scratch=new T.Vector3();

  function commit(){
    // The batch that has been in the furnace all cycle becomes a block.
    state.height++;state.lastCount=taken;
    const oldest=chain.pop();oldest.rehash();chain.unshift(oldest);
    oldest.g.position.set(CHAIN_X,CHAIN_Y,CHAIN_Z);
    // Draw the next batch out of the mempool; the remainder is the backlog.
    taken=Math.min(state.capacity,Math.floor(state.pending));
    state.pending-=taken;state.spill=Math.max(0,Math.floor(state.pending)-state.capacity);
    arrived=0;draw();
  }

  function animate(){/* the mechanism is live-only; clips bake the frame, not the fire */}

  function tick(t,dt,motion='Idle'){
    if(dt>0){
      state.pending=Math.min(MEMPOOL_MAX+40,state.pending+state.inflow*dt*.12);
      cycle+=dt/PERIOD;
      if(cycle>=1){cycle-=1;commit()}
    }
    const u=cycle;

    // Mempool: cubes drift in the cage, crowding as the backlog grows.
    const shown=Math.min(MEMPOOL_MAX,Math.round(state.pending));
    for(let i=0;i<MEMPOOL_MAX;i++){
      const w=waiting[i];w.cube.visible=i<shown;
      if(!w.cube.visible)continue;
      const stack=i/MEMPOOL_MAX;
      const a=w.a+t*w.spin*.35;
      w.cube.position.set(Math.cos(a)*w.r,-.34+stack*.74+Math.sin(t*1.6+w.h*7)*.03,Math.sin(a)*w.r);
      w.cube.rotation.set(w.tilt+t*.5*w.spin,a,w.tilt*.6+t*.32);
    }

    // The handover: the packet lifts off the tray and drops into the cage.
    trayAnchor.getWorldPosition(trayPoint);
      hopper.getWorldPosition(hopPoint);hopPoint.y+=.34;
    const f=span(u,.02,.30),supply=state.pending>=1||taken>0;
    if(f<=0||f>=1){
      // Between throws the tray is not empty for long: the next one is already
      // there. It only stays bare when nothing is arriving at all.
      courier.position.copy(trayPoint);courier.visible=supply&&(f<=0||u>.42);
    }else{
      courier.visible=supply;
      courier.position.lerpVectors(trayPoint,hopPoint,ease(f));
      courier.position.y+=Math.sin(f*Math.PI)*.42;
    }
    root.worldToLocal(courier.position);
    courier.rotation.set(t*1.1,t*.8,0);

    // The batch rides the chute, one cube behind another, into the furnace.
    for(let i=0;i<batch.length;i++){
      const cube=batch[i];
      if(i>=taken){cube.visible=false;continue}
      const start=.30+(i/Math.max(1,taken))*.22,g=span(u,start,start+.20);
      cube.visible=g>0&&g<1;
      if(!cube.visible)continue;
      cube.position.copy(chute.getPointAt(ease(g)));
      cube.rotation.set(t*2.1,t*1.5,0);
    }
    arrived=Math.max(arrived,Math.round(taken*span(u,.36,.56)));
    if(u<.05)arrived=0;

    // Doors, heat and the strike.
    const closing=span(u,.52,.60),opening=span(u,.74,.84);
    const shut=closing-opening;
    for(const {door,s} of doors)door.position.x=s*(.34*(1-shut));
    const heat=Math.max(taken?.25:.08,span(u,.30,.58)*(taken?1:.35));
    glow.material.emissiveIntensity=1.4+heat*2.6+flash*5;
    fire.intensity=(heat*3.4+flash*9)*(taken?1:.5);
    gaugeBar.scale.y=Math.max(.02,arrived/state.capacity);
    gaugeBar.position.y=-.26+gaugeBar.scale.y*.25;

    // The hammer. It overrides the baked arm — except while walking, where the
    // swing belongs to the clip.
    if(motion!=='Walk'){
      // Signs matter here: on a hanging arm a negative rotation.x carries the
      // hand back and up, a positive one drives it forward and down. The stroke
      // is a long haul back and a short, fast fall onto the door.
      const raise=ease(span(u,.28,.54)),fall=ease(span(u,.54,.61)),recover=ease(span(u,.61,.84));
      rig.arm1.rotation.x=-.30-1.70*raise+2.45*fall-.75*recover;
      rig.elbow1.rotation.x=-.55-.75*raise+.70*fall+.05*recover;
      rig.arm1.rotation.z=.14+.22*raise-.22*fall;
      // The mask rides up while it is looking at the work and levels off to
      // shield the eyes as the hammer comes down.
      const down=span(u,.44,.56)-span(u,.80,.92);
      rig.visor.rotation.x=.28*(1-down);
    }

    // Sparks fly on the frame the hammer lands.
    if(u>=.61&&u-dt/PERIOD<.61&&dt>0){
      flash=1;
      for(const s of sparks){
        s.life=.35+rand()*.45;
        s.m.position.set(0,-.05,.68);
        s.v.set((rand()-.5)*3.4,rand()*2.6+.4,rand()*2.2+.6);
      }
    }
    flash=Math.max(0,flash-dt*4.5);
    for(const s of sparks){
      if(s.life<=0){s.m.visible=false;continue}
      s.life-=dt;s.m.visible=true;
      s.v.y-=7*dt;s.m.position.addScaledVector(s.v,dt);
      s.m.scale.setScalar(Math.max(.15,s.life*2.2));
      s.m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),scratch.copy(s.v).normalize());
    }

    // The sealed block leaves the furnace and clips onto the chain, which
    // shunts back by exactly one block as it arrives.
    const out=span(u,.80,.99);
    hot.g.visible=out>0&&out<1;
    if(hot.g.visible){
      const e=ease(out);
      // Out of the door, down, and along to the near end of the row.
      hot.g.position.set(T.MathUtils.lerp(0,CHAIN_X,e),T.MathUtils.lerp(1.66,CHAIN_Y,e),T.MathUtils.lerp(1.00,CHAIN_Z,e));
      hot.g.rotation.set(0,(1-e)*1.4,0);
      hotShell.emissiveIntensity=2.2*(1-e)+.05;
    }
    for(let i=0;i<CHAIN;i++){
      chain[i].g.position.x=CHAIN_X-(i+out)*STEP;
      links[i].position.x=chain[i].g.position.x+STEP*.5;
    }

    // The clock hand sweeps one full turn per slot and the rim confirms the seal.
    hand.rotation.y=-u*Math.PI*2;
    clockRing.scale.setScalar(1+flash*.08);
    for(const s of [-1,1]){const slit=rig.head.getObjectByName('EyeSlit_'+s);if(slit)slit.scale.y=1+flash*1.8}
  }

  function setState(patch){
    Object.assign(state,patch);
    state.pending=T.MathUtils.clamp(state.pending,0,MEMPOOL_MAX+40);
    state.spill=Math.max(0,Math.floor(state.pending)-state.capacity);
    draw();
  }

  return {state,setState,animate,tick,get period(){return PERIOD}};
}

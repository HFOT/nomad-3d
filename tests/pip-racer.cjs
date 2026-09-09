// Drives PIPレーサー in a real browser: the course counts laps in the right
// direction, the queues in the road cost time, the items do what they say, and
// a finished run leaves a best time and a ghost behind.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:8846';

// A crude autopilot: aim a little way further round the curve. It is not fast,
// it only has to be legal.
const AUTOPILOT=`
 window.__auto=setInterval(()=>{
  const S=pipRacer.S;
  const p=pipRacer.curve.getPointAt(((S.seg+16)%600)/600);
  let d=Math.atan2(p.x-S.x,p.z-S.z)-S.head;
  while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
  document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',
   {pointerType:'mouse',clientX:innerWidth*(.5-Math.max(-.4,Math.min(.4,d*.9))),clientY:400,bubbles:true}));
 },30);`;

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(BASE+'/racer/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.pipRacer,null,{timeout:120000});

  // The road has to face upwards. Wound the other way it is culled from every
  // camera that matters and the player drives on the ground showing through it,
  // which is not something a screenshot makes obvious.
  const facing=await page.evaluate(()=>{
   const look=n=>{
    const m=pipRacer.scene.getObjectByName(n);
    if(!m)return null;
    const a=m.geometry.attributes.normal;
    let up=0,down=0;
    for(let i=0;i<Math.min(400,a.count);i++)(a.getY(i)>0?up++:down++);
    return {up,down,both:m.material.side===2};
   };
   return {road:look('RoadSurface'),left:look('Kerb-1'),right:look('Kerb1')};
  });
  assert.ok(facing.road&&facing.road.up>facing.road.down,'the road faces up');
  for(const side of ['left','right']){
   const k=facing[side];
   assert.ok(k&&(k.up>0||k.both),'the '+side+' kerb is drawn towards the camera');
  }

  await page.click('#start');
  await page.waitForFunction(()=>pipRacer.S.phase==='race',null,{timeout:20000});
  // Steering right has to move the machine to the right of the screen. The
  // chase camera looks along the machine's own forward, so the world axis and
  // the screen axis disagree; this is what catches it.
  const dir=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const S=pipRacer.S;
   // Put it in the middle of the road, slowly, so the wall cannot get a hand on
   // the heading while we measure what the steering did.
   // On the start straight: in a corner the auto-drift and the wall both get a
   // hand on the heading, and neither is what this is measuring.
   const p=pipRacer.curve.getPointAt(.02),tan=pipRacer.curve.getTangentAt(.02);
   S.x=p.x;S.z=p.z;S.head=Math.atan2(tan.x,tan.z);S.speed=7;S.driftDir=0;S.drift=0;S.seg=Math.floor(.02*600);
   await wait(120);
   const f0={x:Math.sin(S.head),z:Math.cos(S.head)};
   const el=pipRacer.camera.matrixWorld.elements;   // column 0 is the camera's right
   const rx=el[0],rz=el[2];
   for(let i=0;i<5;i++){
    document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',
     {pointerType:'mouse',clientX:innerWidth*.95,clientY:400,bubbles:true}));
    await wait(50);
   }
   const f1={x:Math.sin(S.head),z:Math.cos(S.head)};
   document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',
    {pointerType:'mouse',clientX:innerWidth*.5,clientY:400,bubbles:true}));
   return (f1.x-f0.x)*rx+(f1.z-f0.z)*rz;
  });
  assert.ok(dir>0,'steering right turns towards the right of the screen, got '+dir.toFixed(3));

  // Turning right fires the left shoulder: the thrust has to push the machine
  // the way it is going. PIP's local +x is the screen's left.
  const jets=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const lit=name=>{
    const m=pipRacer.scene.getObjectByName('PIP').getObjectByName(name);
    return m.children.some(c=>c.isMesh&&c.visible&&c.scale.z>.1);
   };
   for(let i=0;i<6;i++){
    document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',
     {pointerType:'mouse',clientX:innerWidth*.95,clientY:400,bubbles:true}));
    await wait(50);
   }
   const right={left:lit('ShoulderThruster1'),rightSide:lit('ShoulderThruster-1')};
   for(let i=0;i<6;i++){
    document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',
     {pointerType:'mouse',clientX:innerWidth*.05,clientY:400,bubbles:true}));
    await wait(50);
   }
   const left={left:lit('ShoulderThruster1'),rightSide:lit('ShoulderThruster-1')};
   document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',
    {pointerType:'mouse',clientX:innerWidth*.5,clientY:400,bubbles:true}));
   return {right,left};
  });
  assert.equal(jets.right.left,true,'turning right fires the left shoulder');
  assert.equal(jets.left.rightSide,true,'turning left fires the right shoulder');

  // A kicker takes the machine off the ground and the landing gives it back.
  const air=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const S=pipRacer.S;
   const r=pipRacer.ramps[0];
   // Put it on the road just short of the kicker, pointed at it, with pace.
   const t=r.t-.004,p=pipRacer.curve.getPointAt(t),tan=pipRacer.curve.getTangentAt(t);
   S.x=p.x;S.z=p.z;S.y=pipRacer.trackY(t);S.head=Math.atan2(tan.x,tan.z);S.speed=28;
   // The run tracks where it is round the course in a window; teleporting it
   // without moving that window makes the wall drag it back where it was.
   S.seg=Math.floor(t*600);
   S.air=false;S.vy=0;S.boost=0;
   let peak=0,flew=false;
   for(let i=0;i<50;i++){
    if(S.air){flew=true;peak=Math.max(peak,S.y-pipRacer.trackY(S.seg/600));}
    if(flew&&!S.air)break;
    await wait(40);
   }
   return {flew,peak:+peak.toFixed(1),grounded:!S.air};
  });
  assert.equal(air.flew,true,'the kicker takes the machine off the ground');
  assert.ok(air.peak>1.5,'and gets it properly into the air, got '+air.peak);
  assert.equal(air.grounded,true,'and it comes back down');

  // The course keeps you: there is no driving away from it.
  const wall=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const S=pipRacer.S;
   S.x+=60;S.z+=60;
   await wait(200);
   return {dist:pipRacer.nearest(S.x,S.z,S.seg).dist,limit:pipRacer.HALF_W+pipRacer.WALL};
  });
  assert.ok(wall.dist<=wall.limit+.6,'the wall holds the machine on the course, got '+wall.dist.toFixed(1));

  // The queues, while the machine is still on the start straight: once it
  // is running the course it is forever picking up a pad or a crate, and either
  // of those turns a collision into a clear.
  const jam=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const S=pipRacer.S;
   S.boost=0;S.shield=0;S.spin=0;S.item=null;S.itemLeft=0;
   // The machine now leaves the line already moving and crosses a boost pad
   // within seconds; a boost would turn this collision into a clear.
   const savedPads=pipRacer.pads.splice(0);
   // and every other queue is parked too, so the spin can only have come from
   // the one under test.
   const all=pipRacer.jams.splice(0);
   const j=all.find(j=>j.down<=0);
   pipRacer.jams.push(j);
   // Held in front of the machine, with every assist wiped each tick: a drift
   // charge left to build would fire a mini-turbo and clear the queue instead.
   for(let i=0;i<40&&S.spin<=0;i++){
    S.boost=0;S.shield=0;S.charge=0;S.driftDir=0;S.drift=0;
    j.o.position.set(S.x+Math.sin(S.head)*2.2,j.o.position.y,S.z+Math.cos(S.head)*2.2);
    await wait(60);
   }
   pipRacer.pads.push(...savedPads);
   pipRacer.jams.length=0;pipRacer.jams.push(...all);
   return {spun:S.spin>0,down:j.down>0,boost:S.boost,shield:S.shield};
  });
  // (spun can only be true on the unshielded, unboosted branch, so it is the
  // check: a boost from a released drift would have cleared the queue instead.)
  assert.equal(jam.spun,true,'running into a queue spins the machine');
  assert.equal(jam.down,true,'and pushes that queue off the road for a while');

  // The barrier turns exactly that collision into a clear.
  const shielded=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const S=pipRacer.S;
   S.spin=0;S.boost=0;S.item=null;S.shield=6;
   const j=pipRacer.jams.find(j=>j.down<=0);
   j.o.position.set(S.x+Math.sin(S.head)*3,j.o.position.y,S.z+Math.cos(S.head)*3);
   for(let i=0;i<40&&j.down<=0;i++){S.shield=6;await wait(60);}
   return {spun:S.spin>0,cleared:j.down>0};
  });
  assert.equal(shielded.cleared,true,'the barrier clears the queue');
  assert.equal(shielded.spun,false,'and costs nothing');

  // Now let it drive: items act the moment a crate is driven through.
  await page.evaluate(AUTOPILOT);
  const item=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const S=pipRacer.S;
   S.boost=0;S.shield=0;S.item=null;S.giant=null;
   for(let i=0;i<60&&!S.boost&&!S.shield&&!S.giant&&S.item!=='laser';i++)await wait(120);
   return {boost:S.boost>0,shield:S.shield>0,giant:!!S.giant,laser:S.item==='laser'};
  });
  assert.ok(item.boost||item.shield||item.giant||item.laser,'a crate gave something');

  await page.screenshot({path:'racer/preview.png'});

  // Three laps, then a best time and a ghost to race next time.
  const finished=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   localStorage.removeItem('pip-racer-best');localStorage.removeItem('pip-racer-ghost');
   // Skip to the last stretch rather than driving three full laps in a test.
   pipRacer.S.lap=2;pipRacer.S.finished=[20,20];
   for(let i=0;i<900&&pipRacer.S.phase==='race';i++)await wait(60);
   clearInterval(window.__auto);
   return {phase:pipRacer.S.phase,
    best:JSON.parse(localStorage.getItem('pip-racer-best')||'null'),
    ghost:(JSON.parse(localStorage.getItem('pip-racer-ghost')||'[]')).length,
    laps:pipRacer.S.finished.length};
  });
  assert.equal(finished.phase,'done','three laps ends the race');
  assert.ok(finished.best>0,'a best time is kept');
  assert.ok(finished.ghost>300,'and a ghost long enough to race, got '+finished.ghost);
  assert.equal(finished.laps,3,'three lap times were taken');
  assert.equal(await page.evaluate(()=>document.querySelector('#overlay').hidden),false,'the result card is shown');

  assert.deepEqual(errors,[],'no page errors');
  console.log('PIPレーサー: laps, items, queues, barrier and the ghost passed');
 }finally{await browser.close()}
})();

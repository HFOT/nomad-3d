// Plays PIP CHAIN in a real browser: the chain grows on what it picks up, runs
// through itself unharmed, comes apart on anyone else's body and on the wall,
// and burning trades length for speed.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:8846';

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(BASE+'/chain/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.pipChain,null,{timeout:120000});

  // Four chains: the player's, and three of the other karakuri.
  const cast=await page.evaluate(()=>pipChain.chains.map(c=>({i:c.i,name:c.name})));
  assert.equal(cast.length,4,'one chain for the player and three others');
  assert.equal(cast[0].name,'あなた','the player heads the first chain');
  assert.equal(new Set(cast.map(c=>c.name)).size,4,'no karakuri is drawn twice');

  await page.click('#start');
  // It moves on its own, and the path behind it is being written.
  await page.waitForFunction(()=>pipChain.chains[0].n>200,null,{timeout:20000});
  const moving=await page.evaluate(()=>({phase:pipChain.S.phase,len:pipChain.chains[0].len,
   away:Math.hypot(pipChain.chains[0].x,pipChain.chains[0].z)}));
  assert.equal(moving.phase,'run','the run is going');
  assert.ok(moving.away>4,'the head has left the middle');

  // Steering answers the screen, not the axes. The camera mirrors x (screen
  // right is world -x), so a finger dragged right must head for screen right,
  // and the right arrow must turn clockwise as seen.
  const steered=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const you=pipChain.chains[0];
   const right=pipChain.stickDir(60,0),up=pipChain.stickDir(0,-60);
   pipChain.start();
   const a0=you.a;
   pipChain.ctl.mode='keys';pipChain.ctl.right=true;
   await wait(250);
   pipChain.ctl.right=false;pipChain.ctl.mode='point';
   const d=you.a-a0;
   return {rightX:Math.sin(right),upZ:Math.cos(up),turned:((d+Math.PI*3)%(Math.PI*2))-Math.PI};
  });
  assert.ok(steered.rightX<0,'a finger to the right steers to screen right (world -x)');
  assert.ok(steered.upZ>0,'a finger up the screen steers away (world +z)');
  assert.ok(steered.turned<0,'the right arrow turns clockwise on screen');

  // One transaction picked up is one block added. The floor is told to stop
  // topping itself up first, so nothing but the one laid down is in play.
  const grew=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const you=pipChain.chains[0];
   // From a fresh start every time: the middle of an empty field, with the
   // others a long way off, is the only place these checks are not a race.
   pipChain.start();
   pipChain.S.seedTarget=0;pipChain.loose.n=0;
   const before=you.len;
   pipChain.addLoose(you.x,you.z);
   await wait(250);
   return {before,after:you.len,loose:pipChain.loose.n};
  });
  assert.equal(grew.after,grew.before+1,'picking one up adds one block');
  assert.equal(grew.loose,0,'the one that was picked up is off the floor');

  // Burning trades the end of the chain for speed, and every block it lets go
  // of is left where it fell.
  const burned=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const you=pipChain.chains[0];
   pipChain.start();
   pipChain.S.seedTarget=0;pipChain.loose.n=0;you.len=40;
   const before=you.len;
   pipChain.ctl.boost=true;
   // Waited on the chain rather than on the clock: the run advances on its own
   // clamped time, which under a slow frame is not the wall's.
   for(let i=0;i<80&&before-you.len<3;i++)await wait(50);
   pipChain.ctl.boost=false;
   const mid={len:you.len,loose:pipChain.loose.n,phase:pipChain.S.phase};
   await wait(350);
   return {before,mid,after:you.len};
  });
  assert.equal(burned.mid.phase,'run','the chain survived the burn');
  assert.ok(burned.mid.len<burned.before,'burning shortens the chain, '+burned.before+'→'+burned.mid.len);
  assert.equal(burned.mid.loose,burned.before-burned.mid.len,'every block let go of is on the floor');
  assert.equal(burned.after,burned.mid.len,'it stops shortening when the burn stops');

  // And a field that has been emptied fills again, so a long run never runs
  // out of anything to pick up.
  const refilled=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();
   pipChain.S.seedTarget=30;pipChain.loose.n=0;
   for(let i=0;i<120&&pipChain.loose.n<8;i++)await wait(50);
   return {n:pipChain.loose.n,phase:pipChain.S.phase};
  });
  assert.equal(refilled.phase,'run','the run was still going while the floor filled');
  assert.ok(refilled.n>=8,'the floor tops itself back up, got '+refilled.n);

  // A gear is the burn with the bill waived: fast for a while, nothing paid.
  const geared=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();
   pipChain.S.seedTarget=0;pipChain.loose.n=0;
   const you=pipChain.chains[0];you.len=30;
   const g=pipChain.gears[0];
   g.live=true;g.life=12;g.o.position.set(you.x,.75,you.z);
   await wait(250);
   const got=you.gear>0,taken=!g.live;
   const before=you.len;
   pipChain.ctl.boost=true;await wait(500);pipChain.ctl.boost=false;
   return {got,taken,before,after:you.len,loose:pipChain.loose.n};
  });
  assert.equal(geared.got,true,'running over a gear grants it');
  assert.equal(geared.taken,true,'the gear is consumed where it is taken');
  assert.equal(geared.after,geared.before,'no blocks burn while the gear turns');
  assert.equal(geared.loose,0,'and nothing lands on the floor for it');

  // Length shows on the body: a long chain draws its blocks stouter.
  const stout=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();pipChain.S.seedTarget=0;
   const you=pipChain.chains[0];
   const M=new (pipChain.camera.matrix.constructor)();
   const width=m=>Math.hypot(m.elements[0],m.elements[1],m.elements[2]);
   you.len=10;await wait(250);
   you.mesh.getMatrixAt(4,M);const thin=width(M);
   you.len=240;await wait(400);
   you.mesh.getMatrixAt(4,M);const wide=width(M);
   return {thin:+thin.toFixed(2),wide:+wide.toFixed(2)};
  });
  assert.ok(stout.wide>stout.thin*1.3,'blocks grow with the chain, '+stout.thin+'→'+stout.wide);

  // A chain runs through its own body: that is what makes this one different
  // from the old snake.
  const own=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();
   const you=pipChain.chains[0];
   you.len=60;
   await wait(400);
   const on=you.seg[24];
   you.x=on.x;you.z=on.z;
   await wait(250);
   return {phase:pipChain.S.phase,alive:you.alive};
  });
  assert.equal(own.alive,true,'its own body is not an obstacle');
  assert.equal(own.phase,'run','running over itself does not end the run');

  // Another chain's body does end it, and the run is recorded.
  const cutDown=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   localStorage.removeItem('pip-chain-best');
   pipChain.start();
   const you=pipChain.chains[0];
   you.len=30;
   await wait(400);
   const peak=you.len;
   const other=pipChain.chains.find(c=>c.i>0&&c.alive);
   you.x=other.seg[5].x;you.z=other.seg[5].z;
   await wait(300);
   return {phase:pipChain.S.phase,alive:you.alive,peak,best:pipChain.best()};
  });
  assert.equal(cutDown.alive,false,'a head on another chain ends that chain');
  assert.equal(cutDown.phase,'over','and ends the run');
  assert.ok(cutDown.best&&cutDown.best.height>=cutDown.peak,'the height reached is kept');
  assert.equal(await page.evaluate(()=>document.querySelector('#overlay').hidden),false,'the result card is shown');

  // The other way round: their head on the player's body. They come apart,
  // the player is credited, and what they carried lands as light.
  const cutThem=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();
   const you=pipChain.chains[0];
   you.len=40;
   await wait(400);
   pipChain.loose.n=0;
   const them=pipChain.chains.find(c=>c.i>0&&c.alive);
   const name=them.name,had=them.len;
   them.x=you.seg[12].x;them.z=you.seg[12].z;
   await wait(300);
   return {name,had,alive:them.alive,cut:you.cut,loose:pipChain.loose.n,phase:pipChain.S.phase};
  });
  assert.equal(cutThem.alive,false,'their head on the playered chain ends theirs');
  assert.equal(cutThem.cut,1,'the player is credited with the cut');
  assert.ok(cutThem.loose>=Math.floor(cutThem.had/2)-1,'what they carried is back on the floor, got '+cutThem.loose);
  assert.equal(cutThem.phase,'run','the player keeps going');

  // A cut chain comes back, so the field never empties out. The player can
  // fall to the melee while we watch — that ends the run and the world with
  // it, rightly — so the scene is retried rather than blamed.
  const back=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   for(let tries=0;tries<4;tries++){
    pipChain.start();
    const down=pipChain.chains.find(c=>c.i>0);
    pipChain.kill(down,null);
    for(let i=0;i<120&&!down.alive&&pipChain.S.phase==='run';i++)await wait(100);
    if(down.alive)return 'back';
    if(pipChain.S.phase!=='run')continue;
    return 'never came back';
   }
   return 'the player kept dying first';
  });
  assert.equal(back,'back','a cut chain comes back');

  // A full field and a chain worth looking at, for the card on the index.
  await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();
   pipChain.chains[0].len=52;
   await wait(1400);
  });
  await page.screenshot({path:'chain/preview.png'});

  // The wall is the other way a run ends.
  const wall=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipChain.start();
   await wait(300);
   const you=pipChain.chains[0];
   you.x=200;you.z=0;
   await wait(250);
   return {phase:pipChain.S.phase,alive:you.alive};
  });
  assert.equal(wall.alive,false,'the rim ends a chain');
  assert.equal(wall.phase,'over','and ends the run');

  // Four figures and four long chains still has to draw. A loose bound: this
  // is a smoke test for a runaway frame, not a benchmark.
  const perf=await page.evaluate(async()=>{
   const LOAD=200;
   pipChain.start();
   const marks=[];
   let blocks=0;
   await new Promise(done=>{
    let last=performance.now(),n=0;
    const tick=()=>{
     // Held at full load: chains this long in a field this size cut each other
     // down within a second, and the point here is the drawing, not the run.
     for(const c of pipChain.chains)if(c.alive)c.len=LOAD;
     const t=performance.now();
     if(n>4)marks.push(t-last);
     last=t;
     blocks=Math.max(blocks,pipChain.chains.reduce((s,c)=>s+(c.alive?c.len:0),0));
     if(++n<90)requestAnimationFrame(tick);else done();
    };
    requestAnimationFrame(tick);
   });
   marks.sort((a,b)=>a-b);
   return {median:marks[marks.length>>1],worst:marks[marks.length-1],blocks};
  });
  assert.ok(perf.blocks>=700,'the field really was full, '+perf.blocks+' blocks');
  assert.ok(perf.median<50,'a full field still draws, median frame '+perf.median.toFixed(1)+'ms');

  assert.deepEqual(errors,[],'no page errors');
  console.log('PIP CHAIN: growth, burning, own body, both cuts, the wall and a full field passed'
   +' (median frame '+perf.median.toFixed(1)+'ms at '+perf.blocks+' blocks)');
 }finally{await browser.close()}
})();

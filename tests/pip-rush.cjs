// Plays PIP RUSH in a real browser: the swarm arrives and is thrown down, the
// items do what they say when run over, and a run ends both ways.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:8846';

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(BASE+'/rush/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.pipRush,null,{timeout:120000});

  await page.click('#start');
  // The swarm arrives on its own and the automatic throw clears it.
  await page.waitForFunction(()=>pipRush.swarm.length>0,null,{timeout:20000});
  await page.waitForFunction(()=>pipRush.S.kills>0,null,{timeout:30000});
  const running=await page.evaluate(()=>({left:pipRush.S.left,hp:pipRush.S.hp,shots:pipRush.shots.length}));
  assert.ok(running.left<60,'the minute is counting down');
  assert.equal(running.hp,3,'PIP starts whole');

  // Items act the moment they are run over: no button, no menu.
  const picked=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const before={fan:pipRush.S.fan,shields:pipRush.S.shields,drops:pipRush.drops.length};
   pipRush.dropItem(pipRush.S.x,pipRush.S.z,'fan');   // lands under PIP
   await wait(220);
   const afterFan=pipRush.S.fan;
   pipRush.dropItem(pipRush.S.x,pipRush.S.z,'shield');
   await wait(220);
   return {before,afterFan,shields:pipRush.S.shields,drops:pipRush.drops.length};
  });
  assert.equal(picked.afterFan,picked.before.fan+1,'the multi item adds a throw');
  assert.equal(picked.shields,picked.before.shields+1,'the barrier item adds a block');
  assert.ok(picked.drops<=picked.before.drops,'an item is consumed where it is picked up');
  assert.equal(await page.evaluate(()=>pipRush.barrier[0].visible),true,'the barrier block is on the field');

  // The giant block clears what stands around PIP.
  const cleared=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   // A ring wide enough that nothing touches PIP while we watch, and narrow
   // enough that all of it is inside the blast.
   pipRush.S.hp=3;pipRush.S.shields=0;
   for(let i=0;i<24;i++)pipRush.spawnSwarm();
   for(const s of pipRush.swarm){
    const a=Math.random()*Math.PI*2,r=4.5+Math.random()*3;
    s.o.position.x=pipRush.S.x+Math.cos(a)*r;s.o.position.z=pipRush.S.z+Math.sin(a)*r;
   }
   // Only what stands inside the blast is the block's business; the yard keeps
   // spawning at its rim the whole time.
   const near=()=>pipRush.swarm.filter(s=>Math.hypot(s.o.position.x-pipRush.S.x,s.o.position.z-pipRush.S.z)<9).length;
   const before=near();
   pipRush.pickUp('drop');
   // Wait for the block to actually land rather than for a guessed number of
   // milliseconds: a headless frame rate is nobody's promise.
   for(let i=0;i<80&&pipRush.S.drop;i++)await wait(50);
   await wait(60);
   return {before,after:near(),phase:pipRush.S.phase};
  });
  assert.equal(cleared.phase,'run','the run is still going');
  assert.ok(cleared.before>10,'a crowd was standing around PIP');
  assert.ok(cleared.after<cleared.before/2,'the giant block cleared most of it');

  // The kinds behave differently: a hulk takes several throws, a splitter
  // leaves two darts where it fell.
  const kinds=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const gone=s=>!pipRush.swarm.includes(s);

   pipRush.start();pipRush.S.shields=0;
   pipRush.spawnSwarm('hulk',pipRush.S.x+5,pipRush.S.z);
   const hulk=pipRush.swarm[pipRush.swarm.length-1],hulkHp=hulk.hp;
   for(let i=0;i<70&&!gone(hulk)&&hulk.hp===hulkHp;i++)await wait(50);
   const worn=gone(hulk)||hulk.hp<hulkHp;

   pipRush.start();pipRush.S.shields=0;
   pipRush.spawnSwarm('split',pipRush.S.x+4,pipRush.S.z);
   const sp=pipRush.swarm[pipRush.swarm.length-1];
   sp.hp=1;
   const at={x:sp.o.position.x,z:sp.o.position.z};
   for(let i=0;i<70&&!gone(sp);i++)await wait(50);
   await wait(60);
   // Counted where it fell, so the yard's own arrivals cannot be mistaken for
   // the pieces it left.
   const darts=pipRush.swarm.filter(s=>s.kind==='dart'&&Math.hypot(s.o.position.x-at.x,s.o.position.z-at.z)<4).length;
   return {hulkHp,worn,darts,split:gone(sp)};
  });
  assert.equal(kinds.hulkHp,4,'a hulk takes four throws');
  assert.equal(kinds.worn,true,'throws wear a hulk down');
  assert.equal(kinds.split,true,'the splitter went down');
  assert.ok(kinds.darts>=2,'a splitter leaves darts behind, got '+kinds.darts);

  await page.screenshot({path:'rush/preview.png'});

  // Running out of hits ends the run and leaves an empty block behind.
  const ended=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const chain=()=>JSON.parse(localStorage.getItem('pip-rush-chain')||'[]');
   const before=chain().length;
   pipRush.S.hp=1;pipRush.S.invuln=0;pipRush.S.shields=0;
   for(let i=0;i<6;i++)pipRush.spawnSwarm();
   for(const s of pipRush.swarm){s.o.position.x=pipRush.S.x+.3;s.o.position.z=pipRush.S.z;}
   await wait(600);
   return {phase:pipRush.S.phase,added:chain().length-before,last:chain()[chain().length-1]};
  });
  assert.equal(ended.phase,'over','no hits left ends the run');
  assert.equal(ended.added,1,'the run is recorded');
  assert.equal(ended.last,false,'losing leaves an empty block');
  assert.equal(await page.evaluate(()=>document.querySelector('#overlay').hidden),false,'the result card is shown');

  // Surviving the minute mints a filled block.
  const survived=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const chain=()=>JSON.parse(localStorage.getItem('pip-rush-chain')||'[]');
   pipRush.start();
   pipRush.S.left=.15;
   await wait(600);
   return {phase:pipRush.S.phase,last:chain()[chain().length-1]};
  });
  assert.equal(survived.phase,'over','the minute ends the run');
  assert.equal(survived.last,true,'surviving mints a filled block');

  assert.deepEqual(errors,[],'no page errors');
  console.log('PIP RUSH: swarm, auto-throw, items, giant block and both endings passed');
 }finally{await browser.close()}
})();

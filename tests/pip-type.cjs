// Plays PIP TYPE in a real browser: the first key locks the nearest matching
// word, right keys advance it, wrong keys only count, and a finished word is
// a throw. Both endings mint what they deserve.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:8846';

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(BASE+'/type/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.pipType,null,{timeout:120000});

  await page.click('#start');
  await page.waitForFunction(()=>pipType.S.phase==='run',null,{timeout:10000});

  // Typed through the real keyboard: a whole word is a kill.
  const wordKill=await page.evaluate(()=>{
   for(const e of pipType.enemies.slice())e.o.visible=false;
   pipType.enemies.length=0;
   pipType.spawnEnemy('rock','ada',6,3);
   return {enemies:pipType.enemies.length,kills:pipType.S.kills};
  });
  assert.equal(wordKill.enemies,1,'one word is walking');
  await page.keyboard.type('ada',{delay:60});
  await page.waitForFunction(()=>pipType.S.kills===1,null,{timeout:5000});
  assert.equal(await page.evaluate(()=>pipType.enemies.length),0,'the word was thrown down');

  // The first key chooses the nearest starter; a wrong key counts and stays.
  const lock=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipType.spawnEnemy('rock','slot',14,0);
   pipType.spawnEnemy('rock','stake',5,0);
   pipType.keyChar('s');
   const locked=pipType.getTarget()&&pipType.getTarget().word;
   const missBefore=pipType.S.miss;
   pipType.keyChar('x');
   await wait(80);
   return {locked,missAdded:pipType.S.miss-missBefore,done:pipType.getTarget().done,hits:pipType.S.hits};
  });
  assert.equal(lock.locked,'stake','the nearer of the two answers the first key');
  assert.equal(lock.missAdded,1,'a wrong key is counted');
  assert.equal(lock.done,1,'and the word does not advance on it');

  // Finishing the locked word frees the other one for its own first key.
  await page.evaluate(async()=>{
   for(const c of 'take')pipType.keyChar(c);
   await new Promise(r=>setTimeout(r,300));
  });
  assert.equal(await page.evaluate(()=>pipType.S.kills),2,'the locked word went down');
  assert.equal(await page.evaluate(()=>pipType.getTarget()),null,'the lock is released');

  // A splitter read to the end leaves two short words where it fell.
  const split=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   for(const e of pipType.enemies.slice()){const i=pipType.enemies.indexOf(e);if(i>=0){pipType.enemies.splice(i,1);e.o.visible=false;e.label.sprite.visible=false;}}
   pipType.spawnEnemy('split','wallet',10,5);
   for(const c of 'wallet')pipType.keyChar(c);
   await wait(400);
   return {count:pipType.enemies.length,kinds:pipType.enemies.map(e=>e.kind)};
  });
  assert.equal(split.count,2,'the splitter became two');
  assert.deepEqual(split.kinds,['dart','dart'],'both pieces are the quick kind');

  await page.screenshot({path:'type/preview.png'});

  // Reaching PIP costs a crack; running out of them ends the run empty.
  const ended=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const chain=()=>JSON.parse(localStorage.getItem('pip-type-chain')||'[]');
   const before=chain().length;
   pipType.S.hp=1;pipType.S.invuln=0;
   pipType.spawnEnemy('rock','fee',.4,0);
   for(let i=0;i<40&&pipType.S.phase==='run';i++)await wait(100);
   return {phase:pipType.S.phase,added:chain().length-before,last:chain()[chain().length-1]};
  });
  assert.equal(ended.phase,'over','no cracks left ends the run');
  assert.equal(ended.added,1,'the run is recorded');
  assert.equal(ended.last,false,'losing leaves an empty block');

  // Typing through the minute mints a filled block.
  const survived=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const chain=()=>JSON.parse(localStorage.getItem('pip-type-chain')||'[]');
   pipType.start();
   pipType.S.left=.15;
   await wait(700);
   return {phase:pipType.S.phase,last:chain()[chain().length-1]};
  });
  assert.equal(survived.phase,'over','the minute ends the run');
  assert.equal(survived.last,true,'surviving mints a filled block');

  assert.deepEqual(errors,[],'no page errors');
  console.log('PIP TYPE: lock-on, misses, the splitter, the crack and both endings passed');
 }finally{await browser.close()}
})();

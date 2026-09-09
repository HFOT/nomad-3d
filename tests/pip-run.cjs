// Drives PIP RUN in a real browser: the run advances, the road is populated,
// and the three things that decide a run — a hit, a pickup, a gate — resolve.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:8846';

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(BASE+'/game/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.pipRun,null,{timeout:120000});

  await page.click('#start');
  await page.waitForFunction(()=>pipRun.S.dist>25,null,{timeout:30000});

  const seeded=await page.evaluate(()=>({
   obstacles:pipRun.props.filter(p=>p.kind==='obstacle').length,
   pickups:pipRun.props.filter(p=>p.kind==='pickup').length,
   ahead:pipRun.props.filter(p=>p.kind==='obstacle').every(p=>p.obj.position.z>0),
  }));
  assert.ok(seeded.obstacles>2,'road seeded with obstacles, got '+seeded.obstacles);
  assert.ok(seeded.pickups>0,'road seeded with a pickup');
  assert.equal(seeded.ahead,true,'nothing spawns behind the courier');

  // A hit costs a gear and the transaction in hand.
  await page.evaluate(()=>{
   const o=pipRun.props.find(p=>p.kind==='obstacle');
   pipRun.S.carrying=true;pipRun.S.x=o.x;pipRun.S.vx=0;o.obj.position.z=.3;
  });
  await page.waitForFunction(()=>pipRun.S.hits===1,null,{timeout:10000});
  assert.equal(await page.evaluate(()=>pipRun.S.carrying),false,'a hit drops the transaction');

  // Running over a loose transaction picks it up.
  await page.evaluate(()=>{
   const p=pipRun.props.find(p=>p.kind==='pickup');
   pipRun.S.x=p.obj.position.x;pipRun.S.vx=0;p.obj.position.z=.3;
  });
  await page.waitForFunction(()=>pipRun.S.carrying===true,null,{timeout:10000});

  // Carrying it through the gate mints a filled block; the slot moves on.
  await page.evaluate(()=>{pipRun.S.nextGate=pipRun.S.dist+6});
  await page.waitForFunction(()=>pipRun.S.blocks.length===1,null,{timeout:20000});
  const minted=await page.evaluate(()=>({block:pipRun.S.blocks[0],slot:pipRun.S.slot,carrying:pipRun.S.carrying}));
  assert.equal(minted.block,true,'the block carries the delivered transaction');
  assert.equal(minted.slot,2,'the slot advances at the gate');
  assert.equal(minted.carrying,false,'the transaction is handed over at the gate');

  // Pressing right must move PIP to the right of the screen. The camera looks
  // up +z, so the world axis and the screen axis disagree; this catches it.
  await page.evaluate(()=>{pipRun.S.x=0;pipRun.S.vx=0});
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>Math.abs(pipRun.S.x)>.5,null,{timeout:10000});
  const screenX=await page.evaluate(()=>{
   const v=pipRun.scene.getObjectByName('PIP').position.clone();
   return v.project(pipRun.camera).x;
  });
  await page.keyboard.up('ArrowRight');
  assert.ok(screenX>0,'right moves PIP right on screen, got ndc x '+screenX.toFixed(2));

  // The hop clears what is low and never clears a relay pylon.
  const jumped=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   pipRun.S.x=0;pipRun.S.vx=0;
   window.dispatchEvent(new KeyboardEvent('keydown',{key:' '}));
   await wait(120);
   const rose=pipRun.S.y>.3;
   const drop=(kind,y)=>{
    const p=pipRun.props.filter(q=>q.kind==='obstacle').find(q=>q.obj.position.z>4&&q.clear===(kind==='crate'?.95:99));
    if(!p)return null;
    pipRun.S.y=y;pipRun.S.vy=0;pipRun.S.grounded=true;
    pipRun.S.x=p.x;pipRun.S.vx=0;p.obj.position.z=.3;
    return p;
   };
   const before=pipRun.S.hits;
   const crate=drop('crate',1.05);await wait(400);
   const clearedCrate=crate?pipRun.S.hits===before:null;
   const pylon=drop('pylon',1.05);await wait(400);
   const stoppedByPylon=pylon?pipRun.S.hits>before:null;
   pipRun.S.y=0;pipRun.S.vy=0;pipRun.S.grounded=true;
   return {rose,clearedCrate,stoppedByPylon};
  });
  assert.equal(jumped.rose,true,'space lifts PIP off the road');
  assert.equal(jumped.clearedCrate,true,'a crate is passed over at height');
  assert.equal(jumped.stoppedByPylon,true,'a pylon is not passed over at height');

  await page.screenshot({path:'game/preview.png'});

  // The third gear ends the run.
  await page.evaluate(()=>{
   pipRun.S.hits=2;
   const o=pipRun.props.filter(p=>p.kind==='obstacle').find(p=>p.obj.position.z>2);
   pipRun.S.x=o.x;pipRun.S.vx=0;o.obj.position.z=.3;
  });
  await page.waitForFunction(()=>pipRun.S.phase==='over',null,{timeout:15000});
  assert.equal(await page.evaluate(()=>document.querySelector('#overlay').hidden),false,'the result card is shown');

  assert.deepEqual(errors,[],'no page errors');
  console.log('PIP RUN: seeding, hit, pickup, gate and run-end passed');
 }finally{await browser.close()}
})();

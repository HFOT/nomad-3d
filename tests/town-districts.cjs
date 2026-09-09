const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8846/town/?v=district4',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.town,null,{timeout:180000});
  const architecture=await page.evaluate(()=>{
   const [assembly,vault,depot,archive]=town.landmarkModels;
   const before=archive.stats().angles[0];archive.tick(.1,200);const after=archive.stats().angles[0];
   vault.setLock(false);for(let i=0;i<90;i++)vault.tick(i/30,1/30);const opened=vault.getStats().lockOpen;vault.setLock(true);
   return {full:town.landmarkModels.every(m=>m.root.userData.fullModel),names:town.landmarkModels.map(m=>m.root.name),rotates:before!==after,opened,books:archive.stats().bookCount};
  });
  assert.equal(architecture.full,true);assert.equal(architecture.rotates,true);assert.ok(architecture.opened>.95);assert.ok(architecture.books>1000);
  await page.screenshot({path:'town/district-overview.png'});
  await page.locator('#landmarks').uncheck();
  await page.screenshot({path:'town/district-base.png'});
  await page.locator('#market-view').click();
  await page.screenshot({path:'town/district-market.png'});
  await page.locator('#civilian').uncheck();
  const state=await page.evaluate(()=>({civilian:town.neighborhood.root.visible,residences:town.residenceQuarter.root.visible,landmarks:town.civicLayer.visible,works:town.cityWorks.root.visible,water:town.cityWorks.isWater(25,0),bridge:town.cityWorks.isWater(0,25),buildings:town.residenceQuarter.homes.length,flamePorts:town.residenceQuarter.network?.root.userData.plan.connected??0}));
  assert.equal(state.civilian,false);assert.equal(state.residences,false);assert.equal(state.landmarks,false);assert.equal(state.works,true);assert.equal(state.water,true);assert.equal(state.bridge,false);assert.ok(state.buildings>30);
  // Every residence's flame port reaches the treasury, or the quarter has no mains at all.
  assert.ok(state.flamePorts>=state.buildings);
  await page.locator('#civilian').check();await page.locator('#landmarks').check();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,...state,architecture}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

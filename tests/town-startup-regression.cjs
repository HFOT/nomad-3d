const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8846/town/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.town?.state.frames>2,null,{timeout:180000});
 const result=await page.evaluate(()=>{const q=town.residenceQuarter;let batches=0,instances=0;const shared=new Set();q.root.traverse(o=>{if(o.isInstancedMesh){batches++;instances+=o.count;shared.add(o.geometry.uuid);}});const h=q.homes[0];h.tick(0);const before=h.gears[0].g.rotation.z;h.tick(1);const rotates=before!==h.gears[0].g.rotation.z;return {homes:q.homes.length,ports:q.network.root.userData.plan.connected,batches,instances,uniqueGeometry:shared.size,rotates,full:town.landmarkModels.every(m=>m.root.userData.fullModel)};});
 // The map keeps 57 real residences plus the arcade's two flame ports on the
 // validated aerial main. Landmark silhouettes are not allowed here: town
 // landmarks must remain their authored, detailed architectural models.
 assert.equal(result.homes,57);assert.equal(result.ports,61);assert.ok(result.instances>result.uniqueGeometry);assert.ok(result.rotates);assert.equal(result.full,true);
 await page.locator('#civilian').uncheck();assert.equal(await page.evaluate(()=>town.residenceQuarter.root.visible),false);await page.locator('#civilian').check();await page.locator('#market-view').click();await page.locator('#walk').click();assert.ok(await page.evaluate(()=>town.playerState));await page.locator('#walk').click();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,...result}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

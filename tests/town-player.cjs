const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8846/town/?v=movement',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.town,null,{timeout:180000});await page.locator('#walk').click();
 await page.waitForTimeout(400);const initial=await page.evaluate(()=>town.walkers.find(w=>w.id==='nomad').root.position.y);
 await page.keyboard.press('Space');await page.waitForFunction(y=>town.walkers.find(w=>w.id==='nomad').root.position.y>y+.45,initial,{timeout:15000});
 const airborne=await page.evaluate(()=>town.playerState);assert.equal(airborne.grounded,false);
 await page.screenshot({path:'town/nomad-jump.png'});await page.waitForFunction(()=>town.playerState.grounded,null,{timeout:15000});
 await page.keyboard.down('Shift');await page.keyboard.down('KeyW');await page.waitForFunction(()=>town.playerState.speed>9,null,{timeout:15000});await page.keyboard.up('KeyW');await page.keyboard.up('Shift');
 const scale=await page.evaluate(()=>town.walkers.find(w=>w.id==='nomad').root.scale.x);assert.equal(scale,.64);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>town.playerState),null);assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,scale,airborne}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

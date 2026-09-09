const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8846/town/?v=groundwork',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.town,null,{timeout:180000});
 const data=await page.evaluate(async()=>{const T=await import('/node_modules/three/build/three.module.js'),ray=new T.Raycaster();const height=(x,z,objects)=>{ray.set(new T.Vector3(x,5,z),new T.Vector3(0,-1,0));return ray.intersectObjects(objects,true)[0]?.point.y??null;};return {land:height(0,80,town.groundwork.walkables),cut:height(25,0,town.groundwork.walkables),bankDepth:town.groundwork.root.userData.canalDepth};});
 assert.ok(data.land>.05);assert.equal(data.cut,null);assert.ok(data.bankDepth>1);
 const components=await page.evaluate(async()=>{const {streetComponents}=await import('/town/street-surface.js');return streetComponents(town.cityWorks.streets).map(g=>({size:g.length,ends:g.map(i=>[town.cityWorks.streets[i].a.toArray(),town.cityWorks.streets[i].b.toArray()])}));});console.log('Street components',JSON.stringify(components.map(c=>({size:c.size,ends:c.size<4?c.ends:undefined}))));assert.equal(components.length,1,'Every street must connect to the national road network');
 await page.locator('#landmarks').uncheck();await page.screenshot({path:'town/groundwork-overview.png'});
 await page.evaluate(()=>{town.camera.position.set(22,4,59);town.controls.target.set(10.5,0,46);town.controls.update();});await page.screenshot({path:'town/groundwork-canal.png'});
 await page.locator('#walk').click();const before=await page.evaluate(()=>town.walkers.find(w=>w.id==='nomad').root.position.toArray());await page.keyboard.down('KeyW');await page.waitForTimeout(2200);await page.keyboard.up('KeyW');const after=await page.evaluate(()=>town.walkers.find(w=>w.id==='nomad').root.position.toArray());
 assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>.3);assert.ok(after[1]>=.07);
 await page.screenshot({path:'town/groundwork-walking.png'});assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,data,before,after}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

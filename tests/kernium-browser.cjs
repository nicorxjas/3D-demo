const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge',args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const {kerniumKnowledge}=await import('../server/kernium.js');
  await page.route('**/api/kernium/chat',async route=>{const {message,history}=route.request().postDataJSON();await route.fulfill({json:kerniumKnowledge(message,history).demo()});});
  for(const path of ['/impresora','/impresora/','/kernium','/kernium/']){
   const response=await page.goto('http://localhost:3000'+path);assert.equal(response.status(),200);await page.waitForFunction(()=>window.layer?.getState().meshCount>0);
   assert.equal((await page.evaluate(()=>window.layer.getState())).visibleParts.length,path.includes('kernium')?10:18);
  }
  await page.waitForTimeout(1600);await page.screenshot({path:'artifacts/kernium-assembled.png',fullPage:true});
  assert.equal(await page.locator('[data-part]').count(),10);
  await page.getByRole('button',{name:'Hidráulica',exact:true}).click();await page.waitForTimeout(1300);
  let state=await page.evaluate(()=>window.layer.getState());assert.deepEqual(state.visibleParts.sort(),['pump','reservoir','valves']);assert.equal(state.structuralContextVisible,false);
  await page.getByRole('button',{name:'Seleccionar Bloque distribuidor',exact:true}).click();await page.getByRole('button',{name:'Aislar conjunto',exact:true}).click();
  assert.deepEqual((await page.evaluate(()=>window.layer.getState())).visibleParts,['valves']);
  await page.locator('#xray-button').click();await page.locator('#clear-filter').click();await page.locator('#assembled-tab').click();
  state=await page.evaluate(()=>window.layer.getState());assert.equal(state.visibleParts.length,10);assert.equal(state.explosion,0);assert.equal(state.structuralContextVisible,true);
  await page.locator('#xray-button').click();await page.locator('#exploded-tab').click();await page.waitForTimeout(1800);await page.screenshot({path:'artifacts/kernium-exploded.png',fullPage:true});
  await page.getByRole('button',{name:'Las horquillas no elevan',exact:true}).click();await page.waitForFunction(()=>!window.layer.getState().busy&&document.querySelector('.message-sources a'));
  assert((await page.locator('.message-sources a').first().getAttribute('href')).includes('/api/kernium/manual#page='));
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'kernium-diagnostico.md');
  await download.saveAs('artifacts/kernium-session.md');assert.match(fs.readFileSync('artifacts/kernium-session.md','utf8'),/Manual ·.*PDF/);
  await page.locator('#pareto-button').click();assert.match(await page.locator('#dialog-body').innerText(),/pendiente de validar/);await page.locator('#close-dialog').click();
  const pdf=await page.request.get('http://localhost:3000/api/kernium/manual');assert.equal(pdf.headers()['content-type'],'application/pdf');assert.equal((await pdf.body()).subarray(0,4).toString(),'%PDF');
  await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3000/kernium');await page.waitForTimeout(1800);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/kernium-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: routes, 10 groups, 5 subsystems, isolation, X-ray, assembly, citations, export, PDF, mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

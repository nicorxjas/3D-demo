import assert from 'node:assert/strict';
const base=process.env.APP_URL||'http://127.0.0.1:3000';
const status=await fetch(base+'/api/status').then(r=>r.json());
assert.equal(status.provider,'ollama');assert.equal(status.mode,'live');
const started=Date.now();
const r=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'La cama no calienta y aparece Bed preheat error',history:[]}),signal:AbortSignal.timeout(190000)});
const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));assert.equal(data.provider,'ollama');assert.equal(data.mode,'live');assert(data.partIds.includes('bed'));assert(data.sourceIds.includes('heat-guide'));assert(data.steps.length>0);assert(!data.partIds.includes('thermistor'));assert(!data.partIds.includes('heater'));assert(data.summary.trim());assert(data.followUp.trim());
console.log(JSON.stringify({model:data.model,seconds:(Date.now()-started)/1000,answer:data},null,2));

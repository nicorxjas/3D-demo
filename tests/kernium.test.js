import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parts, subsystems } from '../public/kernium/catalog.js';
import { kerniumKnowledge, retrieveManual, manualIndex } from '../server/kernium.js';
import { diagnose } from '../server/diagnosis.js';

test('pinned manual is complete, reproducible, and cited at the correct pages',()=>{
 assert.equal(manualIndex.pageCount,109);
 assert.equal(manualIndex.sha256,createHash('sha256').update(readFileSync(new URL('../data/kernium/manual.pdf',import.meta.url))).digest('hex'));
 assert.match(manualIndex.pages[74].text,/Troubleshooting/);
 assert.match(manualIndex.pages[35].text,/Battery Maintenance/);
 assert.equal(parts.length,10);assert.equal(subsystems.length,5);
 assert(parts.every(p=>subsystems.some(s=>s.id===p.subsystem)));
 assert.equal(new Set(parts.map(p=>p.id)).size,10);
});
test('Spanish symptoms and follow-ups retrieve the relevant English manual pages',()=>{
 for(const [q,page] of [['Las horquillas no elevan',75],['Hay una fuga de aceite hidráulico',84],['No avanza',75],['Código 1908',54]]) {
  const r=retrieveManual(q);assert(r.chunks.some(c=>c.page===page),q);assert(r.chunks.some(c=>c.page===83));
 }
 assert(retrieveManual('Y sigue igual',[{role:'user',content:'No avanza'}]).partIds.includes('drive'));
});
test('Kernium provider gets isolated source and part enums and emits page citations',async()=>{
 const knowledge=kerniumKnowledge('No avanza');
 const answer={title:'Revisar habilitación',summary:'No confirma una falla del motor.',safety:'',steps:['Consultar el estado de carga en el display.'],partIds:['battery'],sourceIds:['manual-p75-c1'],followUp:'¿Qué código aparece?'};
 const result=await diagnose('No avanza',[],{provider:'ollama',knowledge,fetchImpl:async(url,options)=>{
  const body=JSON.parse(options.body);assert.match(body.messages[0].content,/Kernium/);assert.doesNotMatch(body.messages[0].content,/Prusa|hotend|fuse-guide/);
  assert.deepEqual(body.format.properties.partIds.items.enum,parts.map(p=>p.id));
  return {ok:true,json:async()=>({done:true,message:{content:JSON.stringify(answer)}})};
 }});
 assert.equal(result.citations[0].url,'/api/kernium/manual#page=75');
 assert.match(result.safety,/batería/);assert.doesNotMatch(result.safety,/impresora|hotend/);
 assert.throws(()=>knowledge.validate({...answer,partIds:['bed']}));
 assert.throws(()=>knowledge.validate({...answer,sourceIds:['manual-p109-c1']}));
 assert.throws(()=>knowledge.validate({...answer,sourceIds:[]}));
 assert.deepEqual(knowledge.validate({...answer,steps:['1. Revisar la carga (manual-p75-c1, id: manual-p75-c1).']}).steps,['Revisar la carga.']);
});
test('unsupported replacement requests do not turn a maintenance checklist into instructions',async()=>{
 const q='Cómo reemplazar el bloque distribuidor';
 const answer=await diagnose(q,[],{provider:'demo',knowledge:kerniumKnowledge(q)});
 assert.equal(answer.steps.length,0);assert.match(answer.summary,/taller/);
 const brakes=kerniumKnowledge('Falla el freno').demo();assert.equal(brakes.partIds.length,0);assert.match(brakes.title,/Retirar/);
});
test('long conversations have a bounded history and sufficient context capacity',async()=>{
 const history=Array.from({length:10},()=>({role:'user',content:'síntoma '.repeat(200)}));
 const knowledge=kerniumKnowledge('No avanza',history);
 await diagnose('No avanza',history,{knowledge,provider:'ollama',fetchImpl:async(url,options)=>{
  const body=JSON.parse(options.body);assert.equal(body.messages.length,6);
  assert(body.messages.slice(1,-1).every(m=>m.content.length<=500));
  return {ok:true,json:async()=>({done:true,message:{content:JSON.stringify({title:'Contexto',summary:'Falta el código.',safety:'',steps:[],partIds:[],sourceIds:[],followUp:'¿Cuál es el código?'})}})};
 }});
 assert.equal(kerniumKnowledge('Las horquillas no elevan '+'x'.repeat(2990),history).numCtx,8192);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { aiConfig, aiStatus, diagnose, demoDiagnosis, responseSchema } from '../server/diagnosis.js';
const value=()=>{const {mode,...answer}=demoDiagnosis('La cama no calienta');return answer;};
const reply=content=>({ok:true,json:async()=>({done:true,message:{content:JSON.stringify(content)}})});
test('local provider is default even with a cloud key, demo is explicit',async()=>{
 assert.equal(aiConfig({OPENAI_API_KEY:'unused'}).provider,'ollama');
 assert.equal(aiConfig({}).model,'llama3.1:8b');
 assert.throws(()=>aiConfig({LLM_PROVIDER:'typo'}));
 assert.equal((await diagnose('hola',[],{provider:'demo',fetchImpl:()=>assert.fail()})).mode,'demo');
});
test('Ollama receives schema, docs, bounded history and no cloud credentials',async()=>{
 const result=await diagnose('La cama no calienta',Array.from({length:12},()=>({role:'user',content:'contexto'})),{apiKey:'never-send',provider:'ollama',fetchImpl:async(url,options)=>{
  assert.equal(url,'http://127.0.0.1:11434/api/chat');assert.equal(options.headers.Authorization,undefined);
  const body=JSON.parse(options.body);assert.equal(body.model,'llama3.1:8b');assert.equal(body.stream,false);assert.deepEqual(body.format,responseSchema);assert.equal(body.messages.length,12);assert.match(body.messages[0].content,/DOCUMENTACIÓN/);assert.equal(body.messages.at(-1).content,'La cama no calienta');return reply(value());
 }});assert.equal(result.provider,'ollama');assert.equal(result.mode,'live');assert(result.partIds.includes('bed'));
});
test('Ollama failures never fall back to demo',async()=>{
 for(const [fetchImpl,pattern] of [
  [async()=>{throw new Error('ECONNREFUSED');},/conectar a Ollama/],
  [async()=>{throw new DOMException('timeout','TimeoutError');},/3 minutos/],
  [async()=>({ok:false,status:404}),/no está instalado/],
  [async()=>({ok:false,status:500}),/500/],
  [async()=>({ok:true,json:async()=>({done_reason:'length'})}),/incompleta/],
  [async()=>reply({...value(),partIds:['invented']}),/inválido/],
  [async()=>reply({...value(),summary:''}),/inválido/],
  [async()=>reply({...value(),sourceIds:[]}),/inválido/],
  [async()=>({ok:true,json:async()=>({message:{content:'not json'}})}),/inválido/]
 ])await assert.rejects(diagnose('test',[],{fetchImpl}),pattern);
});
test('status checks installed model and distinguishes offline from demo',async()=>{
 const config=aiConfig({});
 assert.equal((await aiStatus(config,async()=>({ok:true,json:async()=>({models:[{name:'llama3.1:8b'}]})}))).mode,'live');
 assert.equal((await aiStatus(config,async()=>({ok:true,json:async()=>({models:[]})}))).mode,'offline');
 assert.equal((await aiStatus(config,async()=>{throw Error();})).mode,'offline');
 assert.equal((await aiStatus({provider:'demo'},()=>assert.fail())).mode,'demo');
});


test('missing citations are repaired by the LLM with the same context and deadline',async()=>{
 const raw={title:'Motor del eje X no se mueve',summary:'Revisar recorrido de cables, varillas y lubricación de rodamientos.',safety:'',steps:['Verificar tensión de correas','Revisar si hay obstrucciones en el recorrido del eje X'],partIds:['motor-x'],sourceIds:[],followUp:'¿El motor vibra?'};
 let calls=0,signal;
 const answer=await diagnose('El motor del eje X no se mueve',[],{fetchImpl:async(url,options)=>{
  const request=JSON.parse(options.body);calls++;
  if(calls===1){signal=options.signal;return reply(raw);}
  assert.equal(options.signal,signal);
  assert.equal(request.messages[1].content,'El motor del eje X no se mueve');
  assert.deepEqual(JSON.parse(request.messages.at(-2).content),raw);
  assert.match(request.messages.at(-1).content,/sourceIds está vacío/);
  return reply({...raw,sourceIds:['motion-guide']});
 }});
 assert.equal(calls,2);assert.equal(answer.mode,'live');assert.deepEqual(answer.sourceIds,['motion-guide']);
});
test('failed repair is bounded and cannot bypass reference validation',async()=>{
 let calls=0;
 await assert.rejects(diagnose('motor x',[],{fetchImpl:async()=>{calls++;return reply({...value(),sourceIds:[]});}}),/después de intentar corregirlo/);
 assert.equal(calls,2);
});
test('unsupported query may return no steps and no citations without repair',async()=>{
 let calls=0;const answer=await diagnose('consulta fuera de alcance',[],{fetchImpl:async()=>{calls++;return reply({...value(),steps:[],sourceIds:[],partIds:[],summary:'No hay documentación para ese síntoma.'});}});
 assert.equal(calls,1);assert.deepEqual(answer.steps,[]);assert.deepEqual(answer.sourceIds,[]);
});

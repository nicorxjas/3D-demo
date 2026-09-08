import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { diagnose, aiConfig, aiStatus } from './diagnosis.js';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const port=Number(process.env.PORT||3000);
const config=aiConfig();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 try {
  if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) return json(res,403,{error:'Origen no autorizado.'});
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/status' && req.method==='GET') return json(res,200,await aiStatus(config));
  if(url.pathname==='/api/chat' && req.method==='POST') {
   let body='', size=0;
   for await(const chunk of req){size+=chunk.length;if(size>32000)return json(res,413,{error:'La consulta es demasiado larga.'});body+=chunk;}
   let data;try{data=JSON.parse(body);}catch{return json(res,400,{error:'JSON inválido.'});}
   if(typeof data.message!=='string'||!data.message.trim()||data.message.length>3000) return json(res,400,{error:'Escribí una consulta de hasta 3000 caracteres.'});
   const history=data.history??[];
   if(!Array.isArray(history)||history.length>10||history.some(m=>!['user','assistant'].includes(m?.role)||typeof m.content!=='string'||m.content.length>5000))return json(res,400,{error:'Historial inválido.'});
   try{return json(res,200,await diagnose(data.message,history,config));}catch(error){return json(res,502,{error:error.message});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Método no permitido.'});
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return json(res,400,{error:'Ruta inválida.'});}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root)||pathname.includes('\\'))return json(res,403,{error:'Ruta no permitida.'});
  try{const content=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'text/plain','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content);}catch{return json(res,404,{error:'No encontrado.'});}
 }catch{if(!res.headersSent)json(res,500,{error:'No se pudo procesar la solicitud.'});else res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`LAYER → http://localhost:${port} · ${config.provider} · ${config.model}`));

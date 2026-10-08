import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url));
const root=process.argv.includes('--dist')?path.join(base,'dist'):base;
const port=Number(process.env.PORT)||4186;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const name=decodeURIComponent(url.pathname);
    let target=path.resolve(root,'.'+name);
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    try{if(!(await stat(target)).isFile())target=path.join(root,'index.html');}catch{if(path.extname(name)){res.writeHead(404);res.end('Файл не найден');return;}target=path.join(root,'index.html');}
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(400);res.end('Некорректный запрос');}
}).listen(port,'127.0.0.1',()=>console.log(`VANTA: http://127.0.0.1:${port}`));

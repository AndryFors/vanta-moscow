import {cp,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
await mkdir(out,{recursive:true});
const products=JSON.parse(await readFile(path.join(root,'data/products.json'),'utf8'));
for(const file of new Set(['/assets/hero.webp',...products.flatMap(p=>p.images)])){try{await stat(path.join(root,file));}catch{throw new Error('Нет изображения: '+file);}}
for(const item of ['index.html','src','data','assets'])await cp(path.join(root,item),path.join(out,item),{recursive:true});
await writeFile(path.join(out,'_redirects'),'/* /index.html 200\n');
await writeFile(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /checkout\nDisallow: /success\n');
console.log('Готово: dist/ · статическая сборка с поддержкой SPA-маршрутов.');

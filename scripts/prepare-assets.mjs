import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {default:sharp}=await import(process.env.VANTA_SHARP_PATH?pathToFileURL(process.env.VANTA_SHARP_PATH).href:'sharp');
const sources=JSON.parse(await readFile(path.join(root,'docs/generated-assets.json'),'utf8'));
await mkdir(path.join(root,'assets'),{recursive:true});
for(const [name,source]of Object.entries(sources)){await sharp(path.resolve(root,source)).resize({width:name==='hero'?1800:1200,withoutEnlargement:true}).webp({quality:86}).toFile(path.join(root,'assets',name+'.webp'));}
const font=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf');
if(!font.ok)throw new Error('Не удалось загрузить шрифт');await writeFile(path.join(root,'assets/manrope.ttf'),Buffer.from(await font.arrayBuffer()));
const license=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt');if(license.ok)await writeFile(path.join(root,'assets/FONT-LICENSE.txt'),await license.text());
console.log(`Подготовлено ${Object.keys(sources).length} изображений и локальный шрифт.`);

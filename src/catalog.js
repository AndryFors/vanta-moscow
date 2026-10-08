export const categoryLabels={hoodies:'Худи',tees:'Футболки',jackets:'Куртки',pants:'Брюки',coats:'Пальто',knitwear:'Трикотаж',shoes:'Обувь',accessories:'Аксессуары'};
export const colorLabels={black:'Чёрный',grey:'Графит',white:'Молочный',brown:'Тауп',green:'Хаки',blue:'Синий'};
export const colorHex={black:'#252623',grey:'#767873',white:'#eeeae0',brown:'#9d8c7d',green:'#666d55',blue:'#52616f'};
export const sorts={recommended:'Рекомендуем',newest:'Сначала новинки','price-asc':'Цена по возрастанию','price-desc':'Цена по убыванию',rating:'По рейтингу',discount:'По размеру скидки'};
export function parseFilters(search){
 const q=new URLSearchParams(search),number=(key,fallback)=>{const v=q.get(key);return v!==null&&/^\d{1,6}$/.test(v)?Math.min(Number(v),50000):fallback;};
 const min=number('min',0),max=number('max',50000);
 return {q:(q.get('q')||'').trim().slice(0,100),category:categoryLabels[q.get('category')]?q.get('category'):'',gender:['men','women'].includes(q.get('gender'))?q.get('gender'):'',size:['XS','S','M','L','XL','XXL','39','40','41','42','43','44','Единый'].includes(q.get('size'))?q.get('size'):'',color:colorLabels[q.get('color')]?q.get('color'):'',collection:['Осень 2026','Базовая линия','Городская серия'].includes(q.get('collection'))?q.get('collection'):'',min:Math.min(min,max),max:Math.max(min,max),stock:q.get('stock')==='1',sale:q.get('sale')==='1',new:q.get('new')==='1',sort:sorts[q.get('sort')]?q.get('sort'):'recommended'};
}
export function filterProducts(products,f){
 const matched=products.filter(p=>(!f.q||`${p.name} ${categoryLabels[p.subcategory]} ${p.description} ${p.collection}`.toLocaleLowerCase('ru').includes(f.q.toLocaleLowerCase('ru')))&&(!f.category||p.subcategory===f.category)&&(!f.gender||p.gender===f.gender||p.gender==='unisex')&&(!f.color||p.colors.includes(f.color))&&(!f.size||p.sizes.includes(f.size))&&(!f.collection||p.collection===f.collection)&&p.price>=f.min&&p.price<=f.max&&(!f.stock||Object.entries(p.inventory).some(([key,n])=>n>0&&(!f.color||key.startsWith(f.color+':'))&&(!f.size||key.endsWith(':'+f.size))))&&(!f.sale||p.oldPrice>p.price)&&(!f.new||p.isNew));
 const compare={recommended:(a,b)=>Number(b.isBestseller)-Number(a.isBestseller)||a.id-b.id,newest:(a,b)=>Number(b.isNew)-Number(a.isNew)||b.id-a.id,'price-asc':(a,b)=>a.price-b.price,'price-desc':(a,b)=>b.price-a.price,rating:(a,b)=>b.rating-a.rating,discount:(a,b)=>b.discount-a.discount};
 return matched.sort(compare[f.sort]||compare.recommended);
}

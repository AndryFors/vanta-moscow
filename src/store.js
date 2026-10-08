import {read,write} from './storage.js';
export const PROMOS={VANTA10:10,WELCOME15:15,FREESHIP:0};
export const deliveryLabels={standard:'Курьер по Москве',express:'Экспресс по Москве',pickup:'Самовывоз в Москве'};
export function calculate(lines,promo='',delivery='standard'){
 const subtotal=lines.reduce((sum,l)=>sum+l.product.price*l.qty,0);
 const discount=Math.round(subtotal*(PROMOS[promo]||0)/100);
 const shipping=!subtotal||delivery==='pickup'||promo==='FREESHIP'||(delivery==='standard'&&subtotal-discount>=15000)?0:delivery==='express'?890:390;
 return {subtotal,discount,shipping,total:subtotal-discount+shipping};
}
export function variantStock(p,color,size){return p?.inventory?.[`${color}:${size}`]||0;}
export function sanitizeCart(value,products){
 const result=[];if(!Array.isArray(value))return result;
 for(const x of value.slice(0,100)){if(!x||typeof x!=='object')continue;const p=products.find(p=>p.id===x.id),stock=variantStock(p,x.color,x.size);if(!stock||!Number.isInteger(x.qty)||x.qty<1)continue;const line=result.find(y=>y.id===x.id&&y.color===x.color&&y.size===x.size);if(line)line.qty=Math.min(stock,line.qty+x.qty);else result.push({id:x.id,color:x.color,size:x.size,qty:Math.min(stock,x.qty)});}
 return result;
}
export function createStore(products){
 const storedPromo=read('promo',''),savedWishlist=read('wishlist',[]),savedRecent=read('recent',[]);
 const state={products,cart:sanitizeCart(read('cart',[]),products),wishlist:Array.isArray(savedWishlist)?[...new Set(savedWishlist.filter(id=>products.some(p=>p.id===id)))]:[],recent:Array.isArray(savedRecent)?[...new Set(savedRecent.filter(id=>products.some(p=>p.id===id)))].slice(0,6):[],promo:Object.hasOwn(PROMOS,storedPromo)?storedPromo:'',delivery:['standard','express','pickup'].includes(read('delivery','standard'))?read('delivery','standard'):'standard'};
 const persist=()=>{for(const key of ['cart','wishlist','recent','promo','delivery'])write(key,state[key]);window.dispatchEvent(new CustomEvent('storechange'));};
 return {state,lines:()=>state.cart.map(line=>({...line,product:products.find(p=>p.id===line.id)})),totals(){return calculate(this.lines(),state.promo,state.delivery);},count:()=>state.cart.reduce((sum,l)=>sum+l.qty,0),
 add(id,color,size,qty=1){const p=products.find(p=>p.id===id),stock=variantStock(p,color,size),line=state.cart.find(x=>x.id===id&&x.color===color&&x.size===size);if(!stock)return 'Выберите доступный размер';if(!Number.isInteger(qty)||qty<1)return 'Укажите количество от 1';if((line?.qty||0)+qty>stock)return `В наличии только ${stock} шт. этого варианта`;if(line)line.qty+=qty;else state.cart.push({id,color,size,qty});persist();return '';},
 quantity(index,qty){const line=state.cart[index];if(!line)return 'Товар не найден';const p=products.find(p=>p.id===line.id);if(qty>variantStock(p,line.color,line.size))return 'Больше нет в наличии';line.qty=Math.max(1,qty);persist();return '';},
 remove(index){state.cart.splice(index,1);if(!state.cart.length)state.promo='';persist();},
 wish(id){if(!products.some(p=>p.id===id))return;state.wishlist=state.wishlist.includes(id)?state.wishlist.filter(x=>x!==id):[...state.wishlist,id];persist();},
 seen(id){state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,6);write('recent',state.recent);},
 apply(code){code=code.trim().toUpperCase();if(!Object.hasOwn(PROMOS,code))return 'Такого промокода нет';if(state.promo===code)return 'Этот промокод уже применён';state.promo=code;persist();return '';},
 clearPromo(){state.promo='';persist();},setDelivery(value){if(Object.hasOwn(deliveryLabels,value)){state.delivery=value;persist();}},clear(){state.cart=[];state.promo='';persist();}};
}

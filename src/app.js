import {esc,icon,link,photo} from './utils.js';
import {read,write} from './storage.js';
import {createStore,variantStock} from './store.js';
import {header,footer,summary} from './components.js';
import {home,catalog,wishlist,cart,drawer,notFound,filters} from './pages.js';
import {productPage,productPanel,quickView,sizeGuide} from './product.js';
import {parseFilters,filterProducts} from './catalog.js';
import {openModal,closeModal,toast} from './modal.js';
import {checkoutPage,getDraft,saveDraft,stepForDraft,successPage,completeOrder} from './checkout.js';
import {validateContact,validateDelivery} from './validation.js';
const main=document.getElementById('main'),modal=document.getElementById('modal');
let store,selection=null,draft=getDraft(),step=1,submitting=false,searchTimer,searchVersion=0,galleryView=0,galleryId=null,touchX=0;
const info={
 about:['Одежда в ритме Москвы.','VANTA — концептуальный московский бренд одежды для повседневной жизни. Свободные силуэты, спокойная палитра и внимание к деталям. Коллекция вдохновлена архитектурой и темпом города.','Этот магазин создан как проект для портфолио веб-разработчика. Бренд, ассортимент и коммерческие условия — демонстрационные.'],
 delivery:['В твоём ритме.','Курьер по Москве: 1–3 рабочих дня, 390 ₽. Бесплатно от 15 000 ₽ после скидок. Экспресс: на следующий рабочий день, 890 ₽. Самовывоз в Москве: бесплатно, адрес по договорённости. Промокод FREESHIP обнуляет стоимость доставки.','Возврат неношеных вещей с сохранёнными бирками — в течение 14 дней по демонстрационным условиям проекта. Реальные заказы и доставка не выполняются.'],
 privacy:['Твои данные — под контролем.','Корзина, избранное, тема, просмотренные вещи и тестовые контактные данные сохраняются только в localStorage вашего браузера. Сайт не отправляет формы на сервер, не использует аналитику и не принимает банковские реквизиты.','Чтобы удалить сохранённые данные, нажмите кнопку ниже. Это также очистит корзину и историю заказов.'],
 terms:['Условия магазина.','VANTA — демонстрационный интернет-магазин для портфолио. Ассортимент, цены, остатки, отзывы и сроки доставки используются для показа работы интерфейса. Оплата не списывается, покупка не создаёт настоящий заказ.','Цены указаны в российских рублях. Промокоды не суммируются: один код на заказ. Бесплатная стандартная доставка действует от 15 000 ₽ после скидок.'],
 contact:['Москва. На связи.','Команда VANTA: Москва, Россия. Время работы: ежедневно, 10:00–21:00 МСК.','Контактный адрес для демонстрации: hello@vanta.example. Для коммерческого запуска здесь размещаются подтверждённые контакты заказчика.'],
 social:['Встретимся в городе.','ВКонтакте · Telegram','Проект для портфолио. Официальные аккаунты бренда будут подключены при коммерческом запуске.']
};
function metadata(title,description='Свободные силуэты и продуманные детали. VANTA — одежда в ритме Москвы.'){document.title=title+' | VANTA';document.querySelector('meta[name="description"]').content=description;document.querySelector('meta[property="og:title"]').content=document.title;document.querySelector('meta[property="og:description"]').content=description;document.getElementById('product-jsonld')?.remove();}
function productMetadata(p){metadata(p.name,p.description);const s=document.createElement('script');s.id='product-jsonld';s.type='application/ld+json';s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:p.name,description:p.description,image:[location.origin+p.images[0]],sku:`VN-${p.id}`,brand:{'@type':'Brand',name:'VANTA'},offers:{'@type':'Offer',priceCurrency:'RUB',price:p.price,availability:Object.values(p.inventory).some(v=>v>0)?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:location.origin+'/product/'+p.slug}});document.head.append(s);}
function render(focus=false){
 if(!store)return;let html,path;try{path=decodeURIComponent(location.pathname).replace(/\/$/,'')||'/';}catch{path='/404';}
 if(path==='/'){html=home(store);metadata('Одежда в ритме Москвы');}
 else if(path==='/catalog'){html=catalog(store);metadata('Каталог одежды — Москва');}
 else if(path==='/wishlist'){html=wishlist(store);metadata('Избранное');}
 else if(path==='/cart'){html=cart(store);metadata('Корзина');}
 else if(path==='/checkout'){step=stepForDraft(draft,store.state.delivery);html=checkoutPage(store,step,draft);metadata('Оформление заказа');}
 else if(path==='/success'){html=successPage();metadata('Заказ оформлен');}
 else if(path.startsWith('/product/')){const p=store.state.products.find(p=>p.slug===path.slice(9));if(p){if(selection?.id!==p.id)selection={id:p.id,color:p.colors[0],size:'',qty:1,view:0};store.seen(p.id);html=productPage(p,selection,store);productMetadata(p);}else{html=notFound();metadata('Товар не найден');}}
 else {html=notFound();metadata('Страница не найдена');}
 main.innerHTML=html;if(focus)main.focus({preventScroll:true});
}
function navigate(href,scroll=true){closeModal();const url=new URL(href,location.origin);if(url.origin!==location.origin)return;history.pushState({},'',url.pathname+url.search+url.hash);selection=null;render(true);if(scroll)window.scrollTo({top:0,behavior:'instant'});if(url.hash)document.querySelector(url.hash)?.scrollIntoView();}
function updateFilter(key,value){const q=new URLSearchParams(location.search);if(key==='price'){q.delete('min');q.delete('max');}else if(value===''||value===false||value===null)q.delete(key);else q.set(key,String(value));history.pushState({},'','/catalog'+(q.size?'?'+q.toString():''));main.innerHTML=catalog(store);}
function selectionProduct(){return selection?store.state.products.find(p=>p.id===selection.id):null;}
function refreshProduct(){const p=selectionProduct();if(!p)return;const panel=document.querySelector(`[data-product-panel="${p.id}"]`);if(panel)panel.outerHTML=productPanel(p,selection,store,modal.open&&modal.classList.contains('quick'));}
function showGallery(){const p=store.state.products.find(p=>p.id===galleryId);if(!p)return;openModal(`<h2 id="modal-title" class="sr-only">${esc(p.name)} — фотогалерея</h2><div class="fullscreen-image" data-swipe>${photo(p,galleryView,'',true)}</div><div class="gallery-controls"><button class="icon-button" data-gallery-prev aria-label="Предыдущее фото">←</button><span>${galleryView+1} / ${p.images.length}</span><button class="icon-button" data-gallery-next aria-label="Следующее фото">→</button><button class="text-link" data-zoom>Увеличить</button></div>`,'gallery');}
function changeGallery(delta){const p=store.state.products.find(p=>p.id===galleryId);galleryView=(galleryView+delta+p.images.length)%p.images.length;showGallery();}
function searchResults(value){if(!modal.open||!modal.classList.contains('search-modal'))return;const q=value.trim(),f=parseFilters('?q='+encodeURIComponent(q)),p=filterProducts(store.state.products,f).slice(0,6);document.getElementById('search-results').innerHTML=`<span class="eyebrow">${q?'РЕЗУЛЬТАТЫ ПОИСКА':'МОЖЕТ ПОНРАВИТЬСЯ'}</span>${p.length?p.map(p=>link('/product/'+p.slug,`${photo(p)}<span>${esc(p.name)}<small>${esc(p.collection)}</small></span>${icon('arrow')}`,'search-result')).join(''):`<div class="search-empty"><h3>Ничего не нашлось.</h3><p>Попробуйте «худи», «брюки» или «пальто».</p></div>`}${p.length?link('/catalog?q='+encodeURIComponent(q),'Смотреть все результаты ↗','button full'):''}`;}
function showErrors(form,errors){form.querySelectorAll('[data-error]').forEach(el=>{const key=el.dataset.error;el.textContent=errors[key]||'';el.id='error-'+key;const input=form.elements[key];if(input){input.setAttribute('aria-invalid',errors[key]?'true':'false');input.setAttribute('aria-describedby',el.id);}});const key=Object.keys(errors)[0];if(key)form.elements[key]?.focus();}
function collectDraft(form){const data=new FormData(form);for(const [key,value]of data)if(['firstName','lastName','email','phone','city','postal','street','house','apartment','payment'].includes(key))draft[key]=String(value).trim();saveDraft(draft);}
document.addEventListener('click',event=>{
 const el=event.target.closest('a,button');if(!el)return;
 if(el.matches('[data-link]')){if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(el.getAttribute('href'));return;}
 if(el.matches('[data-retry]')){boot();return;}
 if(!store)return;
 if(el.matches('[data-search]')){openModal(`<span class="eyebrow">НАЙТИ СВОЮ ВЕЩЬ</span><h2 id="modal-title">Что ищем?</h2><label for="search-input" class="sr-only">Поиск по каталогу</label><div class="search-field">${icon('search')}<input id="search-input" type="search" autocomplete="off" placeholder="Худи, куртка, твой новый силуэт…" maxlength="100"></div><div id="search-results" aria-live="polite"></div>`,'search-modal');searchResults('');}
 if(el.matches('[data-menu]'))openModal(`<h2 id="modal-title" class="logo">VANTA®</h2><nav class="mobile-nav" aria-label="Навигация">${[['Новинки','new=1'],['Мужчинам','gender=men'],['Женщинам','gender=women'],['Обувь','category=shoes'],['Аксессуары','category=accessories'],['Архив','sale=1']].map(([label,q])=>link('/catalog?'+q,label+' ↗')).join('')}${link('/wishlist','Избранное ↗')}${link('/cart','Корзина ↗')}</nav><p class="muted">Москва · Россия · 2026</p>`,'menu-drawer');
 if(el.matches('[data-cart]'))openModal(drawer(store),'cart-drawer');
 if(el.matches('[data-wish]')){const id=Number(el.dataset.wish),was=store.state.wishlist.includes(id);store.wish(id);toast(was?'Удалено из избранного':'Сохранено в избранном');if(location.pathname==='/wishlist')render();}
 if(el.matches('[data-quick]')){const p=store.state.products.find(p=>p.id===Number(el.dataset.quick));selection={id:p.id,color:p.colors[0],size:'',qty:1,view:0};openModal(quickView(p,selection,store),'quick');}
 if(el.matches('[data-color]')){selection.color=el.dataset.color;selection.size='';selection.qty=1;refreshProduct();document.querySelector(`[data-color="${selection.color}"]`)?.focus();}
 if(el.matches('[data-size]')){selection.size=el.dataset.size;selection.qty=1;refreshProduct();document.querySelector(`[data-size="${selection.size}"]`)?.focus();}
 if(el.matches('[data-product-qty]')){const p=selectionProduct();selection.qty=Math.max(1,Math.min(variantStock(p,selection.color,selection.size)||1,selection.qty+Number(el.dataset.productQty)));refreshProduct();}
 if(el.matches('[data-add]')){if(selection?.id!==Number(el.dataset.add))return;const error=store.add(selection.id,selection.color,selection.size,selection.qty);if(error){const out=document.getElementById('size-error');if(out)out.textContent=error;toast(error,true);}else{toast('Товар добавлен в корзину');openModal(drawer(store),'cart-drawer');}}
 if(el.matches('[data-remove]')){store.remove(Number(el.dataset.remove));toast('Товар удалён из корзины');}
 if(el.matches('[data-qty]')){const i=Number(el.dataset.qty),line=store.state.cart[i];if(line){const error=store.quantity(i,line.qty+Number(el.dataset.delta));if(error)toast(error,true);}}
 if(el.matches('[data-clear-promo]'))store.clearPromo();
 if(el.matches('[data-size-guide]'))openModal(sizeGuide(),'size-guide');
 if(el.matches('[data-view]')){selection.view=Number(el.dataset.view);const p=selectionProduct();document.querySelector('.main-photo .product-photo').outerHTML=photo(p,selection.view,'',true);document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.view)===selection.view));}
 if(el.matches('[data-gallery]')){galleryId=Number(el.dataset.gallery);galleryView=selection.view;showGallery();}
 if(el.matches('[data-gallery-next]'))changeGallery(1);if(el.matches('[data-gallery-prev]'))changeGallery(-1);
 if(el.matches('[data-zoom]')){modal.querySelector('.fullscreen-image').classList.toggle('zoomed');el.textContent=modal.querySelector('.zoomed')?'Уменьшить':'Увеличить';}
 if(el.matches('[data-info]')){const [title,...paragraphs]=info[el.dataset.info]||info.about;openModal(`<span class="eyebrow">VANTA / МОСКВА</span><h2 id="modal-title">${title}</h2>${paragraphs.map(text=>`<p>${text}</p>`).join('')}${el.dataset.info==='privacy'?'<button class="button outline" data-clear-data>Удалить данные из браузера</button>':''}`,'info');}
 if(el.matches('[data-clear-data]')){try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key.startsWith('vanta:'))localStorage.removeItem(key);}location.href='/';}catch{toast('Хранилище браузера недоступно',true);}}
 if(el.matches('[data-theme]')){const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;write('theme',value);toast(value==='dark'?'Тёмная тема включена':'Светлая тема включена');}
 if(el.matches('[data-filters]'))openModal(`<h2 id="modal-title">Твой выбор.</h2>${filters(parseFilters(location.search))}<button data-close class="button full">Показать товары</button>`,'filters-drawer');
 if(el.matches('[data-remove-filter]')){updateFilter(el.dataset.removeFilter,'');if(modal.open&&modal.classList.contains('filters-drawer'))modal.querySelector('#filters-form').outerHTML=filters(parseFilters(location.search));}
 if(el.matches('[data-reset-filters]')){history.pushState({},'','/catalog');main.innerHTML=catalog(store);if(modal.open&&modal.classList.contains('filters-drawer'))modal.querySelector('#filters-form').outerHTML=filters(parseFilters(''));}
 if(el.matches('[data-checkout-back]')){collectDraft(document.getElementById('checkout-form'));step=Math.max(1,step-1);write('checkout-step',step);main.innerHTML=checkoutPage(store,step,draft);window.scrollTo({top:0,behavior:'instant'});}
});
document.addEventListener('input',event=>{
 if(event.target.id==='search-input'){clearTimeout(searchTimer);const version=++searchVersion,value=event.target.value;searchTimer=setTimeout(()=>{if(version===searchVersion)searchResults(value);},350);}
 if(event.target.closest('#checkout-form'))collectDraft(event.target.form);
});
document.addEventListener('change',event=>{
 if(!store)return;const el=event.target;
 if(el.closest('#filters-form')){const name=el.name,value=el.value,inModal=Boolean(el.closest('#modal'));updateFilter(name,el.type==='checkbox'?(el.checked?'1':''):value);if(!inModal){const replacement=[...document.querySelectorAll('#filters-form [name]')].find(input=>input.name===name&&(input.type==='radio'?input.value===value:true));replacement?.focus({preventScroll:true});}}
 if(el.matches('[data-sort]'))updateFilter('sort',el.value);
 if(el.name==='delivery'&&el.closest('#checkout-form')){collectDraft(el.form);store.setDelivery(el.value);main.innerHTML=checkoutPage(store,step,draft);}
 if(el.name==='payment'&&el.closest('#checkout-form')){collectDraft(el.form);main.innerHTML=checkoutPage(store,step,draft);}
});
document.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.target;if(!store)return;
 if(form.id==='filters-form')return;
 if(form.id==='newsletter-form'){const email=form.elements.email.value.trim(),consent=form.elements.consent.checked;const message=document.getElementById('newsletter-message');if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){message.textContent='Укажите корректную электронную почту.';form.elements.email.focus();return;}if(!consent){message.textContent='Подтвердите согласие с обработкой данных.';form.elements.consent.focus();return;}const saved=write('newsletter',email);message.textContent=saved?'Вы в списке. Подписка сохранена в этом браузере (демо).':'Хранилище недоступно. Попробуйте снова.';if(saved){form.reset();toast('Подписка сохранена в браузере');}return;}
 if(form.id==='promo-form'){const error=store.apply(form.elements.code.value);toast(error||'Промокод применён',Boolean(error));return;}
 if(form.id!=='checkout-form'||submitting)return;
 collectDraft(form);step=Number(form.dataset.step);const errors=step===1?validateContact(draft):step===2?validateDelivery(draft,store.state.delivery):form.elements.consent.checked?{}:{consent:'Подтвердите согласие с условиями'};
 showErrors(form,errors);if(Object.keys(errors).length)return;
 if(step<3){step++;write('checkout-step',step);main.innerHTML=checkoutPage(store,step,draft);main.querySelector('h2').tabIndex=-1;main.querySelector('h2').focus();window.scrollTo({top:0,behavior:'instant'});return;}
 const allErrors={...validateContact(draft),...validateDelivery(draft,store.state.delivery)};if(Object.keys(allErrors).length||!store.count()){toast('Проверьте данные заказа',true);write('checkout-step',1);render();return;}
 submitting=true;const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Оформляем…';
 try{await new Promise(resolve=>setTimeout(resolve,650));completeOrder(store,draft);draft=getDraft();step=1;navigate('/success');toast('Демонстрационный заказ оформлен');}catch(error){toast(error.message||'Не удалось оформить заказ. Попробуйте ещё раз.',true);button.disabled=false;button.textContent='Подтвердить заказ';}finally{submitting=false;}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.open&&document.activeElement?.closest('.nav-group'))document.querySelector('.header .logo')?.focus();if(modal.open&&modal.classList.contains('gallery')){if(event.key==='ArrowRight')changeGallery(1);if(event.key==='ArrowLeft')changeGallery(-1);}});
modal.addEventListener('touchstart',event=>{touchX=event.touches[0].clientX;},{passive:true});
modal.addEventListener('touchend',event=>{if(modal.classList.contains('gallery')&&Math.abs(event.changedTouches[0].clientX-touchX)>50)changeGallery(event.changedTouches[0].clientX<touchX?1:-1);},{passive:true});
window.addEventListener('popstate',()=>{closeModal();selection=null;render(true);});
window.addEventListener('storechange',()=>{document.getElementById('header').innerHTML=header(store);document.querySelectorAll('[data-wish]').forEach(btn=>{const wished=store.state.wishlist.includes(Number(btn.dataset.wish));btn.classList.toggle('selected',wished);btn.setAttribute('aria-pressed',String(wished));});if(location.pathname==='/cart')main.innerHTML=cart(store);if(location.pathname==='/checkout')document.getElementById('checkout-summary')?.replaceChildren(document.createRange().createContextualFragment(summary(store,true)));if(modal.open&&modal.classList.contains('cart-drawer'))openModal(drawer(store),'cart-drawer');});
window.addEventListener('storage',event=>{if(event.key?.startsWith('vanta:')&&store){store=createStore(store.state.products);draft=getDraft();document.getElementById('header').innerHTML=header(store);render();}});
async function boot(){main.innerHTML='<div class="loading-page" role="status"><span class="eyebrow">VANTA / МОСКВА</span><h1>Собираем коллекцию.</h1><div class="product-grid">'+Array.from({length:4},()=>'<div class="skeleton"></div>').join('')+'</div><span class="sr-only">Загрузка каталога</span></div>';try{const response=await fetch('/data/products.json');if(!response.ok)throw new Error('Ошибка загрузки');const products=await response.json();if(!Array.isArray(products)||products.length<24||products.some(p=>!p.id||!p.name||!Array.isArray(p.images)||!p.inventory))throw new Error('Некорректные данные каталога');store=createStore(products);step=stepForDraft(draft,store.state.delivery);document.getElementById('header').innerHTML=header(store);document.getElementById('footer').innerHTML=footer();render();}catch{main.innerHTML='<section class="empty"><h1>Коллекция задерживается.</h1><p>Не удалось загрузить товары. Проверьте подключение и повторите попытку.</p><button data-retry class="button">Попробовать снова</button></section>';}}
boot();

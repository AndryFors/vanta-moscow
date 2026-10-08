import {icon} from './utils.js';
const modal=document.getElementById('modal');let returnFocus=null,returnSelector='';
export function openModal(content,kind='regular'){
 if(!modal.open){returnFocus=document.activeElement;returnSelector=returnFocus?.matches('[data-cart]')?'[data-cart]':returnFocus?.matches('[data-search]')?'[data-search]':returnFocus?.matches('[data-menu]')?'[data-menu]':'';}
 modal.className=`modal ${kind}`;modal.innerHTML=`<button class="icon-button modal-close" data-close aria-label="Закрыть окно">${icon('close')}</button>${content}`;
 if(!modal.open)modal.showModal();document.body.classList.add('locked');
 requestAnimationFrame(()=>{const el=modal.querySelector('input:not([type=hidden]),select,button:not([data-close]),a');el?.focus();});
}
export function closeModal(){if(modal.open){modal.close();document.body.classList.remove('locked');}}
modal.addEventListener('close',()=>{document.body.classList.remove('locked');if(returnFocus?.isConnected)returnFocus.focus();else if(returnSelector)document.querySelector(returnSelector)?.focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.open){event.preventDefault();closeModal();}},true);
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}if(event.target.closest('[data-close]'))closeModal();});
export function toast(text,error=false){const el=document.createElement('div');el.className=`toast ${error?'error':''}`;const span=document.createElement('span');span.textContent=text;el.append(span);const button=document.createElement('button');button.innerHTML=icon('close');button.setAttribute('aria-label','Закрыть уведомление');button.onclick=()=>el.remove();el.append(button);document.getElementById('toasts').append(el);setTimeout(()=>el.remove(),4500);}

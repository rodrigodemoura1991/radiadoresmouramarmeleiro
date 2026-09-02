/* Popup de edição de serviço — abre o editor existente sem navegar para Lançamentos. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function ensureStyle(){
    if($('service-popup-v31-css'))return;
    const s=document.createElement('style');s.id='service-popup-v31-css';
    s.textContent='#orderFixModal{z-index:1000!important}#orderFixModal .modalbox{width:min(980px,96vw)!important;max-height:92vh!important;overflow:auto!important}#orderFixModal .modalhead{position:sticky;top:-22px;background:#fff;padding:4px 0 12px!important;margin-bottom:10px;z-index:2;border-bottom:1px solid var(--line)}';
    document.head.appendChild(s);
  }
  function openPopup(id){
    if(!id)return;
    window.__freteEditId=String(id);
    if(typeof window.editOrder==='function')window.editOrder(id);
    const m=$('orderFixModal');
    if(m){m.classList.remove('hidden');m.dataset.orderId=String(id);m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');}
  }
  function bind(){
    ensureStyle();
    const list=$('allServicesList');if(!list||list.dataset.servicePopupV31)return;
    list.dataset.servicePopupV31='1';
    list.addEventListener('click',e=>{
      const b=e.target.closest('.service-edit-btn,.edit-all-service');
      if(!b)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const card=b.closest('.grouped-service,.service-card');
      const id=card?.dataset.orderId||card?.dataset.id;
      openPopup(id);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
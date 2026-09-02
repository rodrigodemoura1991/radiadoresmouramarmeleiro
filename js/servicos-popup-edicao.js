/* Popup de edição de lançamento — abre a edição no próprio modal, sem sair da aba Serviços. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function css(){
    if($('service-edit-popup-css')) return;
    const s=document.createElement('style');
    s.id='service-edit-popup-css';
    s.textContent=`
      #orderFixModal{z-index:1000!important}
      #orderFixModal .modalbox{width:min(980px,96vw)!important;max-height:92vh!important;overflow:auto!important}
      #orderFixModal .modalhead{position:sticky;top:-22px;background:#fff;padding:4px 0 12px;margin-bottom:10px;z-index:2;border-bottom:1px solid var(--line)}
      #orderFixModal .modalhead h2{font-size:21px!important}
      #orderFixModal .edit-svc-head,#orderFixModal .edit-svc-row{min-width:850px}
    `;
    document.head.appendChild(s);
  }

  function findCard(id){
    const list=$('allServicesList');
    if(!list)return null;
    return list.querySelector('[data-order-id="'+CSS.escape(String(id))+'"], [data-id="'+CSS.escape(String(id))+'"]');
  }

  function open(id){
    if(!id || typeof window.editOrder!=='function') return;
    css();
    // Mantém a navegação em Serviços e abre o editor existente como popup.
    window.__servicePopupOpening=true;
    window.__freteEditId=String(id);
    window.editOrder(id);
    const modal=$('orderFixModal');
    if(modal){
      modal.classList.remove('hidden');
      modal.setAttribute('aria-modal','true');
      modal.setAttribute('role','dialog');
      modal.dataset.orderId=String(id);
    }
    setTimeout(()=>{
      const focus=modal?.querySelector('#fixClient,#fixVehicle,#fixEntry');
      focus?.focus();
      window.__servicePopupOpening=false;
    },80);
  }

  function install(){
    css();
    const list=$('allServicesList');
    if(!list || list.dataset.popupEditBound==='1') return;
    list.dataset.popupEditBound='1';
    list.addEventListener('click',function(e){
      const btn=e.target.closest('.service-edit-btn,.edit-all-service,[data-edit]');
      if(!btn)return;
      e.preventDefault();
      e.stopPropagation();
      const card=btn.closest('.grouped-service,.service-card,.launch');
      const id=btn.dataset.edit||card?.dataset.orderId||card?.dataset.id;
      if(id)open(id);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

/* EDITOR POPUP REAL — Todos os Serviços
   Reutiliza o formulário oficial #order e a função editOrder existente.
   Não cria IDs duplicados e não altera o Supabase. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let popup=null, originalParent=null, originalNext=null;
  let opened=false;

  function css(){
    if($('service-edit-popup-css'))return;
    const s=document.createElement('style');
    s.id='service-edit-popup-css';
    s.textContent=`
      #serviceEditOverlay{position:fixed!important;inset:0!important;z-index:999999!important;background:rgba(0,0,0,.55)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:14px!important}
      #serviceEditOverlay.hidden{display:none!important}
      #serviceEditBox{width:min(1100px,97vw)!important;max-height:95vh!important;overflow:auto!important;background:#fff!important;border-radius:16px!important;box-shadow:0 24px 80px rgba(0,0,0,.35)!important;padding:18px!important}
      #serviceEditHeader{position:sticky!important;top:-18px!important;z-index:20!important;display:flex!important;align-items:center!important;justify-content:space-between!important;background:#fff!important;padding:3px 0 12px!important;margin-bottom:14px!important;border-bottom:1px solid #e5e7eb!important}
      #serviceEditTitle{margin:0!important;font-size:22px!important}
      #serviceEditClose{border:0!important;border-radius:9px!important;padding:9px 14px!important;background:#eee!important;font-weight:800!important;cursor:pointer!important}
      #serviceEditBox>#order{display:block!important;width:100%!important;max-width:none!important;margin:0!important}
      body.service-edit-popup-open{overflow:hidden!important}
      @media(max-width:700px){#serviceEditOverlay{padding:5px!important}#serviceEditBox{width:100%!important;max-height:99vh!important;padding:11px!important;border-radius:12px!important}}
    `;
    document.head.appendChild(s);
  }

  function ensurePopup(){
    if(popup)return;
    css();
    popup=document.createElement('div');
    popup.id='serviceEditOverlay';
    popup.className='hidden';
    popup.innerHTML='<div id="serviceEditBox" role="dialog" aria-modal="true"><div id="serviceEditHeader"><h2 id="serviceEditTitle">Editar lançamento</h2><button type="button" id="serviceEditClose">Fechar ×</button></div></div>';
    document.body.appendChild(popup);
    $('serviceEditClose').onclick=close;
    popup.addEventListener('click',e=>{if(e.target===popup)close()});
  }

  function close(){
    if(!opened)return;
    const form=$('order');
    if(form&&originalParent){
      if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(form,originalNext);
      else originalParent.appendChild(form);
    }
    popup?.classList.add('hidden');
    document.body.classList.remove('service-edit-popup-open');
    opened=false;
    originalParent=null;originalNext=null;
  }

  function open(id){
    if(!id)return;
    const edit=window.editOrder;
    const form=$('order');
    if(typeof edit!=='function'||!form)return;
    ensurePopup();

    // Primeiro executa a edição oficial, que coloca o lançamento em `editing`.
    edit(String(id));

    // Depois move o mesmo formulário para dentro do popup.
    originalParent=form.parentNode;
    originalNext=form.nextSibling;
    $('serviceEditBox').appendChild(form);

    const o=(window.orders||[]).find(x=>String(x.id)===String(id));
    $('serviceEditTitle').textContent=o?.numero_lancamento!=null?'Editar lançamento #'+o.numero_lancamento:'Editar lançamento';

    const save=form.querySelector('button[type="submit"]');
    if(save)save.textContent='Salvar alterações';

    // Durante a edição, o botão Limpar vira Cancelar para não apagar dados por acidente.
    const clear=$('clear');
    if(clear){
      clear.dataset.popupOriginalText=clear.textContent;
      clear.textContent='Cancelar';
      clear.onclick=e=>{e.preventDefault();close()};
    }

    popup.classList.remove('hidden');
    document.body.classList.add('service-edit-popup-open');
    opened=true;
    setTimeout(()=>$('clientInput')?.focus(),50);
  }

  function getIdFromButton(btn){
    const card=btn.closest('.service-card,.grouped-service,.service-order-group,[data-order-id],[data-id]');
    return btn.dataset.edit||btn.dataset.orderId||btn.dataset.id||card?.dataset.orderId||card?.dataset.id||null;
  }

  function bind(){
    if(document.documentElement.dataset.servicePopupBound==='1')return;
    document.documentElement.dataset.servicePopupBound='1';
    // Delegação no documento: funciona mesmo quando os cartões são recriados dinamicamente.
    document.addEventListener('click',function(e){
      const btn=e.target.closest('.service-edit-btn,.edit-all-service,[data-edit]');
      if(!btn)return;
      const list=$('allServicesList');
      if(!list||!list.contains(btn))return;
      const id=getIdFromButton(btn);
      if(!id)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      open(id);
    },true);
  }

  window.openServiceEditPopup=open;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{css();bind()},{once:true});
  else{css();bind();}
})();

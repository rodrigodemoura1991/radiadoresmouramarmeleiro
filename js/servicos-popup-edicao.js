/* EDITOR POPUP REAL — Todos os Serviços
   Reutiliza o formulário oficial #order. Não duplica IDs e não altera o Supabase. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let popup=null, originalParent=null, originalNext=null, opened=false;
  function css(){
    if($('service-edit-popup-css'))return;
    const s=document.createElement('style');s.id='service-edit-popup-css';s.textContent=`
      html.service-edit-popup-html,body.service-edit-popup-open{overflow:hidden!important}
      #serviceEditOverlay{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(0,0,0,.62)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:14px!important}
      #serviceEditOverlay.hidden{display:none!important}
      #serviceEditBox{position:relative!important;width:min(1100px,97vw)!important;max-height:95vh!important;overflow:auto!important;background:#fff!important;border-radius:16px!important;box-shadow:0 24px 80px rgba(0,0,0,.4)!important;padding:18px!important}
      #serviceEditHeader{position:sticky!important;top:-18px!important;z-index:20!important;display:flex!important;align-items:center!important;justify-content:space-between!important;background:#fff!important;padding:3px 0 12px!important;margin-bottom:14px!important;border-bottom:1px solid #e5e7eb!important}
      #serviceEditTitle{margin:0!important;font-size:22px!important;color:#172033!important}
      #serviceEditClose{border:0!important;border-radius:9px!important;padding:9px 14px!important;background:#eee!important;color:#172033!important;font-weight:800!important;cursor:pointer!important}
      #serviceEditBox>#order{display:block!important;width:100%!important;max-width:none!important;margin:0!important}
      #allServicesList .service-actions-v2{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:10px!important}
      #allServicesList .service-edit-btn{border:0!important;border-radius:9px!important;padding:8px 13px!important;background:#172033!important;color:#fff!important;font-weight:800!important;cursor:pointer!important}
      @media(max-width:700px){#serviceEditOverlay{padding:5px!important}#serviceEditBox{width:100%!important;max-height:99vh!important;padding:11px!important;border-radius:12px!important}#serviceEditTitle{font-size:19px!important}}
    `;document.head.appendChild(s);
  }
  function ensurePopup(){
    if(popup)return;css();popup=document.createElement('div');popup.id='serviceEditOverlay';popup.className='hidden';
    popup.innerHTML='<div id="serviceEditBox" role="dialog" aria-modal="true"><div id="serviceEditHeader"><h2 id="serviceEditTitle">Editar lançamento</h2><button type="button" id="serviceEditClose">Fechar ×</button></div></div>';
    document.body.appendChild(popup);$('serviceEditClose').onclick=close;popup.addEventListener('click',e=>{if(e.target===popup)close()});
  }
  function close(){
    if(!opened)return;const form=$('order');
    if(form&&originalParent){if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(form,originalNext);else originalParent.appendChild(form)}
    popup?.classList.add('hidden');document.documentElement.classList.remove('service-edit-popup-html');document.body.classList.remove('service-edit-popup-open');opened=false;originalParent=null;originalNext=null;
  }
  function open(id){
    if(!id)return;const edit=window.editOrder,form=$('order');if(typeof edit!=='function'||!form)return;ensurePopup();
    originalParent=form.parentNode;originalNext=form.nextSibling;$('serviceEditBox').appendChild(form);popup.classList.remove('hidden');document.documentElement.classList.add('service-edit-popup-html');document.body.classList.add('service-edit-popup-open');opened=true;
    const nativeScrollTo=window.scrollTo;window.scrollTo=function(){};try{edit(String(id))}finally{window.scrollTo=nativeScrollTo}
    const o=(window.orders||[]).find(x=>String(x.id)===String(id));$('serviceEditTitle').textContent=o?.numero_lancamento!=null?'Editar lançamento #'+o.numero_lancamento:'Editar lançamento';
    const save=form.querySelector('button[type="submit"]');if(save)save.textContent='Salvar alterações';
    const clear=$('clear');if(clear){if(clear.dataset.popupOriginalText==null)clear.dataset.popupOriginalText=clear.textContent;clear.textContent='Cancelar';clear.onclick=e=>{e.preventDefault();e.stopPropagation();close()}}
    setTimeout(()=>$('clientInput')?.focus(),50);
  }
  function serviceRowsForDisplay(){
    if(typeof window.allServiceRows!=='function')return [];
    const q=($('allServicesSearch')?.value||'').toLowerCase().trim(),pf=$('servicePaymentFilter')?.value||'',sf=$('serviceStatusFilter')?.value||'';
    return window.allServiceRows().filter(x=>{const text=[x.order?.client_name,x.order?.pedido,x.description,x.order?.vehicle_make_model,x.order?.plate].join(' ').toLowerCase();return(!q||text.includes(q))&&(!pf||(x.order?.payment_status||'EM ABERTO')===pf)&&(!sf||x.service_status===sf)}).sort((a,b)=>String(b.order?.exit_date||'').localeCompare(String(a.order?.exit_date||'')));
  }
  function decorate(){
    const list=$('allServicesList');if(!list)return;
    const data=serviceRowsForDisplay();
    list.querySelectorAll('.service-card').forEach((card,index)=>{
      const item=data[index];const id=card.dataset.orderId||card.dataset.id||item?.order?.id;if(!id)return;
      card.dataset.orderId=id;
      if(card.querySelector('.service-edit-btn'))return;
      const actions=document.createElement('div');actions.className='service-actions-v2';actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button>';actions.querySelector('button').dataset.edit=id;card.appendChild(actions);
    });
  }
  function bind(){
    if(document.documentElement.dataset.servicePopupBound==='1')return;document.documentElement.dataset.servicePopupBound='1';
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&opened){e.preventDefault();e.stopPropagation();close();}
    },true);
    document.addEventListener('click',function(e){
      const btn=e.target.closest?.('#allServicesList .service-edit-btn,#allServicesList .edit-all-service,#allServicesList [data-edit]');if(!btn)return;const list=$('allServicesList');if(!list||!list.contains(btn))return;
      const card=btn.closest('.service-card,.grouped-service,.service-order-group,[data-order-id],[data-id]');const id=btn.dataset.edit||btn.dataset.orderId||btn.dataset.id||card?.dataset.orderId||card?.dataset.id;if(!id)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open(id);
    },true);
    const list=$('allServicesList');if(list){decorate();new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true})}
    document.addEventListener('input',()=>requestAnimationFrame(decorate),true);document.addEventListener('change',()=>requestAnimationFrame(decorate),true);
  }
  window.openServiceEditPopup=open;window.closeServiceEditPopup=close;window.openFix=open;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{css();bind()},{once:true});else{css();bind()}
})();
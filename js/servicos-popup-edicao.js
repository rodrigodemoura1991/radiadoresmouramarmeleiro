/* Popup real de edição na aba Todos os Serviços.
   Reutiliza o formulário #order já existente, preservando todos os handlers e o Supabase.
*/
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  let originalParent=null;
  let originalNext=null;
  let popup=null;
  let closing=false;

  function addCss(){
    if($('service-edit-popup-css')) return;
    const s=document.createElement('style');
    s.id='service-edit-popup-css';
    s.textContent=`
      #serviceEditOverlay{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;}
      #serviceEditOverlay.hidden{display:none!important}
      #serviceEditBox{width:min(1100px,98vw);max-height:94vh;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.28);overflow:auto;position:relative;padding:18px;}
      #serviceEditHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;background:#fff;z-index:10;padding:2px 0 14px;border-bottom:1px solid #e5e7eb;margin-bottom:14px;}
      #serviceEditHeader h2{margin:0;font-size:22px;}
      #serviceEditClose{border:0;background:#eee;border-radius:9px;padding:8px 13px;font-weight:700;cursor:pointer;}
      #serviceEditBox>#order{display:block!important;max-width:none!important;margin:0!important;}
      #serviceEditBox #order{width:100%!important;}
      body.service-edit-popup-open{overflow:hidden!important}
    `;
    document.head.appendChild(s);
  }

  function ensurePopup(){
    if(popup) return popup;
    addCss();
    popup=document.createElement('div');
    popup.id='serviceEditOverlay';
    popup.className='hidden';
    popup.innerHTML=`<div id="serviceEditBox" role="dialog" aria-modal="true" aria-labelledby="serviceEditTitle"><div id="serviceEditHeader"><h2 id="serviceEditTitle">Editar lançamento</h2><button type="button" id="serviceEditClose">Fechar</button></div></div>`;
    document.body.appendChild(popup);
    $('serviceEditClose').onclick=close;
    popup.addEventListener('click',e=>{if(e.target===popup)close()});
    return popup;
  }

  function moveFormIntoPopup(){
    const form=$('order');
    const box=$('serviceEditBox');
    if(!form||!box) return false;
    if(form.parentElement!==box){
      originalParent=form.parentElement;
      originalNext=form.nextSibling;
      box.appendChild(form);
    }
    return true;
  }

  function restoreForm(){
    const form=$('order');
    if(!form||!originalParent)return;
    if(originalNext&&originalNext.parentNode===originalParent) originalParent.insertBefore(form,originalNext);
    else originalParent.appendChild(form);
    originalParent=null;
    originalNext=null;
  }

  function close(){
    if(closing)return;
    closing=true;
    restoreForm();
    popup?.classList.add('hidden');
    document.body.classList.remove('service-edit-popup-open');
    closing=false;
  }

  function open(id){
    if(!id)return;
    const fn=window.editOrder;
    if(typeof fn!=='function')return;
    ensurePopup();

    // O editor original preenche #order com os dados do lançamento.
    fn(String(id));

    setTimeout(()=>{
      const o=(window.orders||[]).find(x=>String(x.id)===String(id));
      if(o){
        const title=$('serviceEditTitle');
        if(title)title.textContent='Editar lançamento'+(o.pedido?' • Pedido '+o.pedido:'');
      }
      if(!moveFormIntoPopup())return;
      popup.classList.remove('hidden');
      document.body.classList.add('service-edit-popup-open');
      $('clientInput')?.focus();

      const form=$('order');
      if(form&&!form.dataset.popupSaveWatcher){
        form.dataset.popupSaveWatcher='1';
        form.addEventListener('submit',()=>{
          let tries=0;
          const timer=setInterval(()=>{
            tries++;
            if(window.editing==null || tries>30){
              clearInterval(timer);
              if(window.editing==null)close();
            }
          },200);
        });
      }
    },30);
  }

  function install(){
    addCss();
    const list=$('allServicesList');
    if(!list||list.dataset.realPopupBound==='1')return;
    list.dataset.realPopupBound='1';
    list.addEventListener('click',e=>{
      const btn=e.target.closest('.service-edit-btn,.edit-all-service');
      if(!btn)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const card=btn.closest('.service-card,.grouped-service,[data-order-id],[data-id]');
      const id=btn.dataset.edit||card?.dataset.orderId||card?.dataset.id;
      if(id)open(id);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

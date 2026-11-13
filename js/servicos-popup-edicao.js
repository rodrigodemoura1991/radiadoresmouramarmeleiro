/* EDITOR POPUP REAL — Todos os Serviços
   Reutiliza o formulário oficial #order. Não duplica IDs e não altera o Supabase. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let popup=null, originalParent=null, originalNext=null, originalParentDisplay='', originalClearText=null, originalClearOnclick=null, opened=false, currentOrderId=null, creating=false;
  function css(){
    if($('service-edit-popup-css'))return;
    const s=document.createElement('style');s.id='service-edit-popup-css';s.textContent=`
      html.service-edit-popup-html,body.service-edit-popup-open{overflow:hidden!important}
      #serviceEditOverlay{position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(0,0,0,.62)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:14px!important}
      #serviceEditOverlay.hidden{display:none!important}
      #serviceEditBox{position:relative!important;width:min(1100px,97vw)!important;max-height:95vh!important;overflow:auto!important;background:#fff!important;border-radius:16px!important;box-shadow:0 24px 80px rgba(0,0,0,.4)!important;padding:18px!important}
/* Editor compacto: prioriza visualizar os campos e ações sem rolagem no caso comum. */
      #serviceEditBox{display:flex!important;flex-direction:column!important;width:min(1186px,96vw)!important;height:90vh!important;max-height:90vh!important;overflow:hidden!important;padding:12px 16px!important}
      #serviceEditHeader{position:relative!important;top:auto!important;flex:0 0 auto!important;margin:0 0 7px!important;padding:0 0 7px!important}
      #serviceEditBox>#order{display:flex!important;flex:1 1 auto!important;min-height:0!important;flex-direction:column!important;gap:5px!important;overflow-y:auto!important;overflow-x:hidden!important}
      #serviceEditBox>#order>.grid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:6px!important;flex:0 0 auto!important}
      #serviceEditBox #order .field{gap:3px!important;min-width:0!important}
      #serviceEditBox #order .field label{font-size:10px!important;line-height:1.1!important}
      #serviceEditBox #order input,#serviceEditBox #order select{min-height:32px!important;height:32px!important;padding:5px 8px!important;font-size:12px!important;box-sizing:border-box!important}
      #serviceEditBox #order .section{min-width:0!important}
      #serviceEditBox #order .sectiontitle{margin:0 0 4px!important}
      #serviceEditBox #order .sectiontitle h3{font-size:13px!important;margin:0!important}
      #serviceEditBox #order .sectiontitle span{font-size:10px!important}
      #serviceEditBox #order .services{max-height:190px!important;overflow:auto!important}
      #serviceEditBox #order .svc-head{padding:5px 7px!important}
      #serviceEditBox #order .svc-row{padding:5px 7px!important;gap:5px!important}
      #serviceEditBox #order .svc-row input,#serviceEditBox #order .svc-row select{height:30px!important;min-height:30px!important;padding:4px 6px!important;font-size:11px!important}
      #serviceEditBox #order #add{padding:6px 10px!important;margin-top:4px!important;font-size:11px!important}
      #serviceEditBox #order .order-notes-field{min-height:0!important}
      #serviceEditBox #order .order-notes-field textarea{height:100px!important;min-height:100px!important;max-height:180px!important;padding:8px 10px!important;font-size:12px!important;line-height:1.4!important;resize:vertical!important}
      #serviceEditBox #order>.field.g12{gap:3px!important}
      #serviceEditBox #order #discountPercent{max-width:180px!important}
      #serviceEditBox #order .totals{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin:0!important}
      #serviceEditBox #order .metric{padding:6px 9px!important;min-width:0!important}
      #serviceEditBox #order .metric small{font-size:10px!important}
      #serviceEditBox #order .metric b{font-size:14px!important}
      #serviceEditBox #order .grand{font-size:17px!important;margin:0!important;padding:2px 0!important}
      /* Resumo financeiro: três indicadores à esquerda e lucro em destaque à direita. */
      #serviceEditBox #order .totals{grid-template-columns:repeat(3,minmax(0,1fr)) minmax(220px,1.35fr)!important;align-items:stretch!important}
      #serviceEditBox #order .totals .metric:last-child{display:flex!important;flex-direction:column!important;justify-content:center!important;padding:10px 16px!important;background:linear-gradient(135deg,#e8f1ff 0%,#d7e7ff 100%)!important;border:2px solid #3478c8!important;border-radius:12px!important;box-shadow:0 4px 14px rgba(23,75,145,.18)!important}
      #serviceEditBox #order .totals .metric:last-child small{font-size:11px!important;font-weight:900!important;color:#174b86!important;text-transform:uppercase!important;letter-spacing:.35px!important}
      #serviceEditBox #order .totals .metric:last-child b{font-size:23px!important;line-height:1.2!important;font-weight:950!important;color:#103e75!important;margin-top:7px!important;white-space:nowrap!important}
      @media(max-width:700px){
        #serviceEditBox #order .totals{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #serviceEditBox #order .totals .metric:last-child{grid-column:1/-1!important}
        #serviceEditBox #order .totals .metric:last-child b{font-size:21px!important}
      }
      #serviceEditBox #order .foot{position:sticky!important;bottom:0!important;z-index:30!important;display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:auto!important;padding:7px 0 0!important;background:#fff!important;border-top:1px solid #e5e7eb!important;flex:0 0 auto!important}
      @media(max-height:780px) and (min-width:701px){
        #serviceEditBox{height:98vh!important;max-height:98vh!important;padding:8px 12px!important}
        #serviceEditBox #order>.grid{gap:4px!important}
        #serviceEditBox #order .services{max-height:145px!important}
        #serviceEditBox #order .order-notes-field textarea{height:80px!important;min-height:80px!important}
      }
      @media(max-width:700px){
        #serviceEditBox{height:98vh!important;max-height:98vh!important;overflow:auto!important;padding:9px!important}
        #serviceEditBox>#order{overflow-y:auto!important;overflow-x:hidden!important}
        #serviceEditBox #order>.grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}
        #serviceEditBox #order .g8{grid-column:span 6!important}
        #serviceEditBox #order .g3,#serviceEditBox #order .g2{grid-column:span 3!important}
        #serviceEditBox #order .totals{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #serviceEditBox #order .foot{position:sticky!important;bottom:0!important}
      }
      #serviceEditHeader{position:sticky!important;top:-18px!important;z-index:20!important;display:flex!important;align-items:center!important;justify-content:space-between!important;background:#fff!important;color:#172033!important;padding:3px 0 12px!important;margin-bottom:14px!important;border-bottom:1px solid #e5e7eb!important}
      #serviceEditTitle{margin:0!important;font-size:22px!important;color:#172033!important}
      #serviceEditHeaderActions{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important}
      #serviceEditPrintReceipt{border:0!important;border-radius:9px!important;padding:9px 14px!important;background:#173b67!important;color:#fff!important;font-weight:800!important;cursor:pointer!important}
      #serviceEditClose{border:0!important;border-radius:9px!important;padding:9px 14px!important;background:#eee!important;color:#172033!important;font-weight:800!important;cursor:pointer!important}
      #serviceEditBox>#order{display:block!important;width:100%!important;max-width:none!important;margin:0!important}
      #allServicesList .service-actions-v2{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:10px!important}
      #allServicesList .service-edit-btn{border:0!important;border-radius:9px!important;padding:8px 13px!important;background:#172033!important;color:#fff!important;font-weight:800!important;cursor:pointer!important}
      @media(max-width:700px){#serviceEditOverlay{padding:5px!important}#serviceEditBox{width:100%!important;max-height:99vh!important;padding:11px!important;border-radius:12px!important}#serviceEditTitle{font-size:19px!important}}
    `;document.head.appendChild(s);
  }
  function ensurePopup(){
    if(popup)return;css();popup=document.createElement('div');popup.id='serviceEditOverlay';popup.className='hidden';
    popup.innerHTML='<div id="serviceEditBox" role="dialog" aria-modal="true"><div id="serviceEditHeader"><h2 id="serviceEditTitle">Editar lançamento</h2><div id="serviceEditHeaderActions"><button type="button" id="serviceEditPrintReceipt">Imprimir</button><button type="button" id="serviceEditClose">Fechar ×</button></div></div></div>';
    document.body.appendChild(popup);
    $('serviceEditClose').onclick=close;
    $('serviceEditPrintReceipt').addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      const orderId=currentOrderId;
      if(!orderId){
        alert('Não foi possível identificar o lançamento aberto. Feche e abra o lançamento novamente.');
        return;
      }
      if(typeof window.printServiceReceipt!=='function'){
        alert('O módulo de impressão não foi carregado. Atualize o aplicativo com Ctrl + F5 e tente novamente.');
        console.error('[Radiadores Moura] printServiceReceipt não está disponível.');
        return;
      }
      try{
        const result=window.printServiceReceipt(orderId);
        if(result&&typeof result.catch==='function')result.catch(error=>{
          console.error('[Radiadores Moura] Erro ao iniciar impressão:',error);
          alert('Ocorreu um erro ao abrir a impressão. Consulte o console para detalhes.');
        });
      }catch(error){
        console.error('[Radiadores Moura] Erro ao iniciar impressão:',error);
        alert('Não foi possível iniciar a impressão: '+(error?.message||error));
      }
    });
    // Clique fora do formulário não fecha o popup; use Fechar ou Cancelar.
  }
  function close(){
    if(!opened)return;const form=$('order');
    if(form&&originalParent){if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(form,originalNext);else originalParent.appendChild(form)}
    popup?.classList.add('hidden');window.__serviceEditCurrentOrderId=null;document.documentElement.classList.remove('service-edit-popup-html');document.body.classList.remove('service-edit-popup-open');opened=false;if(originalParent)originalParent.style.display=originalParentDisplay;if($('clear')&&originalClearText!==null){$('clear').textContent=originalClearText;$('clear').onclick=originalClearOnclick;}originalParent=null;originalNext=null;currentOrderId=null;creating=false;$('serviceEditPrintReceipt')?.classList.remove('hidden');
  }
  function configureDeliveryControl(){
    const checkbox=$('notDelivered'),exit=$('exit');
    if(!checkbox||!exit)return;
    const label=checkbox.closest('label');
    if(label){
      const textNode=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
      if(textNode)textNode.textContent=' NÃO ENTREGUE';
      else if(!label.textContent.includes('NÃO ENTREGUE'))label.appendChild(document.createTextNode(' NÃO ENTREGUE'));
    }
    if(checkbox.dataset.autoExitDateBound!=='1'){
      checkbox.dataset.autoExitDateBound='1';
      checkbox.addEventListener('change',()=>{
        if(checkbox.checked){exit.value='';exit.disabled=true;}
        else{
          exit.disabled=false;
          const d=new Date(),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
          exit.value=local.toISOString().slice(0,10);
        }
      });
    }
    exit.disabled=checkbox.checked;
  }
  function openNew(){
    const form=$('order');if(!form||opened)return;ensurePopup();creating=true;currentOrderId=null;
    originalParent=form.parentNode;originalNext=form.nextSibling;originalParentDisplay=originalParent?.style.display||'';const clearButton=$('clear');if(clearButton&&originalClearText===null){originalClearText=clearButton.textContent;originalClearOnclick=clearButton.onclick;}
    if(typeof window.clearOrder==='function')window.clearOrder();else $('clear')?.click();
    // Ao abrir um novo lançamento, entrada e saída começam com a data local de hoje.
    const now=new Date(),todayLocal=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    $('entry').value=todayLocal;$('exit').value=todayLocal;
    const deliveryCheckbox=$('notDelivered');if(deliveryCheckbox)deliveryCheckbox.checked=false;
    $('exit').disabled=false;
    $('serviceEditBox').appendChild(form);popup.classList.remove('hidden');document.documentElement.classList.add('service-edit-popup-html');document.body.classList.add('service-edit-popup-open');opened=true;
    $('serviceEditTitle').textContent='Novo lançamento de serviço';$('serviceEditPrintReceipt')?.classList.add('hidden');
    const save=form.querySelector('button[type="submit"]');if(save)save.textContent='Salvar lançamento';
    const clear=$('clear');if(clear){clear.textContent='Cancelar';clear.onclick=e=>{e.preventDefault();e.stopPropagation();close()}}
    setTimeout(()=>$('clientInput')?.focus(),50);
  }
  function open(id){
    if(!id)return;const edit=window.editOrder,form=$('order');if(typeof edit!=='function'||!form)return;ensurePopup();creating=false;currentOrderId=String(id);
    originalParent=form.parentNode;originalNext=form.nextSibling;window.__serviceEditCurrentOrderId=String(id);$('serviceEditBox').appendChild(form);popup.classList.remove('hidden');document.documentElement.classList.add('service-edit-popup-html');document.body.classList.add('service-edit-popup-open');opened=true;
    const nativeScrollTo=window.scrollTo;window.scrollTo=function(){};try{edit(String(id));configureDeliveryControl()}finally{window.scrollTo=nativeScrollTo}
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
    const side=document.querySelector('.side');
    if(side&&!$('launchNewService')){const b=document.createElement('button');b.type='button';b.id='launchNewService';b.className='btn primary';b.textContent='＋ Novo lançamento';b.style.width='100%';b.style.margin='0 0 16px';b.addEventListener('click',openNew);side.insertBefore(b,side.firstChild);}
    const toast=$('toast');if(toast){new MutationObserver(()=>{if(creating&&toast.textContent.includes('Lançamento salvo na nuvem'))close()}).observe(toast,{childList:true,subtree:true,characterData:true});}
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
  // Captura o clique no botão de impressão mesmo se outro script interceptar eventos.
  document.addEventListener('click',function(e){
    const button=e.target.closest?.('#serviceEditPrintReceipt');
    if(!button)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const id=window.__serviceEditCurrentOrderId;
    if(!id){alert('Não foi possível identificar o lançamento. Feche e abra novamente.');return;}
    if(typeof window.printServiceReceipt!=='function'){
      alert('O módulo de impressão não carregou. Recarregue a página com Ctrl + Shift + R.');
      console.error('[Radiadores Moura] Módulo service-receipt-print.js ausente.');
      return;
    }
    Promise.resolve(window.printServiceReceipt(id)).catch(err=>{
      console.error('[Radiadores Moura] Falha na impressão:',err);
      alert('Erro ao abrir impressão: '+(err?.message||err));
    });
  },true);
  window.openServiceEditPopup=open;window.openServiceNewPopup=openNew;window.closeServiceEditPopup=close;window.openFix=open;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{css();bind()},{once:true});else{css();bind()}
})();
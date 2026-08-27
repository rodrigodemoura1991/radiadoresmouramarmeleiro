/* Correções finais: legenda lateral, saída opcional e status FALTA ACERTAR também no editor popup. */
(function(){
  const $=id=>document.getElementById(id);
  const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};

  function injectCss(){
    let s=$('final-fixes-css');
    if(!s){s=document.createElement('style');s.id='final-fixes-css';document.head.appendChild(s)}
    s.textContent=`
      .services-side-shell{display:grid!important;grid-template-columns:minmax(0,1fr) 150px!important;gap:12px!important;align-items:start!important;width:100%!important;box-sizing:border-box!important}
      .services-side-shell>.all-services,.services-side-shell>.launches{grid-column:1!important;grid-row:1!important;min-width:0!important;width:100%!important}
      .services-color-legend{grid-column:2!important;grid-row:1!important;position:sticky!important;top:90px!important;align-self:start!important;width:150px!important;margin:0!important;padding:10px!important;display:flex!important;flex-direction:column!important;gap:7px!important;background:#fff!important;border:1px solid var(--line)!important;border-radius:10px!important;box-shadow:0 4px 14px #17203312!important;z-index:20!important;box-sizing:border-box!important}
      .services-color-legend strong{display:block!important;margin:0 0 2px!important;font-size:10px!important;line-height:1.2!important}
      .services-color-legend .legend-item{display:flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important;font-size:10px!important;font-weight:800!important;line-height:1.2!important;color:var(--muted)!important}
      .services-color-legend .legend-dot{display:inline-block!important;width:9px!important;height:9px!important;min-width:9px!important;border-radius:50%!important}
      .legend-black{background:#111}.legend-green{background:#138a5b}.legend-blue{background:#2f80ed}.legend-purple{background:#7356c8}.legend-orange{background:#d97706}.legend-brown{background:#b7791f}.legend-cyan{background:#0891b2}.legend-gray{background:#64748b}
      .legend-falta{background:#1264d8!important;box-shadow:0 0 0 2px #8fc2ff inset}
      .edit-exit-option{display:none;align-items:center;gap:6px;margin-top:6px;font-size:10px;font-weight:800;color:var(--muted)}
      .edit-exit-option.visible{display:flex}
      .order-notes-field{grid-column:1/-1!important}
      .order-notes-field textarea{width:100%!important;min-height:90px!important;resize:vertical!important;box-sizing:border-box!important;font:inherit!important;line-height:1.45!important}
      .order-notes-label{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}
      .order-notes-hint{font-size:11px!important;font-weight:600!important;color:var(--muted)!important}
      .launch-observation{margin-top:7px!important;padding:7px 9px!important;border-radius:8px!important;background:#fff9df!important;border:1px solid #eadc9c!important;color:#5f5220!important;font-size:11px!important;line-height:1.35!important;white-space:pre-wrap!important;word-break:break-word!important}
      .launch-observation b{font-weight:900!important}
      @media(max-width:1000px){.services-side-shell{grid-template-columns:minmax(0,1fr) 125px!important;gap:8px!important}.services-color-legend{width:125px!important}}
      @media(max-width:700px){.services-side-shell{grid-template-columns:minmax(0,1fr) 105px!important;gap:6px!important}.services-color-legend{width:105px!important;top:65px!important;padding:7px 6px!important}.services-color-legend .legend-item,.services-color-legend strong{font-size:8px!important}.order-notes-field textarea{min-height:100px!important}.order-notes-hint{display:none!important}}
    `;
  }

  function unwrapOldLegendLayouts(){
    document.querySelectorAll('.services-legend-shell').forEach(shell=>{const host=shell.querySelector('#allServicesList,#launchList');if(host&&shell.parentNode)shell.parentNode.insertBefore(host,shell);shell.remove()});
    document.querySelectorAll('.services-color-legend').forEach(x=>x.remove());
  }

  function makeSideLegend(hostId,title,items){
    const host=$(hostId);if(!host)return;
    let shell=host.parentElement;
    if(!shell||!shell.classList.contains('services-side-shell')){const oldShell=host.closest('.services-legend-shell');if(oldShell)oldShell.remove();shell=document.createElement('div');shell.className='services-side-shell';host.parentNode.insertBefore(shell,host);shell.appendChild(host)}
    shell.querySelectorAll(':scope>.services-color-legend').forEach(x=>x.remove());
    const legend=document.createElement('aside');legend.className='services-color-legend';legend.innerHTML='<strong>'+title+'</strong>'+items.map(x=>`<span class="legend-item"><i class="legend-dot ${x[0]}"></i>${x[1]}</span>`).join('');shell.appendChild(legend);
  }

  const launchItems=[['legend-blue','Liberado'],['legend-orange','Parado'],['legend-purple','Pronto'],['legend-green','Pronto entregue']];
  const serviceItems=[['legend-black','EM ABERTO'],['legend-green','Dinheiro'],['legend-blue','Cartão'],['legend-purple','Pix'],['legend-orange','Cheque'],['legend-brown','Carteira'],['legend-cyan','Boleto'],['legend-gray','Notinha'],['legend-falta','FALTA ACERTAR']];
  function addLegends(){document.querySelectorAll('.services-color-legend').forEach(x=>x.remove());makeSideLegend('launchList','Cores dos cartões:',launchItems);makeSideLegend('allServicesList','Cores dos cartões:',serviceItems)}

  function ensurePaymentOption(){
    document.querySelectorAll('#payment,#servicePaymentFilter,#fixPayment,.payment-status-select').forEach(el=>{
      if(!el.options)return;
      if(![...el.options].some(o=>String(o.value)==='FALTA ACERTAR')){const o=document.createElement('option');o.value='FALTA ACERTAR';o.textContent='FALTA ACERTAR';el.appendChild(o)}
    });
  }

  function ensureExitOption(){
    const exit=$('exit');if(!exit)return null;const field=exit.closest('.field');if(!field)return null;
    let box=$('editExitOption');
    if(!box){box=document.createElement('label');box.id='editExitOption';box.className='edit-exit-option';box.innerHTML='<input id="editExitBlank" type="checkbox"><span>Deixar sem data de saída</span>';field.appendChild(box);const check=$('editExitBlank');check.addEventListener('change',()=>{if(check.checked)exit.value='';else if(!exit.value){const rows=[...document.querySelectorAll('#rows .svc-row')];const allDelivered=rows.length>0&&rows.every(r=>r.querySelector('.status')?.value==='Pronto entregue');if(allDelivered)exit.value=today()}})}
    return box;
  }
  function setEditExitOption(){const box=ensureExitOption(),check=$('editExitBlank'),isEditing=typeof editing!=='undefined'&&!!editing;if(box)box.classList.toggle('visible',isEditing);if(check){check.checked=isEditing&&!$('exit')?.value;if(check.checked&&$('exit'))$('exit').value=''}}
  function syncExit(){const exit=$('exit'),rows=document.querySelectorAll('#rows .svc-row');if(!exit)return;const check=$('editExitBlank');if(check?.checked){exit.value='';return}if(!rows.length)return;const allDelivered=[...rows].every(r=>r.querySelector('.status')?.value==='Pronto entregue');if(!allDelivered)exit.value='';else if(!exit.value)exit.value=today()}
  function bindStatus(){document.querySelectorAll('#rows .status').forEach(s=>{if(s.dataset.exitBound)return;s.dataset.exitBound='1';s.addEventListener('change',syncExit)})}
  function installEnter(){const add=$('add');if(!add||add.dataset.enterFixed)return;add.dataset.enterFixed='1';add.addEventListener('keydown',function(e){if(e.key!=='Enter')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof addRow!=='function')return;addRow();requestAnimationFrame(()=>{const rows=document.querySelectorAll('#rows .svc-row');rows[rows.length-1]?.querySelector('.desc')?.focus();bindStatus()})},true);add.addEventListener('click',()=>requestAnimationFrame(bindStatus))}
  function wrapEdit(){if(typeof window.editOrder!=='function'||window.editOrder.__finalFixWrapped)return;const original=window.editOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{ensurePaymentOption();ensureExitOption();setEditExitOption();syncExit();bindStatus();ensureNotesField();ensureFixNotesField()},50);return r};wrapped.__finalFixWrapped=true;window.editOrder=wrapped}
  function wrapClear(){if(typeof window.clearOrder!=='function'||window.clearOrder.__finalFixWrapped)return;const original=window.clearOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{if($('exit'))$('exit').value=today();if($('editExitBlank'))$('editExitBlank').checked=false;if($('editExitOption'))$('editExitOption').classList.remove('visible');if($('orderNotes'))$('orderNotes').value='';if($('fixNotes'))$('fixNotes').value='';bindStatus();ensurePaymentOption()},20);return r};wrapped.__finalFixWrapped=true;window.clearOrder=wrapped}
  function bindSubmit(){const order=$('order');if(!order||order.dataset.finalSubmitFixed)return;order.dataset.finalSubmitFixed='1';order.addEventListener('submit',()=>{if($('editExitBlank')?.checked&&$('exit'))$('exit').value=''},true)}

  function ensureNotesField(){
    const order=$('order');if(!order)return;
    let field=$('orderNotesField');
    if(!field){
      field=document.createElement('div');field.id='orderNotesField';field.className='field g12 order-notes-field';
      field.innerHTML='<label class="order-notes-label"><span>Observações</span><span class="order-notes-hint">Informações importantes deste lançamento</span></label><textarea id="orderNotes" placeholder="Ex.: peça com avaria, cliente solicitou retorno, aguardar aprovação, detalhes importantes..."></textarea>';
      const section=order.querySelector('.section');
      if(section) section.parentNode.insertBefore(field,section); else order.querySelector('.grid')?.appendChild(field);
    }
    if(field.parentElement?.classList.contains('grid'))return;
    const grid=order.querySelector('.grid');if(grid)grid.appendChild(field);
  }

  function ensureFixNotesField(){
    const form=$('fixEditForm');if(!form)return;
    let field=$('fixNotesField');
    if(!field){
      field=document.createElement('div');field.id='fixNotesField';field.className='field g12 order-notes-field';
      field.innerHTML='<label class="order-notes-label"><span>Observações</span><span class="order-notes-hint">Informações importantes deste lançamento</span></label><textarea id="fixNotes" placeholder="Ex.: peça com avaria, cliente solicitou retorno, aguardar aprovação, detalhes importantes..."></textarea>';
      const totals=form.querySelector('.edit-totals');if(totals)totals.parentNode.insertBefore(field,totals);else form.appendChild(field);
    }
  }

  function getNotesClient(){
    try{return window.supabase?.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.key)||null}catch(e){return null}
  }

  async function persistNotes(snapshot,notes){
    const client=getNotesClient();const companyId=sessionStorage.getItem('companyId');if(!client||!companyId)return;
    const q=await client.from('orders').select('id,client_name,entry_date,vehicle_make_model,plate,pedido,created_at').eq('company_id',companyId).eq('entry_date',snapshot.entry).order('created_at',{ascending:false}).limit(20);
    if(q.error||!q.data?.length)return;
    const norm=s=>String(s||'').trim().toLowerCase();
    let found=q.data.find(o=>norm(o.client_name)===norm(snapshot.client)&&norm(o.vehicle_make_model)===norm(snapshot.vehicle)&&norm(o.plate)===norm(snapshot.plate)&&norm(o.pedido)===norm(snapshot.pedido));
    if(!found)found=q.data[0];
    await client.from('orders').update({notes:String(notes||'').trim()}).eq('id',found.id);
    showObservation(found.id,String(notes||'').trim());
  }

  function captureOrderSnapshot(){return {entry:$('entry')?.value||'',client:$('clientInput')?.value||'',vehicle:$('vehicle')?.value||'',plate:$('plate')?.value||'',pedido:$('pedido')?.value||''}}
  function bindNotesPersistence(){
    const order=$('order');if(!order||order.dataset.notesBound)return;order.dataset.notesBound='1';
    order.addEventListener('submit',()=>{const snapshot=captureOrderSnapshot();const notes=$('orderNotes')?.value||'';setTimeout(()=>persistNotes(snapshot,notes),900)},true);
  }

  function bindFixNotesPersistence(){
    const form=$('fixEditForm');if(!form||form.dataset.notesBound)return;form.dataset.notesBound='1';
    form.addEventListener('submit',()=>{const snapshot={entry:$('fixEntry')?.value||'',client:$('fixClient')?.value||'',vehicle:$('fixVehicle')?.value||'',plate:$('fixPlate')?.value||'',pedido:$('fixPedido')?.value||''};const notes=$('fixNotes')?.value||'';setTimeout(()=>persistNotes(snapshot,notes),1000)},true);
  }

  function showObservation(id,notes){
    if(!id)return;const card=document.querySelector('.launch[data-id="'+CSS.escape(id)+'"]');if(!card)return;
    card.querySelector('.launch-observation')?.remove();if(!notes)return;
    const el=document.createElement('div');el.className='launch-observation';el.innerHTML='<b>Observação:</b> '+String(notes).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    card.appendChild(el);
  }

  async function refreshObservations(){
    const client=getNotesClient(),companyId=sessionStorage.getItem('companyId');if(!client||!companyId)return;
    const cards=[...document.querySelectorAll('.launch[data-id]')];if(!cards.length)return;
    const ids=cards.map(x=>x.dataset.id);const r=await client.from('orders').select('id,notes').eq('company_id',companyId).in('id',ids);if(r.error)return;
    (r.data||[]).forEach(o=>showObservation(o.id,o.notes||''));
  }

  function install(){
    injectCss();unwrapOldLegendLayouts();addLegends();ensurePaymentOption();ensureExitOption();installEnter();wrapEdit();wrapClear();bindStatus();bindSubmit();ensureNotesField();ensureFixNotesField();bindNotesPersistence();bindFixNotesPersistence();const exit=$('exit');if(exit)exit.removeAttribute('required');setEditExitOption();setTimeout(refreshObservations,250);
  }
  let timer=0;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{injectCss();installEnter();wrapEdit();wrapClear();bindStatus();bindSubmit();ensureExitOption();ensurePaymentOption();ensureNotesField();ensureFixNotesField();bindNotesPersistence();bindFixNotesPersistence();setEditExitOption();if(!$('launchList')?.parentElement?.classList.contains('services-side-shell')||!$('launchList')?.parentElement?.querySelector('.services-color-legend')||!$('allServicesList')?.parentElement?.classList.contains('services-side-shell')||!$('allServicesList')?.parentElement?.querySelector('.services-color-legend'))addLegends();refreshObservations()},80)});observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

// Observações dos lançamentos: campo livre, persistência na tabela orders.notes e exibição nos cartões.

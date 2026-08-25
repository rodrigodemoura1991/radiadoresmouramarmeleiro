window.SUPABASE_CONFIG={url:'https://uwnzpoqhxioxjegflksv.supabase.co',key:'sb_publishable_WLXH_fefLlSO-r9ebQHAnw_MtUd7w7r'};

// UI overrides: compact launch cards + edit/delete popup.
document.addEventListener('DOMContentLoaded',()=>{
  const css=`
.launches{gap:3px}.launch{padding:5px 8px;border-radius:9px}.lname{font-size:13px}.meta{font-size:10px;margin-top:1px}.chips{gap:3px;margin-top:3px}.chip{padding:2px 5px;font-size:9px}.launch-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}.launch-action{border:1px solid var(--line);background:#fff;border-radius:7px;padding:3px 6px;font-size:10px;font-weight:900;cursor:pointer;color:var(--ink)}.launch-action.delete{color:#b42318}.order-edit-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:10px}.order-edit-grid .g4{grid-column:span 4}.order-edit-grid .g8{grid-column:span 8}.order-edit-grid .g12{grid-column:1/-1}.edit-services{border:1px solid var(--line);border-radius:12px;overflow:auto}.edit-svc-head,.edit-svc-row{display:grid;grid-template-columns:minmax(220px,3fr) minmax(110px,1.2fr) minmax(110px,1.2fr) minmax(90px,1fr) minmax(145px,1.4fr) 36px;gap:7px;align-items:center;min-width:780px}.edit-svc-head{padding:8px;background:#f4f7fb;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase}.edit-svc-row{padding:7px;border-top:1px solid var(--line)}.edit-svc-row input,.edit-svc-row select{width:100%;padding:8px;border:1px solid #d5dde8;border-radius:8px;background:#fff}.edit-totals{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.edit-total{padding:8px;background:#f7f9fc;border:1px solid var(--line);border-radius:10px}.edit-total small{display:block;color:var(--muted);font-size:10px}.edit-total b{display:block;margin-top:3px;font-size:14px}.payment-pending{background:#fff4cf!important;color:#8a5a00!important;font-weight:1000!important}.payment-star{color:#c58a00;font-weight:1000;font-size:15px;margin-left:5px}.launch-services{display:grid;gap:2px;margin-top:4px}.service-line{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 6px;border-radius:6px;background:#f7f9fc;font-size:10px}.service-line b{font-size:10px}.service-line .service-status{font-weight:900}.service-line.status-Liberado{background:#e8f2ff;color:#2364a9}.service-line.status-Parado{background:#fff3df;color:#9b5c00}.service-line.status-Pronto{background:#eee9ff;color:#6444ad}.service-line.status-Prontoentregue{background:#e6f7ef;color:#087249}.launch-meta-extra{font-weight:800;color:var(--brand2)}
@media(max-width:700px){.order-edit-grid{grid-template-columns:1fr}.order-edit-grid .g4,.order-edit-grid .g8,.order-edit-grid .g12{grid-column:1}.edit-totals{grid-template-columns:1fr 1fr}}
`;
  document.head.insertAdjacentHTML('beforeend',`<style>${css}</style>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="orderModal" class="modal hidden"><div class="modalbox" style="width:min(900px,100%)"><div class="modalhead"><h2>Editar lançamento</h2><button class="btn" id="closeOrderModal">×</button></div><form id="editOrderForm"><div class="order-edit-grid"><div class="field g4"><label>Entrada</label><input id="editEntry" type="date" required></div><div class="field g4"><label>Saída</label><input id="editExit" type="date" required></div><div class="field g4"><label>Nome do cliente</label><input id="editClient" required></div><div class="field g4"><label>Marca e modelo</label><input id="editVehicle"></div><div class="field g4"><label>Placa</label><input id="editPlate"></div><div class="field g4"><label>Pedido</label><input id="editPedido" placeholder="Número do pedido"></div><div class="field g4"><label>Forma de pagamento</label><select id="editPayment"><option value="EM ABERTO">EM ABERTO</option><option>Dinheiro</option><option>Cartão</option><option>Pix</option><option>Cheque</option><option>Carteira</option><option>Boleto</option></select></div><div class="g12"><div class="sectiontitle"><h3>Serviços e produtos</h3><span>Edite os valores e a situação diretamente aqui.</span></div><div class="edit-services"><div class="edit-svc-head"><span>Descrição</span><span>Venda</span><span>Custo</span><span>Alíquota</span><span>Situação</span><span></span></div><div id="editRows"></div></div><button type="button" class="btn" id="addEditRow" style="margin-top:7px">＋ Adicionar serviço / produto</button></div></div><div class="edit-totals"><div class="edit-total"><small>Venda total</small><b id="editSaleTotal">R$ 0,00</b></div><div class="edit-total"><small>Custo total</small><b id="editCostTotal">R$ 0,00</b></div><div class="edit-total"><small>Imposto</small><b id="editTaxTotal">R$ 0,00</b></div><div class="edit-total"><small>Lucro líquido</small><b id="editProfitTotal">R$ 0,00</b></div></div><div class="foot" style="justify-content:space-between"><button type="button" class="btn" id="deleteOrderFromModal" style="color:#b42318;border-color:#f0c9c5">Excluir lançamento</button><div style="display:flex;gap:8px"><button type="button" class="btn" id="cancelOrderModal">Cancelar</button><button class="btn primary">Salvar alterações</button></div></div></form></div></div>`);
  let popupEditingId=null;
  function editRowItems(){return [...document.querySelectorAll('#editRows .edit-svc-row')].map(r=>({description:r.querySelector('.edesc').value.trim(),sale_value:parseMoney(r.querySelector('.esale').value),cost_value:parseMoney(r.querySelector('.ecost').value),tax_rate:Number(r.querySelector('.etax').value)||0,service_status:r.querySelector('.estatus').value})).filter(x=>x.description||x.sale_value||x.cost_value)}
  function calcEdit(){const a=editRowItems(),sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);$('editSaleTotal').textContent=money(sale);$('editCostTotal').textContent=money(cost);$('editTaxTotal').textContent=money(tax);$('editProfitTotal').textContent=money(sale-cost-tax)}
  function addEditRow(item={}){const r=document.createElement('div');r.className='edit-svc-row';r.innerHTML=`<input class="edesc" list="catalogList" placeholder="Descrição serviço / produto" value="${esc(item.description||'')}"><input class="esale" inputmode="decimal" placeholder="R$ 0,00" value="${item.sale_value?money(item.sale_value):''}"><input class="ecost" inputmode="decimal" placeholder="R$ 0,00" value="${item.cost_value?money(item.cost_value):''}"><input class="etax" type="number" min="0" step=".01" placeholder="%" value="${item.tax_rate??''}"><select class="estatus"><option value="Pronto entregue">Pronto/Entregue</option><option>Liberado</option><option>Parado</option><option>Pronto</option></select><button type="button" class="btn">×</button>`;$('editRows').appendChild(r);r.querySelector('.estatus').value=item.service_status||'Pronto entregue';r.querySelector('button').onclick=()=>{r.remove();calcEdit()};r.querySelectorAll('input,select').forEach(x=>x.oninput=calcEdit);['esale','ecost'].forEach(k=>{const x=r.querySelector('.'+k);x.onblur=()=>{const n=parseMoney(x.value);x.value=n?money(n):'';calcEdit()}});calcEdit()}
  function openOrderModal(id){const o=orders.find(x=>x.id===id);if(!o)return;popupEditingId=id;$('editEntry').value=o.entry_date||today();$('editExit').value=o.exit_date||today();$('editClient').value=o.client_name||'';$('editVehicle').value=o.vehicle_make_model||'';$('editPlate').value=o.plate||'';$('editPedido').value=o.pedido||'';$('editPayment').value=o.payment_status||'EM ABERTO';$('editRows').innerHTML='';(o.order_items||[]).forEach(addEditRow);if(!o.order_items?.length)addEditRow();calcEdit();$('orderModal').classList.remove('hidden')}
  function closeOrderModal(){$('orderModal').classList.add('hidden');popupEditingId=null}
  $('closeOrderModal').onclick=closeOrderModal;$('cancelOrderModal').onclick=closeOrderModal;$('addEditRow').onclick=()=>addEditRow();
  $('editOrderForm').onsubmit=async e=>{e.preventDefault();if(!popupEditingId||!company)return;const a=editRowItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');const o=orders.find(x=>x.id===popupEditingId);if(!o)return;cloud('Salvando...');let c=clients.find(x=>x.name.toLowerCase()===$('editClient').value.trim().toLowerCase());if(!c&&$('editClient').value.trim()){const cr=await sb.from('clients').insert({company_id:company.id,name:$('editClient').value.trim()}).select().single();if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)}c=cr.data;clients.unshift(c)}const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);const p={company_id:company.id,client_id:c?.id||null,entry_date:$('editEntry').value,exit_date:$('editExit').value,client_name:$('editClient').value.trim(),vehicle_make_model:$('editVehicle').value.trim(),plate:$('editPlate').value.trim(),pedido:$('editPedido').value.trim(),payment_status:$('editPayment').value,total_sale:sale,total_cost:cost,total_tax:tax,net_profit:sale-cost-tax};const r=await sb.from('orders').update(p).eq('id',popupEditingId).select().single();if(r.error){cloud('Erro ao salvar',false);return toast(r.error.message)}const dr=await sb.from('order_items').delete().eq('order_id',popupEditingId);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:popupEditingId})));if(ir.error){cloud('Erro ao salvar',false);return toast(ir.error.message)}await saveCatalog(a);closeOrderModal();await loadData();toast('Lançamento atualizado')};
  async function deleteOrder(id){const o=orders.find(x=>x.id===id);if(!o)return;if(!confirm(`Excluir o lançamento de ${o.client_name||'Sem cliente'}? Esta ação não pode ser desfeita.`))return;cloud('Excluindo...');const r=await sb.from('orders').delete().eq('id',id);if(r.error){cloud('Erro ao excluir',false);return toast(r.error.message)}if(popupEditingId===id)closeOrderModal();await loadData();toast('Lançamento excluído')}
  $('deleteOrderFromModal').onclick=()=>{if(popupEditingId)deleteOrder(popupEditingId)};
  renderLaunches=function(){updateCatalog();const q=($('launchSearch').value||'').toLowerCase();const a=orders.filter(o=>[o.client_name,o.vehicle_make_model,o.plate,o.pedido,...(o.order_items||[]).map(i=>i.description)].join(' ').toLowerCase().includes(q));$('count').textContent=a.length+' lançamento(s)';$('launchList').innerHTML=a.map(o=>{const st=(o.order_items||[])[0]?.service_status||'Pronto entregue',cl=slug(st);const pending=['EM ABERTO','Carteira'].includes((o.payment_status||'').trim());return `<article class="launch ${cl}" data-id="${o.id}"><div class="ltop"><div><div class="lname">${esc(o.client_name||'Sem cliente')}${pending?'<span class="payment-star">★</span>':''}</div><div class="meta">${o.entry_date||''} • Saída ${o.exit_date||''}${o.vehicle_make_model?' • '+esc(o.vehicle_make_model):''}${o.plate?' • '+esc(o.plate):''}${o.pedido?' • <span class="launch-meta-extra">Pedido '+esc(o.pedido)+'</span>':''}</div></div><div class="launch-actions"><b>${money(o.total_sale)}</b><button type="button" class="launch-action" data-edit="${o.id}">Editar</button><button type="button" class="launch-action delete" data-delete="${o.id}">Excluir</button></div></div><div class="launch-services">${(o.order_items||[]).map(i=>`<div class="service-line status-${slug(i.service_status||'Pronto entregue')}"><span><b>${esc(i.description)}</b> • ${money(i.sale_value)}</span><span class="service-status">${esc(i.service_status||'Pronto entregue')}</span></div>`).join('')}</div><div class="chips"><span class="chip payment-chip ${pending?'payment-pending':''}">${pending?'★ ':''}${esc(o.payment_status||'EM ABERTO')}</span></div></article>`}).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';$('launchList').querySelectorAll('.launch').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-edit],[data-delete]'))return;openOrderModal(x.dataset.id)});$('launchList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();openOrderModal(b.dataset.edit)});$('launchList').querySelectorAll('[data-delete]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteOrder(b.dataset.delete)})};
  $('launchSearch').oninput=renderLaunches;
  renderLaunches();
});

// Final business/UI patch: Pedido, Boleto, pending-payment star and separated services.
document.addEventListener('DOMContentLoaded',()=>{
  const payment=$('payment');
  if(payment && ![...payment.options].some(o=>o.value==='Boleto')) payment.insertAdjacentHTML('beforeend','<option value="Boleto">Boleto</option>');

  const plateField=$('plate')?.closest('.field');
  if(plateField && !$('pedido')){
    const f=document.createElement('div');f.className='field g4';f.innerHTML='<label>Pedido</label><input id="pedido" placeholder="Número do pedido" autocomplete="off">';
    plateField.after(f);
  }

  function normalizeServiceSelect(select,value){
    if(!select)return;
    select.innerHTML='<option value="Pronto entregue">Pronto/Entregue</option><option value="Liberado">Liberado</option><option value="Parado">Parado</option><option value="Pronto">Pronto</option>';
    select.value=value||'Pronto entregue';
  }
  const originalAddRow=addRow;
  addRow=function(item={}){originalAddRow({...item,service_status:item.service_status||'Pronto entregue'});const r=$('rows').lastElementChild;normalizeServiceSelect(r?.querySelector('.status'),item.service_status||'Pronto entregue');};
  document.querySelectorAll('#rows .status').forEach(s=>normalizeServiceSelect(s,s.value));

  // Capture Pedido before the original save handler clears the form.
  $('order')?.addEventListener('submit',()=>{
    window.__pedidoToSave=$('pedido')?.value.trim()||'';
    window.__editingOrderId=typeof editing!=='undefined'&&editing?editing.id:null;
    window.__saveStartedAt=new Date(Date.now()-1500).toISOString();
    setTimeout(async()=>{
      if(!company)return;
      let id=window.__editingOrderId;
      if(!id){
        const q=await sb.from('orders').select('id').eq('company_id',company.id).eq('entry_date',$('entry')?.value||today()).eq('client_name',window.__lastClientName||'').order('created_at',{ascending:false}).limit(1);
        id=q.data?.[0]?.id||null;
      }
      if(id){await sb.from('orders').update({pedido:window.__pedidoToSave||null}).eq('id',id);await loadData();}
    },1000);
  });

  // Keep the latest client name available without interfering with the original handler.
  $('order')?.addEventListener('submit',()=>{window.__lastClientName=$('clientInput')?.value.trim()||'';});

  // Add Pedido to the edit popup and keep it synchronized with the selected launch.
  const editPlate=$('editPlate');
  if(editPlate && !$('editPedido')){
    const f=document.createElement('div');f.className='field g4';f.innerHTML='<label>Pedido</label><input id="editPedido" placeholder="Número do pedido" autocomplete="off">';
    editPlate.closest('.field')?.after(f);
  }
  const editPayment=$('editPayment');
  if(editPayment && ![...editPayment.options].some(o=>o.value==='Boleto')) editPayment.insertAdjacentHTML('beforeend','<option value="Boleto">Boleto</option>');

  const launchList=$('launchList');
  launchList?.addEventListener('click',e=>{
    const el=e.target.closest('.launch');
    if(el)window.__selectedOrderId=el.dataset.id;
  },true);

  const modal=$('orderModal');
  if(modal){
    const obs=new MutationObserver(()=>{
      if(!modal.classList.contains('hidden')&&window.__selectedOrderId){
        const o=orders.find(x=>x.id===window.__selectedOrderId);
        if(o&&$('editPedido'))$('editPedido').value=o.pedido||'';
      }
    });
    obs.observe(modal,{attributes:true,attributeFilter:['class']});
  }

  $('editOrderForm')?.addEventListener('submit',()=>{
    const id=window.__selectedOrderId,pedido=$('editPedido')?.value.trim()||'';
    if(!id)return;
    setTimeout(async()=>{const r=await sb.from('orders').update({pedido:pedido||null}).eq('id',id);if(!r.error)await loadData();},1000);
  });

  // Re-render the launch cards with each service on its own compact line and a clear pending marker.
  const originalRender=renderLaunches;
  renderLaunches=function(){
    updateCatalog();
    const q=($('launchSearch').value||'').toLowerCase();
    const a=orders.filter(o=>[o.client_name,o.vehicle_make_model,o.plate,o.pedido,...(o.order_items||[]).map(i=>i.description)].join(' ').toLowerCase().includes(q));
    $('count').textContent=a.length+' lançamento(s)';
    $('launchList').innerHTML=a.map(o=>{
      const st=(o.order_items||[])[0]?.service_status||'Pronto entregue',cl=slug(st),pending=['EM ABERTO','Carteira'].includes((o.payment_status||'').trim());
      const services=(o.order_items||[]).map(i=>`<div class="service-line status-${slug(i.service_status||'Pronto entregue')}"><span><b>${esc(i.description)}</b></span><span><b>${money(i.sale_value)}</b> • <span class="service-status">${esc(i.service_status||'Pronto entregue')}</span></span></div>`).join('');
      return `<article class="launch ${cl}" data-id="${o.id}"><div class="ltop"><div><div class="lname">${esc(o.client_name||'Sem cliente')}${pending?'<span class="payment-star">★</span>':''}</div><div class="meta">${o.entry_date||''} • Saída ${o.exit_date||''}${o.vehicle_make_model?' • '+esc(o.vehicle_make_model):''}${o.plate?' • '+esc(o.plate):''}${o.pedido?' • <span class="launch-meta-extra">Pedido '+esc(o.pedido)+'</span>':''}</div></div><div class="launch-actions"><b>${money(o.total_sale)}</b><button type="button" class="launch-action" data-edit="${o.id}">Editar</button><button type="button" class="launch-action delete" data-delete="${o.id}">Excluir</button></div></div><div class="launch-services">${services||'<div class="service-line">Nenhum serviço</div>'}</div><div class="chips"><span class="chip payment-chip ${pending?'payment-pending':''}">${pending?'★ ':''}${esc(o.payment_status||'EM ABERTO')}</span></div></article>`;
    }).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';
    $('launchList').querySelectorAll('.launch').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-edit],[data-delete]'))return;window.__selectedOrderId=x.dataset.id;openOrderModal(x.dataset.id)});
    $('launchList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();window.__selectedOrderId=b.dataset.edit;openOrderModal(b.dataset.edit)});
    $('launchList').querySelectorAll('[data-delete]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteOrder(b.dataset.delete)});
  };
  $('launchSearch').oninput=renderLaunches;
  renderLaunches();
});
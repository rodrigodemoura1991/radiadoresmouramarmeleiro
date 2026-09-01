/* Radiadores Moura - Frete por item (correção definitiva)
   - Frete fica ao lado do Custo.
   - Frete é salvo em order_items.freight_value.
   - Frete volta preenchido ao editar um lançamento.
   - Totais consideram custo + frete.
*/
(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const moneyInput=v=>{const n=parseMoney(v);return n?money(n):''};
  function styleRows(){
    const styleId='freight-layout-v2';
    if(!document.getElementById(styleId)){
      const s=document.createElement('style');s.id=styleId;s.textContent=`
        .services{overflow-x:auto}
        .svc-head,.svc-row{grid-template-columns:minmax(220px,2.8fr) minmax(92px,1fr) minmax(92px,1fr) minmax(92px,1fr) minmax(78px,.8fr) minmax(132px,1.25fr) 34px;gap:7px;min-width:0}
        .svc-head{padding:9px 8px}.svc-row{padding:8px}.svc-row .freight{text-align:right}
        .edit-services{overflow-x:auto}
        .edit-svc-head,.edit-svc-row{grid-template-columns:minmax(210px,2.7fr) minmax(90px,1fr) minmax(90px,1fr) minmax(90px,1fr) minmax(76px,.8fr) minmax(125px,1.2fr) 34px;gap:7px;min-width:0}
        @media(max-width:850px){.svc-head,.svc-row,.edit-svc-head,.edit-svc-row{min-width:820px}}
      `;document.head.appendChild(s)
    }
  }
  function ensureHeader(header){
    if(!header)return;
    const children=[...header.children];
    const cost=children.find(x=>x.textContent.trim().toLowerCase()==='custo');
    if(cost&&!children.some(x=>x.classList.contains('freight-head'))){const s=document.createElement('span');s.className='freight-head';s.textContent='Frete';cost.after(s)}
  }
  function ensureFreight(row,value){
    if(!row)return null;
    let f=row.querySelector('.freight');
    if(!f){
      f=document.createElement('input');f.className='freight money';f.inputMode='decimal';f.placeholder='R$ 0,00';
      const cost=row.querySelector('.cost'),tax=row.querySelector('.tax');if(cost&&tax)tax.before(f);else row.appendChild(f);
      f.addEventListener('input',calcNew);f.addEventListener('blur',()=>{f.value=moneyInput(f.value);calcNew()})
    }
    if(value!==undefined&&value!==null&&value!=='')f.value=moneyInput(value);
    return f
  }
  function patchNewRows(){styleRows();ensureHeader(document.querySelector('.svc-head'));document.querySelectorAll('#rows .svc-row').forEach(r=>ensureFreight(r,r.dataset.freightValue))}
  function newItems(){return [...document.querySelectorAll('#rows .svc-row')].map(r=>({description:r.querySelector('.desc')?.value.trim()||'',sale_value:parseMoney(r.querySelector('.sale')?.value),cost_value:parseMoney(r.querySelector('.cost')?.value),freight_value:parseMoney(r.querySelector('.freight')?.value),tax_rate:Number(r.querySelector('.tax')?.value)||0,service_status:r.querySelector('.status')?.value||'Liberado'})).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value)}
  function calcNew(){if(!q('rows'))return;const a=newItems(),sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);if(q('saleTotal'))q('saleTotal').textContent=money(sale);if(q('costTotal'))q('costTotal').textContent=money(cost+freight);if(q('taxTotal'))q('taxTotal').textContent=money(tax);if(q('profitTotal'))q('profitTotal').textContent=money(sale-cost-freight-tax);if(q('grand'))q('grand').textContent=money(sale)}
  async function saveNew(e){
    e.preventDefault();e.stopImmediatePropagation();if(!company)return toast('Escolha a empresa primeiro');patchNewRows();const a=newItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');cloud('Salvando...');
    let c=clients.find(x=>x.name.toLowerCase()===(q('clientInput').value||'').trim().toLowerCase());
    if(!c&&q('clientInput').value.trim()){const cr=await sb.from('clients').insert({company_id:company.id,name:q('clientInput').value.trim()}).select().single();if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)}c=cr.data;clients.unshift(c)}
    const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0),payment=String(q('payment').value||'').trim();
    const p={company_id:company.id,client_id:c?.id||null,entry_date:q('entry').value||null,exit_date:q('exit').value||null,client_name:q('clientInput').value.trim(),vehicle_make_model:q('vehicle').value.trim(),plate:q('plate').value.trim(),pedido:q('pedido').value.trim(),payment_status:payment||null,total_sale:sale,total_cost:cost+freight,total_tax:tax,net_profit:sale-cost-freight-tax};
    const r=editing?await sb.from('orders').update(p).eq('id',editing.id).select().single():await sb.from('orders').insert(p).select().single();if(r.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar lançamento: '+r.error.message)}
    if(editing){const dr=await sb.from('order_items').delete().eq('order_id',editing.id);if(dr.error){cloud('Erro ao salvar',false);return toast('Erro ao atualizar serviços: '+dr.error.message)}}
    const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:r.data.id})));if(ir.error){cloud('Erro ao salvar',false);return toast('Lançamento salvo, mas os serviços falharam: '+ir.error.message)}
    if(typeof saveCatalog==='function')await saveCatalog(a);editing=null;clearOrder();await loadData();toast('Lançamento salvo na nuvem')
  }
  function patchAddRow(){if(typeof window.addRow!=='function'||window.addRow.__freightV2)return;const original=window.addRow;function wrapped(item={}){original(item);const r=q('rows')?.lastElementChild;if(r){r.dataset.freightValue=item.freight_value??'';ensureFreight(r,item.freight_value)}calcNew()}wrapped.__freightV2=true;window.addRow=wrapped}
  function editItems(){return [...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({description:r.querySelector('.fd')?.value.trim()||'',sale_value:parseMoney(r.querySelector('.fs')?.value),cost_value:parseMoney(r.querySelector('.fc')?.value),freight_value:parseMoney(r.querySelector('.ff')?.value),tax_rate:Number(r.querySelector('.ft')?.value)||0,service_status:r.querySelector('.fst')?.value||'Pronto entregue'})).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value)}
  function ensureEditFreight(row,value){if(!row)return;let f=row.querySelector('.ff');if(!f){f=document.createElement('input');f.className='ff';f.inputMode='decimal';f.placeholder='R$ 0,00';const cost=row.querySelector('.fc'),tax=row.querySelector('.ft');if(cost&&tax)tax.before(f);else row.appendChild(f);f.addEventListener('input',calcEdit);f.addEventListener('blur',()=>{f.value=moneyInput(f.value);calcEdit()})}if(value!==undefined&&value!==null&&value!=='')f.value=moneyInput(value)}
  function patchEditRows(){styleRows();ensureHeader(document.querySelector('.edit-svc-head'));document.querySelectorAll('#fixRows .edit-svc-row').forEach(r=>ensureEditFreight(r,r.dataset.freightValue))}
  function calcEdit(){if(!q('fixRows'))return;const a=editItems(),sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);if(q('fixSale'))q('fixSale').textContent=money(sale);if(q('fixCost'))q('fixCost').textContent=money(cost+freight);if(q('fixTax'))q('fixTax').textContent=money(tax);if(q('fixProfit'))q('fixProfit').textContent=money(sale-cost-freight-tax)}
  function patchEditAddRow(){if(typeof window.addFixRow!=='function'||window.addFixRow.__freightV2)return;const original=window.addFixRow;function wrapped(item={}){original(item);const r=q('fixRows')?.lastElementChild;if(r){r.dataset.freightValue=item.freight_value??'';ensureEditFreight(r,item.freight_value)}calcEdit()}wrapped.__freightV2=true;window.addFixRow=wrapped}
  async function saveEdit(e){
    e.preventDefault();e.stopImmediatePropagation();if(!company)return toast('Escolha a empresa primeiro');const modal=q('orderFixModal'),id=window.__freightEditId||modal?.dataset.freightOrderId;if(!id)return toast('Não foi possível identificar o lançamento');patchEditRows();const a=editItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');const old=orders.find(x=>x.id===id);if(!old)return toast('Lançamento não encontrado');cloud('Salvando...');
    let c=clients.find(x=>x.name.toLowerCase()===(q('fixClient').value||'').trim().toLowerCase());if(!c&&q('fixClient').value.trim()){const cr=await sb.from('clients').insert({company_id:company.id,name:q('fixClient').value.trim()}).select().single();if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)}c=cr.data;clients.unshift(c)}
    const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);const p={company_id:company.id,client_id:c?.id||old.client_id||null,entry_date:q('fixEntry').value,exit_date:q('fixExit').value,client_name:q('fixClient').value.trim(),vehicle_make_model:q('fixVehicle').value.trim(),plate:q('fixPlate').value.trim(),pedido:q('fixPedido').value.trim(),payment_status:q('fixPayment').value,total_sale:sale,total_cost:cost+freight,total_tax:tax,net_profit:sale-cost-freight-tax};
    const r=await sb.from('orders').update(p).eq('id',id).select().single();if(r.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar: '+r.error.message)}const dr=await sb.from('order_items').delete().eq('order_id',id);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:id})));if(ir.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar serviços: '+ir.error.message)}if(typeof saveCatalog==='function')await saveCatalog(a);modal.classList.add('hidden');window.__freightEditId=null;await loadData();toast('Lançamento atualizado')
  }
  function captureEditId(e){const b=e.target.closest('[data-edit]');if(b){window.__freightEditId=b.dataset.edit;requestAnimationFrame(()=>{const m=q('orderFixModal');if(m)m.dataset.freightOrderId=b.dataset.edit;patchEditRows();calcEdit()})}}
  function install(){styleRows();patchAddRow();patchEditAddRow();patchNewRows();patchEditRows();const form=q('order');if(form&&!form.dataset.freightV2){form.dataset.freightV2='1';form.addEventListener('submit',saveNew,true);form.addEventListener('input',e=>{if(e.target.closest('#rows')){patchNewRows();calcNew()}},true)}const fix=q('fixEditForm');if(fix&&!fix.dataset.freightV2){fix.dataset.freightV2='1';fix.addEventListener('submit',saveEdit,true)}document.addEventListener('click',captureEditId,true);setTimeout(()=>{patchAddRow();patchEditAddRow();patchNewRows();patchEditRows();calcNew();calcEdit()},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

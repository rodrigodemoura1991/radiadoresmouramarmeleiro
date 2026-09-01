/* Radiadores Moura - Frete FINAL
   Uma unica rotina de salvamento para novos lancamentos e edicao.
   O frete pertence ao order_item e o total_freight fica em orders.
*/
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const num=v=>parseMoney(v)||0;
  const fmt=v=>Number(v)?money(v):'';
  let currentEditId=null;

  function addStyle(){
    if($('freight-final-style')) return;
    const s=document.createElement('style'); s.id='freight-final-style'; s.textContent=`
      .svc-head,.svc-row{grid-template-columns:minmax(220px,2.8fr) minmax(92px,1fr) minmax(92px,1fr) minmax(92px,1fr) minmax(92px,1fr) minmax(132px,1.25fr) 34px;gap:7px;min-width:0}
      .edit-svc-head,.edit-svc-row{grid-template-columns:minmax(210px,2.7fr) minmax(90px,1fr) minmax(90px,1fr) minmax(90px,1fr) minmax(90px,1fr) minmax(125px,1.2fr) 34px;gap:7px;min-width:0}
      .svc-head .freight-head,.edit-svc-head .freight-head{display:block}
      .svc-row .freight,.edit-svc-row .freight{width:100%;text-align:right}
      @media(max-width:850px){.svc-head,.svc-row,.edit-svc-head,.edit-svc-row{min-width:850px}}
    `; document.head.appendChild(s);
  }

  function header(){
    document.querySelectorAll('.svc-head,.edit-svc-head').forEach(h=>{
      if(h.querySelector('.freight-head')) return;
      const cost=[...h.children].find(x=>x.textContent.trim().toLowerCase()==='custo');
      if(cost){const x=document.createElement('span');x.className='freight-head';x.textContent='Frete';cost.after(x)}
    });
  }

  function freightInput(row,value){
    if(!row) return null;
    let f=row.querySelector('.freight');
    if(!f){
      f=document.createElement('input');
      f.className='freight money'; f.inputMode='decimal'; f.placeholder='R$ 0,00';
      const cost=row.querySelector('.cost,.fc'), tax=row.querySelector('.tax,.ft');
      if(cost&&tax) tax.before(f); else row.appendChild(f);
      f.addEventListener('input',()=>{calcNew();calcEdit()});
      f.addEventListener('blur',()=>{const n=num(f.value);f.value=fmt(n);calcNew();calcEdit()});
    }
    if(value!==undefined&&value!==null) f.value=fmt(value);
    return f;
  }

  function patchNewRows(){
    document.querySelectorAll('#rows .svc-row').forEach(r=>{
      const existing=r.querySelector('.freight');
      if(existing) return;
      freightInput(r,r.dataset.freightValue ?? 0);
    });
    header();
  }

  function wrapAddRow(){
    if(typeof window.addRow!=='function'||window.addRow.__freightFinal) return;
    const old=window.addRow;
    function wrapped(item={}){
      old(item);
      const r=$('rows')?.lastElementChild;
      if(r){r.dataset.freightValue=item.freight_value??0;freightInput(r,item.freight_value??0)}
      calcNew();
    }
    wrapped.__freightFinal=true; window.addRow=wrapped;
  }

  function newItems(){
    return [...document.querySelectorAll('#rows .svc-row')].map(r=>({
      description:r.querySelector('.desc')?.value.trim()||'',
      sale_value:num(r.querySelector('.sale')?.value),
      cost_value:num(r.querySelector('.cost')?.value),
      freight_value:num(r.querySelector('.freight')?.value),
      tax_rate:Number(r.querySelector('.tax')?.value)||0,
      service_status:r.querySelector('.status')?.value||'Pronto entregue'
    })).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value);
  }

  function editItems(){
    return [...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({
      description:r.querySelector('.fd')?.value.trim()||'',
      sale_value:num(r.querySelector('.fs')?.value),
      cost_value:num(r.querySelector('.fc')?.value),
      freight_value:num(r.querySelector('.freight')?.value),
      tax_rate:Number(r.querySelector('.ft')?.value)||0,
      service_status:r.querySelector('.fst')?.value||'Pronto entregue'
    })).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value);
  }

  function totals(a){
    const sale=a.reduce((s,x)=>s+x.sale_value,0);
    const cost=a.reduce((s,x)=>s+x.cost_value,0);
    const freight=a.reduce((s,x)=>s+x.freight_value,0);
    const tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
    return {sale,cost,freight,tax,net:sale-cost-freight-tax};
  }

  function calcNew(){
    if(!$('rows')) return; const t=totals(newItems());
    if($('saleTotal'))$('saleTotal').textContent=money(t.sale);
    if($('costTotal'))$('costTotal').textContent=money(t.cost+t.freight);
    if($('taxTotal'))$('taxTotal').textContent=money(t.tax);
    if($('profitTotal'))$('profitTotal').textContent=money(t.net);
    if($('grand'))$('grand').textContent=money(t.sale);
  }

  function calcEdit(){
    if(!$('fixRows')) return; const t=totals(editItems());
    if($('fixSale'))$('fixSale').textContent=money(t.sale);
    if($('fixCost'))$('fixCost').textContent=money(t.cost+t.freight);
    if($('fixTax'))$('fixTax').textContent=money(t.tax);
    if($('fixProfit'))$('fixProfit').textContent=money(t.net);
  }

  window.__radiadoresCalcEdit=calcEdit;

  async function saveNew(e){
    e.preventDefault();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    if(!company)return toast('Escolha a empresa primeiro');
    patchNewRows(); const a=newItems();
    if(!a.length)return toast('Adicione pelo menos um serviço ou produto');
    cloud('Salvando...');
    let c=clients.find(x=>x.name.toLowerCase()===$('clientInput').value.trim().toLowerCase());
    if(!c&&$('clientInput').value.trim()){
      const cr=await sb.from('clients').insert({company_id:company.id,name:$('clientInput').value.trim()}).select().single();
      if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)} c=cr.data; clients.unshift(c);
    }
    const t=totals(a), payment=String($('payment').value||'').trim();
    const p=sanitizeDates({company_id:company.id,client_id:c?.id||null,entry_date:$('entry').value||null,exit_date:$('notDelivered')?.checked?null:($('exit').value||null),client_name:$('clientInput').value.trim(),vehicle_make_model:$('vehicle').value.trim(),plate:$('plate').value.trim(),pedido:$('pedido').value.trim(),payment_status:payment||null,total_sale:t.sale,total_cost:t.cost+t.freight,total_freight:t.freight,total_tax:t.tax,net_profit:t.net,notes:$('orderNotes')?.value.trim()||''});
    const r=editing?await sb.from('orders').update(p).eq('id',editing.id).select().single():await sb.from('orders').insert(p).select().single();
    if(r.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar lançamento: '+r.error.message)}
    if(editing){const dr=await sb.from('order_items').delete().eq('order_id',editing.id);if(dr.error){cloud('Erro ao salvar',false);return toast('Erro ao atualizar serviços: '+dr.error.message)}}
    const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:r.data.id,freight_value:Number(x.freight_value)||0})));
    if(ir.error){cloud('Erro ao salvar',false);return toast('Lançamento salvo, mas os serviços falharam: '+ir.error.message)}
    if(typeof saveCatalog==='function')await saveCatalog(a);
    editing=null;clearOrder();await loadData();toast('Lançamento salvo na nuvem');
  }

  function patchEditRows(){
    document.querySelectorAll('#fixRows .edit-svc-row').forEach(r=>{
      const existing=r.querySelector('.freight');
      if(existing) return;
      freightInput(r, r.dataset.freightValue ?? 0);
    });
    header(); calcEdit();
  }

  function loadEditFreight(){
    if(!currentEditId||!$('fixRows'))return;
    const o=orders.find(x=>String(x.id)===String(currentEditId));
    if(!o)return;
    const items=o.order_items||[];
    [...document.querySelectorAll('#fixRows .edit-svc-row')].forEach((r,i)=>{
      const v=Number(items[i]?.freight_value||0); r.dataset.freightValue=v; freightInput(r,v);
    });
    calcEdit();
  }

  async function saveEdit(e){
    e.preventDefault();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    if(!company)return toast('Escolha a empresa primeiro');
    patchEditRows(); const a=editItems();
    if(!a.length)return toast('Adicione pelo menos um serviço ou produto');
    const id=currentEditId;if(!id)return toast('Não foi possível identificar o lançamento');
    const old=orders.find(x=>String(x.id)===String(id));if(!old)return toast('Lançamento não encontrado');
    cloud('Salvando...');
    let c=clients.find(x=>x.name.toLowerCase()===$('fixClient').value.trim().toLowerCase());
    if(!c&&$('fixClient').value.trim()){
      const cr=await sb.from('clients').insert({company_id:company.id,name:$('fixClient').value.trim()}).select().single();
      if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)} c=cr.data;
    }
    const t=totals(a);
    const p=sanitizeDates({company_id:company.id,client_id:c?.id||old.client_id||null,entry_date:$('fixEntry').value,exit_date:$('fixNotDelivered')?.checked?null:$('fixExit').value,client_name:$('fixClient').value.trim(),vehicle_make_model:$('fixVehicle').value.trim(),plate:$('fixPlate').value.trim(),pedido:$('fixPedido').value.trim(),payment_status:$('fixPayment').value,total_sale:t.sale,total_cost:t.cost+t.freight,total_freight:t.freight,total_tax:t.tax,net_profit:t.net,notes:$('fixNotes')?.value.trim()||''});
    const r=await sb.from('orders').update(p).eq('id',id).select().single();
    if(r.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar: '+r.error.message)}
    const dr=await sb.from('order_items').delete().eq('order_id',id);
    if(dr.error){cloud('Erro ao salvar',false);return toast('Erro ao atualizar serviços: '+dr.error.message)}
    const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:id,freight_value:Number(x.freight_value)||0})));
    if(ir.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar serviços: '+ir.error.message)}
    if(typeof saveCatalog==='function')await saveCatalog(a);
    $('orderFixModal')?.classList.add('hidden'); currentEditId=null; await loadData(); toast('Lançamento atualizado');
  }

  function observeClicks(){
    if(window.__radiadoresFreightClicksBound) return;
    window.__radiadoresFreightClicksBound=true;
    document.addEventListener('click',e=>{
      const edit=e.target.closest?.('[data-edit]');
      const launch=e.target.closest?.('.launch[data-id],.launch[data-order-id]');
      const add=e.target.closest?.('#fixAdd');
      let opened=false;
      if(edit){ currentEditId=edit.dataset.edit; opened=true; }
      else if(launch){ currentEditId=launch.dataset.id || launch.dataset.orderId; opened=true; }
      if(add){ requestAnimationFrame(()=>{patchEditRows();calcEdit()}); return; }
      requestAnimationFrame(()=>{
        patchNewRows();
        patchEditRows();
        if(opened) loadEditFreight();
      });
    },true);
  }

  function install(){
    addStyle();
    wrapAddRow();
    patchNewRows();
    const order=$('order');
    if(order){order.onsubmit=saveNew;order.dataset.freightFinal='1'}
    const fix=$('fixEditForm');
    if(fix){fix.onsubmit=saveEdit;fix.dataset.freightFinal='1'}
    observeClicks();
    setTimeout(()=>{
      wrapAddRow();patchNewRows();patchEditRows();
      const f=$('fixEditForm');if(f)f.onsubmit=saveEdit;
      calcNew();calcEdit();
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
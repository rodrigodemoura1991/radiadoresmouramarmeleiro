/* Radiadores Moura - Frete por item
   Adiciona frete ao lado do custo, persiste em order_items.freight_value
   e mantém o frete editável no lançamento existente.
*/
(function(){
  'use strict';
  function moneyInput(v){ const n=parseMoney(v); return n?money(n):''; }
  function addFreightToNewRows(){
    const rows=document.querySelectorAll('#rows .svc-row');
    rows.forEach(r=>{
      if(r.querySelector('.freight')) return;
      const cost=r.querySelector('.cost');
      if(!cost) return;
      const f=document.createElement('input');
      f.className='freight money'; f.inputMode='decimal'; f.placeholder='R$ 0,00';
      r.insertBefore(f,r.querySelector('.tax'));
      f.addEventListener('input',calcWithFreight);
      f.addEventListener('blur',()=>{f.value=moneyInput(f.value);calcWithFreight()});
    });
  }
  function calcWithFreight(){
    const rows=[...document.querySelectorAll('#rows .svc-row')];
    let sale=0,cost=0,freight=0,tax=0;
    rows.forEach(r=>{
      sale+=parseMoney(r.querySelector('.sale')?.value);
      cost+=parseMoney(r.querySelector('.cost')?.value);
      freight+=parseMoney(r.querySelector('.freight')?.value);
      tax+=sale*0; // imposto é calculado abaixo por item
    });
    tax=rows.reduce((s,r)=>{const sv=parseMoney(r.querySelector('.sale')?.value),rate=Number(r.querySelector('.tax')?.value)||0;return s+sv*rate/100},0);
    $('saleTotal').textContent=money(sale);$('costTotal').textContent=money(cost+freight);$('taxTotal').textContent=money(tax);$('profitTotal').textContent=money(sale-cost-freight-tax);$('grand').textContent=money(sale);
  }
  function patchNewRows(){
    addFreightToNewRows();
    document.querySelectorAll('#rows .svc-row input,#rows .svc-row select').forEach(x=>{if(!x.dataset.freightBound){x.dataset.freightBound='1';x.addEventListener('input',()=>{addFreightToNewRows();calcWithFreight()})}});
  }
  function patchEditRows(){
    const rows=document.querySelectorAll('#fixRows .edit-svc-row');
    rows.forEach(r=>{
      if(r.querySelector('.ff')) return;
      const cost=r.querySelector('.fc'); if(!cost)return;
      const f=document.createElement('input');f.className='ff';f.inputMode='decimal';f.placeholder='R$ 0,00';f.value=moneyInput(r.dataset.freight||'');
      r.insertBefore(f,r.querySelector('.ft'));
      f.addEventListener('input',calcEditWithFreight);f.addEventListener('blur',()=>{f.value=moneyInput(f.value);calcEditWithFreight()});
    });
  }
  function calcEditWithFreight(){
    let sale=0,cost=0,freight=0,tax=0;
    document.querySelectorAll('#fixRows .edit-svc-row').forEach(r=>{const sv=parseMoney(r.querySelector('.fs')?.value),cv=parseMoney(r.querySelector('.fc')?.value),fv=parseMoney(r.querySelector('.ff')?.value),rate=Number(r.querySelector('.ft')?.value)||0;sale+=sv;cost+=cv;freight+=fv;tax+=sv*rate/100});
    $('fixSale').textContent=money(sale);$('fixCost').textContent=money(cost+freight);$('fixTax').textContent=money(tax);$('fixProfit').textContent=money(sale-cost-freight-tax);
  }
  function install(){
    const rows=$('rows');
    if(rows && typeof addRow==='function'){
      const oldAdd=window.addRow;
      window.addRow=function(item={}){oldAdd(item);const r=$('rows')?.lastElementChild;if(r && item.freight_value!=null)r.dataset.freight=String(item.freight_value);patchNewRows();calcWithFreight()};
      patchNewRows();
      const oldRowItems=window.rowItems;
      if(typeof oldRowItems==='function')window.rowItems=function(){return oldRowItems().map((x,i)=>({...x,freight_value:parseMoney(document.querySelectorAll('#rows .svc-row')[i]?.querySelector('.freight')?.value)}));};
    }
    const form=$('order');
    if(form && !form.dataset.freightCalc){form.dataset.freightCalc='1';form.addEventListener('input',e=>{if(e.target.closest('#rows')){patchNewRows();calcWithFreight()}},true);}
    const fixForm=$('fixEditForm');
    if(fixForm && !fixForm.dataset.freightSubmit){
      fixForm.dataset.freightSubmit='1';
      const original=fixForm.onsubmit;
      fixForm.onsubmit=async function(ev){
        ev.preventDefault();
        const currentId=window.currentId || null;
        // currentId is lexical in supabase-config, so use the launch selected by modal buttons if needed.
        const modal=$('orderFixModal');
        const old=orders.find(o=>o.id===modal.dataset.freightOrderId) || orders.find(o=>o.id===fixForm.dataset.orderId);
        const target=old;
        if(!target){ if(typeof original==='function') return original.call(this,ev); return; }
        const items=[...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({description:r.querySelector('.fd')?.value.trim()||'',sale_value:parseMoney(r.querySelector('.fs')?.value),cost_value:parseMoney(r.querySelector('.fc')?.value),freight_value:parseMoney(r.querySelector('.ff')?.value),tax_rate:Number(r.querySelector('.ft')?.value)||0,service_status:r.querySelector('.fst')?.value||'Pronto entregue'})).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value);
        if(!items.length)return toast('Adicione pelo menos um serviço ou produto');
        cloud('Salvando...');
        const sale=items.reduce((s,x)=>s+x.sale_value,0),cost=items.reduce((s,x)=>s+x.cost_value,0),freight=items.reduce((s,x)=>s+x.freight_value,0),tax=items.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
        const p={company_id:company.id,client_id:target.client_id||null,entry_date:$('fixEntry').value,exit_date:$('fixExit').value,client_name:$('fixClient').value.trim(),vehicle_make_model:$('fixVehicle').value.trim(),plate:$('fixPlate').value.trim(),pedido:$('fixPedido').value.trim(),payment_status:$('fixPayment').value,total_sale:sale,total_cost:cost+freight,total_tax:tax,net_profit:sale-cost-freight-tax};
        const r=await sb.from('orders').update(p).eq('id',target.id).select().single();
        if(r.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar: '+r.error.message)}
        const dr=await sb.from('order_items').delete().eq('order_id',target.id);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}
        const ir=await sb.from('order_items').insert(items.map(x=>({...x,order_id:target.id})));if(ir.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar serviços: '+ir.error.message)}
        if(typeof saveCatalog==='function')await saveCatalog(items);
        modal.classList.add('hidden');await loadData();toast('Lançamento atualizado');
      };
    }
    // Quando o modal de edição abrir, associa o ID ao modal e injeta os campos.
    document.addEventListener('click',e=>{
      const edit=e.target.closest('[data-edit]');
      if(edit){requestAnimationFrame(()=>{const id=edit.dataset.edit;const m=$('orderFixModal');if(m)m.dataset.freightOrderId=id;patchEditRows();calcEditWithFreight()})}
      if(e.target.closest('#fixAdd'))requestAnimationFrame(()=>{patchEditRows();calcEditWithFreight()});
    });
    setInterval(()=>{if(!$('orderFixModal')?.classList.contains('hidden')){patchEditRows();calcEditWithFreight()}else patchNewRows()},1200);
  }
  document.addEventListener('DOMContentLoaded',install);
})();

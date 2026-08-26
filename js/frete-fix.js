// Campo FRETE por serviço/produto e edição do frete.
document.addEventListener('DOMContentLoaded', () => {
  const moneyF = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const parseF = v => { let s=String(v||'').replace('R$','').replace(/\s/g,''); if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.'); return Number(s)||0; };

  const css = `
    #rows .svc-row, .svc-head{grid-template-columns:minmax(220px,3fr) minmax(100px,1.1fr) minmax(100px,1.1fr) minmax(100px,1.1fr) minmax(90px,1fr) minmax(145px,1.4fr) 36px !important;}
    #rows .freight{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d5dde8;border-radius:8px;background:#fff;}
    .edit-svc-head,.edit-svc-row{grid-template-columns:minmax(200px,3fr) minmax(95px,1.1fr) minmax(95px,1.1fr) minmax(95px,1.1fr) minmax(80px,1fr) minmax(135px,1.4fr) 36px !important;min-width:850px;}
    .edit-svc-row .ff{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d5dde8;border-radius:8px;background:#fff;}
  `;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

  function decorateMainRow(r,item={}){
    if(!r || r.querySelector('.freight')) return;
    const tax=r.querySelector('.tax'); if(!tax) return;
    const el=document.createElement('input'); el.className='freight money'; el.inputMode='decimal'; el.placeholder='R$ 0,00'; el.value=Number(item.freight_value)?moneyF(item.freight_value):'';
    tax.parentNode.insertBefore(el,tax);
    el.oninput=()=>calcFreteMain();
    el.onblur=()=>{const n=parseF(el.value);el.value=n?moneyF(n):'';calcFreteMain();};
  }
  function decorateAllMainRows(){document.querySelectorAll('#rows .svc-row').forEach(r=>decorateMainRow(r));}
  if(typeof addRow==='function'){
    const baseAddRow=addRow;
    addRow=function(item={}){baseAddRow(item);const r=document.querySelector('#rows .svc-row:last-child');decorateMainRow(r,item);};
  }
  setTimeout(decorateAllMainRows,50);

  function getMainItems(){return [...document.querySelectorAll('#rows .svc-row')].map(r=>({description:r.querySelector('.desc')?.value.trim()||'',sale_value:parseF(r.querySelector('.sale')?.value),cost_value:parseF(r.querySelector('.cost')?.value),freight_value:parseF(r.querySelector('.freight')?.value),tax_rate:Number(r.querySelector('.tax')?.value)||0,service_status:r.querySelector('.status')?.value||'Liberado'})).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value);}
  window.rowItems=getMainItems;

  function calcFreteMain(){
    const a=getMainItems(),sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
    if($('saleTotal'))$('saleTotal').textContent=moneyF(sale);
    if($('costTotal'))$('costTotal').textContent=moneyF(cost);
    if($('taxTotal'))$('taxTotal').textContent=moneyF(tax);
    if($('profitTotal'))$('profitTotal').textContent=moneyF(sale-cost-freight-tax);
    if($('grand'))$('grand').textContent=moneyF(sale);
  }
  window.calc=calcFreteMain;

  const oldEditOrder=window.editOrder;
  if(typeof oldEditOrder==='function'){
    window.editOrder=async function(id){await oldEditOrder(id);setTimeout(()=>{const o=(typeof orders!=='undefined'?orders:[]).find(x=>x.id===id);document.querySelectorAll('#rows .svc-row').forEach((r,i)=>decorateMainRow(r,o?.order_items?.[i]||{}));calcFreteMain();},80);};
  }

  const order=$('order');
  if(order){
    order.onsubmit=async e=>{
      e.preventDefault();
      if(typeof company==='undefined'||!company)return toast('Escolha a empresa primeiro');
      const a=getMainItems(); if(!a.length)return toast('Adicione pelo menos um serviço ou produto');
      cloud('Salvando...');
      const clientList=typeof clients!=='undefined'?clients:[];
      let c=clientList.find(x=>x.name.toLowerCase()===$('clientInput').value.trim().toLowerCase());
      if(!c&&$('clientInput').value.trim()){
        const cr=await sb.from('clients').insert({company_id:company.id,name:$('clientInput').value.trim()}).select().single();
        if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)} c=cr.data; if(typeof clients!=='undefined')clients.unshift(c);
      }
      const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
      const p={company_id:company.id,client_id:c?.id||null,entry_date:$('entry').value,exit_date:$('exit').value||null,client_name:$('clientInput').value.trim(),vehicle_make_model:$('vehicle').value.trim(),plate:$('plate').value.trim(),pedido:$('pedido').value.trim(),payment_status:$('payment').value,total_sale:sale,total_cost:cost,total_freight:freight,total_tax:tax,net_profit:sale-cost-freight-tax};
      const editingId=(typeof editing!=='undefined'&&editing)?editing.id:null;
      const r=editingId?await sb.from('orders').update(p).eq('id',editingId).select().single():await sb.from('orders').insert(p).select().single();
      if(r.error){cloud('Erro ao salvar',false);return toast(r.error.message)}
      if(editingId){const dr=await sb.from('order_items').delete().eq('order_id',editingId);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}}
      const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:r.data.id})));if(ir.error){cloud('Erro ao salvar',false);return toast('Lançamento salvo, mas os itens falharam: '+ir.error.message)}
      if(typeof saveCatalog==='function')await saveCatalog(a);
      if(typeof editing!=='undefined')editing=null; if(typeof clearOrder==='function')clearOrder(); await loadData(); toast('Lançamento salvo na nuvem');
    };
  }

  let editId=null;
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-edit]'); if(b) editId=b.dataset.edit;
    const card=e.target.closest('.launch[data-id]'); if(card&&!e.target.closest('button')) editId=card.dataset.id;
  },true);

  function decorateEditRows(){
    const box=$('fixRows'); if(!box)return;
    const orderList=typeof orders!=='undefined'?orders:[];
    const o=orderList.find(x=>x.id===editId);
    [...box.querySelectorAll('.edit-svc-row')].forEach((r,i)=>{
      if(!r.querySelector('.ff')){
        const tax=r.querySelector('.ft');if(!tax)return;
        const el=document.createElement('input');el.className='ff';el.inputMode='decimal';el.placeholder='R$ 0,00';const v=o?.order_items?.[i]?.freight_value;el.value=Number(v)?moneyF(v):'';tax.parentNode.insertBefore(el,tax);el.onblur=()=>{const n=parseF(el.value);el.value=n?moneyF(n):'';calcEdit();};el.oninput=calcEdit;
      }
    });
    calcEdit();
  }
  function editItems(){return [...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({description:r.querySelector('.fd')?.value.trim()||'',sale_value:parseF(r.querySelector('.fs')?.value),cost_value:parseF(r.querySelector('.fc')?.value),freight_value:parseF(r.querySelector('.ff')?.value),tax_rate:Number(r.querySelector('.ft')?.value)||0,service_status:r.querySelector('.fst')?.value||'Pronto entregue'})).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value)}
  function calcEdit(){const a=editItems(),s=a.reduce((t,x)=>t+x.sale_value,0),c=a.reduce((t,x)=>t+x.cost_value,0),f=a.reduce((t,x)=>t+x.freight_value,0),tx=a.reduce((t,x)=>t+x.sale_value*x.tax_rate/100,0);if($('fixSale'))$('fixSale').textContent=moneyF(s);if($('fixCost'))$('fixCost').textContent=moneyF(c);if($('fixTax'))$('fixTax').textContent=moneyF(tx);if($('fixProfit'))$('fixProfit').textContent=moneyF(s-c-f-tx);}

  const observer=new MutationObserver(()=>{if($('orderFixModal')&&!$('orderFixModal').classList.contains('hidden'))setTimeout(decorateEditRows,20)});
  observer.observe(document.body,{subtree:true,childList:true});

  const fixForm=$('fixEditForm');
  if(fixForm){
    fixForm.onsubmit=async e=>{
      e.preventDefault();
      if(!editId||typeof company==='undefined'||!company)return;
      const a=editItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');
      const orderList=typeof orders!=='undefined'?orders:[]; const old=orderList.find(x=>x.id===editId);if(!old)return;
      cloud('Salvando...');
      const clientList=typeof clients!=='undefined'?clients:[];
      let c=clientList.find(x=>x.name.toLowerCase()===$('fixClient').value.trim().toLowerCase());
      if(!c&&$('fixClient').value.trim()){const cr=await sb.from('clients').insert({company_id:company.id,name:$('fixClient').value.trim()}).select().single();if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)}c=cr.data}
      const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
      const p={company_id:company.id,client_id:c?.id||old.client_id||null,entry_date:$('fixEntry').value,exit_date:$('fixExit').value||null,client_name:$('fixClient').value.trim(),vehicle_make_model:$('fixVehicle').value.trim(),plate:$('fixPlate').value.trim(),pedido:$('fixPedido').value.trim(),payment_status:$('fixPayment').value,total_sale:sale,total_cost:cost,total_freight:freight,total_tax:tax,net_profit:sale-cost-freight-tax};
      const r=await sb.from('orders').update(p).eq('id',editId).select().single();if(r.error){cloud('Erro ao salvar',false);return toast(r.error.message)}
      const dr=await sb.from('order_items').delete().eq('order_id',editId);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}
      const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:editId})));if(ir.error){cloud('Erro ao salvar',false);return toast('Serviço salvo, mas os itens falharam: '+ir.error.message)}
      if(typeof saveCatalog==='function')await saveCatalog(a);$('orderFixModal').classList.add('hidden');editId=null;await loadData();toast('Lançamento atualizado');
    };
  }

  const addHeader=sel=>{const h=document.querySelector(sel);if(h&&!h.querySelector('.freight-head')){const t=h.querySelectorAll('span')[2];const s=document.createElement('span');s.className='freight-head';s.textContent='Frete';t?.parentNode.insertBefore(s,t.nextSibling);}};
  addHeader('.svc-head'); addHeader('.edit-svc-head');
});

/* FRETE — implementação única e estável.
   Substitui o antigo frete-fix.js, evitando múltiplos patches concorrentes.
   O campo existe por item e é persistido em order_items.freight_value;
   o total é persistido em orders.total_freight e descontado do lucro. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const moneyF=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const parseF=v=>{let s=String(v??'').replace('R$','').replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)||0};
  const escF=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function installCss(){
    if($('frete-clean-css'))return;
    const s=document.createElement('style');s.id='frete-clean-css';
    s.textContent=`
      .svc-head,.svc-row{grid-template-columns:minmax(210px,3fr) minmax(105px,1.15fr) minmax(105px,1.15fr) minmax(105px,1.15fr) minmax(85px,1fr) minmax(135px,1.4fr) 36px!important;}
      #rows .freight-field{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d5dde8;border-radius:8px;background:#fff;}
      .edit-svc-head,.edit-svc-row{grid-template-columns:minmax(200px,3fr) minmax(95px,1.1fr) minmax(95px,1.1fr) minmax(95px,1.1fr) minmax(80px,1fr) minmax(135px,1.4fr) 36px!important;min-width:880px;}
      .edit-svc-row .freight-field{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d5dde8;border-radius:8px;background:#fff;}
      .freight-label{font-weight:900!important;}
    `;
    document.head.appendChild(s);
  }

  function ensureMainHeader(){
    const h=document.querySelector('.svc-head');if(!h||h.querySelector('.freight-head'))return;
    const spans=h.querySelectorAll('span');
    if(spans.length>=3){const x=document.createElement('span');x.className='freight-head';x.textContent='Frete';spans[2].after(x);}
  }

  function decorateMainRow(r,item){
    if(!r||r.querySelector('.freight-field'))return;
    const tax=r.querySelector('.tax');if(!tax)return;
    const el=document.createElement('input');
    el.className='freight-field money';el.inputMode='decimal';el.placeholder='R$ 0,00';
    const v=item&&item.freight_value!=null?Number(item.freight_value):0;el.value=v?moneyF(v):'';
    tax.before(el);
    el.addEventListener('input',calcMain);
    el.addEventListener('blur',()=>{const n=parseF(el.value);el.value=n?moneyF(n):'';calcMain()});
  }

  function decorateMainRows(){
    ensureMainHeader();
    document.querySelectorAll('#rows .svc-row').forEach(r=>decorateMainRow(r,null));
    calcMain();
  }

  function mainItems(){
    return [...document.querySelectorAll('#rows .svc-row')].map(r=>({
      description:r.querySelector('.desc')?.value.trim()||'',
      sale_value:parseF(r.querySelector('.sale')?.value),
      cost_value:parseF(r.querySelector('.cost')?.value),
      freight_value:parseF(r.querySelector('.freight-field')?.value),
      tax_rate:Number(r.querySelector('.tax')?.value)||0,
      service_status:r.querySelector('.status')?.value||'Liberado'
    })).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value);
  }

  function calcMain(){
    const a=mainItems(),sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
    if($('saleTotal'))$('saleTotal').textContent=moneyF(sale);
    if($('costTotal'))$('costTotal').textContent=moneyF(cost);
    if($('taxTotal'))$('taxTotal').textContent=moneyF(tax);
    if($('profitTotal'))$('profitTotal').textContent=moneyF(sale-cost-freight-tax);
    if($('grand'))$('grand').textContent=moneyF(sale);
  }

  function decorateEdit(){
    const box=$('fixRows');if(!box)return;
    const id=window.__freteEditId;
    const list=typeof orders!=='undefined'?orders:[];
    const o=id?list.find(x=>x.id===id):null;
    const head=document.querySelector('.edit-svc-head');
    if(head&&!head.querySelector('.freight-head')){const spans=head.querySelectorAll('span');if(spans.length>=3){const x=document.createElement('span');x.className='freight-head';x.textContent='Frete';spans[2].after(x)}}
    box.querySelectorAll('.edit-svc-row').forEach((r,i)=>{
      if(r.querySelector('.freight-field'))return;
      const tax=r.querySelector('.ft');if(!tax)return;
      const el=document.createElement('input');el.className='freight-field';el.inputMode='decimal';el.placeholder='R$ 0,00';
      const v=Number(o?.order_items?.[i]?.freight_value||0);el.value=v?moneyF(v):'';
      tax.before(el);el.addEventListener('input',calcEdit);el.addEventListener('blur',()=>{const n=parseF(el.value);el.value=n?moneyF(n):'';calcEdit()});
    });
    calcEdit();
  }

  function editItems(){return [...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({
    description:r.querySelector('.fd')?.value.trim()||'',sale_value:parseF(r.querySelector('.fs')?.value),cost_value:parseF(r.querySelector('.fc')?.value),freight_value:parseF(r.querySelector('.freight-field')?.value),tax_rate:Number(r.querySelector('.ft')?.value)||0,service_status:r.querySelector('.fst')?.value||'Pronto entregue'
  })).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value)}

  function calcEdit(){
    const a=editItems(),s=a.reduce((t,x)=>t+x.sale_value,0),c=a.reduce((t,x)=>t+x.cost_value,0),f=a.reduce((t,x)=>t+x.freight_value,0),tx=a.reduce((t,x)=>t+x.sale_value*x.tax_rate/100,0);
    if($('fixSale'))$('fixSale').textContent=moneyF(s);if($('fixCost'))$('fixCost').textContent=moneyF(c);if($('fixTax'))$('fixTax').textContent=moneyF(tx);if($('fixProfit'))$('fixProfit').textContent=moneyF(s-c-f-tx);
  }

  async function saveMain(e){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(typeof company==='undefined'||!company)return toast('Escolha a empresa primeiro');
    const a=mainItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');
    cloud('Salvando...');
    let c=clients.find(x=>x.name.toLowerCase()===$('clientInput').value.trim().toLowerCase());
    if(!c&&$('clientInput').value.trim()){
      const cr=await sb.from('clients').insert({company_id:company.id,name:$('clientInput').value.trim()}).select().single();
      if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)}c=cr.data;clients.unshift(c);
    }
    const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
    const p={company_id:company.id,client_id:c?.id||null,entry_date:$('entry').value,exit_date:$('exit').value||null,client_name:$('clientInput').value.trim(),vehicle_make_model:$('vehicle').value.trim(),plate:$('plate').value.trim(),pedido:$('pedido').value.trim(),payment_status:$('payment').value,total_sale:sale,total_cost:cost,total_freight:freight,total_tax:tax,net_profit:sale-cost-freight-tax};
    const editingId=typeof editing!=='undefined'&&editing?editing.id:null;
    const r=editingId?await sb.from('orders').update(p).eq('id',editingId).select().single():await sb.from('orders').insert(p).select().single();
    if(r.error){cloud('Erro ao salvar',false);return toast(r.error.message)}
    if(editingId){const dr=await sb.from('order_items').delete().eq('order_id',editingId);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}}
    const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:r.data.id})));
    if(ir.error){cloud('Erro ao salvar',false);return toast('Lançamento salvo, mas os itens falharam: '+ir.error.message)}
    if(typeof saveCatalog==='function')await saveCatalog(a);
    if(typeof editing!=='undefined')editing=null;
    if(typeof clearOrder==='function')clearOrder();
    await loadData();toast('Lançamento salvo na nuvem');
  }

  async function saveEdit(e){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const id=window.__freteEditId;if(!id||typeof company==='undefined'||!company)return;
    const a=editItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');
    const old=(typeof orders!=='undefined'?orders:[]).find(x=>x.id===id);if(!old)return;
    cloud('Salvando...');
    let c=clients.find(x=>x.name.toLowerCase()===$('fixClient').value.trim().toLowerCase());
    if(!c&&$('fixClient').value.trim()){
      const cr=await sb.from('clients').insert({company_id:company.id,name:$('fixClient').value.trim()}).select().single();
      if(cr.error){cloud('Erro ao salvar',false);return toast(cr.error.message)}c=cr.data;clients.unshift(c);
    }
    const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),freight=a.reduce((s,x)=>s+x.freight_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);
    const p={company_id:company.id,client_id:c?.id||old.client_id||null,entry_date:$('fixEntry').value,exit_date:$('fixExit').value||null,client_name:$('fixClient').value.trim(),vehicle_make_model:$('fixVehicle').value.trim(),plate:$('fixPlate').value.trim(),pedido:$('fixPedido').value.trim(),payment_status:$('fixPayment').value,total_sale:sale,total_cost:cost,total_freight:freight,total_tax:tax,net_profit:sale-cost-freight-tax};
    const r=await sb.from('orders').update(p).eq('id',id).select().single();if(r.error){cloud('Erro ao salvar',false);return toast(r.error.message)}
    const dr=await sb.from('order_items').delete().eq('order_id',id);if(dr.error){cloud('Erro ao salvar',false);return toast(dr.error.message)}
    const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:id})));if(ir.error){cloud('Erro ao salvar',false);return toast('Serviço salvo, mas os itens falharam: '+ir.error.message)}
    if(typeof saveCatalog==='function')await saveCatalog(a);
    $('orderFixModal').classList.add('hidden');window.__freteEditId=null;await loadData();toast('Lançamento atualizado');
  }

  function bind(){
    installCss();ensureMainHeader();decorateMainRows();
    const form=$('order');if(form&&!form.dataset.freteCleanBound){form.dataset.freteCleanBound='1';form.addEventListener('submit',saveMain,true)}
    const editForm=$('fixEditForm');if(editForm&&!editForm.dataset.freteCleanBound){editForm.dataset.freteCleanBound='1';editForm.addEventListener('submit',saveEdit,true)}
    const add=$('add');if(add&&!add.dataset.freteCleanBound){add.dataset.freteCleanBound='1';add.addEventListener('click',()=>setTimeout(decorateMainRows,0))}
    const fixAdd=$('fixAdd');if(fixAdd&&!fixAdd.dataset.freteCleanBound){fixAdd.dataset.freteCleanBound='1';fixAdd.addEventListener('click',()=>setTimeout(decorateEdit,0))}
    document.querySelectorAll('#launchList [data-edit],#allServicesList [data-edit]').forEach(b=>{
      if(b.dataset.freteEditBound)return;b.dataset.freteEditBound='1';b.addEventListener('click',()=>{window.__freteEditId=b.dataset.edit;setTimeout(decorateEdit,80)},true);
    });
    const modal=$('orderFixModal');if(modal&&modal.classList.contains('hidden')===false)decorateEdit();
  }

  installCss();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  const obs=new MutationObserver(()=>{clearTimeout(window.__freteTimer);window.__freteTimer=setTimeout(bind,20)});
  obs.observe(document.body,{childList:true,subtree:true});
})();

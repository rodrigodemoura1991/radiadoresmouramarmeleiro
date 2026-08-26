/* Editor de lançamentos — captura robusta do ID e salvamento no Supabase. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const num=v=>{let s=String(v??'').replace('R$','').replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)||0};
  let busy=false;

  function setId(id){
    if(!id)return null;
    const value=String(id);
    window.__freteEditId=value;
    const modal=$('orderFixModal');
    const form=$('fixEditForm');
    if(modal)modal.dataset.orderId=value;
    if(form)form.dataset.orderId=value;
    return value;
  }

  function captureFromElement(el){
    if(!el)return null;
    const node=el.closest('[data-order-id],[data-id],[data-edit],.launch,.service-card,.grouped-service');
    if(!node)return null;
    const id=node.dataset.orderId||node.dataset.id||node.dataset.edit;
    return id?setId(id):null;
  }

  function wrapEditOrder(){
    if(typeof window.editOrder!=='function'||window.editOrder.__idCaptureWrapped)return;
    const original=window.editOrder;
    const wrapped=function(id){
      setId(id);
      const result=original.apply(this,arguments);
      setTimeout(()=>setId(id),20);
      setTimeout(()=>setId(id),100);
      return result;
    };
    wrapped.__idCaptureWrapped=true;
    window.editOrder=wrapped;
  }

  function currentId(){
    const modal=$('orderFixModal'),form=$('fixEditForm');
    const fromEditing=(typeof editing!=='undefined'&&editing)?editing.id:null;
    return window.__freteEditId||modal?.dataset.orderId||form?.dataset.orderId||fromEditing||null;
  }

  function items(){
    return [...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({
      description:r.querySelector('.fd')?.value.trim()||'',
      sale_value:num(r.querySelector('.fs')?.value),
      cost_value:num(r.querySelector('.fc')?.value),
      freight_value:num(r.querySelector('.freight-field')?.value),
      tax_rate:Number(r.querySelector('.ft')?.value)||0,
      service_status:r.querySelector('.fst')?.value||'Liberado'
    })).filter(x=>x.description||x.sale_value||x.cost_value||x.freight_value);
  }

  async function save(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
    if(busy)return;
    const id=currentId();
    if(!id||typeof company==='undefined'||!company){toast('Nenhum lançamento selecionado. Abra novamente pelo botão Editar.');return;}
    const a=items();
    if(!a.length){toast('Adicione pelo menos um serviço ou produto.');return;}
    const old=(typeof orders!=='undefined'?orders:[]).find(x=>String(x.id)===String(id));
    if(!old){toast('Lançamento não encontrado. Atualize a página e tente novamente.');return;}
    busy=true;cloud('Salvando alterações...');
    try{
      const clientName=$('fixClient')?.value.trim()||old.client_name||'';
      let c=(typeof clients!=='undefined'?clients:[]).find(x=>String(x.name||'').toLowerCase()===clientName.toLowerCase());
      if(!c&&clientName){
        const cr=await sb.from('clients').insert({company_id:company.id,name:clientName}).select().single();
        if(cr.error)throw new Error('Erro ao salvar cliente: '+cr.error.message);
        c=cr.data;clients.unshift(c);
      }
      const sale=a.reduce((t,x)=>t+x.sale_value,0),cost=a.reduce((t,x)=>t+x.cost_value,0),freight=a.reduce((t,x)=>t+x.freight_value,0),tax=a.reduce((t,x)=>t+x.sale_value*x.tax_rate/100,0);
      const p={company_id:company.id,client_id:c?.id||old.client_id||null,entry_date:$('fixEntry')?.value||null,exit_date:$('fixExit')?.value||null,client_name:clientName,vehicle_make_model:$('fixVehicle')?.value.trim()||'',plate:$('fixPlate')?.value.trim()||'',pedido:$('fixPedido')?.value.trim()||'',payment_status:($('fixPayment')?.value||'').trim()||null,total_sale:sale,total_cost:cost,total_freight:freight,total_tax:tax,net_profit:sale-cost-freight-tax};
      const r=await sb.from('orders').update(p).eq('id',id).select().single();
      if(r.error)throw new Error('Erro ao atualizar lançamento: '+r.error.message);
      const dr=await sb.from('order_items').delete().eq('order_id',id);
      if(dr.error)throw new Error('Erro ao atualizar serviços: '+dr.error.message);
      const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:id})));
      if(ir.error)throw new Error('Lançamento atualizado, mas os serviços falharam: '+ir.error.message);
      if(typeof saveCatalog==='function')await saveCatalog(a);
      $('orderFixModal')?.classList.add('hidden');
      window.__freteEditId=null;
      $('orderFixModal')?.removeAttribute('data-order-id');
      $('fixEditForm')?.removeAttribute('data-order-id');
      if(typeof editing!=='undefined')editing=null;
      if(typeof loadData==='function')await loadData();
      cloud('Salvo na nuvem');toast('Alterações salvas com sucesso');
    }catch(err){cloud('Erro ao salvar',false);toast(err?.message||'Não foi possível salvar as alterações.');}
    finally{busy=false;}
  }

  function bind(){
    wrapEditOrder();
    const form=$('fixEditForm');
    if(form&&!form.dataset.editSaveFix){form.dataset.editSaveFix='1';form.addEventListener('submit',save,true);}
    const modal=$('orderFixModal');
    if(modal&&!modal.dataset.editSaveFix){
      modal.dataset.editSaveFix='1';
      modal.addEventListener('click',e=>{
        const b=e.target.closest('button');
        if(!b)return;
        if((b.textContent||'').trim().toLowerCase()==='salvar alterações')save(e);
      },true);
    }
  }

  /* Captura o ID ANTES de qualquer outro handler de Editar. */
  document.addEventListener('click',e=>{
    const target=e.target.closest('button,a,[role="button"],.launch,.service-card,.grouped-service');
    if(!target)return;
    const text=(target.textContent||'').trim().toLowerCase();
    const looksEdit=text.includes('editar')||target.classList.contains('service-edit-btn')||target.classList.contains('edit-all-service')||target.dataset.edit;
    if(!looksEdit)return;
    captureFromElement(target);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  const observer=new MutationObserver(()=>{wrapEditOrder();bind();});
  observer.observe(document.body,{childList:true,subtree:true});
})();

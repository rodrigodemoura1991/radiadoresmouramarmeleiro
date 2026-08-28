/* Ações estáveis da aba Todos os Serviços. */
(function(){
  function visibleRows(){
    const q=(document.getElementById('allServicesSearch')?.value||'').toLowerCase().trim();
    const pf=document.getElementById('servicePaymentFilter')?.value||'';
    const sf=document.getElementById('serviceStatusFilter')?.value||'';
    const rows=typeof allServiceRows==='function'?allServiceRows():[];
    return rows.filter(x=>{
      const text=[x.order?.client_name,x.order?.pedido,x.description,x.order?.vehicle_make_model,x.order?.plate].join(' ').toLowerCase();
      return (!q||text.includes(q))&&(!pf||(x.order?.payment_status||'EM ABERTO')===pf)&&(!sf||x.service_status===sf);
    }).sort((a,b)=>String(b.order?.exit_date||'').localeCompare(String(a.order?.exit_date||'')));
  }

  function removeOrder(id){
    if(!id) return;
    const o=(window.orders||[]).find(x=>x.id===id);
    if(!o) return;
    if(!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return;
    (async()=>{
      if(typeof cloud==='function') cloud('Excluindo...');
      const items=await sb.from('order_items').delete().eq('order_id',id);
      if(items.error){if(typeof toast==='function')toast('Erro ao excluir serviços: '+items.error.message);if(typeof cloud==='function')cloud('Erro ao excluir',false);return}
      const order=await sb.from('orders').delete().eq('id',id);
      if(order.error){if(typeof toast==='function')toast('Erro ao excluir lançamento: '+order.error.message);if(typeof cloud==='function')cloud('Erro ao excluir',false);return}
      if(typeof loadData==='function')await loadData();
      if(typeof toast==='function')toast('Lançamento excluído com sucesso');
    })();
  }

  function openEditor(id){
    const launchNav=document.querySelector('.nav[data-view="launch"]');
    if(launchNav)launchNav.click();
    setTimeout(()=>{
      if(typeof window.editOrder==='function')window.editOrder(id);
      else if(typeof editOrder==='function')editOrder(id);
    },20);
  }

  function decorate(){
    const list=document.getElementById('allServicesList');
    if(!list)return;
    const data=visibleRows();
    list.querySelectorAll('.service-card').forEach((card,index)=>{
      const item=data[index];
      const id=card.dataset.orderId||item?.order?.id;
      if(!id)return;
      card.dataset.orderId=id;
      let actions=card.querySelector('.service-actions-v2');
      if(!actions){
        actions=document.createElement('div');
        actions.className='service-actions-v2';
        actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button><button type="button" class="service-delete-btn">Excluir</button>';
        card.appendChild(actions);
      }
      const edit=actions.querySelector('.service-edit-btn');
      const del=actions.querySelector('.service-delete-btn');
      edit.onclick=e=>{e.preventDefault();e.stopPropagation();openEditor(id)};
      del.onclick=e=>{e.preventDefault();e.stopPropagation();removeOrder(id)};
    });
  }

  function install(){
    const list=document.getElementById('allServicesList');
    if(!list)return;
    const original=window.renderAllServices;
    if(typeof original==='function'&&!original.__actionsWrapped){
      const wrapped=function(){original.apply(this,arguments);requestAnimationFrame(decorate)};
      wrapped.__actionsWrapped=true;
      window.renderAllServices=wrapped;
    }
    new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});
    decorate();
  }

  window.removeServiceOrder=removeOrder;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

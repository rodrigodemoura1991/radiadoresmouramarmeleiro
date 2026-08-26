/* Ações estáveis da aba Todos os Serviços.
   Não altera os dados do Supabase; apenas adiciona uma camada de UI para editar/excluir. */
(function(){
  function getRows(){
    if(typeof allServiceRows!=='function') return [];
    return allServiceRows().slice().sort((a,b)=>String(b.order?.exit_date||'').localeCompare(String(a.order?.exit_date||'')));
  }

  async function removeOrder(id){
    if(!id) return;
    const o=(window.orders||[]).find(x=>x.id===id);
    if(!o) return;
    if(!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return;
    if(typeof cloud==='function') cloud('Excluindo...');
    const items=await sb.from('order_items').delete().eq('order_id',id);
    if(items.error){ if(typeof toast==='function') toast('Erro ao excluir serviços: '+items.error.message); if(typeof cloud==='function') cloud('Erro ao excluir',false); return; }
    const order=await sb.from('orders').delete().eq('id',id);
    if(order.error){ if(typeof toast==='function') toast('Erro ao excluir lançamento: '+order.error.message); if(typeof cloud==='function') cloud('Erro ao excluir',false); return; }
    if(typeof loadData==='function') await loadData();
    if(typeof toast==='function') toast('Lançamento excluído com sucesso');
  }

  function decorate(){
    const list=document.getElementById('allServicesList');
    if(!list) return;
    const cards=[...list.querySelectorAll('.service-card')];
    if(!cards.length) return;
    const rows=getRows();

    cards.forEach((card,index)=>{
      const item=rows[index];
      if(!item?.order?.id) return;

      card.dataset.orderId=item.order.id;
      card.dataset.serviceId=item.id||'';

      let actions=card.querySelector('.service-actions-v2');
      if(actions){
        actions.querySelector('.service-edit-btn')?.replaceWith(actions.querySelector('.service-edit-btn')?.cloneNode(true));
        actions.querySelector('.service-delete-btn')?.replaceWith(actions.querySelector('.service-delete-btn')?.cloneNode(true));
      } else {
        actions=document.createElement('div');
        actions.className='service-actions-v2';
        actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button><button type="button" class="service-delete-btn">Excluir</button>';
        card.appendChild(actions);
      }

      const edit=actions.querySelector('.service-edit-btn');
      const del=actions.querySelector('.service-delete-btn');
      if(edit) edit.onclick=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        if(typeof window.editOrder==='function') window.editOrder(item.order.id);
        else if(typeof editOrder==='function') editOrder(item.order.id);
      };
      if(del) del.onclick=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        removeOrder(item.order.id);
      };
    });
  }

  function install(){
    const list=document.getElementById('allServicesList');
    if(!list) return;
    const original=window.renderAllServices;
    if(typeof original==='function' && !original.__actionsWrapped){
      const wrapped=function(){
        original.apply(this,arguments);
        requestAnimationFrame(decorate);
      };
      wrapped.__actionsWrapped=true;
      window.renderAllServices=wrapped;
    }
    const observer=new MutationObserver(()=>requestAnimationFrame(decorate));
    observer.observe(list,{childList:true,subtree:true});
    decorate();
  }

  window.removeServiceOrder=removeOrder;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

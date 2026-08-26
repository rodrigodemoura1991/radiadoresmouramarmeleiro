/* Ações da aba Todos os Serviços */
(function(){
  function rows(){
    return (typeof allServiceRows==='function'?allServiceRows():[]).slice().sort((a,b)=>String(b.order?.exit_date||'').localeCompare(String(a.order?.exit_date||'')));
  }
  async function removeOrder(id){
    if(!id) return;
    const o=(window.orders||[]).find(x=>x.id===id);
    if(!o) return;
    if(!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return;
    if(typeof cloud==='function') cloud('Excluindo...');
    const a=await sb.from('order_items').delete().eq('order_id',id);
    if(a.error){ if(typeof toast==='function') toast('Erro ao excluir itens: '+a.error.message); return; }
    const r=await sb.from('orders').delete().eq('id',id);
    if(r.error){ if(typeof toast==='function') toast('Erro ao excluir lançamento: '+r.error.message); return; }
    if(typeof loadData==='function') await loadData();
    if(typeof toast==='function') toast('Lançamento excluído');
  }
  function addActions(){
    const list=document.getElementById('allServicesList'); if(!list) return;
    const cards=[...list.querySelectorAll('.service-card')]; if(!cards.length) return;
    const data=rows();
    cards.forEach((card,i)=>{
      if(card.querySelector('.service-actions')) return;
      const item=data[i]; if(!item?.order?.id) return;
      const box=document.createElement('div'); box.className='service-actions';
      box.style.cssText='display:flex;gap:6px;margin-top:8px;justify-content:flex-end';
      const edit=document.createElement('button'); edit.type='button'; edit.className='btn'; edit.textContent='✎ Editar';
      const del=document.createElement('button'); del.type='button'; del.className='btn'; del.textContent='Excluir';
      edit.onclick=(e)=>{e.stopPropagation(); if(typeof editOrder==='function') editOrder(item.order.id);};
      del.onclick=(e)=>{e.stopPropagation(); removeOrder(item.order.id);};
      box.append(edit,del); card.appendChild(box);
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const list=document.getElementById('allServicesList');
    if(!list) return;
    new MutationObserver(addActions).observe(list,{childList:true,subtree:true});
    addActions();
  });
  window.addServiceActions=addActions;
})();

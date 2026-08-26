/* Ajustes visuais dos cartões de lançamentos e da página Todos os Serviços. */
(function(){
  function applyLaunches(){
    const list=document.getElementById('launchList');
    if(!list)return;
    list.querySelectorAll('.launch').forEach(card=>{
      const id=card.dataset.id;
      const order=(typeof orders!=='undefined'?orders:[]).find(o=>o.id===id);
      const open=order&&String(order.payment_status||'').trim().toUpperCase()==='EM ABERTO';
      card.classList.toggle('payment-open',!!open);
      card.querySelectorAll('.chip').forEach(chip=>{
        if(chip.textContent.trim().startsWith('★'))chip.textContent=chip.textContent.trim().replace(/^★\s*/,'');
      });
    });
  }
  function ensureServicesCss(){
    if(document.getElementById('todos-servicos-ui-css'))return;
    const link=document.createElement('link');link.id='todos-servicos-ui-css';link.rel='stylesheet';link.href='css/todos-servicos-ui.css?v=20260826-1130';document.head.appendChild(link);
  }
  function removeOrder(id){
    if(!id)return;
    const o=(typeof orders!=='undefined'?orders:[]).find(x=>x.id===id);
    if(!o||!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.'))return;
    (async()=>{
      cloud('Excluindo...');
      const a=await sb.from('order_items').delete().eq('order_id',id);
      if(a.error){toast('Erro ao excluir serviços: '+a.error.message);cloud('Erro ao excluir',false);return}
      const r=await sb.from('orders').delete().eq('id',id);
      if(r.error){toast('Erro ao excluir lançamento: '+r.error.message);cloud('Erro ao excluir',false);return}
      await loadData();toast('Lançamento excluído com sucesso');
    })();
  }
  function editOrderFromServices(id){
    document.querySelector('.nav[data-view="launch"]')?.click();
    setTimeout(()=>{if(typeof window.editOrder==='function')window.editOrder(id)},20);
  }
  function addActions(){
    const list=document.getElementById('allServicesList');if(!list)return;
    list.querySelectorAll('.grouped-service').forEach(card=>{
      const id=card.dataset.orderId;if(!id)return;
      let actions=card.querySelector('.service-actions-v2');
      if(!actions){actions=document.createElement('div');actions.className='service-actions-v2';actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button><button type="button" class="service-delete-btn">Excluir</button>';card.appendChild(actions)}
      actions.querySelector('.service-edit-btn').onclick=e=>{e.preventDefault();e.stopPropagation();editOrderFromServices(id)};
      actions.querySelector('.service-delete-btn').onclick=e=>{e.preventDefault();e.stopPropagation();removeOrder(id)};
    });
  }
  function renderGroupedServices(){
    const list=document.getElementById('allServicesList');if(!list||typeof allServiceRows!=='function')return;
    const q=(document.getElementById('allServicesSearch')?.value||'').toLowerCase().trim();
    const pf=document.getElementById('servicePaymentFilter')?.value||'';const sf=document.getElementById('serviceStatusFilter')?.value||'';const groups=new Map();
    allServiceRows().forEach(x=>{
      const o=x.order||{};const text=[o.client_name,o.pedido,o.vehicle_make_model,o.plate,x.description].join(' ').toLowerCase();const payment=o.payment_status||'EM ABERTO';
      if(q&&!text.includes(q))return;if(pf&&payment!==pf)return;if(sf&&x.service_status!==sf)return;
      if(!groups.has(o.id))groups.set(o.id,{order:o,items:[]});groups.get(o.id).items.push(x);
    });
    const grouped=[...groups.values()].sort((a,b)=>String(b.order.exit_date||'').localeCompare(String(a.order.exit_date||'')));
    list.innerHTML=grouped.map(g=>{
      const o=g.order,pay=o.payment_status||'EM ABERTO',open=pay==='EM ABERTO';const statusClass=slug(g.items[0]?.service_status||'Liberado');
      return `<article class="service-card launch grouped-service ${statusClass} ${open?'payment-pending':'payment-'+slug(pay)}" data-order-id="${esc(o.id)}">
        <div class="grouped-top"><div class="grouped-date"><b>${esc(o.exit_date||'—')}</b><small>Entrada ${esc(o.entry_date||'—')}</small></div><div class="grouped-main"><div class="lname">${esc(o.client_name||'Sem cliente')}</div><div class="meta">Pedido ${esc(o.pedido||'—')}${o.vehicle_make_model?' • '+esc(o.vehicle_make_model):''}${o.plate?' • '+esc(o.plate):''}</div></div><b class="grouped-total">${money(o.total_sale)}</b></div>
        <div class="grouped-items">${g.items.map(i=>`<div class="grouped-item ${slug(i.service_status)}"><span>${esc(i.description||'Sem descrição')} • ${money(i.sale_value)}</span><b>${esc(i.service_status||'—')}</b></div>`).join('')}</div>
        <div class="grouped-payment"><span class="payment-badge">${esc(pay)}</span></div>
      </article>`;
    }).join('')||'<div class="empty">Nenhum serviço encontrado.</div>';
    requestAnimationFrame(addActions);
  }
  function install(){
    ensureServicesCss();applyLaunches();
    const launchList=document.getElementById('launchList');if(launchList)new MutationObserver(()=>requestAnimationFrame(applyLaunches)).observe(launchList,{childList:true,subtree:true});
    const serviceList=document.getElementById('allServicesList');if(serviceList)new MutationObserver(()=>requestAnimationFrame(addActions)).observe(serviceList,{childList:true,subtree:true});
    window.renderAllServices=renderGroupedServices;renderGroupedServices();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

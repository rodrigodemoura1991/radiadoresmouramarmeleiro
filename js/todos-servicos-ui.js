/* Todos os Serviços: visual agrupado por lançamento, igual aos Lançamentos recentes. */
(function(){
  function renderGrouped(){
    const list=document.getElementById('allServicesList');
    if(!list || typeof allServiceRows!=='function') return;

    const q=(document.getElementById('allServicesSearch')?.value||'').toLowerCase().trim();
    const pf=document.getElementById('servicePaymentFilter')?.value||'';
    const sf=document.getElementById('serviceStatusFilter')?.value||'';
    const rows=allServiceRows();
    const groups=new Map();

    rows.forEach(x=>{
      const o=x.order||{};
      const text=[o.client_name,o.pedido,o.vehicle_make_model,o.plate,x.description].join(' ').toLowerCase();
      const payment=o.payment_status||'EM ABERTO';
      if(q && !text.includes(q)) return;
      if(pf && payment!==pf) return;
      if(sf && x.service_status!==sf) return;
      if(!groups.has(o.id)) groups.set(o.id,{order:o,items:[]});
      groups.get(o.id).items.push(x);
    });

    const grouped=[...groups.values()].sort((a,b)=>String(b.order.exit_date||'').localeCompare(String(a.order.exit_date||'')));

    list.innerHTML=grouped.map(g=>{
      const o=g.order;
      const pay=o.payment_status||'EM ABERTO';
      const open=pay==='EM ABERTO';
      const firstStatus=g.items[0]?.service_status||'Liberado';
      const statusClass=slug(firstStatus);
      const sale=Number(o.total_sale||0);
      return `<article class="service-card launch grouped-service ${statusClass} ${open?'payment-pending':'payment-'+slug(pay)}" data-order-id="${esc(o.id)}">
        <div class="grouped-top">
          <div class="grouped-date"><b>${esc(o.exit_date||'—')}</b><small>Entrada ${esc(o.entry_date||'—')}</small></div>
          <div class="grouped-main"><div class="lname">${esc(o.client_name||'Sem cliente')} ${open?'<span class="grouped-star-inside">★</span>':''}</div><div class="meta">Pedido ${esc(o.pedido||'—')}${o.vehicle_make_model?' • '+esc(o.vehicle_make_model):''}${o.plate?' • '+esc(o.plate):''}</div></div>
          <b class="grouped-total">${money(sale)}</b>
        </div>
        <div class="grouped-items">${g.items.map(i=>`<div class="grouped-item ${slug(i.service_status)}"><span>${esc(i.description||'Sem descrição')} • ${money(i.sale_value)}</span><b>${esc(i.service_status||'—')}</b></div>`).join('')}</div>
        <div class="grouped-payment"><span class="payment-badge">${esc(pay)}</span></div>
      </article>`;
    }).join('')||'<div class="empty">Nenhum serviço encontrado.</div>';
  }

  window.renderAllServices=renderGrouped;
  window.renderGroupedAllServices=renderGrouped;
  if(document.readyState!=='loading') renderGrouped();
  else document.addEventListener('DOMContentLoaded',renderGrouped,{once:true});
})();

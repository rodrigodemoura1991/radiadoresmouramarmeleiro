/* Renderização estável da aba Todos os Serviços. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=s=>String(s??'').toLowerCase().trim();
  function rows(){
    const os=Array.isArray(window.orders)?window.orders:[];
    return os.flatMap(o=>(Array.isArray(o.order_items)&&o.order_items.length?o.order_items:[{description:'Lançamento',sale_value:o.total_sale||0,cost_value:o.total_cost||0,tax_rate:0,service_status:'Liberado'}]).map(i=>({order:o,description:i.description||'Lançamento',sale_value:Number(i.sale_value)||0,cost_value:Number(i.cost_value)||0,tax_rate:Number(i.tax_rate)||0,service_status:i.service_status||'Liberado'})));
  }
  window.allServiceRows=rows;
  function filtered(){
    const q=norm($('allServicesSearch')?.value),pf=$('servicePaymentFilter')?.value||'',sf=$('serviceStatusFilter')?.value||'';
    return rows().filter(x=>{const o=x.order,text=norm([o.client_name,o.pedido,x.description,o.vehicle_make_model,o.plate].join(' '));return(!q||text.includes(q))&&(!pf||(o.payment_status||'EM ABERTO')===pf)&&(!sf||x.service_status===sf)}).sort((a,b)=>String(b.order.exit_date||'').localeCompare(String(a.order.exit_date||'')));
  }
  function render(){
    const list=$('allServicesList');if(!list)return;
    const data=filtered();
    if(!data.length){list.innerHTML='<div class="empty">Nenhum serviço encontrado.</div>';return;}
    const grouped=new Map();data.forEach(x=>{const id=x.order.id;if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(x)});
    list.innerHTML=[...grouped.values()].map(items=>{const o=items[0].order,noExit=!o.exit_date,pay=o.payment_status||'EM ABERTO';return `<article class="service-card ${noExit?'no-exit-date':''}" data-order-id="${o.id}"><div class="service-main"><div><b>${esc(o.client_name||'Sem cliente')}</b><small>${esc(o.vehicle_make_model||'')}${o.plate?' • '+esc(o.plate):''}${o.pedido?' • Pedido '+esc(o.pedido):''}</small></div><div class="service-date"><b>${o.exit_date?'Saída '+esc(o.exit_date):'Sem data de saída'}</b></div></div><div class="service-items">${items.map(i=>`<div class="service-item"><span class="service-desc">${esc(i.description)}</span><span class="service-values"><b>${money(i.sale_value)}</b><span>${esc(i.service_status)}</span></span></div>`).join('')}</div><div class="service-footer"><span class="payment-badge">${esc(pay)}</span><button type="button" class="service-edit-btn" data-edit="${o.id}">Editar</button></div></article>`}).join('');
  }
  window.renderAllServices=render;
  function bind(){
    ['allServicesSearch','servicePaymentFilter','serviceStatusFilter'].forEach(id=>$(id)?.addEventListener($(id)?.tagName==='SELECT'?'change':'input',render));
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

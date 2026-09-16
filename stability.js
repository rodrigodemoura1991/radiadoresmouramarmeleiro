/* Camada de estabilidade + renderização da aba Todos os Serviços. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s??'').toLowerCase().trim();
window.addEventListener('error',e=>console.error('[Radiadores Moura]',e.error||e.message));
window.addEventListener('unhandledrejection',e=>console.error('[Radiadores Moura]',e.reason));

/* Evita duplo salvamento. */
const order=$('order');
if(order&&typeof order.onsubmit==='function'){
 const original=order.onsubmit;
 order.onsubmit=async function(ev){
  if(order.dataset.saving==='1'){ev.preventDefault();return;}
  order.dataset.saving='1';
  const bs=[...order.querySelectorAll('button[type="submit"],button:not([type])')];
  bs.forEach(b=>{if(!b.dataset.oldText)b.dataset.oldText=b.textContent;b.disabled=true;});
  try{return await original.call(this,ev);}finally{order.dataset.saving='0';bs.forEach(b=>{b.disabled=false;if(b.dataset.oldText)b.textContent=b.dataset.oldText;});}
 };
}

/* Lançamentos sem saída ficam verdes. */
function noExitStyles(){
 if($('no-exit-date-css'))return;
 const s=document.createElement('style');s.id='no-exit-date-css';s.textContent=`
 #launchList .launch.no-exit-date,#allServicesList .service-card.no-exit-date{background:#dff7e8!important;background-color:#dff7e8!important;border-color:#9edbb5!important;color:#174b2a!important}
 #launchList .launch.no-exit-date .lname,#launchList .launch.no-exit-date .meta,#launchList .launch.no-exit-date .launch-values>b,#launchList .launch.no-exit-date .launch-values>span,#launchList .launch.no-exit-date .launch-values>em,#allServicesList .service-card.no-exit-date *{color:#174b2a!important;-webkit-text-fill-color:#174b2a!important}
 #launchList .launch.no-exit-date .chip{background:#c8efd6!important;border-color:#a9dfbd!important;color:#174b2a!important}
 `;document.head.appendChild(s);
}
function decorateNoExit(){
 noExitStyles();const data=Array.isArray(window.orders)?window.orders:[];
 document.querySelectorAll('#launchList .launch').forEach(c=>{const o=data.find(x=>String(x.id)===String(c.dataset.id));if(o)c.classList.toggle('no-exit-date',!o.exit_date);});
 document.querySelectorAll('#allServicesList .service-card').forEach(c=>{const o=data.find(x=>String(x.id)===String(c.dataset.orderId||c.dataset.id));if(o)c.classList.toggle('no-exit-date',!o.exit_date);});
}

/* Fonte única da aba Serviços: os mesmos orders/order_items carregados pelo app. */
function serviceRows(){
 const data=Array.isArray(window.orders)?window.orders:[];const out=[];
 data.forEach(o=>{
  const items=Array.isArray(o.order_items)&&o.order_items.length?o.order_items:[{description:'Lançamento',sale_value:o.total_sale||0,cost_value:o.total_cost||0,service_status:'Liberado'}];
  items.forEach(i=>out.push({order:o,item:i,payment:String(o.payment_status||'EM ABERTO').trim(),status:String(i.service_status||'Liberado').trim()}));
 });
 return out;
}
window.allServiceRows=serviceRows;
function renderServices(){
 const list=$('allServicesList');if(!list)return;
 const q=norm($('allServicesSearch')?.value),pf=$('servicePaymentFilter')?.value||'',sf=$('serviceStatusFilter')?.value||'';
 const rows=serviceRows().filter(r=>{const o=r.order,i=r.item,text=norm([o.client_name,o.pedido,i.description,o.vehicle_make_model,o.plate].join(' '));return(!q||text.includes(q))&&(!pf||r.payment===pf)&&(!sf||r.status===sf)}).sort((a,b)=>String(b.order.exit_date||b.order.entry_date||'').localeCompare(String(a.order.exit_date||a.order.entry_date||'')));
 if(!rows.length){list.innerHTML='<div class="empty">Nenhum serviço encontrado.</div>';decorateNoExit();return;}
 list.innerHTML=rows.map(r=>{const o=r.order,i=r.item,noExit=!o.exit_date;return `<article class="service-card ${noExit?'no-exit-date':''}" data-order-id="${esc(o.id)}"><div class="service-date"><small>Entrega</small><b>${o.exit_date?esc(o.exit_date.split('-').reverse().join('/')):'Sem data de saída'}</b></div><div class="service-main"><b>${esc(o.client_name||'Sem cliente')}</b><small>${o.pedido?'Pedido '+esc(o.pedido)+' • ':''}${esc(o.vehicle_make_model||'')}${o.plate?' • '+esc(o.plate):''}</small><div class="service-desc">${esc(i.description||'Sem descrição')}</div></div><div class="service-values"><b>${money(i.sale_value)}</b><span>Custo ${money(i.cost_value)}</span></div><div class="service-footer"><span class="payment-badge">${esc(r.payment)}</span><span class="service-status-badge">${esc(r.status)}</span><button type="button" class="service-edit-btn" data-edit="${esc(o.id)}">Editar</button></div></article>`}).join('');
 decorateNoExit();
}
window.renderAllServices=renderServices;
function installServices(){
 noExitStyles();
 ['allServicesSearch','servicePaymentFilter','serviceStatusFilter'].forEach(id=>{const el=$(id);if(!el||el.dataset.servicesBound==='1')return;el.dataset.servicesBound='1';el.addEventListener(el.tagName==='SELECT'?'change':'input',renderServices);});
 document.querySelectorAll('.nav[data-view="services"]').forEach(b=>{if(b.dataset.servicesNavBound==='1')return;b.dataset.servicesNavBound='1';b.addEventListener('click',()=>setTimeout(renderServices,50));});
 renderServices();
}
function boot(){installServices();setTimeout(installServices,300);setTimeout(installServices,1000);setTimeout(installServices,2000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

/* Depois do carregamento do Supabase, atualiza automaticamente a lista. */
let lastOrdersRef=null;
setInterval(()=>{if(window.orders!==lastOrdersRef){lastOrdersRef=window.orders;installServices();decorateNoExit();}},500);
})();

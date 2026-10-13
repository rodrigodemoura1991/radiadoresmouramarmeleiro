/* Camada de estabilidade + renderização da aba Todos os Serviços. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s??'').toLowerCase().trim();
window.addEventListener('error',e=>console.error('[Radiadores Moura]',e.error||e.message));
window.addEventListener('unhandledrejection',e=>console.error('[Radiadores Moura]',e.reason));

/* Evita que o navegador preencha o campo de pesquisa de Serviços com o e-mail da conta. */
function clearServiceSearchAutofill(){
 const el=$('allServicesSearch');
 if(!el)return;
 el.setAttribute('autocomplete','off');
 el.setAttribute('name','service-search');
 const value=String(el.value||'').trim();
 if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){
  el.value='';
  el.dispatchEvent(new Event('input',{bubbles:true}));
 }
}

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
 clearServiceSearchAutofill();
 const list=$('allServicesList');if(!list)return;
 const q=norm($('allServicesSearch')?.value),pf=$('servicePaymentFilter')?.value||'',sf=$('serviceStatusFilter')?.value||'';
 const rows=serviceRows().filter(r=>{const o=r.order,i=r.item,text=norm([o.client_name,o.pedido,o.numero_lancamento,i.description,o.vehicle_make_model,o.plate].join(' '));return(!q||text.includes(q))&&(!pf||r.payment===pf)&&(!sf||r.status===sf)});
 const groups=new Map();
 rows.forEach(r=>{const o=r.order;const os=String(o.numero_lancamento??'').trim();const key=os?'os:'+os:'record:'+String(o.id);if(!groups.has(key))groups.set(key,{os,rows:[]});groups.get(key).rows.push(r)});
 const groupList=[...groups.values()].map(g=>{g.rows.sort((a,b)=>String(b.order.exit_date||b.order.entry_date||'').localeCompare(String(a.order.exit_date||a.order.entry_date||'')));const dates=g.rows.map(r=>String(r.order.exit_date||'').slice(0,10)).filter(Boolean).sort().reverse();g.date=dates[0]||'';return g}).sort((a,b)=>b.date.localeCompare(a.date));
 const dateText=v=>{if(!v)return 'Sem data de saída';const p=String(v).slice(0,10).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:v};
 const cssId='services-os-group-style';if(!$(cssId)){const style=document.createElement('style');style.id=cssId;style.textContent=`#allServicesList .os-group-card{display:block;background:#fff;border:1px solid #dce5f0;border-left:5px solid #173b67;border-radius:13px;padding:14px;margin-bottom:11px;box-shadow:0 4px 14px rgba(25,48,78,.06)}#allServicesList .os-group-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid #e7edf5}#allServicesList .os-group-number{display:inline-flex;padding:6px 10px;border-radius:8px;background:#173b67;color:#fff;font-size:13px;font-weight:900}#allServicesList .os-group-meta{display:flex;flex:1;flex-direction:column;gap:3px;color:#1b304d;font-size:12px}#allServicesList .os-group-meta small{color:#71839a;font-size:10px}#allServicesList .os-group-totals{display:flex;gap:14px;flex-wrap:wrap}#allServicesList .os-group-totals span{display:flex;flex-direction:column;gap:3px;color:#70819a;font-size:10px}#allServicesList .os-group-totals b{font-size:13px;color:#172b46}#allServicesList .os-launch-record{margin-top:9px;border:1px solid #e2e9f2;border-radius:9px;padding:10px;background:#f9fbfe}#allServicesList .os-launch-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#allServicesList .os-launch-client{display:flex;flex:1;min-width:180px;flex-direction:column;gap:3px;color:#203957;font-size:12px}#allServicesList .os-launch-client small{color:#71839a;font-size:10px}#allServicesList .os-launch-items{display:grid;gap:5px;margin-top:8px}#allServicesList .os-launch-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:7px 9px;border-radius:7px;background:#fff;border:1px solid #e5ebf3}#allServicesList .os-launch-item .desc{font-size:12px;font-weight:800;color:#243d5d;overflow-wrap:anywhere}#allServicesList .os-launch-item .amount{font-size:11px;font-weight:900;color:#172b46;white-space:nowrap}#allServicesList .os-launch-item .status{font-size:9px;font-weight:900;color:#087249;background:#e6f6ed;border-radius:5px;padding:4px 6px}#allServicesList .os-edit{border:0;border-radius:7px;padding:7px 11px;background:#172b46;color:#fff;font-weight:800;cursor:pointer}#allServicesList .os-launch-record.no-exit-date{background:#effbf3;border-color:#b8e4c7}@media(max-width:600px){#allServicesList .os-launch-item{grid-template-columns:minmax(0,1fr) auto}#allServicesList .os-launch-item .status{grid-column:1/-1;justify-self:start}}`;document.head.appendChild(style)}
 if(!groupList.length){list.innerHTML='<div class="empty">Nenhum serviço encontrado.</div>';decorateNoExit();return;}
 list.innerHTML=groupList.map(g=>{
  const ordersById=new Map();g.rows.forEach(r=>{const id=String(r.order.id);if(!ordersById.has(id))ordersById.set(id,{order:r.order,rows:[]});ordersById.get(id).rows.push(r)});
  const records=[...ordersById.values()];const clients=[...new Set(records.map(x=>String(x.order.client_name||'Sem cliente')))];const vehicles=[...new Set(records.map(x=>[x.order.vehicle_make_model,x.order.plate].filter(Boolean).join(' • ')).filter(Boolean))];
  const totalSale=g.rows.reduce((n,r)=>n+Number(r.item.sale_value||0),0);const totalProfit=g.rows.reduce((n,r)=>n+Number(r.item.sale_value||0)-Number(r.item.cost_value||0)-Number(r.item.freight_value||0)-Number(r.item.sale_value||0)*Number(r.item.tax_rate||0)/100,0);
  const recordHtml=records.map(({order:o,rows:items})=>{const noExit=!o.exit_date;const note=String(o.notes||'').trim();return `<section class="os-launch-record ${noExit?'no-exit-date':''}" data-order-id="${esc(o.id)}"><div class="os-launch-head"><div class="os-launch-client"><b>${esc(o.client_name||'Sem cliente')}</b><small>${esc([o.pedido?'Pedido '+o.pedido:'',o.vehicle_make_model||'',o.plate||''].filter(Boolean).join(' • '))}</small><small>Entrada ${esc(dateText(o.entry_date))} · ${esc(o.exit_date?'Saída '+dateText(o.exit_date):'Serviço ainda não entregue')}</small></div><span class="payment-badge">${esc(o.payment_status||'EM ABERTO')}</span><button type="button" class="os-edit" data-edit="${esc(o.id)}">Editar</button></div><div class="os-launch-items">${items.map(r=>`<div class="os-launch-item"><span class="desc">${esc(r.item.description||'Sem descrição')}</span><span class="amount">${money(r.item.sale_value)}</span><span class="status">${esc(r.status)}</span></div>`).join('')}</div>${note?'<div class="service-order-note"><b>Observação:</b> '+esc(note)+'</div>':''}</section>`}).join('');
  const pays=[...new Set(records.map(x=>String(x.order.payment_status||'EM ABERTO')))];const payment=pays.length===1?pays[0]:'Pagamentos variados';
  return `<article class="os-group-card"><div class="os-group-head"><span class="os-group-number">${g.os?'OS '+esc(g.os):'OS não informada'}</span><div class="os-group-meta"><b>${esc(clients.join(' / '))}</b><small>${esc(vehicles.join(' / '))}</small><small>${records.length} lançamento(s) · ${g.rows.length} serviço(s) · ${esc(payment)}</small></div><div class="os-group-totals"><span>Venda total<b>${money(totalSale)}</b></span><span>Lucro líquido<b>${money(totalProfit)}</b></span></div></div>${recordHtml}</article>`;
 }).join('');
 list.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const id=button.dataset.edit;if(typeof window.editOrder==='function')window.editOrder(id);else if(typeof editOrder==='function')editOrder(id)}));
 decorateNoExit();
}
window.renderAllServices=renderServices;
function installServices(){
 clearServiceSearchAutofill();
 noExitStyles();
 ['allServicesSearch','servicePaymentFilter','serviceStatusFilter'].forEach(id=>{const el=$(id);if(!el||el.dataset.servicesBound==='1')return;el.dataset.servicesBound='1';el.addEventListener(el.tagName==='SELECT'?'change':'input',renderServices);});
 document.querySelectorAll('.nav[data-view="services"]').forEach(b=>{if(b.dataset.servicesNavBound==='1')return;b.dataset.servicesNavBound='1';b.addEventListener('click',()=>setTimeout(renderServices,50));});
 renderServices();
}
function boot(){
 clearServiceSearchAutofill();
 installServices();
 setTimeout(clearServiceSearchAutofill,100);
 setTimeout(installServices,300);
 setTimeout(clearServiceSearchAutofill,600);
 setTimeout(installServices,1000);
 setTimeout(clearServiceSearchAutofill,1500);
 setTimeout(installServices,2000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

/* Depois do carregamento do Supabase, atualiza automaticamente a lista. */
let lastOrdersRef=null;
setInterval(()=>{if(window.orders!==lastOrdersRef){lastOrdersRef=window.orders;installServices();decorateNoExit();}},500);
})();

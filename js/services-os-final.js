/* Renderização final da aba Serviços agrupada por número de OS.
   Carregado por último para prevalecer sobre renderizadores antigos. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const date=s=>{if(!s)return 'Sem data';const p=String(s).slice(0,10).split('-');return p.length===3&&p[0].length===4?p[2]+'/'+p[1]+'/'+p[0]:String(s)};
let busy=false;
function getOrders(){return Array.isArray(window.orders)?window.orders:[]}
function render(){
 const list=$('allServicesList');if(!list||busy)return;
 const q=String($('allServicesSearch')?.value||'').trim().toLowerCase();
 const pf=$('servicePaymentFilter')?.value||'';
 const sf=$('serviceStatusFilter')?.value||'';
 const groups=new Map();
 getOrders().forEach(o=>{
  const items=Array.isArray(o.order_items)&&o.order_items.length?o.order_items:[{description:'Lançamento',sale_value:o.total_sale||0,cost_value:o.total_cost||0,service_status:'Liberado'}];
  const os=String(o.numero_lancamento??'').trim();
  const hay=[o.client_name,o.vehicle_make_model,o.plate,o.pedido,o.numero_lancamento,...items.map(i=>i.description)].join(' ').toLowerCase();
  if(q&&!hay.includes(q))return;
  if(pf&&(o.payment_status||'EM ABERTO')!==pf)return;
  const visible=items.filter(i=>!sf||String(i.service_status||'Liberado')===sf);
  if(!visible.length)return;
  const key=os?'os:'+os:'record:'+String(o.id);
  if(!groups.has(key))groups.set(key,{os,records:[]});
  groups.get(key).records.push({o,items:visible});
 });
 const ordered=[...groups.values()].map(g=>{const ds=g.records.map(r=>r.o.exit_date||r.o.entry_date||'').filter(Boolean).sort().reverse();g.date=ds[0]||'';return g}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 if(!ordered.length){list.innerHTML='<div class="empty">Nenhum serviço encontrado.</div>';return}
 if(!$('services-os-final-css')){
  const style=document.createElement('style');style.id='services-os-final-css';style.textContent=`
  #allServicesList .os-final-card{background:#fff;border:1px solid #dce5f0;border-left:5px solid #173b67;border-radius:13px;padding:14px;margin:0 0 12px;box-shadow:0 4px 14px #19304e0d}
  #allServicesList .os-final-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid #e7edf5;padding-bottom:10px}
  #allServicesList .os-final-badge{background:#173b67;color:white;border-radius:8px;padding:7px 10px;font-weight:900;font-size:13px;white-space:nowrap}
  #allServicesList .os-final-meta{display:flex;flex:1;min-width:180px;flex-direction:column;gap:4px;color:#1b304d;font-size:12px}
  #allServicesList .os-final-meta small{font-size:10px;color:#71839a}
  #allServicesList .os-final-total{display:flex;gap:12px;flex-wrap:wrap}
  #allServicesList .os-final-total span{display:flex;flex-direction:column;gap:3px;color:#71839a;font-size:10px}
  #allServicesList .os-final-total b{font-size:13px;color:#172b46}
  #allServicesList .os-final-record{margin-top:10px;border:1px solid #e2e9f2;border-radius:9px;padding:10px;background:#f9fbfe}
  #allServicesList .os-final-record-head{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  #allServicesList .os-final-client{display:flex;flex:1;min-width:180px;flex-direction:column;gap:3px;font-size:12px;color:#203957}
  #allServicesList .os-final-client small{font-size:10px;color:#71839a}
  #allServicesList .os-final-edit{border:0;border-radius:7px;padding:7px 11px;background:#172b46;color:#fff;font-weight:800;cursor:pointer}
  #allServicesList .os-final-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;margin-top:6px;padding:8px;border:1px solid #e5ebf3;border-radius:7px;background:white}
  #allServicesList .os-final-desc{font-size:12px;font-weight:800;color:#243d5d;overflow-wrap:anywhere}
  #allServicesList .os-final-price{font-size:11px;font-weight:900;color:#172b46;white-space:nowrap}
  #allServicesList .os-final-status{font-size:9px;font-weight:900;color:#087249;background:#e6f6ed;border-radius:5px;padding:4px 6px}
  @media(max-width:600px){#allServicesList .os-final-item{grid-template-columns:minmax(0,1fr) auto}#allServicesList .os-final-status{grid-column:1/-1;justify-self:start}}
  `;document.head.appendChild(style);
 }
 busy=true;
 list.innerHTML=ordered.map(g=>{
  const sale=g.records.reduce((n,r)=>n+r.items.reduce((v,i)=>v+Number(i.sale_value||0),0),0);
  const profit=g.records.reduce((n,r)=>n+r.items.reduce((v,i)=>v+Number(i.sale_value||0)-Number(i.cost_value||0)-Number(i.freight_value||0)-Number(i.sale_value||0)*Number(i.tax_rate||0)/100,0),0);
  const records=g.records.map(({o,items})=>'<section class="os-final-record" data-order-id="'+esc(o.id)+'"><div class="os-final-record-head"><div class="os-final-client"><b>'+esc(o.client_name||'Sem cliente')+'</b><small>'+esc([o.pedido?'Pedido '+o.pedido:'',o.vehicle_make_model||'',o.plate||''].filter(Boolean).join(' • '))+'</small><small>Entrada '+esc(date(o.entry_date))+' · '+esc(o.exit_date?'Saída '+date(o.exit_date):'Serviço ainda não entregue')+'</small></div><span class="payment-badge">'+esc(o.payment_status||'EM ABERTO')+'</span><button type="button" class="os-final-edit" data-edit="'+esc(o.id)+'">Editar</button></div>'+items.map(i=>'<div class="os-final-item"><span class="os-final-desc">'+esc(i.description||'Sem descrição')+'</span><span class="os-final-price">'+money(i.sale_value)+'</span><span class="os-final-status">'+esc(i.service_status||'Liberado')+'</span></div>').join('')+'</section>').join('');
  const clients=[...new Set(g.records.map(r=>r.o.client_name||'Sem cliente'))].join(' / ');
  const vehicles=[...new Set(g.records.map(r=>[r.o.vehicle_make_model,r.o.plate].filter(Boolean).join(' • ')).filter(Boolean))].join(' / ');
  return '<article class="os-final-card"><div class="os-final-head"><span class="os-final-badge">'+(g.os?'OS '+esc(g.os):'OS não informada')+'</span><div class="os-final-meta"><b>'+esc(clients)+'</b><small>'+esc(vehicles)+'</small><small>'+g.records.length+' lançamento(s) · '+g.records.reduce((n,r)=>n+r.items.length,0)+' serviço(s)</small></div><div class="os-final-total"><span>Venda total<b>'+money(sale)+'</b></span><span>Lucro líquido<b>'+money(profit)+'</b></span></div></div>'+records+'</article>';
 }).join('');
 list.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const id=b.dataset.edit;if(typeof window.editOrder==='function')window.editOrder(id);else if(typeof editOrder==='function')editOrder(id)}));
 busy=false;
}
window.renderServicesGroupedByOS=render;
['allServicesSearch','servicePaymentFilter','serviceStatusFilter'].forEach(id=>{const el=$(id);if(el)el.addEventListener(el.tagName==='SELECT'?'change':'input',render)});
document.querySelectorAll('.nav[data-view="services"]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,100)));
const previous=window.renderAllServices;
window.renderAllServices=function(){if(typeof previous==='function'){try{previous.apply(this,arguments)}catch(e){console.warn(e)}}render()};
function boot(){render();setTimeout(render,500);setTimeout(render,1500);setInterval(()=>{const list=$('allServicesList');if(list&&list.children.length&&!list.querySelector('.os-final-card'))render()},1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

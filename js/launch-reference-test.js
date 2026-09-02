/* TESTE V26 — cartões no padrão de referência + filtros completos de lançamentos. */
(function(){
'use strict';

const PAYMENTS_DEFAULT = ['EM ABERTO','Dinheiro','Cartão','Pix','Cheque','Carteira','Boleto','Notinha','FALTA ACERTAR'];

function getOrders(){
  return (typeof orders !== 'undefined' && Array.isArray(orders)) ? orders : [];
}
function esc2(v){
  if(typeof esc==='function') return esc(v);
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function money2(v){
  if(typeof money==='function') return money(v);
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
}
function slug2(v){
  if(typeof slug==='function') return slug(v);
  return String(v||'').replace(/\s+/g,'').replace('ç','c').replace('ã','a');
}
function shortDate2(v){
  const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${String(m[1]).slice(-2)}` : '—';
}
function fullDate2(v){
  const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : 'Sem data';
}
function dateKey2(o){
  const v=String(o?.exit_date||'').trim();
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0,10) : '';
}

function updateLaunchFilters(){
  const pay=document.getElementById('launchPaymentFilter');
  const svc=document.getElementById('launchStatusFilter');
  if(!pay || !svc) return;

  const currentPay=pay.value, currentSvc=svc.value;
  const ordersNow=getOrders();

  const payments=[...PAYMENTS_DEFAULT, ...ordersNow.map(o=>String(o?.payment_status||'').trim()).filter(Boolean)]
    .filter((v,i,a)=>a.indexOf(v)===i)
    .sort((a,b)=>{
      const ai=PAYMENTS_DEFAULT.indexOf(a), bi=PAYMENTS_DEFAULT.indexOf(b);
      if(ai>=0 && bi>=0) return ai-bi;
      if(ai>=0) return -1;
      if(bi>=0) return 1;
      return a.localeCompare(b,'pt-BR');
    });

  const statuses=['Liberado','Pronto','Parado','Pronto entregue'];

  pay.innerHTML='<option value="">Todos os pagamentos</option>'+payments.map(v=>`<option value="${esc2(v)}">${esc2(v)}</option>`).join('');
  // O filtro de situação é fixo e acompanha os quatro estados oficiais do serviço.
  svc.innerHTML='<option value="">Todas as situações</option>'+statuses.map(v=>`<option value="${esc2(v)}">${esc2(v)==='Pronto entregue'?'Pronto/Entregue':esc2(v)}</option>`).join('');

  if(pay.querySelector(`option[value="${CSS.escape(currentPay)}"]`)) pay.value=currentPay; else pay.value='';
  if(svc.querySelector(`option[value="${CSS.escape(currentSvc)}"]`)) svc.value=currentSvc; else svc.value='';
}

function renderLaunchesReference(){
  if(typeof updateCatalog==='function') updateCatalog();
  const list=document.getElementById('launchList');
  if(!list) return;

  updateLaunchFilters();

  const q=(document.getElementById('launchSearch')?.value||'').toLowerCase().trim();
  const pf=(document.getElementById('launchPaymentFilter')?.value||'').trim();
  const sf=(document.getElementById('launchStatusFilter')?.value||'').trim();

  const a=getOrders().filter(o=>{
    const items=o.order_items||[];
    const text=[o.client_name,o.vehicle_make_model,o.plate,o.pedido,o.numero_lancamento,...items.map(i=>i.description)]
      .join(' ').toLowerCase();
    const pay=String(o.payment_status||'EM ABERTO').trim();
    const searchMatch=!q || text.includes(q);
    const paymentMatch=!pf || pay===pf;
    const normalizeStatus=v=>{
      const t=String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
      if(t==='pronto/entregue' || t==='pronto entregue') return 'Pronto entregue';
      if(t==='liberado') return 'Liberado';
      if(t==='pronto') return 'Pronto';
      if(t==='parado') return 'Parado';
      return String(v||'').trim();
    };
    const serviceMatch=!sf || items.some(i=>normalizeStatus(i?.service_status||'Pronto entregue')===sf);
    return searchMatch && paymentMatch && serviceMatch;
  });

  const sorted=[...a].sort((x,y)=>{
    const dx=dateKey2(x),dy=dateKey2(y);
    if(!dx&&!dy) return String(y.entry_date||'').localeCompare(String(x.entry_date||''));
    if(!dx) return -1;
    if(!dy) return 1;
    if(dx!==dy) return dy.localeCompare(dx);
    return String(y.entry_date||'').localeCompare(String(x.entry_date||''));
  });

  const count=document.getElementById('count');
  if(count) count.textContent=sorted.length+' lançamento(s)';

  let lastDay=null;
  list.innerHTML=sorted.map(o=>{
    const day=dateKey2(o);
    const sep=day!==lastDay ? `<div class="launch-day-separator"><span>${fullDate2(day)}</span></div>` : '';
    lastDay=day;

    const first=(o.order_items||[])[0];
    const payment=String(o.payment_status||'EM ABERTO').trim();
    const paymentUpper=payment.toUpperCase();
    const paymentClass=paymentUpper==='FALTA ACERTAR'?'payment-falta-acertar':(paymentUpper==='EM ABERTO'?'payment-em-aberto':'payment-paid');
    const noExitClass=!String(o.exit_date||'').trim()?'no-exit-service':'';
    const gross=Number(o.total_sale||0), net=Number(o.net_profit||0);
    const vehicle=String(o.vehicle_make_model||'').trim();
    const plate=String(o.plate||'').trim();
    const pedido=String(o.pedido||'').trim();
    const os=String(o.numero_lancamento||'').trim();
    const entry=shortDate2(o.entry_date), exit=shortDate2(o.exit_date);
    const vehicleLine=[vehicle,plate].filter(Boolean).join(' • ');
    const statusText=o.exit_date ? `Saída ${exit}` : 'Serviço ainda não entregue';
    const statusClass=slug2(first?.service_status||'Pronto entregue');

    const card=`<article class="launch launch-reference-card ${statusClass} ${paymentClass} ${noExitClass}" data-id="${esc2(o.id)}">
      <div class="launch-reference-top">
        <div class="launch-reference-left">
          ${pedido?`<div class="launch-pedido"><span>Pedido</span> <b>${esc2(pedido)}</b></div>`:''}
          <div class="launch-dates">
            <span>Ent. <b>${esc2(entry)}</b></span>
            <span>${esc2(statusText)}</span>
          </div>
        </div>

        <div class="launch-reference-center">
          <div class="launch-os">${os?`OS ${esc2(os)}`:'OS —'}</div>
          <div class="launch-client">${esc2(o.client_name||'Sem cliente')}</div>
          ${vehicleLine?`<div class="launch-vehicle">${esc2(vehicleLine)}</div>`:''}
          <div class="launch-payment">${esc2(payment)}</div>
        </div>

        <div class="launch-reference-right">
          <div class="launch-reference-values">
            <b>${money2(gross)}</b>
            <span>${money2(net)}</span>
            <em>Líquido</em>
          </div>
          <div class="launch-reference-actions">
            <button type="button" class="launch-action" data-edit="${esc2(o.id)}">Editar</button>
            <button type="button" class="launch-action delete" data-delete="${esc2(o.id)}">Excluir</button>
          </div>
        </div>
      </div>

      <div class="launch-services">
        ${(o.order_items||[]).map(i=>{
          const st=String(i?.service_status||'Pronto entregue');
          return `<div class="service-line status-${slug2(st)}">
            <span><b>${esc2(i.description||'Sem descrição')}</b> • ${money2(i.sale_value)}</span>
            <span class="service-status">${esc2(st)}</span>
          </div>`;
        }).join('')}
      </div>

      ${String(o.notes||'').trim()?`<div class="launch-observation-card"><span>⚠ Observação:</span> ${esc2(o.notes.trim())}</div>`:''}
    </article>`;
    return sep+card;
  }).join('') || '<div class="empty">Nenhum lançamento encontrado.</div>';

  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    if(typeof openFix==='function') openFix(b.dataset.edit);
    else if(typeof editOrder==='function') editOrder(b.dataset.edit);
  });
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    if(typeof removeOrder==='function') removeOrder(b.dataset.delete);
  });
  list.querySelectorAll('.launch-reference-card').forEach(x=>x.onclick=e=>{
    if(e.target.closest('[data-edit],[data-delete]')) return;
    if(typeof openFix==='function') openFix(x.dataset.id);
    else if(typeof editOrder==='function') editOrder(x.dataset.id);
  });
}

function install(){
  const search=document.getElementById('launchSearch');
  const pf=document.getElementById('launchPaymentFilter');
  const sf=document.getElementById('launchStatusFilter');
  [search,pf,sf].forEach(el=>{
    if(!el || el.dataset.refFilterBound==='1') return;
    el.dataset.refFilterBound='1';
    el.addEventListener('input',renderLaunchesReference);
    el.addEventListener('change',renderLaunchesReference);
  });

  window.renderLaunches=renderLaunchesReference;
  updateLaunchFilters();
  setTimeout(renderLaunchesReference,0);
  setTimeout(renderLaunchesReference,300);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
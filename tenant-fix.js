/* Radiadores Moura - isolamento real por usuário. */
(function(){
  'use strict';
  let userCompanies=[];
  let refreshRunning=false;

  async function getMyCompanies(){
    const r=await sb.rpc('ensure_my_company');
    if(r.error){ console.error('[tenant]',r.error); return []; }
    return r.data||[];
  }

  function drawCompanies(){
    const root=$('companies');
    if(!root)return;
    root.innerHTML=userCompanies.map(c=>`<button class="companychoice" data-id="${esc(c.id)}"><b>${esc(c.name)}</b><small style="display:block;color:var(--muted);margin-top:4px">Abrir este banco</small></button>`).join('')||'<div style="padding:12px;color:var(--muted)">Nenhuma empresa disponível.</div>';
    root.querySelectorAll('button[data-id]').forEach(b=>b.onclick=async()=>{const c=userCompanies.find(x=>x.id===b.dataset.id);if(c)await selectCompany(c)});
  }

  async function selectCompany(c){
    if(!c)return;
    company=c;
    sessionStorage.setItem('companyId',c.id);
    $('companyPill').textContent='Banco: '+c.name;
    $('companyModal').classList.add('hidden');
    await loadData();
  }

  async function refreshTenant(){
    if(refreshRunning)return;
    const session=(await sb.auth.getSession()).data.session;
    if(!session)return;
    refreshRunning=true;
    try{
      userCompanies=await getMyCompanies();
      drawCompanies();
      const saved=sessionStorage.getItem('companyId');
      const found=userCompanies.find(c=>c.id===saved);
      if(found){
        await selectCompany(found);
      }else if(userCompanies.length===1){
        sessionStorage.removeItem('companyId');
        await selectCompany(userCompanies[0]);
      }else if(userCompanies.length>1){
        sessionStorage.removeItem('companyId');
        $('companyModal').classList.remove('hidden');
      }else{
        sessionStorage.removeItem('companyId');
        company=null;
        $('companyModal').classList.add('hidden');
      }
    }finally{ refreshRunning=false; }
  }

  sb.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){
      sessionStorage.removeItem('companyId');
      userCompanies=[];
      company=null;
      return;
    }
    if(session && ['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED'].includes(event))setTimeout(refreshTenant,0);
  });

  document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshTenant,150));

  /* ===== Serviços relacionados ao período selecionado no Balanço ===== */
  function ensureBalanceServicesBox(){
    const cards=$('balanceCards');
    if(!cards||$('balanceServicesList'))return;
    const card=document.createElement('div');
    card.className='card balance-services-card';
    card.innerHTML='<div class="sectiontitle"><h3>Serviços do período</h3><span id="balanceServicesCount">0 serviços</span></div><div id="balanceServicesList" class="all-services"></div>';
    cards.insertAdjacentElement('afterend',card);
  }

  function selectedBalancePeriod(){
    if(window.__balanceCustom)return 'custom';
    return document.querySelector('.period.active')?.dataset.p||'day';
  }

  function balanceOrders(){
    const p=selectedBalancePeriod();
    const ref=$('balanceDate')?.value||'';
    const start=$('balanceStart')?.value||'';
    const end=$('balanceEnd')?.value||'';
    if(p==='custom')return orders.filter(o=>o.entry_date&&(!start||o.entry_date>=start)&&(!end||o.entry_date<=end));
    if(p==='all')return orders.slice();
    if(!ref)return [];
    const d=new Date(ref+'T00:00:00');
    return orders.filter(o=>{
      if(!o.entry_date)return false;
      const x=new Date(o.entry_date+'T00:00:00');
      if(p==='day')return o.entry_date===ref;
      if(p==='month')return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth();
      if(p==='year')return x.getFullYear()===d.getFullYear();
      const startWeek=new Date(d);startWeek.setDate(d.getDate()-d.getDay());
      const endWeek=new Date(startWeek);endWeek.setDate(startWeek.getDate()+6);
      return x>=startWeek&&x<=endWeek;
    });
  }

  function renderBalanceServices(){
    ensureBalanceServicesBox();
    const list=$('balanceServicesList');
    const count=$('balanceServicesCount');
    if(!list||!count)return;
    const rows=balanceOrders().flatMap(o=>(o.order_items||[]).map(i=>({...i,order:o})));
    rows.sort((a,b)=>String(b.order.exit_date||b.order.entry_date||'').localeCompare(String(a.order.exit_date||a.order.entry_date||'')));
    count.textContent=`${rows.length} ${rows.length===1?'serviço':'serviços'}`;
    list.innerHTML=rows.map(x=>{
      const pay=x.order.payment_status||'EM ABERTO';
      const cls=String(pay).toLowerCase().replace(/\s+/g,'-').replace('ã','a');
      const profit=Number(x.sale_value||0)-Number(x.cost_value||0)-Number(x.freight_value||0)-(Number(x.sale_value||0)*Number(x.tax_rate||0)/100);
      return `<article class="service-card payment-${cls}"><div class="service-date"><b>${esc(x.order.exit_date||'—')}</b><small>Entrada ${esc(x.order.entry_date||'—')}</small></div><div class="service-main"><b>${esc(x.order.client_name||'Sem cliente')}</b><small>OS ${esc(x.order.numero_lancamento||'—')} • Pedido ${esc(x.order.pedido||'—')}${x.order.vehicle_make_model?' • '+esc(x.order.vehicle_make_model):''}</small><div class="service-desc">${esc(x.description||'Sem descrição')}</div></div><div class="service-values"><span>Venda <b>${money(x.sale_value)}</b></span><span>Custo <b>${money(x.cost_value)}</b></span><span>Lucro <b>${money(profit)}</b></span></div><div class="service-badges"><span class="status-badge status-${slug(x.service_status)}">${esc(x.service_status||'—')}</span><span class="payment-badge">${esc(pay)}</span></div></article>`;
    }).join('')||'<div class="empty">Nenhum serviço encontrado no período.</div>';
  }

  document.addEventListener('DOMContentLoaded',()=>{
    window.__balanceCustom=false;
    ensureBalanceServicesBox();
    const cards=$('balanceCards');
    if(cards)new MutationObserver(()=>setTimeout(renderBalanceServices,0)).observe(cards,{childList:true,subtree:true});
    document.querySelectorAll('.period').forEach(b=>b.addEventListener('click',()=>{window.__balanceCustom=false;setTimeout(renderBalanceServices,20)}));
    ['balanceDate','balanceStart','balanceEnd'].forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(renderBalanceServices,20)));
    $('applyCustomBalance')?.addEventListener('click',()=>{window.__balanceCustom=true;setTimeout(renderBalanceServices,20)});
    setTimeout(renderBalanceServices,250);
  });

  /* ===== Compactação extra dos cartões de lançamentos ===== */
  document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent=`
      html body #launchList .launch-card-v3{padding:2px 4px!important;border-radius:5px!important}
      html body #launchList .launch-card-v3 .grouped-top{grid-template-columns:54px minmax(0,1fr) auto!important;gap:2px!important}
      html body #launchList .launch-card-v3 .grouped-date b{font-size:8px!important;line-height:1!important}
      html body #launchList .launch-card-v3 .grouped-date small{font-size:6.5px!important;line-height:1!important;margin:0!important}
      html body #launchList .launch-card-v3 .grouped-main .lname{font-size:9px!important;line-height:1!important}
      html body #launchList .launch-card-v3 .grouped-main .meta{font-size:6.5px!important;line-height:1!important;margin:0!important}
      html body #launchList .launch-card-v3 .grouped-total{font-size:8px!important;line-height:1!important}
      html body #launchList .launch-card-v3 .launch-number{font-size:6.5px!important;padding:1px 3px!important;margin-right:2px!important}
      html body #launchList .launch-card-v3 .grouped-items{gap:1px!important;margin-top:1px!important}
      html body #launchList .launch-card-v3 .grouped-item{gap:2px!important;padding:1px 3px!important;border-radius:2px!important;font-size:6.5px!important;line-height:1!important}
      html body #launchList .launch-card-v3 .grouped-item b{font-size:6.5px!important;line-height:1!important}
      html body #launchList .launch-card-v3 .grouped-payment{gap:2px!important;margin-top:1px!important}
      html body #launchList .launch-card-v3 .payment-badge{padding:1px 3px!important;border-radius:3px!important;font-size:6.5px!important;line-height:1!important}
      html body #launchList .launch-card-v3 .service-actions-v2{gap:2px!important}
      html body #launchList .launch-card-v3 .service-actions-v2 button{padding:1px 3px!important;font-size:6.5px!important;border-radius:3px!important;line-height:1!important}
      @media(max-width:700px){
        html body #launchList .launch-card-v3{padding:1px 3px!important}
        html body #launchList .launch-card-v3 .grouped-top{grid-template-columns:50px minmax(0,1fr) auto!important;gap:2px!important}
        html body #launchList .launch-card-v3 .grouped-date b{font-size:7.5px!important}
        html body #launchList .launch-card-v3 .grouped-date small{font-size:6px!important}
        html body #launchList .launch-card-v3 .grouped-main .lname{font-size:8.5px!important}
        html body #launchList .launch-card-v3 .grouped-main .meta{font-size:6px!important}
        html body #launchList .launch-card-v3 .grouped-total{font-size:7.5px!important}
        html body #launchList .launch-card-v3 .grouped-item{font-size:6px!important;padding:1px 2px!important}
        html body #launchList .launch-card-v3 .grouped-item b{font-size:6px!important}
        html body #launchList .launch-card-v3 .payment-badge{font-size:6px!important}
      }
    `;
    document.head.appendChild(style);
  });
})();

/* Radiadores Moura - camada de estabilidade
   Sem MutationObserver: as correções são aplicadas somente após renderizações
   e em eventos controlados, evitando loops que podem travar a interface.
*/
(function(){
  'use strict';

  const nextFrame = fn => window.requestAnimationFrame(() => window.requestAnimationFrame(fn));

  window.addEventListener('error', function(ev){
    console.error('[Radiadores Moura]', ev.error || ev.message);
  });
  window.addEventListener('unhandledrejection', function(ev){
    console.error('[Radiadores Moura] Promise rejeitada:', ev.reason);
  });

  function removeEmptyDateGroups(){
    const root=document.getElementById('launchList');
    if(!root) return;
    const children=[...root.children];
    for(let i=0;i<children.length;i++){
      const el=children[i];
      if(!el || !el.isConnected) continue;
      const text=(el.textContent||'').trim();
      const looksLikeDate=/^(?:\d{2}\/\d{2}\/\d{4}|SEM DATA(?: DE SAÍDA)?)$/i.test(text);
      if(!looksLikeDate) continue;
      const next=children[i+1];
      if(!next || !next.classList.contains('launch')) el.remove();
    }
  }

  const order=document.getElementById('order');
  if(order){
    const originalSubmit=order.onsubmit;
    if(typeof originalSubmit==='function'){
      order.onsubmit=async function(ev){
        if(order.dataset.saving==='1'){
          ev.preventDefault();
          return;
        }
        order.dataset.saving='1';
        const submitButtons=[...order.querySelectorAll('button[type="submit"],button:not([type])')];
        submitButtons.forEach(b=>{ if(!b.dataset.oldText)b.dataset.oldText=b.textContent; b.disabled=true; });
        try{
          return await originalSubmit.call(this,ev);
        }finally{
          order.dataset.saving='0';
          submitButtons.forEach(b=>{b.disabled=false;if(b.dataset.oldText)b.textContent=b.dataset.oldText;});
        }
      };
    }
  }

  /* Serviços/lançamentos sem data de saída: verde claro, independentemente do pagamento. */
  function addNoExitStyles(){
    if(document.getElementById('no-exit-date-css')) return;
    const s=document.createElement('style');
    s.id='no-exit-date-css';
    s.textContent=`
      #launchList .launch.no-exit-date,
      #allServicesList .service-card.no-exit-date,
      #allServicesList .grouped-service.no-exit-date{
        background:#dff7e8!important;
        background-color:#dff7e8!important;
        border-color:#9edbb5!important;
        color:#174b2a!important;
        box-shadow:0 6px 18px rgba(70,160,100,.18)!important;
      }
      #launchList .launch.no-exit-date .lname,
      #launchList .launch.no-exit-date .meta,
      #launchList .launch.no-exit-date .launch-values>b,
      #launchList .launch.no-exit-date .launch-values>span,
      #launchList .launch.no-exit-date .launch-values>em,
      #allServicesList .service-card.no-exit-date .service-date b,
      #allServicesList .service-card.no-exit-date .service-main>b,
      #allServicesList .service-card.no-exit-date .service-main small,
      #allServicesList .service-card.no-exit-date .service-desc,
      #allServicesList .service-card.no-exit-date .service-values b,
      #allServicesList .service-card.no-exit-date .service-values span{
        color:#174b2a!important;
        -webkit-text-fill-color:#174b2a!important;
      }
      #launchList .launch.no-exit-date .chip:not(:last-child){
        background:#c8efd6!important;
        border-color:#a9dfbd!important;
        color:#174b2a!important;
        -webkit-text-fill-color:#174b2a!important;
      }
      #launchList .launch.no-exit-date .chip:last-child{
        background:#b9e8ca!important;
        border-color:#91d5aa!important;
        color:#174b2a!important;
        -webkit-text-fill-color:#174b2a!important;
      }
      #allServicesList .service-card.no-exit-date .payment-badge{
        background:#b9e8ca!important;
        border-color:#91d5aa!important;
        color:#174b2a!important;
      }
      #allServicesList .grouped-service.no-exit-date .service-group-head{
        background:#dff7e8!important;
        color:#174b2a!important;
      }
    `;
    document.head.appendChild(s);
  }

  function decorateNoExitCards(){
    addNoExitStyles();
    const data=(typeof orders!=='undefined'&&Array.isArray(orders))?orders:[];
    if(!data.length) return;

    document.querySelectorAll('#launchList .launch').forEach(card=>{
      const o=data.find(x=>String(x.id)===String(card.dataset.id));
      card.classList.toggle('no-exit-date',!!o && !o.exit_date);
    });

    document.querySelectorAll('#allServicesList .service-card,#allServicesList .grouped-service').forEach(card=>{
      const id=card.dataset.orderId||card.dataset.id;
      const o=data.find(x=>String(x.id)===String(id));
      if(o) card.classList.toggle('no-exit-date',!o.exit_date);
    });
  }

  function postRender(){
    nextFrame(removeEmptyDateGroups);
    nextFrame(decorateNoExitCards);
  }

  if(typeof window.renderAll==='function'){
    const originalRenderAll=window.renderAll;
    window.renderAll=function(){
      const result=originalRenderAll.apply(this,arguments);
      postRender();
      return result;
    };
  }

  if(typeof window.renderLaunches==='function'){
    const originalRenderLaunches=window.renderLaunches;
    window.renderLaunches=function(){
      const result=originalRenderLaunches.apply(this,arguments);
      postRender();
      return result;
    };
  }

  /* CORREÇÃO DA ABA TODOS OS SERVIÇOS.
     A tela deve sempre usar o mesmo array orders carregado do Supabase.
     Alguns módulos antigos dependiam de allServiceRows/renderAllServices e
     podiam deixar a lista vazia. Aqui reconstruímos a visualização diretamente. */
  function escService(v){
    if(typeof esc==='function') return esc(v);
    return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  }
  function moneyService(v){
    if(typeof money==='function') return money(v);
    return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  }
  function serviceDate(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m?`${m[3]}/${m[2]}/${m[1]}`:'Sem data de saída';
  }
  function serviceData(){
    const data=(typeof orders!=='undefined'&&Array.isArray(orders))?orders:[];
    const q=(document.getElementById('allServicesSearch')?.value||'').toLowerCase().trim();
    const pf=document.getElementById('servicePaymentFilter')?.value||'';
    const sf=document.getElementById('serviceStatusFilter')?.value||'';
    const rows=[];
    data.forEach(o=>{
      (Array.isArray(o.order_items)?o.order_items:[]).forEach(item=>{
        const text=[o.client_name,o.pedido,o.vehicle_make_model,o.plate,item.description].join(' ').toLowerCase();
        const pay=String(o.payment_status||'EM ABERTO').trim();
        const st=String(item.service_status||'Liberado').trim();
        if(q&&!text.includes(q)) return;
        if(pf&&pay!==pf) return;
        if(sf&&st!==sf) return;
        rows.push({order:o,item,payment:pay,status:st});
      });
    });
    rows.sort((a,b)=>{
      const ad=String(a.order.exit_date||'');
      const bd=String(b.order.exit_date||'');
      if(!ad&&!bd) return String(b.order.entry_date||'').localeCompare(String(a.order.entry_date||''));
      if(!ad) return 1;
      if(!bd) return -1;
      return bd.localeCompare(ad);
    });
    return rows;
  }
  function renderServicesFixed(){
    const list=document.getElementById('allServicesList');
    if(!list) return;
    const rows=serviceData();
    list.innerHTML=rows.map(r=>{
      const o=r.order,i=r.item;
      const noExit=!o.exit_date;
      return `<article class="service-card ${noExit?'no-exit-date':''} payment-${String(r.payment).toLowerCase().replace(/\s+/g,'-')}" data-order-id="${escService(o.id)}">
        <div class="service-date"><small>Entrega</small><b>${escService(serviceDate(o.exit_date))}</b></div>
        <div class="service-main"><b>${escService(o.client_name||'Sem cliente')}</b><small>${o.pedido?'Pedido '+escService(o.pedido)+' • ':''}${escService(o.vehicle_make_model||'')}${o.plate?' • '+escService(o.plate):''}</small><div class="service-desc">${escService(i.description||'Sem descrição')}</div></div>
        <div class="service-values"><b>${moneyService(i.sale_value)}</b><span>Custo ${moneyService(i.cost_value)}</span></div>
        <div class="service-badges"><span class="service-status-badge">${escService(r.status)}</span><span class="payment-badge">${escService(r.payment)}</span></div>
      </article>`;
    }).join('') || '<div class="empty">Nenhum serviço encontrado.</div>';
    postRender();
  }
  function installServicesFix(){
    const list=document.getElementById('allServicesList');
    if(!list) return false;
    window.renderAllServices=renderServicesFixed;
    const run=()=>{ if(document.getElementById('services')?.classList.contains('active')) renderServicesFixed(); };
    document.getElementById('allServicesSearch')?.addEventListener('input',run);
    document.getElementById('servicePaymentFilter')?.addEventListener('change',run);
    document.getElementById('serviceStatusFilter')?.addEventListener('change',run);
    document.querySelectorAll('.nav[data-view="services"]').forEach(b=>b.addEventListener('click',()=>setTimeout(renderServicesFixed,30)));
    setTimeout(renderServicesFixed,100);
    setTimeout(renderServicesFixed,600);
    return true;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      addNoExitStyles();
      setTimeout(decorateNoExitCards,100);
      setTimeout(decorateNoExitCards,500);
      setTimeout(decorateNoExitCards,1200);
      setTimeout(installServicesFix,150);
      setTimeout(installServicesFix,700);
      setTimeout(installServicesFix,1500);
    });
  }else{
    addNoExitStyles();
    setTimeout(decorateNoExitCards,100);
    setTimeout(decorateNoExitCards,500);
    setTimeout(decorateNoExitCards,1200);
    setTimeout(installServicesFix,150);
    setTimeout(installServicesFix,700);
    setTimeout(installServicesFix,1500);
  }
})();

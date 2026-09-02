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

  document.addEventListener('DOMContentLoaded',()=>{
    addNoExitStyles();
    setTimeout(decorateNoExitCards,100);
    setTimeout(decorateNoExitCards,500);
    setTimeout(decorateNoExitCards,1200);
  });
})();

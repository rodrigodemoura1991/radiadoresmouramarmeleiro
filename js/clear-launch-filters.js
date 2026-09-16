/* Limpar filtros — Lançamentos recentes */
(function(){
  'use strict';
  function install(){
    const filters=document.getElementById('launchFilters');
    if(!filters || document.getElementById('clearLaunchFilters')) return;

    const btn=document.createElement('button');
    btn.type='button';
    btn.id='clearLaunchFilters';
    btn.className='btn';
    btn.textContent='✕ Limpar filtros';
    btn.title='Limpar pesquisa e filtros de lançamentos';
    btn.style.cssText='white-space:nowrap;cursor:pointer;';

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      const search=document.getElementById('launchSearch');
      const payment=document.getElementById('launchPaymentFilter');
      const status=document.getElementById('launchStatusFilter');
      if(search) search.value='';
      if(payment) payment.value='';
      if(status) status.value='';
      if(typeof window.renderLaunches==='function') window.renderLaunches();
      else if(typeof window.renderLaunchesReference==='function') window.renderLaunchesReference();
    });

    filters.appendChild(btn);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  setTimeout(install,300);
})();

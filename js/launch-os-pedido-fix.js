/* Ajuste final: OS automático sem quadrado preto; pedido manual identificado como PEDIDO. */
(function(){
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function apply(){
    const list=document.getElementById('launchList');
    if(!list || typeof orders==='undefined' || !Array.isArray(orders)) return;

    list.querySelectorAll('.launch-card-v3').forEach(card=>{
      const id=card.dataset.id;
      const o=orders.find(x=>String(x.id)===String(id));
      if(!o) return;

      const lname=card.querySelector('.lname');
      const meta=card.querySelector('.meta');
      if(!lname || !meta) return;

      const os=o.numero_lancamento!=null && String(o.numero_lancamento).trim()!==''
        ? `OS: ${esc(o.numero_lancamento)}` : '';
      const pedido=String(o.pedido||'').trim();
      const vehicle=String(o.vehicle_make_model||'').trim();
      const client=esc(o.client_name||'Sem cliente');

      lname.innerHTML=`${os?`<span class="launch-os-plain">${os}</span>`:''}<span class="launch-client-name">${client}</span>`;

      const parts=[];
      if(pedido) parts.push(`<span class="launch-pedido-plain">PEDIDO: ${esc(pedido)}</span>`);
      if(vehicle) parts.push(`<span class="launch-vehicle-plain">Marca/Modelo: <strong>${esc(vehicle)}</strong></span>`);
      meta.innerHTML=parts.join('<span class="launch-meta-sep"> • </span>');
    });
  }

  function injectCss(){
    let s=document.getElementById('launch-os-pedido-fix-css');
    if(!s){s=document.createElement('style');s.id='launch-os-pedido-fix-css';document.head.appendChild(s)}
    s.textContent=`
      /* Remove completamente o antigo quadrado/etiqueta preta do número automático. */
      #launchList .launch-card-v3 .launch-number{display:none!important;background:transparent!important;border:0!important;padding:0!important;margin:0!important}
      #launchList .launch-card-v3 .lname{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;flex-wrap:wrap!important;text-align:center!important;width:100%!important}
      #launchList .launch-card-v3 .launch-os-plain{font-size:10px!important;line-height:1.05!important;font-weight:1000!important;color:inherit!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .launch-client-name{font-size:11px!important;line-height:1.05!important;font-weight:1000!important;color:inherit!important;white-space:normal!important}
      #launchList .launch-card-v3 .meta{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;flex-wrap:wrap!important;text-align:center!important;width:100%!important}
      #launchList .launch-card-v3 .launch-pedido-plain,
      #launchList .launch-card-v3 .launch-vehicle-plain{font-size:9px!important;line-height:1.08!important;font-weight:1000!important;color:inherit!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .launch-vehicle-plain strong{font-weight:1000!important;color:inherit!important}
      #launchList .launch-card-v3 .launch-meta-sep{font-size:8px!important;font-weight:1000!important;color:inherit!important}
      #launchList .launch-card-v3.payment-falta-acertar .launch-os-plain,
      #launchList .launch-card-v3.payment-falta-acertar .launch-client-name,
      #launchList .launch-card-v3.payment-falta-acertar .launch-pedido-plain,
      #launchList .launch-card-v3.payment-falta-acertar .launch-vehicle-plain,
      #launchList .launch-card-v3.payment-falta-acertar .launch-meta-sep{color:#fff!important;-webkit-text-fill-color:#fff!important}
      @media(max-width:520px){
        #launchList .launch-card-v3 .launch-os-plain{font-size:9.5px!important}
        #launchList .launch-card-v3 .launch-client-name{font-size:10.5px!important}
        #launchList .launch-card-v3 .launch-pedido-plain,
        #launchList .launch-card-v3 .launch-vehicle-plain{font-size:8.5px!important}
      }
    `;
  }

  function start(){
    injectCss();
    apply();
    const list=document.getElementById('launchList');
    if(list && !list.__osPedidoFixObserver){
      const obs=new MutationObserver(()=>requestAnimationFrame(apply));
      obs.observe(list,{childList:true,subtree:true});
      list.__osPedidoFixObserver=obs;
    }
    if(typeof window.renderAll==='function'&&!window.renderAll.__osPedidoFix){
      const original=window.renderAll;
      const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(apply);return r};
      wrapped.__osPedidoFix=true;
      window.renderAll=wrapped;
    }
    let n=0;
    const timer=setInterval(()=>{apply();if(++n>=10)clearInterval(timer)},300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(start,500);
})();

/* Cliente em destaque */
(function(){
  const style=document.createElement('style');
  style.textContent='#launchList .launch .launch-client-name{font-size:18px!important;font-weight:800!important;line-height:1.15!important;color:var(--ink,#111827)!important;display:inline-block} #launchList .launch .launch-os-plain{font-size:12px!important;font-weight:500!important;margin-right:7px}';
  document.head.appendChild(style);
})();

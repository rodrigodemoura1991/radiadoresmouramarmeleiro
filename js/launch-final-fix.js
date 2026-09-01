/* Ajuste final dos cartões de Lançamentos — 2026-09-01 */
(function(){
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmtDate=v=>{
    const s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m?`${m[3]}/${m[2]}/${m[1]}`:(s||'—');
  };

  function apply(){
    const list=document.getElementById('launchList');
    if(!list || typeof orders==='undefined' || !Array.isArray(orders)) return;

    list.querySelectorAll('.launch-card-v3').forEach(card=>{
      const o=orders.find(x=>String(x.id)===String(card.dataset.id));
      if(!o) return;

      const main=card.querySelector('.grouped-main');
      const lname=card.querySelector('.lname');
      const meta=card.querySelector('.meta');
      if(!main || !lname || !meta) return;

      const os=o.numero_lancamento!=null && String(o.numero_lancamento).trim()!==''
        ? `OS: ${esc(o.numero_lancamento)}` : '';
      const pedido=String(o.pedido||'').trim();
      const vehicle=String(o.vehicle_make_model||'').trim();

      const client=esc(o.client_name||'Sem cliente');
      lname.innerHTML=`<span class="launch-os">${os}</span>${client}`;

      let html='';
      if(pedido) html+=`<span class="launch-pedido">PEDIDO: ${esc(pedido)}</span>`;
      if(vehicle) html+=`${html?' ':''}<span class="launch-vehicle-line">Marca/Modelo: <strong>${esc(vehicle)}</strong></span>`;
      meta.innerHTML=html;

      const date=card.querySelector('.grouped-date');
      if(date){
        const b=date.querySelector('b'),small=date.querySelector('small');
        if(b) b.textContent=`Saída: ${fmtDate(o.exit_date)}`;
        if(small) small.textContent=`Entrada: ${fmtDate(o.entry_date)}`;
      }
    });
  }

  function injectCss(){
    let s=document.getElementById('launch-final-fix-css');
    if(!s){s=document.createElement('style');s.id='launch-final-fix-css';document.head.appendChild(s)}
    s.textContent=`
      #launchList .launch-card-v3 .lname{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;flex-wrap:wrap!important;text-align:center!important}
      #launchList .launch-card-v3 .launch-os{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:2px 6px!important;border-radius:5px!important;background:#111827!important;color:#fff!important;font-size:9px!important;line-height:1!important;font-weight:1000!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .meta{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;flex-wrap:wrap!important;text-align:center!important}
      #launchList .launch-card-v3 .launch-pedido{font-weight:1000!important;color:#17324d!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .launch-vehicle-line{font-weight:1000!important;color:#17324d!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .launch-vehicle-line strong{font-weight:1000!important;color:#111827!important}
      #launchList .launch-card-v3.payment-falta-acertar .launch-pedido,#launchList .launch-card-v3.payment-falta-acertar .launch-vehicle-line,#launchList .launch-card-v3.payment-falta-acertar .launch-vehicle-line strong{color:#fff!important;-webkit-text-fill-color:#fff!important}
      @media(max-width:520px){
        #launchList .launch-card-v3 .launch-os{font-size:8.5px!important;padding:2px 5px!important}
      }
    `;
  }

  function start(){
    injectCss();
    apply();
    if(typeof window.renderLaunches==='function'&&!window.renderLaunches.__launchFinalFix){
      const original=window.renderLaunches;
      const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(apply);return r};
      wrapped.__launchFinalFix=true;
      window.renderLaunches=wrapped;
    }
    if(typeof window.renderAll==='function'&&!window.renderAll.__launchFinalFix){
      const original=window.renderAll;
      const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(apply);return r};
      wrapped.__launchFinalFix=true;
      window.renderAll=wrapped;
    }
    let n=0;
    const timer=setInterval(()=>{apply();if(++n>=8)clearInterval(timer)},300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

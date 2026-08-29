/* Layout dos lançamentos: cliente -> marca/modelo -> serviços. */
(function(){
  'use strict';

  function moveServicesBelowClient(){
    const list=document.getElementById('launchList');
    if(!list) return;

    list.querySelectorAll('.launch').forEach(card=>{
      const top=card.querySelector('.ltop');
      const left=top?.firstElementChild;
      const meta=left?.querySelector('.meta');
      const chips=card.querySelector('.chips');
      if(!left || !meta || !chips) return;
      if(chips.parentElement===left) return;

      /* O meta continua com data/saída/placa; retiramos marca/modelo dele
         para exibir marca/modelo em uma linha própria logo abaixo do cliente. */
      const text=meta.textContent||'';
      const parts=text.split('•').map(x=>x.trim()).filter(Boolean);
      const entry=parts[0]||'';
      const exit=parts.find(x=>/^Saída\s/i.test(x))||'';
      const vehicle=card.dataset.vehicle || '';
      const plate=card.dataset.plate || '';

      let vehicleLine=left.querySelector('.vehicle-line');
      if(!vehicleLine){
        vehicleLine=document.createElement('div');
        vehicleLine.className='vehicle-line';
        vehicleLine.textContent=(vehicle||plate) ? [vehicle,plate].filter(Boolean).join(' • ') : '';
        left.insertBefore(vehicleLine,meta.nextSibling);
      }

      const dateParts=[entry,exit].filter(Boolean);
      meta.textContent=dateParts.join(' • ');

      chips.classList.add('services-under-client');
      left.appendChild(chips);
    });
  }

  function patchCards(){
    const list=document.getElementById('launchList');
    if(!list) return;
    list.querySelectorAll('.launch').forEach(card=>{
      const id=card.dataset.id;
      const data=Array.isArray(window.orders)?window.orders.find(o=>String(o.id)===String(id)):null;
      if(data){
        card.dataset.vehicle=data.vehicle_make_model||'';
        card.dataset.plate=data.plate||'';
      }
    });
    moveServicesBelowClient();
  }

  function css(){
    if(document.getElementById('services-below-client-css')) return;
    const s=document.createElement('style');
    s.id='services-below-client-css';
    s.textContent=`
      .launch .ltop>div:first-child{min-width:0;display:flex;flex-direction:column;align-items:flex-start}
      .launch .vehicle-line{font-weight:800;color:var(--muted);font-size:14px;line-height:1.25;margin-top:3px}
      .launch .services-under-client{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;width:100%}
      .launch .services-under-client .chip{white-space:normal}
    `;
    document.head.appendChild(s);
  }

  function hook(){
    css();
    patchCards();
    if(typeof window.renderLaunches==='function' && !window.renderLaunches.__servicesBelowClient){
      const original=window.renderLaunches;
      const wrapped=function(){
        const result=original.apply(this,arguments);
        requestAnimationFrame(patchCards);
        return result;
      };
      wrapped.__servicesBelowClient=true;
      window.renderLaunches=wrapped;
    }
  }

  let tries=0;
  const timer=setInterval(()=>{hook();if(++tries>120)clearInterval(timer)},250);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',hook,{once:true});
  else hook();
})();

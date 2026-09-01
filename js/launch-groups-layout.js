/* Ajustes finais da página Lançamentos: datas maiores, sem legenda e grupos por saída. */
(function(){
  'use strict';
  const LIST_ID='launchList';
  const STYLE_ID='launch-groups-layout-css';

  function injectCss(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .launch-color-legend,.launch-legend{display:none!important}
      /* Os separadores antigos são gerados por outro módulo. O agrupamento atual cria os seus próprios. */
      #${LIST_ID} .launch-day-separator{display:none!important}
      #${LIST_ID} .launch-group-divider{display:flex!important;align-items:center!important;gap:9px!important;margin:8px 5px 5px!important;color:#17324d!important;font-weight:1000!important;font-size:10.5px!important}
      #${LIST_ID} .launch-group-divider::before,#${LIST_ID} .launch-group-divider::after{content:"";height:1px;background:#cbd8e7;flex:1}
      #${LIST_ID} .launch-group-divider span{background:#edf3fa;border:1px solid #d4e0ed;border-radius:14px;padding:4px 10px;white-space:nowrap}
      #${LIST_ID} .launch-card-v3 .grouped-date b{font-size:11.5px!important;line-height:1.12!important}
      #${LIST_ID} .launch-card-v3 .grouped-date small{font-size:10px!important;line-height:1.12!important;margin-top:2px!important}
      #${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id{display:block!important;text-align:center!important;font-size:10.5px!important;line-height:1.12!important;font-weight:1000!important;margin-bottom:2px!important}
      #${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{display:block!important;text-align:center!important;font-size:10.5px!important;line-height:1.12!important;font-weight:1000!important}
      #${LIST_ID} .launch-card-v3.payment-pending,#${LIST_ID} .launch-card-v3.payment-em-aberto{background:#f5c542!important;background-color:#f5c542!important;border:2px solid #d7a900!important;border-left-color:#d7a900!important;color:#172033!important;box-shadow:0 4px 12px rgba(215,169,0,.20)!important}
      #${LIST_ID} .launch-card-v3.payment-pending .grouped-date b,#${LIST_ID} .launch-card-v3.payment-pending .grouped-date small,#${LIST_ID} .launch-card-v3.payment-pending .grouped-main .lname,#${LIST_ID} .launch-card-v3.payment-pending .grouped-main .meta,#${LIST_ID} .launch-card-v3.payment-pending .grouped-vehicle,#${LIST_ID} .launch-card-v3.payment-pending .grouped-total,#${LIST_ID} .launch-card-v3.payment-em-aberto .grouped-date b,#${LIST_ID} .launch-card-v3.payment-em-aberto .grouped-date small,#${LIST_ID} .launch-card-v3.payment-em-aberto .grouped-main .lname,#${LIST_ID} .launch-card-v3.payment-em-aberto .grouped-main .meta,#${LIST_ID} .launch-card-v3.payment-em-aberto .grouped-vehicle,#${LIST_ID} .launch-card-v3.payment-em-aberto .grouped-total{color:#172033!important;-webkit-text-fill-color:#172033!important}
      #${LIST_ID} .launch-card-v3.payment-pending .payment-badge,#${LIST_ID} .launch-card-v3.payment-pending .service-actions-v2 button,#${LIST_ID} .launch-card-v3.payment-em-aberto .payment-badge,#${LIST_ID} .launch-card-v3.payment-em-aberto .service-actions-v2 button{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #${LIST_ID} .launch-card-v3.payment-falta-acertar{background:#2563eb!important;background-color:#2563eb!important;border:2px solid #1d4ed8!important;color:#fff!important;box-shadow:0 2px 6px rgba(37,99,235,.22)!important}
      #${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-date b,#${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-date small,#${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-main .lname,#${LIST_ID} .launch-card-v3.payment-falta-acertar .meta,#${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-vehicle,#${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-total{color:#fff!important;-webkit-text-fill-color:#fff!important}
      #${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-item{background:#fff!important;color:#111827!important;border:1px solid #dbe4ef!important}
      #${LIST_ID} .launch-card-v3.payment-falta-acertar .grouped-item *{color:#111827!important;-webkit-text-fill-color:#111827!important}
      #${LIST_ID} .launch-card-v3.payment-falta-acertar .payment-badge{background:#fff!important;color:#1d4ed8!important}
      #${LIST_ID} .launch-card-v3.payment-falta-acertar .service-actions-v2 button{background:#fff!important;color:#1d4ed8!important;border-color:#fff!important}
      @media(max-width:520px){
        #${LIST_ID} .launch-card-v3 .grouped-date b{font-size:11px!important}
        #${LIST_ID} .launch-card-v3 .grouped-date small{font-size:9.5px!important}
        #${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id,#${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{font-size:10px!important}
        #${LIST_ID} .launch-group-divider{font-size:10px!important;margin-top:7px!important}
      }
      @media(max-width:390px){
        #${LIST_ID} .launch-card-v3 .grouped-date b{font-size:10.5px!important}
        #${LIST_ID} .launch-card-v3 .grouped-date small{font-size:9px!important}
        #${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id,#${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{font-size:9.5px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function hideColorLegend(){
    [...document.querySelectorAll('body *')].forEach(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(t!=='cores dos cartões:' && t!=='cores dos cartoes:') return;
      let p=el;
      for(let i=0;i<7 && p;i++,p=p.parentElement){
        const r=p.getBoundingClientRect ? p.getBoundingClientRect() : {width:9999,height:9999};
        const txt=(p.textContent||'').replace(/\s+/g,' ').toLowerCase();
        if(r.width>100 && r.width<500 && r.height>30 && r.height<400 && txt.includes('liberado') && txt.includes('parado') && txt.includes('pronto')){p.style.setProperty('display','none','important');p.setAttribute('aria-hidden','true');break}
      }
    });
  }

  function applyPaymentColors(){
    const list=document.getElementById(LIST_ID);if(!list)return;
    list.querySelectorAll('.launch').forEach(card=>{
      card.classList.remove('payment-em-aberto');
      const chips=card.querySelector('.chips');
      const paymentChip=chips?.lastElementChild;
      const status=(paymentChip?.textContent||'').replace(/★/g,'').replace(/\s+/g,' ').trim().toUpperCase();
      if(status==='EM ABERTO')card.classList.add('payment-em-aberto');
      if(status==='FALTA ACERTAR')card.classList.add('payment-falta-acertar');
    });
  }

  function dateKey(card){
    const b=card.querySelector('.grouped-date b');
    const m=(b?.textContent||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if(!m)return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
  }
  function dateLabel(key){if(!key)return 'SEM DATA DE SAÍDA';const [y,m,d]=key.split('-');return `${d}/${m}/${y}`}

  function regroup(){
    const list=document.getElementById(LIST_ID);if(!list)return;
    injectCss();hideColorLegend();applyPaymentColors();
    [...list.querySelectorAll('.launch-group-divider,.launch-day-separator')].forEach(x=>x.remove());
    const cards=[...list.querySelectorAll('.launch-card-v3')];if(!cards.length)return;
    const groups=new Map();
    cards.forEach(card=>{const key=dateKey(card)||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(card)});
    const keys=[...groups.keys()].sort((a,b)=>{if(!a)return -1;if(!b)return 1;return b.localeCompare(a)});
    const frag=document.createDocumentFragment();
    keys.forEach(key=>{const divider=document.createElement('div');divider.className='launch-group-divider';divider.innerHTML=`<span>${dateLabel(key)}</span>`;frag.appendChild(divider);groups.get(key).forEach(card=>frag.appendChild(card))});
    list.appendChild(frag);
  }

  function install(){
    injectCss();hideColorLegend();applyPaymentColors();regroup();
    const list=document.getElementById(LIST_ID);
    if(list&&!list.__groupsObserver){
      const obs=new MutationObserver(()=>{if(list.__groupsBusy)return;list.__groupsBusy=true;requestAnimationFrame(()=>{list.__groupsBusy=false;regroup()})});
      obs.observe(list,{childList:true});list.__groupsObserver=obs;
    }
    if(!document.body.__launchLegendObserver){const bodyObs=new MutationObserver(()=>hideColorLegend());bodyObs.observe(document.body,{childList:true,subtree:true});document.body.__launchLegendObserver=bodyObs}
    const old=window.renderAll;
    if(typeof old==='function'&&!old.__groupsWrapped){const wrapped=function(){const r=old.apply(this,arguments);requestAnimationFrame(()=>{applyPaymentColors();regroup()});return r};wrapped.__groupsWrapped=true;window.renderAll=wrapped}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,500);setTimeout(install,1500);
})();

/* Ajuste final: OS automático, PEDIDO manual e sem placa no cartão. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmtDate=v=>{const s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:(s||'—')};

  function apply(){
    const list=document.getElementById('launchList');
    if(!list||typeof orders==='undefined'||!Array.isArray(orders))return;
    list.querySelectorAll('.launch-card-v3').forEach(card=>{
      const o=orders.find(x=>String(x.id)===String(card.dataset.id));if(!o)return;
      const lname=card.querySelector('.lname'),meta=card.querySelector('.meta');if(!lname||!meta)return;
      const os=o.numero_lancamento!=null&&String(o.numero_lancamento).trim()!==''?`OS: ${esc(o.numero_lancamento)}`:'';
      const pedido=String(o.pedido||'').trim();
      const vehicle=String(o.vehicle_make_model||'').trim();
      lname.innerHTML=`<span class="launch-os">${os}</span>${esc(o.client_name||'Sem cliente')}`;
      let html='';
      if(pedido)html+=`<span class="launch-pedido">PEDIDO: ${esc(pedido)}</span>`;
      if(vehicle)html+=`${html?' ':''}<span class="launch-vehicle-line">Marca/Modelo: <strong>${esc(vehicle)}</strong></span>`;
      meta.innerHTML=html;
      const date=card.querySelector('.grouped-date');
      if(date){
        const b=date.querySelector('b'),small=date.querySelector('small');
        if(b)b.textContent=`Saída: ${fmtDate(o.exit_date)}`;
        if(small)small.textContent=`Entrada: ${fmtDate(o.entry_date)}`;
      }
    });
  }

  function injectFixCss(){
    let s=document.getElementById('launch-os-pedido-fix-css');
    if(!s){s=document.createElement('style');s.id='launch-os-pedido-fix-css';document.head.appendChild(s)}
    s.textContent=`
      #launchList .launch-card-v3 .lname{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;flex-wrap:wrap!important;text-align:center!important}
      #launchList .launch-card-v3 .launch-os{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:2px 6px!important;border-radius:5px!important;background:#111827!important;color:#fff!important;font-size:9px!important;line-height:1!important;font-weight:1000!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .meta{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;flex-wrap:wrap!important;text-align:center!important}
      #launchList .launch-card-v3 .launch-pedido,#launchList .launch-card-v3 .launch-vehicle-line{font-weight:1000!important;color:#17324d!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .launch-vehicle-line strong{font-weight:1000!important;color:#111827!important}
      #launchList .launch-card-v3.payment-falta-acertar .launch-pedido,#launchList .launch-card-v3.payment-falta-acertar .launch-vehicle-line,#launchList .launch-card-v3.payment-falta-acertar .launch-vehicle-line strong{color:#fff!important;-webkit-text-fill-color:#fff!important}
      @media(max-width:520px){#launchList .launch-card-v3 .launch-os{font-size:8.5px!important;padding:2px 5px!important}}
    `;
  }

  function start(){
    injectFixCss();apply();
    const list=document.getElementById('launchList');
    if(list&&!list.__osPedidoObserver){
      const obs=new MutationObserver(()=>requestAnimationFrame(apply));
      obs.observe(list,{childList:true,subtree:true});list.__osPedidoObserver=obs;
    }
    const old=window.renderAll;
    if(typeof old==='function'&&!old.__osPedidoFix){
      const wrapped=function(){const r=old.apply(this,arguments);requestAnimationFrame(apply);return r};
      wrapped.__osPedidoFix=true;window.renderAll=wrapped;
    }
    let n=0;const timer=setInterval(()=>{apply();if(++n>=10)clearInterval(timer)},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(start,400);setTimeout(start,1200);
})();

(()=>{
  const STYLE_ID='payment-colors-fix-style-v3';
  const addStyles=()=>{
    const old=document.getElementById('payment-colors-fix-style');if(old)old.remove();
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #launchList .launch.payment-em-aberto{background:#f5c542!important;background-color:#f5c542!important;border:2px solid #d7a900!important;color:#172033!important;box-shadow:0 8px 22px #d7a90033!important}
      #launchList .launch.payment-em-aberto .lname,#launchList .launch.payment-em-aberto .meta,#launchList .launch.payment-em-aberto .ltop>b{color:#172033!important}
      #launchList .launch.payment-em-aberto .btn,#launchList .launch.payment-em-aberto button{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #launchList .launch.payment-em-aberto .chip{background:#fff!important;color:#172033!important;border-color:#fff!important}
      #launchList .launch.payment-em-aberto .chip:last-child{color:#173b67!important;font-weight:950!important}
      #launchList .launch.payment-falta-acertar{background:#1976e8!important;background-color:#1976e8!important;border:2px solid #1266cf!important;color:#fff!important;box-shadow:0 8px 22px #1976e833!important}
      #launchList .launch.payment-falta-acertar .lname,#launchList .launch.payment-falta-acertar .meta,#launchList .launch.payment-falta-acertar .ltop>b{color:#fff!important}
      #launchList .launch.payment-falta-acertar .btn,#launchList .launch.payment-falta-acertar button{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child),#launchList .launch.payment-falta-acertar .chips .chip:not(:last-child) *{color:#111827!important;-webkit-text-fill-color:#111827!important;text-shadow:none!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child){background:#e6f7ef!important;border-color:#d1eadf!important}
      #launchList .launch.payment-falta-acertar .chips .chip:last-child{background:#fff!important;color:#1266cf!important;-webkit-text-fill-color:#1266cf!important;border-color:#fff!important;font-weight:950!important}

      /* SERVIÇOS: mesmas cores de pagamento dos cartões de Lançamentos */
      #allServicesList .service-card.payment-em-aberto,#allServicesList .service-card.payment-pending{background:#f5c542!important;background-color:#f5c542!important;border:2px solid #d7a900!important;border-left-color:#d7a900!important;color:#172033!important;box-shadow:0 8px 22px #d7a90033!important}
      #allServicesList .service-card.payment-em-aberto .service-main>b,#allServicesList .service-card.payment-em-aberto .service-date>b,#allServicesList .service-card.payment-pending .service-main>b,#allServicesList .service-card.payment-pending .service-date>b{color:#172033!important}
      #allServicesList .service-card.payment-em-aberto .service-main small,#allServicesList .service-card.payment-em-aberto .service-date small,#allServicesList .service-card.payment-pending .service-main small,#allServicesList .service-card.payment-pending .service-date small{color:#172033!important}
      #allServicesList .service-card.payment-em-aberto .payment-badge,#allServicesList .service-card.payment-pending .payment-badge{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #allServicesList .service-card.payment-falta-acertar{background:#1976e8!important;background-color:#1976e8!important;border:2px solid #1266cf!important;border-left-color:#1266cf!important;color:#fff!important;box-shadow:0 8px 22px #1976e833!important}
      #allServicesList .service-card.payment-falta-acertar .service-main>b,#allServicesList .service-card.payment-falta-acertar .service-date>b,#allServicesList .service-card.payment-falta-acertar .service-main small,#allServicesList .service-card.payment-falta-acertar .service-date small{color:#fff!important}
      #allServicesList .service-card.payment-falta-acertar .payment-badge{background:#fff!important;color:#1266cf!important;border-color:#fff!important}
      #allServicesList .service-card .service-vehicle{display:inline-block!important;font-weight:950!important;color:inherit!important;font-size:11px!important}

      /* Marca e modelo destacados também nos cartões de Lançamentos */
      #launchList .launch .launch-vehicle{display:block!important;margin-top:3px!important;font-size:14px!important;line-height:1.25!important;font-weight:950!important;letter-spacing:.1px!important;color:inherit!important}
      #launchList .launch .launch-order{display:inline!important}
      #launchList .launch .launch-plate{display:inline!important;font-weight:800!important}
      @media(max-width:760px){#launchList .launch .launch-vehicle{font-size:16px!important;line-height:1.25!important;margin-top:4px!important}}
    `;document.head.appendChild(s);
  };
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim().toUpperCase();
  const cleanStars=el=>{if(!el)return;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);nodes.forEach(x=>{if(x.nodeValue.includes('★'))x.nodeValue=x.nodeValue.replace(/★/g,'').replace(/\s{2,}/g,' ')})};
  const highlightLaunchVehicle=card=>{
    const meta=card.querySelector('.meta');if(!meta||meta.querySelector('.launch-vehicle'))return;
    const text=meta.textContent||'';const parts=text.split('•').map(x=>x.trim()).filter(Boolean);if(parts.length<2)return;
    const first=parts[0];let order=first,vehicle='',plate='';
    if(/^PEDIDO\b/i.test(first))order=first;
    vehicle=parts[1]||'';plate=parts[2]||'';
    meta.textContent='';
    const orderSpan=document.createElement('span');orderSpan.className='launch-order';orderSpan.textContent=order;meta.appendChild(orderSpan);
    const vehicleSpan=document.createElement('span');vehicleSpan.className='launch-vehicle';vehicleSpan.textContent=vehicle;meta.appendChild(vehicleSpan);
    if(plate){const plateSpan=document.createElement('span');plateSpan.className='launch-plate';plateSpan.textContent=' • '+plate;meta.appendChild(plateSpan)}
  };
  const applyLaunches=()=>document.querySelectorAll('#launchList .launch').forEach(card=>{
    const chips=card.querySelectorAll('.chips .chip');const payment=normalize(chips.length?chips[chips.length-1].textContent:'');
    card.classList.remove('payment-em-aberto','payment-falta-acertar','payment-open');
    if(payment==='EM ABERTO')card.classList.add('payment-em-aberto','payment-open');
    if(payment==='FALTA ACERTAR')card.classList.add('payment-falta-acertar');
    highlightLaunchVehicle(card);cleanStars(card);
  });
  const applyServices=()=>document.querySelectorAll('#allServicesList .service-card').forEach(card=>{
    const badge=card.querySelector('.payment-badge');const payment=normalize(badge?.textContent||'');
    card.classList.remove('payment-em-aberto','payment-falta-acertar');
    if(payment==='EM ABERTO')card.classList.add('payment-em-aberto');if(payment==='FALTA ACERTAR')card.classList.add('payment-falta-acertar');
    const small=card.querySelector('.service-main small');
    if(small&&!small.querySelector('.service-vehicle')){const text=small.textContent||'';const pos=text.indexOf('•');if(pos>=0&&text.slice(pos+1).trim()){const pedido=text.slice(0,pos).trim(),vehicle=text.slice(pos+1).trim();small.textContent='';const p=document.createElement('span');p.textContent=pedido+' ';small.appendChild(p);const v=document.createElement('span');v.className='service-vehicle';v.textContent='• '+vehicle;small.appendChild(v)}}
  });
  const start=()=>{addStyles();applyLaunches();applyServices();const launch=document.getElementById('launchList');if(launch)new MutationObserver(()=>requestAnimationFrame(applyLaunches)).observe(launch,{childList:true,subtree:true});const services=document.getElementById('allServicesList');if(services)new MutationObserver(()=>requestAnimationFrame(applyServices)).observe(services,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

(()=>{const start=()=>{const brand=document.querySelector('.brand');if(!brand)return;const old=brand.querySelector('.mark');if(old)old.remove();let logo=brand.querySelector('.brand-logo');if(!logo){logo=document.createElement('img');logo.className='brand-logo';logo.alt='Radiadores Moura';logo.src='assets/logo-radiadores-moura.svg';brand.prepend(logo)}const copy=brand.querySelector('.brand-copy');if(copy)copy.style.display='none';};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start()})();

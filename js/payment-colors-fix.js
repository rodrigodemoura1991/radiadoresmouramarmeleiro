(()=>{
  const STYLE_ID='payment-colors-fix-style-v2';
  const addStyles=()=>{
    const old=document.getElementById('payment-colors-fix-style');
    if(old)old.remove();
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #launchList .launch.payment-em-aberto{background:#f5c542!important;background-color:#f5c542!important;border:2px solid #d7a900!important;color:#172033!important;box-shadow:0 8px 22px #d7a90033!important}
      #launchList .launch.payment-em-aberto .lname,#launchList .launch.payment-em-aberto .meta,#launchList .launch.payment-em-aberto .ltop>b{color:#172033!important}
      #launchList .launch.payment-em-aberto .btn,#launchList .launch.payment-em-aberto button{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #launchList .launch.payment-em-aberto .chip{background:#fff!important;color:#172033!important;border-color:#fff!important}
      #launchList .launch.payment-em-aberto .chip:last-child{color:#173b67!important;font-weight:950!important}
      #launchList .launch.payment-falta-acertar{background:#1976e8!important;background-color:#1976e8!important;border:2px solid #1266cf!important;color:#fff!important;box-shadow:0 8px 22px #1976e833!important}
      #launchList .launch.payment-falta-acertar .lname,#launchList .launch.payment-falta-acertar .meta,#launchList .launch.payment-falta-acertar .ltop>b{color:#fff!important}
      #launchList .launch.payment-falta-acertar .btn,#launchList .launch.payment-falta-acertar button{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child),#launchList .launch.payment-falta-acertar .chips .chip:not(:last-child) *,#launchList .launch.payment-falta-acertar .chips .chip:not(:last-child) span,#launchList .launch.payment-falta-acertar .chips .chip:not(:last-child) b{color:#111827!important;-webkit-text-fill-color:#111827!important;text-shadow:none!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child){background:#e6f7ef!important;border-color:#d1eadf!important}
      #launchList .launch.payment-falta-acertar .chips .chip:last-child{background:#fff!important;color:#1266cf!important;-webkit-text-fill-color:#1266cf!important;border-color:#fff!important;font-weight:950!important}
    `;document.head.appendChild(s);
  };
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim().toUpperCase();
  const cleanStars=el=>{if(!el)return;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);nodes.forEach(x=>{if(x.nodeValue.includes('★'))x.nodeValue=x.nodeValue.replace(/★/g,'').replace(/\s{2,}/g,' ')})};
  const apply=()=>document.querySelectorAll('#launchList .launch').forEach(card=>{const chips=card.querySelectorAll('.chips .chip');const payment=normalize(chips.length?chips[chips.length-1].textContent:'');card.classList.remove('payment-em-aberto','payment-falta-acertar');if(payment==='EM ABERTO')card.classList.add('payment-em-aberto');if(payment==='FALTA ACERTAR')card.classList.add('payment-falta-acertar');cleanStars(card)});
  const start=()=>{addStyles();apply();const list=document.getElementById('launchList');if(list)new MutationObserver(apply).observe(list,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* Cabeçalho com a nova identidade visual e adaptação para iPhone */
(()=>{
  const start=()=>{
    const brand=document.querySelector('.brand');
    if(!brand)return;
    const old=brand.querySelector('.mark');
    if(old)old.remove();
    let logo=brand.querySelector('.brand-logo');
    if(!logo){logo=document.createElement('img');logo.className='brand-logo';logo.alt='Radiadores Moura';logo.src='assets/logo-radiadores-moura.svg';brand.prepend(logo)}
    const copy=brand.querySelector('.brand-copy');
    if(copy)copy.style.display='none';
    if(!document.getElementById('logo-header-runtime-style')){
      const s=document.createElement('style');s.id='logo-header-runtime-style';s.textContent=`
        .brand{min-width:0}.brand-logo{display:block;width:250px;height:61px;object-fit:contain;border-radius:10px;flex:0 0 auto}.brand-copy{display:none}
        @media(max-width:760px){.topin{padding:8px 10px!important;gap:8px!important;overflow:hidden}.brand{flex:0 0 auto;min-width:0}.brand-logo{width:205px;height:50px;border-radius:8px}.actions{flex:1 1 auto;min-width:0;justify-content:flex-end;flex-wrap:nowrap;overflow:hidden}.actions .cloud,.actions .pill{display:none}.actions #logout{display:none}.actions #switch{white-space:nowrap;padding:9px 10px;font-size:12px}.top{height:66px}.shell{padding-top:10px!important}}
        @media(max-width:390px){.brand-logo{width:180px;height:45px}.actions #switch{font-size:11px;padding:8px}.top{height:60px}}
      `;document.head.appendChild(s)
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

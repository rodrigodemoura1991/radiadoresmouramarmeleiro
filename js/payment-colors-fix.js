(()=>{
  const addStyles=()=>{
    if(document.getElementById('payment-colors-fix-style'))return;
    const s=document.createElement('style');s.id='payment-colors-fix-style';s.textContent=`
      #launchList .launch.payment-em-aberto{background:#f5c542!important;border:2px solid #d7a900!important;color:#172033!important;box-shadow:0 8px 22px #d7a90033!important}
      #launchList .launch.payment-em-aberto .lname,#launchList .launch.payment-em-aberto .meta,#launchList .launch.payment-em-aberto .ltop>b{color:#172033!important}
      #launchList .launch.payment-em-aberto .btn,#launchList .launch.payment-em-aberto button{background:#fff!important;color:#173b67!important;border-color:#fff!important}
      #launchList .launch.payment-em-aberto .chip{background:#fff!important;color:#172033!important;border-color:#fff!important}
      #launchList .launch.payment-em-aberto .chip:last-child{color:#173b67!important;font-weight:950!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child){color:#172033!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child).Liberado{color:#2364a9!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child).Parado{color:#9b5c00!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child).Pronto{color:#6444ad!important}
      #launchList .launch.payment-falta-acertar .chips .chip:not(:last-child).Prontoentregue{color:#087249!important}
      #launchList .launch.payment-falta-acertar .chips .chip:last-child{background:#fff!important;color:#1266cf!important}
    `;document.head.appendChild(s);
  };
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim().toUpperCase();
  const cleanStars=el=>{
    if(!el)return;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    const nodes=[];let n;
    while(n=walker.nextNode())nodes.push(n);
    nodes.forEach(x=>{if(x.nodeValue.includes('★'))x.nodeValue=x.nodeValue.replace(/★/g,'').replace(/\s{2,}/g,' ')});
  };
  const apply=()=>document.querySelectorAll('#launchList .launch').forEach(card=>{
    const chips=card.querySelectorAll('.chips .chip');
    const payment=normalize(chips.length?chips[chips.length-1].textContent:'');
    card.classList.remove('payment-em-aberto','payment-falta-acertar');
    if(payment==='EM ABERTO')card.classList.add('payment-em-aberto');
    if(payment==='FALTA ACERTAR')card.classList.add('payment-falta-acertar');
    cleanStars(card);
  });
  const start=()=>{addStyles();apply();const list=document.getElementById('launchList');if(list)new MutationObserver(apply).observe(list,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

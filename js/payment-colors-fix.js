(()=>{
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
  const start=()=>{apply();const list=document.getElementById('launchList');if(list)new MutationObserver(apply).observe(list,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

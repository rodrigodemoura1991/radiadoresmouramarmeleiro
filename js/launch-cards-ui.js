/* Ajustes visuais dos cartões de lançamentos.
   Não altera dados: apenas marca visualmente os pagamentos EM ABERTO. */
(function(){
  function apply(){
    const list=document.getElementById('launchList');
    if(!list) return;
    list.querySelectorAll('.launch').forEach(card=>{
      const id=card.dataset.id;
      const order=(window.orders||[]).find(o=>o.id===id);
      const open=order && String(order.payment_status||'').trim().toUpperCase()==='EM ABERTO';
      card.classList.toggle('payment-open',!!open);
      card.querySelectorAll('.chip').forEach(chip=>{
        if(chip.textContent.trim().startsWith('★')) chip.textContent=chip.textContent.trim().replace(/^★\s*/, '');
      });
    });
  }
  function install(){
    const list=document.getElementById('launchList');
    if(!list) return;
    new MutationObserver(()=>requestAnimationFrame(apply)).observe(list,{childList:true,subtree:true});
    apply();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

/* Ajustes da página Todos os Serviços. */
(function(){
  function applyServices(){
    const search=document.getElementById('allServicesSearch');
    if(search) search.placeholder='Buscar cliente, placa, pedido ou serviço';
    const list=document.getElementById('allServicesList');
    if(!list) return;
    list.querySelectorAll('.service-card').forEach(card=>{
      const badge=card.querySelector('.payment-badge');
      if(!badge) return;
      const text=badge.textContent.trim();
      if(text.startsWith('★')) badge.textContent=text.replace(/^★\s*/, '');
    });
  }
  function install(){
    applyServices();
    const list=document.getElementById('allServicesList');
    if(list) new MutationObserver(()=>requestAnimationFrame(applyServices)).observe(list,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

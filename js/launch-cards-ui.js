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
      /* Remove a estrela antiga que era exibida dentro do chip de pagamento. */
      card.querySelectorAll('.chip').forEach(chip=>{
        if(chip.textContent.trim().startsWith('★')){
          chip.textContent=chip.textContent.trim().replace(/^★\s*/, '');
        }
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

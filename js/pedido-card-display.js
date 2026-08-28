/* Exibe somente o número do pedido nos cartões de Lançamentos quando houver pedido preenchido. */
(function(){
  function apply(){
    const list=document.getElementById('launchList');
    if(!list || !Array.isArray(window.orders) && typeof orders==='undefined') return;
    const data=(typeof orders!=='undefined' && Array.isArray(orders)) ? orders : (Array.isArray(window.orders)?window.orders:[]);
    list.querySelectorAll('.launch').forEach(card=>{
      const id=card.dataset.id;
      const order=data.find(o=>String(o.id)===String(id));
      const meta=card.querySelector('.meta');
      if(!order || !meta) return;
      const pedido=String(order.pedido||'').trim();
      const base=meta.textContent.replace(/^\s*[^•]+\s+•\s+/, '');
      if(pedido){
        meta.textContent=pedido+' • '+base;
      }else{
        meta.textContent=base;
      }
    });
  }
  function start(){
    apply();
    const list=document.getElementById('launchList');
    if(list){
      new MutationObserver(()=>requestAnimationFrame(apply)).observe(list,{childList:true,subtree:true});
    }
    setTimeout(apply,300);
    setTimeout(apply,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

// Edição rápida na aba Todos os Serviços.
// Usa o mesmo editor de lançamento já existente no app, preservando o Supabase.
(function(){
  function decorate(){
    const list=document.getElementById('allServicesList');
    if(!list) return;
    list.querySelectorAll('[data-id]').forEach(card=>{
      if(card.querySelector('.edit-all-service')) return;
      const id=card.dataset.id;
      if(!id) return;
      const actions=document.createElement('div');
      actions.className='all-service-actions';
      actions.innerHTML='<button type="button" class="btn edit-all-service">Editar</button>';
      actions.querySelector('button').addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        if(typeof window.editOrder==='function') window.editOrder(id);
      });
      card.appendChild(actions);
    });
  }
  const observer=new MutationObserver(decorate);
  function start(){
    const list=document.getElementById('allServicesList');
    if(list) observer.observe(list,{childList:true,subtree:true});
    decorate();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
  setInterval(decorate,1500);
})();

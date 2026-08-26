/* Garante que NOTINHA exista em TODOS os campos de pagamento,
   inclusive em edições de lançamentos criadas dinamicamente. */
(function(){
  function ensure(){
    document.querySelectorAll('select').forEach(function(select){
      var id=(select.id||'').toLowerCase();
      var name=(select.name||'').toLowerCase();
      var text='';
      var field=select.closest('.field');
      if(field) text=(field.innerText||'').toLowerCase();
      var looksPayment=id==='payment'||id.includes('payment')||name.includes('payment')||text.includes('forma de pagamento')||text.includes('situação (pagamento)')||text.includes('situação do pagamento');
      if(!looksPayment) return;
      if(![...select.options].some(function(o){return o.value==='Notinha'||o.textContent.trim().toLowerCase()==='notinha'})){
        var option=document.createElement('option');
        option.value='Notinha';
        option.textContent='Notinha';
        select.appendChild(option);
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensure,{once:true}); else ensure();
  new MutationObserver(ensure).observe(document.documentElement,{childList:true,subtree:true});
  window.ensureNotinhaPayment=ensure;
})();

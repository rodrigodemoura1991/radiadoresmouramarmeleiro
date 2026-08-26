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

/* Correção: saída pode ficar em branco quando o serviço ainda não foi entregue.
   O PostgreSQL recebe NULL, nunca a string vazia. */
(function(){
  function normalize(data){
    if(Array.isArray(data)) return data.map(normalize);
    if(data && typeof data==='object' && Object.prototype.hasOwnProperty.call(data,'exit_date')){
      return Object.assign({},data,{exit_date:data.exit_date ? data.exit_date : null});
    }
    return data;
  }
  function patch(){
    if(!window.sb || window.__exitDatePatchApplied) return;
    window.__exitDatePatchApplied=true;
    var originalFrom=window.sb.from.bind(window.sb);
    window.sb.from=function(table){
      var builder=originalFrom(table);
      if(table!=='orders') return builder;
      var originalInsert=builder.insert.bind(builder);
      var originalUpdate=builder.update.bind(builder);
      builder.insert=function(data){ return originalInsert(normalize(data)); };
      builder.update=function(data){ return originalUpdate(normalize(data)); };
      return builder;
    };
  }
  function init(){
    patch();
    var exit=document.getElementById('exit');
    if(exit) exit.value='';
    var clear=document.getElementById('clear');
    if(clear) clear.addEventListener('click',function(){setTimeout(function(){if(exit) exit.value='';},0)});
    var rows=document.getElementById('rows');
    if(rows) rows.addEventListener('change',function(e){
      if(e.target && e.target.classList.contains('status') && e.target.value==='Parado' && exit) exit.value='';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

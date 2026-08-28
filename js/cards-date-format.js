(function(){
  function f(){
    document.querySelectorAll('#launchList .launch,#allServicesList .service-card,#allServicesList .grouped-service').forEach(function(c){
      var w=document.createTreeWalker(c,NodeFilter.SHOW_TEXT),n,a=[];
      while(n=w.nextNode())a.push(n);
      a.forEach(function(x){x.nodeValue=x.nodeValue.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,function(_,y,m,d){return d+'/'+m+'/'+y}).replace(/\bPronto entregue\b/g,'PRONTO/ENTREGUE')})
    });
    document.querySelectorAll('#rows .svc-row select.status').forEach(function(s){
      var opt=[...s.options].find(function(o){return o.value==='Pronto entregue'||o.textContent.trim().toLowerCase()==='pronto entregue'});
      if(!opt)return;
      opt.textContent='PRONTO/ENTREGUE';
      if(s.firstElementChild!==opt)s.insertBefore(opt,s.firstElementChild);
      var desc=s.closest('.svc-row')?.querySelector('.desc');
      if(desc && !desc.value.trim() && s.value!=='Pronto entregue')s.value='Pronto entregue';
    });
  }
  f();
  setInterval(f,1000);
})();

/* Radiadores Moura - camada de estabilidade
   Sem MutationObserver: as correções são aplicadas somente após renderizações
   e em eventos controlados, evitando loops que podem travar a interface.
*/
(function(){
  'use strict';

  const nextFrame = fn => window.requestAnimationFrame(() => window.requestAnimationFrame(fn));

  // Erros JS não devem deixar a interface silenciosamente sem resposta.
  window.addEventListener('error', function(ev){
    console.error('[Radiadores Moura]', ev.error || ev.message);
  });
  window.addEventListener('unhandledrejection', function(ev){
    console.error('[Radiadores Moura] Promise rejeitada:', ev.reason);
  });

  function removeEmptyDateGroups(){
    const root=document.getElementById('launchList');
    if(!root) return;
    // Remove somente separadores claramente vazios: um título de data sem
    // nenhum cartão associado antes do próximo separador.
    const children=[...root.children];
    for(let i=0;i<children.length;i++){
      const el=children[i];
      if(!el || !el.isConnected) continue;
      const text=(el.textContent||'').trim();
      const looksLikeDate=/^(?:\d{2}\/\d{2}\/\d{4}|SEM DATA(?: DE SAÍDA)?)$/i.test(text);
      if(!looksLikeDate) continue;
      const next=children[i+1];
      if(!next || !next.classList.contains('launch')) el.remove();
    }
  }

  // Evita duplo clique em Salvar durante uma operação assíncrona.
  const order=document.getElementById('order');
  if(order){
    const originalSubmit=order.onsubmit;
    if(typeof originalSubmit==='function'){
      order.onsubmit=async function(ev){
        if(order.dataset.saving==='1'){
          ev.preventDefault();
          return;
        }
        order.dataset.saving='1';
        const submitButtons=[...order.querySelectorAll('button[type="submit"],button:not([type])')];
        submitButtons.forEach(b=>{ if(!b.dataset.oldText)b.dataset.oldText=b.textContent; b.disabled=true; });
        try{
          return await originalSubmit.call(this,ev);
        }finally{
          order.dataset.saving='0';
          submitButtons.forEach(b=>{b.disabled=false;if(b.dataset.oldText)b.textContent=b.dataset.oldText;});
        }
      };
    }
  }

  // Pós-render leve, sem observers contínuos.
  function postRender(){
    nextFrame(removeEmptyDateGroups);
  }

  // renderAll é criado pelo app.js antes deste arquivo.
  if(typeof window.renderAll==='function'){
    const originalRenderAll=window.renderAll;
    window.renderAll=function(){
      const result=originalRenderAll.apply(this,arguments);
      postRender();
      return result;
    };
  }

  // Se uma busca/renderização específica for chamada diretamente, também
  // limpamos os separadores depois dela.
  if(typeof window.renderLaunches==='function'){
    const originalRenderLaunches=window.renderLaunches;
    window.renderLaunches=function(){
      const result=originalRenderLaunches.apply(this,arguments);
      postRender();
      return result;
    };
  }
})();

/* Carrega o ajuste final dos cartões depois de todos os demais scripts da página. */
(function(){
  'use strict';
  function loadFix(){
    if(document.querySelector('script[data-launch-os-pedido-fix]')) return;
    const s=document.createElement('script');
    s.src='js/launch-os-pedido-fix.js?v=20260901-1';
    s.async=false;
    s.setAttribute('data-launch-os-pedido-fix','1');
    document.body.appendChild(s);
  }
  if(document.readyState==='complete') loadFix();
  else window.addEventListener('load',loadFix,{once:true});
  setTimeout(loadFix,1800);
})();

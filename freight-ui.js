/* Ajustes visuais do campo Frete */
(function(){
  'use strict';
  function addHeaders(){
    document.querySelectorAll('.svc-head').forEach(h=>{
      if(!h.querySelector('.freight-head')){
        const cost=[...h.children].find(x=>x.textContent.trim().toLowerCase()==='custo');
        const s=document.createElement('span');s.className='freight-head';s.textContent='Frete';
        cost?cost.after(s):h.appendChild(s);
      }
    });
    document.querySelectorAll('.edit-svc-head').forEach(h=>{
      if(!h.querySelector('.freight-head')){
        const cost=[...h.children].find(x=>x.textContent.trim().toLowerCase()==='custo');
        const s=document.createElement('span');s.className='freight-head';s.textContent='Frete';
        cost?cost.after(s):h.appendChild(s);
      }
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    addHeaders();
    document.addEventListener('click',()=>requestAnimationFrame(addHeaders));
  });
})();

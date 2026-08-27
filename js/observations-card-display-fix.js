/* Exibição das observações nos cartões — somente visual, sem alterar o salvamento. */
(function(){
  'use strict';
  if(window.__observationsCardDisplayFix)return;
  window.__observationsCardDisplayFix=true;

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function getOrders(){
    try{if(typeof orders!=='undefined'&&Array.isArray(orders))return orders}catch(e){}
    return Array.isArray(window.orders)?window.orders:[];
  }

  function addStyles(){
    if(document.getElementById('observation-card-display-css'))return;
    const s=document.createElement('style');
    s.id='observation-card-display-css';
    s.textContent=`
      .launch-observation-card{
        display:block!important;
        margin-top:5px!important;
        padding:6px 9px!important;
        border:1px solid #e7c75f!important;
        border-left:4px solid #d99b00!important;
        border-radius:7px!important;
        background:#fff8d9!important;
        color:#27364d!important;
        font-size:10px!important;
        line-height:1.35!important;
        white-space:pre-wrap!important;
        overflow-wrap:anywhere!important;
        box-sizing:border-box!important;
      }
      .launch-observation-card .observation-label{
        font-weight:800!important;
        color:#8a5a00!important;
        margin-right:4px!important;
      }
      .launch.payment-falta-acertar .launch-observation-card{
        background:#fff8d9!important;
        border-color:#e7c75f!important;
        border-left-color:#d99b00!important;
        color:#27364d!important;
      }
    `;
    document.head.appendChild(s);
  }

  function render(){
    const list=document.getElementById('launchList');
    if(!list)return;
    const data=getOrders();
    list.querySelectorAll('.launch[data-id]').forEach(card=>{
      const old=card.querySelector('.launch-observation-card');
      if(old)old.remove();
      const order=data.find(o=>String(o.id)===String(card.dataset.id));
      const note=String(order?.notes??'').trim();
      if(!note)return;
      const el=document.createElement('div');
      el.className='launch-observation-card';
      el.innerHTML='<span class="observation-label">⚠ Observação:</span>'+esc(note);
      card.appendChild(el);
    });
  }

  addStyles();
  render();
  const listObserver=new MutationObserver(()=>requestAnimationFrame(render));
  const start=()=>{
    const list=document.getElementById('launchList');
    if(list)listObserver.observe(list,{childList:true,subtree:true});
    render();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

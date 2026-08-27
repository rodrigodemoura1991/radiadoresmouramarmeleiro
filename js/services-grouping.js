/* Agrupa os cards de serviços pelo mesmo order_id. Não altera os dados, apenas a apresentação. */
(function(){
  'use strict';
  const LIST_ID='allServicesList';
  let scheduled=false;

  function money(n){
    try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0)}
    catch(e){return 'R$ '+(Number(n)||0).toFixed(2)}
  }
  function getOrders(){return Array.isArray(window.orders)?window.orders:[]}
  function group(){
    const list=document.getElementById(LIST_ID);
    if(!list)return;
    const cards=[...list.children].filter(el=>el.classList&&el.classList.contains('service-card'));
    if(cards.length<2)return;
    const groups=new Map();
    cards.forEach(card=>{
      const id=card.dataset.orderId||card.dataset.id;
      if(!id)return;
      if(!groups.has(String(id)))groups.set(String(id),[]);
      groups.get(String(id)).push(card);
    });
    groups.forEach((items,id)=>{
      if(items.length<2)return;
      if(items[0].parentElement?.classList.contains('service-order-group'))return;
      const order=getOrders().find(o=>String(o.id)===String(id));
      const wrap=document.createElement('div');
      wrap.className='service-order-group';
      wrap.dataset.orderId=id;
      const head=document.createElement('div');
      head.className='service-group-head';
      const label=order?.client_name||items[0].querySelector('.lname')?.textContent?.trim()||'Lançamento';
      const total=order?.total_sale;
      head.innerHTML='<strong>'+escapeHtml(label)+'</strong>'+(total!=null?'<span class="service-group-total">'+money(total)+'</span>':'');
      wrap.appendChild(head);
      const first=items[0];
      first.before(wrap);
      items.forEach(card=>wrap.appendChild(card));
    });
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;group()})}
  function install(){
    const list=document.getElementById(LIST_ID);
    if(!list)return;
    if(!list.dataset.groupObserver){
      list.dataset.groupObserver='1';
      new MutationObserver(schedule).observe(list,{childList:true});
    }
    group();
  }
  let tries=0;
  const timer=setInterval(()=>{install();if(++tries>100)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

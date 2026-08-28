/* Cartões de Lançamentos: mostra apenas o número do pedido e preserva as datas de entrada e saída. */
(function(){
  const fmtDate=(v)=>{
    const s=String(v||'').trim();
    const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}` : s;
  };
  const escLocal=(s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function apply(){
    const list=document.getElementById('launchList');
    if(!list || typeof orders==='undefined' || !Array.isArray(orders)) return;
    list.querySelectorAll('.launch').forEach(card=>{
      const order=orders.find(o=>String(o.id)===String(card.dataset.id));
      const meta=card.querySelector('.meta');
      if(!order || !meta) return;
      const entry=fmtDate(order.entry_date);
      const exit=fmtDate(order.exit_date);
      const pedido=String(order.pedido||'').trim();
      const vehicle=String(order.vehicle_make_model||'').trim();
      const plate=String(order.plate||'').trim();
      const parts=[];
      if(entry) parts.push(entry);
      if(exit) parts.push(`Saída ${exit}`);
      if(pedido) parts.push(pedido);
      if(vehicle) parts.push(`<strong class="launch-vehicle">${escLocal(vehicle)}</strong>`);
      if(plate) parts.push(escLocal(plate));
      const html=parts.join(' • ');
      if(meta.innerHTML!==html) meta.innerHTML=html;
    });
  }
  function start(){
    apply();
    const list=document.getElementById('launchList');
    if(list) new MutationObserver(()=>requestAnimationFrame(apply)).observe(list,{childList:true,subtree:true});
    setTimeout(apply,300);
    setTimeout(apply,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

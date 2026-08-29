/* Agrupa os serviços pelo lançamento (order_id) mesmo depois de pesquisar/filtrar. */
(function(){
  'use strict';

  function getOrders(){
    return Array.isArray(window.orders) ? window.orders : (typeof orders !== 'undefined' && Array.isArray(orders) ? orders : []);
  }

  function getFilteredRows(){
    if(typeof window.allServiceRows!=='function') return [];
    const q=(document.getElementById('allServicesSearch')?.value||'').toLowerCase().trim();
    const pf=document.getElementById('servicePaymentFilter')?.value||'';
    const sf=document.getElementById('serviceStatusFilter')?.value||'';
    let rows=window.allServiceRows().filter(x=>{
      const text=[x.order?.client_name,x.order?.pedido,x.description,x.order?.vehicle_make_model,x.order?.plate].join(' ').toLowerCase();
      return (!q||text.includes(q)) && (!pf||(x.order?.payment_status||'EM ABERTO')===pf) && (!sf||x.service_status===sf);
    });
    rows.sort((x,y)=>String(y.order?.exit_date||'').localeCompare(String(x.order?.exit_date||'')));
    return rows;
  }

  function group(){
    const list=document.getElementById('allServicesList');
    if(!list) return;

    const cards=[...list.children].filter(el=>el.classList?.contains('service-card'));
    if(!cards.length) return;

    const rows=getFilteredRows();
    cards.forEach((card,i)=>{
      const row=rows[i];
      if(row?.order?.id) card.dataset.orderId=String(row.order.id);
    });

    const groups=new Map();
    cards.forEach(card=>{
      const id=card.dataset.orderId;
      if(!id) return;
      if(!groups.has(id)) groups.set(id,[]);
      groups.get(id).push(card);
    });

    groups.forEach((items,id)=>{
      if(items.length<2) return;
      if(items[0].parentElement?.classList.contains('service-order-group')) return;

      const order=getOrders().find(o=>String(o.id)===String(id));
      const wrap=document.createElement('div');
      wrap.className='service-order-group grouped-service';
      wrap.dataset.orderId=id;

      const head=document.createElement('div');
      head.className='service-group-head';
      const client=order?.client_name || 'Lançamento';
      const total=order?.total_sale;
      head.innerHTML='<strong>'+escapeHtml(client)+'</strong>'+(total!=null?'<span class="service-group-total">'+money(total)+'</span>':'');
      wrap.appendChild(head);

      items[0].before(wrap);
      items.forEach(card=>wrap.appendChild(card));
    });
  }

  function money(n){
    try{return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0)}
    catch(e){return 'R$ '+(Number(n)||0).toFixed(2)}
  }

  function escapeHtml(s){
    return String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  }

  function hook(){
    const fn=window.renderAllServices;
    if(typeof fn!=='function' || fn.__groupingFixed) return false;
    const wrapped=function(){
      const result=fn.apply(this,arguments);
      requestAnimationFrame(group);
      return result;
    };
    wrapped.__groupingFixed=true;
    window.renderAllServices=wrapped;
    requestAnimationFrame(group);
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    hook();
    decorateLaunchNumbers();
    if(++tries>120) clearInterval(timer);
  },250);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{hook();group();decorateLaunchNumbers()},{once:true});
  else {hook();group();decorateLaunchNumbers();}

  /* Numeração dos lançamentos: uma sequência própria para cada empresa, iniciando em 1000. */
  function decorateLaunchNumbers(){
    const data=getOrders();
    if(!data.length) return;
    addNumberCss();

    document.querySelectorAll('#launchList .launch').forEach(card=>{
      const o=data.find(x=>String(x.id)===String(card.dataset.id));
      if(!o || o.numero_lancamento==null) return;
      if(card.querySelector('.launch-number')) return;
      const name=card.querySelector('.lname');
      if(!name) return;
      const badge=document.createElement('span');
      badge.className='launch-number';
      badge.textContent='#'+o.numero_lancamento;
      name.prepend(badge);
    });

    document.querySelectorAll('#allServicesList .service-card,#allServicesList .grouped-service').forEach(card=>{
      const id=card.dataset.orderId||card.dataset.id;
      const o=data.find(x=>String(x.id)===String(id));
      if(!o || o.numero_lancamento==null) return;
      if(card.classList.contains('service-order-group')){
        const head=card.querySelector('.service-group-head');
        if(head && !head.querySelector('.launch-number')){
          const badge=document.createElement('span');
          badge.className='launch-number launch-number-services';
          badge.textContent='#'+o.numero_lancamento;
          head.prepend(badge);
        }
      }else if(!card.querySelector('.launch-number')){
        const title=card.querySelector('h3,h4,.service-title,.service-client,.client-name');
        if(title){
          const badge=document.createElement('span');
          badge.className='launch-number launch-number-services';
          badge.textContent='#'+o.numero_lancamento;
          title.prepend(badge);
        }
      }
    });

    const modalTitle=document.querySelector('#orderFixModal .modalhead h2');
    if(modalTitle && typeof currentId!=='undefined'){
      const o=data.find(x=>String(x.id)===String(currentId));
      if(o?.numero_lancamento!=null && !modalTitle.querySelector('.launch-number')){
        const badge=document.createElement('span');
        badge.className='launch-number';
        badge.textContent='#'+o.numero_lancamento;
        modalTitle.prepend(badge);
      }
    }
  }

  function addNumberCss(){
    if(document.getElementById('launch-number-css')) return;
    const s=document.createElement('style');
    s.id='launch-number-css';
    s.textContent=`
      .launch-number{display:inline-flex;align-items:center;justify-content:center;margin-right:7px;padding:3px 7px;border-radius:7px;background:#111827;color:#fff;font-size:11px;font-weight:1000;line-height:1;vertical-align:middle;white-space:nowrap}
      .launch-number-services{margin-right:8px}
      .service-group-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    `;
    document.head.appendChild(s);
  }
})();

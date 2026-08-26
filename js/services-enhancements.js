/* Todos os Serviços — filtros por período + edição sempre em popup. */
(function(){
  'use strict';
  const PERIOD_KEY='servicesPeriodFilter';
  let filter='';

  function css(){
    if(document.getElementById('services-period-css')) return;
    const s=document.createElement('style'); s.id='services-period-css';
    s.textContent=`
      .services-period-buttons{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
      .services-period-buttons .btn{padding:8px 13px;font-weight:800}
      .services-period-buttons .btn.active{background:var(--brand);color:#fff;border-color:var(--brand)}
      @media(max-width:700px){.services-period-buttons{gap:5px}.services-period-buttons .btn{padding:7px 10px;font-size:12px}}
    `;
    document.head.appendChild(s);
  }

  function dateOnly(value){return value?new Date(value+'T00:00:00'):null}
  function today(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
  function inPeriod(o){
    const value=o?.exit_date||o?.entry_date; if(!value) return false;
    const d=dateOnly(value), ref=dateOnly(today());
    if(!d||!ref) return false;
    if(filter==='year') return d.getFullYear()===ref.getFullYear();
    if(filter==='month') return d.getFullYear()===ref.getFullYear() && d.getMonth()===ref.getMonth();
    if(filter==='week'){
      const start=new Date(ref); const day=start.getDay(); start.setDate(start.getDate()-day); start.setHours(0,0,0,0);
      const end=new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999);
      return d>=start&&d<=end;
    }
    return true;
  }

  function addButtons(){
    const host=document.getElementById('services'); if(!host) return;
    const toolbar=host.querySelector('.service-toolbar'); if(!toolbar) return;
    let box=toolbar.querySelector('.services-period-buttons');
    if(!box){
      box=document.createElement('div'); box.className='services-period-buttons';
      box.innerHTML='<button type="button" class="btn period-service" data-services-period="week">Semana</button><button type="button" class="btn period-service" data-services-period="month">Mês</button><button type="button" class="btn period-service" data-services-period="year">Ano</button>';
      toolbar.appendChild(box);
      box.querySelectorAll('.period-service').forEach(b=>b.addEventListener('click',()=>{
        filter=filter===b.dataset.servicesPeriod?'':b.dataset.servicesPeriod;
        localStorage.setItem(PERIOD_KEY,filter);
        box.querySelectorAll('.period-service').forEach(x=>x.classList.toggle('active',x.dataset.servicesPeriod===filter));
        render();
      }));
    }
    box.querySelectorAll('.period-service').forEach(x=>x.classList.toggle('active',x.dataset.servicesPeriod===filter));
  }

  function render(){
    if(typeof window.renderAllServices==='function') window.renderAllServices();
  }

  function wrapRender(){
    if(typeof window.renderAllServices!=='function'||window.renderAllServices.__periodWrapped) return;
    const original=window.renderAllServices;
    const wrappedRender=function(){
      original.apply(this,arguments);
      if(!filter) return;
      const list=document.getElementById('allServicesList');
      if(list){
        list.querySelectorAll('.grouped-service').forEach(card=>{
          const id=card.dataset.orderId;
          const o=(typeof orders!=='undefined'?orders:[]).find(x=>String(x.id)===String(id));
          card.style.display=inPeriod(o)?'':'none';
        });
        const visible=[...list.querySelectorAll('.grouped-service')].filter(x=>x.style.display!=='none').length;
        const empty=list.querySelector('.empty');
        if(empty) empty.style.display=visible?'none':'';
      }
    };
    wrappedRender.__periodWrapped=true;
    window.renderAllServices=wrappedRender;
  }

  function ensurePopup(){
    if(typeof window.editOrder!=='function'||window.editOrder.__popupWrapped) return;
    const original=window.editOrder;
    const wrappedEdit=function(id){
      const result=original.apply(this,arguments);
      setTimeout(()=>{
        const modal=document.getElementById('orderFixModal');
        if(modal) modal.classList.remove('hidden');
      },80);
      return result;
    };
    wrappedEdit.__popupWrapped=true;
    window.editOrder=wrappedEdit;
  }

  function install(){
    css();
    const saved=localStorage.getItem(PERIOD_KEY); if(['week','month','year'].includes(saved)) filter=saved;
    addButtons();
    wrapRender();
    ensurePopup();
  }

  let tries=0;
  const timer=setInterval(()=>{install(); if(++tries>50)clearInterval(timer)},200);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();

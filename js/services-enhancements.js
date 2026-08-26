/* Todos os Serviços — filtros por período + edição sempre em popup + destaque de pagamento. */
(function(){
  'use strict';
  const PERIOD_KEY='servicesPeriodFilter';
  const PAYMENT_FLAG='FALTA ACERTAR';
  let filter='';

  function css(){
    if(document.getElementById('services-period-css')) return;
    const s=document.createElement('style'); s.id='services-period-css';
    s.textContent=`
      .services-period-buttons{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
      .services-period-buttons .btn{padding:8px 13px;font-weight:800}
      .services-period-buttons .btn.active{background:var(--brand);color:#fff;border-color:var(--brand)}
      .payment-falta-acertar{background:linear-gradient(135deg,#1264d8 0%,#0b4da8 100%) !important;border-color:#2d83ff !important;box-shadow:0 8px 24px rgba(8,91,205,.28),inset 0 1px 0 rgba(255,255,255,.12) !important;color:#fff !important}
      .payment-falta-acertar .lname,.payment-falta-acertar .service-desc,.payment-falta-acertar .grouped-main .lname{color:#fff !important}
      .payment-falta-acertar .meta,.payment-falta-acertar .grouped-date small,.payment-falta-acertar .service-date small,.payment-falta-acertar .service-main small{color:#dcecff !important}
      .payment-falta-acertar .chip{background:#0a3f8c !important;border-color:#67aaff !important;color:#fff !important}
      .payment-falta-acertar .chip:last-child{background:#fff !important;color:#0750ae !important;font-weight:900;border-color:#fff !important}
      .payment-falta-acertar .service-actions-v2 button{background:#0a3f8c !important;color:#fff !important;border-color:#67aaff !important}
      @media(max-width:700px){.services-period-buttons{gap:5px}.services-period-buttons .btn{padding:7px 10px;font-size:12px}}
    `;
    document.head.appendChild(s);
  }

  function addPaymentOption(){
    ['payment','servicePaymentFilter'].forEach(id=>{
      const el=document.getElementById(id); if(!el) return;
      if(![...el.options].some(o=>o.value===PAYMENT_FLAG)){
        const o=document.createElement('option'); o.value=PAYMENT_FLAG; o.textContent=PAYMENT_FLAG; el.appendChild(o);
      }
    });
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

  function highlightPayments(){
    const data=typeof orders!=='undefined'?orders:[];
    document.querySelectorAll('#launchList .launch').forEach(card=>{
      const o=data.find(x=>String(x.id)===String(card.dataset.id));
      card.classList.toggle('payment-falta-acertar',String(o?.payment_status||'')===PAYMENT_FLAG);
    });
    document.querySelectorAll('#allServicesList .grouped-service, #allServicesList .service-card').forEach(card=>{
      const id=card.dataset.orderId||card.dataset.id;
      const o=data.find(x=>String(x.id)===String(id));
      card.classList.toggle('payment-falta-acertar',String(o?.payment_status||'')===PAYMENT_FLAG);
    });
  }

  function wrapRender(name){
    if(typeof window[name]!=='function'||window[name].__paymentFlagWrapped) return;
    const original=window[name];
    const wrapped=function(){
      const result=original.apply(this,arguments);
      requestAnimationFrame(()=>{addPaymentOption();highlightPayments()});
      return result;
    };
    wrapped.__paymentFlagWrapped=true;
    window[name]=wrapped;
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
    requestAnimationFrame(()=>{addPaymentOption();highlightPayments()});
  }

  function wrapRenderServices(){
    if(typeof window.renderAllServices!=='function'||window.renderAllServices.__periodWrapped) return;
    const original=window.renderAllServices;
    const wrappedRender=function(){
      original.apply(this,arguments);
      if(filter){
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
      }
      requestAnimationFrame(()=>{addPaymentOption();highlightPayments()});
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
    addPaymentOption();
    const saved=localStorage.getItem(PERIOD_KEY); if(['week','month','year'].includes(saved)) filter=saved;
    addButtons();
    wrapRenderServices();
    wrapRender('renderLaunches');
    ensurePopup();
    requestAnimationFrame(highlightPayments);
  }

  let tries=0;
  const timer=setInterval(()=>{install(); if(++tries>60)clearInterval(timer)},200);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();

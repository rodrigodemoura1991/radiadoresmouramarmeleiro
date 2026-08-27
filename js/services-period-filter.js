/* Filtro de período da aba Serviços: semana, mês e ano. */
(function(){
  'use strict';
  const ID='servicesPeriodFilter';
  const DATE_ID='servicesPeriodDate';
  let mode='all';

  function pad(n){return String(n).padStart(2,'0')}
  function isoLocal(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function parseDate(value){
    if(!value)return null;
    const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m)return null;
    return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  }
  function periodRange(){
    const input=document.getElementById(DATE_ID);
    const ref=parseDate(input&&input.value)||new Date();
    if(mode==='week'){
      const start=new Date(ref);
      const day=start.getDay();
      start.setDate(start.getDate()-(day===0?6:day-1));
      const end=new Date(start); end.setDate(start.getDate()+6);
      return [start,end];
    }
    if(mode==='month')return [new Date(ref.getFullYear(),ref.getMonth(),1),new Date(ref.getFullYear(),ref.getMonth()+1,0)];
    if(mode==='year')return [new Date(ref.getFullYear(),0,1),new Date(ref.getFullYear(),11,31)];
    return null;
  }
  function getOrders(){
    if(typeof orders!=='undefined'&&Array.isArray(orders))return orders;
    return Array.isArray(window.orders)?window.orders:[];
  }
  function matches(order){
    if(mode==='all')return true;
    const range=periodRange();
    if(!range)return true;
    const d=parseDate(order.exit_date||order.entry_date);
    return !!d&&d>=range[0]&&d<=range[1];
  }
  function apply(){
    const list=document.getElementById('allServicesList');
    if(!list)return;
    const data=getOrders();
    list.querySelectorAll('.service-card,.grouped-service').forEach(card=>{
      const id=card.dataset.orderId||card.dataset.id;
      if(!id){card.hidden=false;return;}
      const order=data.find(o=>String(o.id)===String(id));
      card.hidden=!matches(order||{});
    });
    const info=document.getElementById('servicesPeriodInfo');
    if(info){
      if(mode==='all')info.textContent='Todos os períodos';
      else{const r=periodRange();info.textContent=(mode==='week'?'Semana: ':mode==='month'?'Mês: ':'Ano: ')+isoLocal(r[0])+' até '+isoLocal(r[1]);}
    }
  }
  function addUI(){
    const toolbar=document.querySelector('#services .service-toolbar');
    if(!toolbar||document.getElementById(ID))return;
    const wrap=document.createElement('div');
    wrap.id=ID;wrap.className='services-period-controls';
    wrap.innerHTML='<label>Período</label><div class="services-period-buttons"><button type="button" data-period="all" class="active">Todos</button><button type="button" data-period="week">Semana</button><button type="button" data-period="month">Mês</button><button type="button" data-period="year">Ano</button></div><input id="'+DATE_ID+'" type="date" aria-label="Data de referência do período"><small id="servicesPeriodInfo">Todos os períodos</small>';
    toolbar.appendChild(wrap);
    const date=document.getElementById(DATE_ID);if(date)date.value=isoLocal(new Date());
    wrap.querySelectorAll('[data-period]').forEach(btn=>btn.addEventListener('click',function(){
      mode=this.dataset.period;wrap.querySelectorAll('[data-period]').forEach(x=>x.classList.toggle('active',x===this));apply();
    }));
    if(date)date.addEventListener('change',apply);
  }
  function install(){
    addUI();apply();
    const list=document.getElementById('allServicesList');
    if(list&&!list.dataset.periodObserver){
      list.dataset.periodObserver='1';
      new MutationObserver(()=>requestAnimationFrame(apply)).observe(list,{childList:true,subtree:true});
    }
    const original=window.renderAllServices;
    if(typeof original==='function'&&!original.__periodFilterWrapped){
      const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(()=>{addUI();apply()});return r};
      wrapped.__periodFilterWrapped=true;window.renderAllServices=wrapped;
    }
  }
  let tries=0;const timer=setInterval(()=>{install();if(++tries>80)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

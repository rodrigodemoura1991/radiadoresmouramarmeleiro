/* Radiadores Moura — Resumo rápido da página de lançamentos */
(function(){
  'use strict';

  function moneyLocal(n){
    return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  }
  function localToday(){
    const d=new Date();
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function dateObj(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):null;
  }
  function iso(d){
    return d.toISOString().slice(0,10);
  }
  function bounds(mode){
    const today=localToday();
    const ref=dateObj(today);
    if(mode==='day') return [today,today];
    if(mode==='yesterday'){
      const d=new Date(ref); d.setDate(d.getDate()-1);
      const v=iso(d); return [v,v];
    }
    if(mode==='week'){
      const d=new Date(ref);
      const day=d.getDay()||7;
      d.setDate(d.getDate()-day+1);
      const e=new Date(d); e.setDate(e.getDate()+6);
      return [iso(d),iso(e)];
    }
    if(mode==='month'){
      const d=new Date(ref.getFullYear(),ref.getMonth(),1);
      const e=new Date(ref.getFullYear(),ref.getMonth()+1,0);
      return [iso(d),iso(e)];
    }
    if(mode==='prev-month'){
      const d=new Date(ref.getFullYear(),ref.getMonth()-1,1);
      const e=new Date(ref.getFullYear(),ref.getMonth(),0);
      return [iso(d),iso(e)];
    }
    const s=document.getElementById('launchSummaryStart')?.value||today;
    const e=document.getElementById('launchSummaryEnd')?.value||today;
    return [s<=e?s:e,s<=e?e:s];
  }
  function inRange(v,a,b){
    const d=String(v||'').slice(0,10);
    return !!d && d>=a && d<=b;
  }

  function build(){
    const launch=document.getElementById('launch');
    if(!launch || document.getElementById('launchSummary')) return;

    const head=launch.querySelector('.head');
    const cards=[...launch.children].filter(x=>x!==head);
    const layout=document.createElement('div');
    layout.className='launch-dashboard-layout';
    const main=document.createElement('div');
    main.className='launch-dashboard-main';
    const aside=document.createElement('aside');
    aside.id='launchSummary';
    aside.className='launch-summary card';

    if(head) layout.appendChild(head);
    cards.forEach(x=>main.appendChild(x));
    layout.appendChild(main);
    layout.appendChild(aside);
    launch.appendChild(layout);

    aside.innerHTML=`
      <div class="launch-summary-head">
        <div>
          <h3>Resumo do período</h3>
          <small id="launchSummaryLabel">Hoje</small>
        </div>
        <select id="launchSummaryPeriod" aria-label="Período do resumo">
          <option value="day">Hoje</option>
          <option value="yesterday">Ontem</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mês</option>
          <option value="prev-month">Mês anterior</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>
      <div id="launchSummaryCustom" class="launch-summary-custom hidden">
        <label>De <input id="launchSummaryStart" type="date"></label>
        <label>Até <input id="launchSummaryEnd" type="date"></label>
      </div>
      <div class="launch-summary-section">
        <div class="launch-summary-title">Serviços</div>
        <div class="launch-summary-stats">
          <div class="summary-stat"><span>Entraram</span><b id="sumEntered">0</b></div>
          <div class="summary-stat"><span>Saíram</span><b id="sumExited">0</b></div>
          <div class="summary-stat"><span>Em andamento</span><b id="sumOpen">0</b></div>
        </div>
      </div>
      <div class="launch-summary-section">
        <div class="launch-summary-title">Financeiro</div>
        <div class="summary-finance">
          <div><span>Vendas</span><b id="sumSales">R$ 0,00</b></div>
          <div><span>Custos</span><b id="sumCosts">R$ 0,00</b></div>
          <div class="summary-profit"><span>Lucro líquido*</span><b id="sumProfit">R$ 0,00</b></div>
          <div><span>Margem</span><b id="sumMargin">0,0%</b></div>
        </div>
      </div>
      <div class="summary-ticket">
        <span>Ticket médio</span><b id="sumTicket">R$ 0,00</b>
      </div>
      <small class="launch-summary-note">* Considera venda − custo − imposto dos serviços que entraram no período.</small>
    `;

    const select=document.getElementById('launchSummaryPeriod');
    const custom=document.getElementById('launchSummaryCustom');
    const start=document.getElementById('launchSummaryStart');
    const end=document.getElementById('launchSummaryEnd');

    function refresh(){
      const mode=select.value;
      custom.classList.toggle('hidden',mode!=='custom');
      if(mode==='custom' && !start.value){start.value=localToday();end.value=localToday();}
      const [a,b]=bounds(mode);
      const data=Array.isArray(orders)?orders:[];
      const enteredOrders=data.filter(o=>inRange(o.entry_date,a,b));
      const exitedOrders=data.filter(o=>inRange(o.exit_date,a,b));
      const entered=enteredOrders.flatMap(o=>Array.isArray(o.order_items)?o.order_items:[]);
      const exited=exitedOrders.flatMap(o=>Array.isArray(o.order_items)?o.order_items:[]);
      const sales=entered.reduce((s,i)=>s+(Number(i.sale_value)||0),0);
      const costs=entered.reduce((s,i)=>s+(Number(i.cost_value)||0),0);
      const taxes=entered.reduce((s,i)=>s+(Number(i.sale_value)||0)*(Number(i.tax_rate)||0)/100,0);
      const profit=sales-costs-taxes;
      const margin=sales?profit/sales*100:0;
      const ticket=entered.length?sales/entered.length:0;
      const exitedIds=new Set(exitedOrders.map(o=>o.id));
      const open=data.flatMap(o=>Array.isArray(o.order_items)?o.order_items.map(i=>({i,o})):[]).filter(x=>inRange(x.o.entry_date,a,b)&&!exitedIds.has(x.o.id)).length;

      document.getElementById('sumEntered').textContent=entered.length;
      document.getElementById('sumExited').textContent=exited.length;
      document.getElementById('sumOpen').textContent=open;
      document.getElementById('sumSales').textContent=moneyLocal(sales);
      document.getElementById('sumCosts').textContent=moneyLocal(costs);
      document.getElementById('sumProfit').textContent=moneyLocal(profit);
      document.getElementById('sumMargin').textContent=margin.toFixed(1).replace('.',',')+'%';
      document.getElementById('sumTicket').textContent=moneyLocal(ticket);

      const labels={day:'Hoje',yesterday:'Ontem',week:'Esta semana',month:'Este mês','prev-month':'Mês anterior',custom:'Período personalizado'};
      document.getElementById('launchSummaryLabel').textContent=mode==='custom'?('De '+a.split('-').reverse().join('/')+' até '+b.split('-').reverse().join('/')):labels[mode];
    }

    select.addEventListener('change',refresh);
    start.addEventListener('change',refresh);
    end.addEventListener('change',refresh);
    refresh();

    window.renderLaunchSummary=refresh;
    if(typeof window.renderAll==='function'){
      const oldRenderAll=window.renderAll;
      window.renderAll=function(){
        oldRenderAll();
        refresh();
      };
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build);
  else build();
})();

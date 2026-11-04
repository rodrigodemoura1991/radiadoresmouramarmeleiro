/* Radiadores Moura — Resumo do período na página inicial */
(function(){
  'use strict';

  const moneyLocal=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  function localToday(){
    const d=new Date();
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function dateObj(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):null;
  }
  const iso=d=>d.toISOString().slice(0,10);
  function bounds(mode){
    const today=localToday(),ref=dateObj(today);
    if(mode==='day')return[today,today];
    if(mode==='yesterday'){const d=new Date(ref);d.setDate(d.getDate()-1);const v=iso(d);return[v,v];}
    if(mode==='week'){const d=new Date(ref),day=d.getDay()||7;d.setDate(d.getDate()-day+1);const e=new Date(d);e.setDate(e.getDate()+6);return[iso(d),iso(e)];}
    if(mode==='month'){const d=new Date(ref.getFullYear(),ref.getMonth(),1),e=new Date(ref.getFullYear(),ref.getMonth()+1,0);return[iso(d),iso(e)];}
    if(mode==='prev-month'){const d=new Date(ref.getFullYear(),ref.getMonth()-1,1),e=new Date(ref.getFullYear(),ref.getMonth(),0);return[iso(d),iso(e)];}
    const s=document.getElementById('launchSummaryStart')?.value||today,e=document.getElementById('launchSummaryEnd')?.value||today;
    return[s<=e?s:e,s<=e?e:s];
  }
  function inRange(v,a,b){const d=String(v||'').slice(0,10);return!!d&&d>=a&&d<=b;}
  function orderItems(o){
    if(Array.isArray(o?.order_items)&&o.order_items.length)return o.order_items;
    // Lançamentos antigos sem itens detalhados continuam contando como um serviço.
    return [{description:'Lançamento',sale_value:Number(o?.total_sale)||0,cost_value:Number(o?.total_cost)||0,freight_value:Number(o?.total_freight)||0,tax_rate:0}];
  }

  function build(){
    const launch=document.getElementById('launch');
    if(!launch||document.getElementById('launchSummary'))return;
    const head=launch.querySelector('.head');
    const cards=[...launch.children].filter(x=>x!==head);
    const layout=document.createElement('div');layout.className='launch-dashboard-layout';
    const main=document.createElement('div');main.className='launch-dashboard-main';
    const right=document.createElement('div');right.className='launch-dashboard-side';
    const aside=document.createElement('aside');aside.id='launchSummary';aside.className='launch-summary card';
    if(head)layout.appendChild(head);
    cards.forEach(x=>main.appendChild(x));
    layout.appendChild(main);right.appendChild(aside);layout.appendChild(right);launch.appendChild(layout);
    aside.innerHTML=`
      <div class="launch-summary-head"><div><h3>Resumo do período</h3><small id="launchSummaryLabel">Hoje</small></div>
      <select id="launchSummaryPeriod" aria-label="Período do resumo"><option value="day">Hoje</option><option value="yesterday">Ontem</option><option value="week">Esta semana</option><option value="month">Este mês</option><option value="prev-month">Mês anterior</option><option value="custom">Personalizado</option></select></div>
      <div id="launchSummaryCustom" class="launch-summary-custom hidden"><label>De <input id="launchSummaryStart" type="date"></label><label>Até <input id="launchSummaryEnd" type="date"></label></div>
      <div class="launch-summary-section"><div class="launch-summary-title">Movimentação de serviços</div><div class="launch-summary-stats"><div class="summary-stat"><span>Entraram</span><b id="sumEntered">0</b></div><div class="summary-stat"><span>Saíram</span><b id="sumExited">0</b></div></div></div>
      <div class="launch-summary-section"><div class="launch-summary-title">Financeiro das saídas</div><div class="summary-finance"><div><span>Valor bruto</span><b id="sumSales">R$ 0,00</b></div><div><span>Descontos</span><b id="sumDiscount">R$ 0,00</b></div><div><span>Valor líquido</span><b id="sumProfit">R$ 0,00</b></div></div></div>
      <small class="launch-summary-note">Entradas são contadas pela data de entrada; saídas e valores financeiros, pela data de saída. O status do serviço não interfere nas quantidades. O valor líquido corresponde à venda menos descontos, custos, frete e impostos. Lançamentos ocultos continuam nas quantidades, mas ficam fora dos valores do balanço normal.</small>`;
    const select=document.getElementById('launchSummaryPeriod');
    const custom=document.getElementById('launchSummaryCustom');
    const start=document.getElementById('launchSummaryStart');
    const end=document.getElementById('launchSummaryEnd');

    function refresh(){
      const mode=select.value;
      custom.classList.toggle('hidden',mode!=='custom');
      if(mode==='custom'&&!start.value){start.value=localToday();end.value=localToday();}
      const[a,b]=bounds(mode),data=Array.isArray(orders)?orders:[];
      // Contagens: cada serviço/peça é contado pela data correspondente, sem filtro de status.
      const entered=data.filter(o=>inRange(o.entry_date,a,b)).reduce((n,o)=>n+orderItems(o).length,0);
      const exitedOrders=data.filter(o=>inRange(o.exit_date,a,b));
      const exited=exitedOrders.reduce((n,o)=>n+orderItems(o).length,0);

      // O financeiro usa exatamente a mesma função do Balanço.
      const financial=window.calculateFinancialPeriod(data,a,b,false).totals;
      const sales=financial.gross,discounts=financial.discounts,net=financial.profit;
      document.getElementById('sumEntered').textContent=entered;
      document.getElementById('sumExited').textContent=exited;
      document.getElementById('sumSales').textContent=moneyLocal(sales);
      document.getElementById('sumDiscount').textContent=moneyLocal(discounts);
      document.getElementById('sumProfit').textContent=moneyLocal(net);
      const labels={day:'Hoje',yesterday:'Ontem',week:'Esta semana',month:'Este mês','prev-month':'Mês anterior',custom:'Período personalizado'};
      document.getElementById('launchSummaryLabel').textContent=mode==='custom'?('De '+a.split('-').reverse().join('/')+' até '+b.split('-').reverse().join('/')):labels[mode];
    }
    select.addEventListener('change',refresh);
    start.addEventListener('change',refresh);
    end.addEventListener('change',refresh);
    refresh();
    window.renderLaunchSummary=refresh;
    if(typeof renderAll==='function'){
      const oldRenderAll=renderAll;
      renderAll=function(){oldRenderAll();refresh();};
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
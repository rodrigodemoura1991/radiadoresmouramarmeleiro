/* Dashboard do Balanço: serviços feitos, faturamento bruto/líquido e evolução do faturamento. */
(function(){
  const $=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const css=`
    .balance-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}
    .balance-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:15px 16px;box-shadow:0 3px 12px #1720330b}
    .balance-kpi small{display:block;color:var(--muted);font-weight:700;font-size:12px;margin-bottom:6px}.balance-kpi b{font-size:21px;color:var(--ink)}
    .balance-kpi .green{color:#138a5b}.balance-kpi .blue{color:#245a91}
    .billing-chart{margin-top:14px}.billing-chart-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.billing-chart-head h3{margin:0}.billing-chart-head small{color:var(--muted);font-weight:700}
    .billing-chart-wrap{height:270px;border:1px solid var(--line);border-radius:12px;padding:12px;background:#fff;overflow:hidden}.billing-chart svg{width:100%;height:100%;display:block}.chart-grid{stroke:#dfe5ec;stroke-width:1}.chart-axis{fill:#687386;font-size:10px;font-weight:700}.chart-area{fill:#245a9120}.chart-line{fill:none;stroke:#245a91;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.chart-dot{fill:#fff;stroke:#245a91;stroke-width:2}.chart-value{fill:#172033;font-size:10px;font-weight:800}
    @media(max-width:760px){.balance-kpis{grid-template-columns:1fr}.billing-chart-wrap{height:230px}}
  `;
  function inject(){if($('balanco-dashboard-css'))return;const s=document.createElement('style');s.id='balanco-dashboard-css';s.textContent=css;document.head.appendChild(s)}
  function periodBounds(){
    const date=$('balanceDate')?.value||new Date().toISOString().slice(0,10);
    const ref=new Date(date+'T00:00:00');let start,end;
    if(window.period==='year'){start=new Date(ref.getFullYear(),0,1);end=new Date(ref.getFullYear(),11,31)}
    else if(window.period==='month'){start=new Date(ref.getFullYear(),ref.getMonth(),1);end=new Date(ref.getFullYear(),ref.getMonth()+1,0)}
    else if(window.period==='week'){const d=ref.getDay();start=new Date(ref);start.setDate(ref.getDate()-d);end=new Date(start);end.setDate(start.getDate()+6)}
    else {start=new Date(ref);end=new Date(ref)}
    return {start,end};
  }
  function inRange(o,start,end){if(!o?.entry_date)return false;const d=new Date(o.entry_date+'T00:00:00');return d>=start&&d<=end}
  function serviceRows(o){return (o?.order_items||[]).filter(i=>['Pronto','Pronto entregue'].includes(String(i.service_status||'')))}
  function getData(){
    const orders=window.orders||[];const {start,end}=periodBounds();const selected=orders.filter(o=>inRange(o,start,end));
    const made=selected.reduce((n,o)=>n+serviceRows(o).length,0);
    const gross=selected.reduce((n,o)=>n+Number(o.total_sale||0),0);
    const net=selected.reduce((n,o)=>n+Number(o.net_profit||0),0);
    return {selected,made,gross,net,start,end};
  }
  function upsertKpis(data){
    let box=$('balanceKpis');if(!box){box=document.createElement('div');box.id='balanceKpis';box.className='balance-kpis';const cards=$('balanceCards');if(cards)cards.parentNode.insertBefore(box,cards.nextSibling);}
    box.innerHTML=`<div class="balance-kpi"><small>Quantidade de serviços feitos</small><b>${data.made}</b></div><div class="balance-kpi"><small>Valor bruto</small><b class="blue">${money(data.gross)}</b></div><div class="balance-kpi"><small>Valor líquido</small><b class="green">${money(data.net)}</b></div>`;
  }
  function bucketData(){
    const {start,end}=periodBounds(),orders=window.orders||[];let labels=[],vals=[];
    const days=Math.round((end-start)/86400000)+1;
    if(window.period==='day'){
      for(let h=0;h<24;h++){labels.push(String(h).padStart(2,'0')+'h');vals.push(0)}
      orders.forEach(o=>{if(!inRange(o,start,end))return;const d=o.entry_date;const items=serviceRows(o);if(!items.length)return;const h=Number(o.created_at?String(o.created_at).slice(11,13):12);vals[h]+=Number(o.total_sale||0)})
    }else if(window.period==='week'){
      labels=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];vals=Array(7).fill(0);orders.forEach(o=>{if(!inRange(o,start,end)||!serviceRows(o).length)return;const d=new Date(o.entry_date+'T00:00:00');vals[d.getDay()]+=Number(o.total_sale||0)})
    }else if(window.period==='month'){
      const n=end.getDate();labels=Array.from({length:n},(_,i)=>String(i+1));vals=Array(n).fill(0);orders.forEach(o=>{if(!inRange(o,start,end)||!serviceRows(o).length)return;const day=Number(o.entry_date.slice(8,10));vals[day-1]+=Number(o.total_sale||0)})
    }else{
      labels=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];vals=Array(12).fill(0);orders.forEach(o=>{if(!inRange(o,start,end)||!serviceRows(o).length)return;const m=Number(o.entry_date.slice(5,7));vals[m-1]+=Number(o.total_sale||0)})
    }
    return {labels,vals};
  }
  function renderChart(){
    const host=$('billingChart');if(!host)return;const {labels,vals}=bucketData();const W=900,H=250,L=48,R=18,T=20,B=38,iw=W-L-R,ih=H-T-B,max=Math.max(...vals,1);const points=vals.map((v,i)=>[L+(labels.length===1?iw/2:L+i*(iw/Math.max(1,labels.length-1))),T+ih-(v/max)*ih]);const path=points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');const area=path+' L '+points[points.length-1][0]+' '+(T+ih)+' L '+points[0][0]+' '+(T+ih)+' Z';
    const step=Math.max(1,Math.ceil(labels.length/8));const xlabels=labels.map((l,i)=>i%step===0?`<text class="chart-axis" x="${points[i][0]}" y="${H-12}" text-anchor="middle">${esc(l)}</text>`:'').join('');const dots=points.map((p,i)=>vals[i]>0?`<circle class="chart-dot" cx="${p[0]}" cy="${p[1]}" r="4"><title>${esc(labels[i])}: ${money(vals[i])}</title></circle>`:'').join('');
    const grids=[0,.25,.5,.75,1].map(r=>{const y=T+ih-r*ih;return `<line class="chart-grid" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="chart-axis" x="${L-7}" y="${y+3}" text-anchor="end">${money(max*r).replace(',00','')}</text>`}).join('');
    host.innerHTML=`<div class="billing-chart-head"><h3>Desenvolvimento do faturamento</h3><small>Somente serviços Pronto e Pronto entregue</small></div><div class="billing-chart-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grids}<path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>${dots}${xlabels}</svg></div>`;
  }
  function render(){inject();const data=getData();upsertKpis(data);let host=$('billingChart');if(!host){host=document.createElement('div');host.id='billingChart';host.className='card billing-chart';const breakdown=$('breakdown');if(breakdown?.parentNode)breakdown.parentNode.insertBefore(host,breakdown.parentNode.firstChild);else $('balance')?.appendChild(host)}renderChart()}
  function install(){
    if(typeof window.renderBalance==='function'&&!window.renderBalance.__dashboardWrapped){const original=window.renderBalance;const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(render);return r};wrapped.__dashboardWrapped=true;window.renderBalance=wrapped}
    document.querySelectorAll('.period').forEach(b=>{if(b.dataset.dashboardBound)return;b.dataset.dashboardBound='1';b.addEventListener('click',()=>setTimeout(render,30))});
    ['balanceDate','balanceStart','balanceEnd'].forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(render,30)));
    render();
  }
  let tries=0;const timer=setInterval(()=>{install();if(++tries>40)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

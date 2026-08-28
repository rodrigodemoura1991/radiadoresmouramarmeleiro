/* Agrupa os lançamentos pela DATA DE SAÍDA, independentemente da sequência original. */
(function(){
  'use strict';
  function getOrders(){try{return Array.isArray(orders)?orders:[]}catch(e){return[]}}
  function dateKey(o){return String(o?.exit_date||'').slice(0,10)}
  function fullDate(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:'Sem data'}
  function groupByExitDate(){
    const list=document.getElementById('launchList');if(!list)return;
    list.querySelectorAll('.launch-day-separator').forEach(el=>el.remove());
    const sourceOrders=getOrders(),cards=[...list.querySelectorAll(':scope > .launch')];if(!cards.length)return;
    const orderMap=new Map(sourceOrders.map(o=>[String(o.id),o]));
    cards.sort((a,b)=>{const da=dateKey(orderMap.get(String(a.dataset.id))||{}),db=dateKey(orderMap.get(String(b.dataset.id))||{});if(da!==db){if(!da)return 1;if(!db)return -1;return db.localeCompare(da)}return 0});
    const fragment=document.createDocumentFragment();let lastDay=null;
    cards.forEach(card=>{const day=dateKey(orderMap.get(String(card.dataset.id))||{});if(day!==lastDay){const sep=document.createElement('div');sep.className='launch-day-separator';sep.innerHTML='<span>'+fullDate(day)+'</span>';fragment.appendChild(sep);lastDay=day}fragment.appendChild(card)});
    list.appendChild(fragment);
  }
  function install(){
    groupByExitDate();
    if(typeof window.renderLaunches==='function'&&!window.renderLaunches.__exitDateGroupingFixed){const original=window.renderLaunches;const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(groupByExitDate);return r};wrapped.__exitDateGroupingFixed=true;window.renderLaunches=wrapped}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  let lastSignature='';setInterval(()=>{const list=document.getElementById('launchList');if(!list)return;const signature=[...list.querySelectorAll(':scope > .launch')].map(c=>c.dataset.id).join('|');if(signature!==lastSignature){lastSignature=signature;groupByExitDate()}},500);
})();

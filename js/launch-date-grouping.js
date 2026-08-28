/* Agrupa os lançamentos pela DATA DE SAÍDA, independentemente da sequência original. */
(function(){
  'use strict';

  function getOrders(){
    return Array.isArray(window.orders) ? window.orders : [];
  }

  function dateKey(order){
    return String(order?.exit_date || '').slice(0,10);
  }

  function fullDate(v){
    const s=String(v||'');
    const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : (s || 'Sem data');
  }

  function escapeHtml(s){
    return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function groupByExitDate(){
    const list=document.getElementById('launchList');
    if(!list) return;

    list.querySelectorAll('.launch-day-separator').forEach(el=>el.remove());

    const orders=getOrders();
    const cards=[...list.querySelectorAll(':scope > .launch')];
    if(!cards.length) return;

    const orderMap=new Map(orders.map(o=>[String(o.id),o]));

    // Reordena fisicamente os cartões pela data de SAÍDA, do mais recente para o mais antigo.
    cards.sort((a,b)=>{
      const oa=orderMap.get(String(a.dataset.id))||{};
      const ob=orderMap.get(String(b.dataset.id))||{};
      const da=dateKey(oa), db=dateKey(ob);
      if(da!==db) return db.localeCompare(da);
      // Mantém uma ordem estável dentro do mesmo dia.
      return String(ob.id||'').localeCompare(String(oa.id||''));
    });

    const fragment=document.createDocumentFragment();
    let lastDay=null;
    cards.forEach(card=>{
      const order=orderMap.get(String(card.dataset.id))||{};
      const day=dateKey(order);
      if(day!==lastDay){
        const sep=document.createElement('div');
        sep.className='launch-day-separator';
        sep.innerHTML='<span>Saída: '+escapeHtml(fullDate(day))+'</span>';
        fragment.appendChild(sep);
        lastDay=day;
      }
      fragment.appendChild(card);
    });

    list.appendChild(fragment);
  }

  function install(){
    groupByExitDate();
    if(typeof window.renderLaunches==='function' && !window.renderLaunches.__exitDateGroupingFixed){
      const original=window.renderLaunches;
      const wrapped=function(){
        const result=original.apply(this,arguments);
        requestAnimationFrame(groupByExitDate);
        return result;
      };
      wrapped.__exitDateGroupingFixed=true;
      window.renderLaunches=wrapped;
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }

  // Garante a reorganização após filtros, carregamento da nuvem ou outros scripts que redesenhem a lista.
  let lastSignature='';
  setInterval(()=>{
    const list=document.getElementById('launchList');
    if(!list) return;
    const signature=[...list.querySelectorAll(':scope > .launch')].map(c=>c.dataset.id).join('|');
    if(signature!==lastSignature){
      lastSignature=signature;
      groupByExitDate();
    }
  },500);
})();

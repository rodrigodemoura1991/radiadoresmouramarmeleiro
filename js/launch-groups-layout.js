/* Ajustes finais da página Lançamentos: datas maiores, sem legenda e grupos por saída. */
(function(){
  'use strict';
  const LIST_ID='launchList';
  const STYLE_ID='launch-groups-layout-css';

  function injectCss(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .launch-color-legend,.launch-legend{display:none!important}
      #${LIST_ID} .launch-group-divider{
        display:flex!important;align-items:center!important;gap:9px!important;
        margin:8px 5px 5px!important;color:#17324d!important;
        font-weight:1000!important;font-size:10.5px!important;
      }
      #${LIST_ID} .launch-group-divider::before,
      #${LIST_ID} .launch-group-divider::after{
        content:"";height:1px;background:#cbd8e7;flex:1;
      }
      #${LIST_ID} .launch-group-divider span{
        background:#edf3fa;border:1px solid #d4e0ed;border-radius:14px;
        padding:4px 10px;white-space:nowrap;
      }
      #${LIST_ID} .launch-card-v3 .grouped-date b{
        font-size:11.5px!important;line-height:1.12!important;
      }
      #${LIST_ID} .launch-card-v3 .grouped-date small{
        font-size:10px!important;line-height:1.12!important;margin-top:2px!important;
      }
      #${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id{
        display:block!important;text-align:center!important;
        font-size:10.5px!important;line-height:1.12!important;
        font-weight:1000!important;margin-bottom:2px!important;
      }
      #${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{
        display:block!important;text-align:center!important;
        font-size:10.5px!important;line-height:1.12!important;
        font-weight:1000!important;
      }
      @media(max-width:520px){
        #${LIST_ID} .launch-card-v3 .grouped-date b{font-size:11px!important}
        #${LIST_ID} .launch-card-v3 .grouped-date small{font-size:9.5px!important}
        #${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id,
        #${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{font-size:10px!important}
        #${LIST_ID} .launch-group-divider{font-size:10px!important;margin-top:7px!important}
      }
      @media(max-width:390px){
        #${LIST_ID} .launch-card-v3 .grouped-date b{font-size:10.5px!important}
        #${LIST_ID} .launch-card-v3 .grouped-date small{font-size:9px!important}
        #${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id,
        #${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{font-size:9.5px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function hideColorLegend(){
    [...document.querySelectorAll('body *')].forEach(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(t!=='cores dos cartões:' && t!=='cores dos cartoes:') return;
      let p=el;
      for(let i=0;i<7 && p;i++,p=p.parentElement){
        const r=p.getBoundingClientRect ? p.getBoundingClientRect() : {width:9999,height:9999};
        const txt=(p.textContent||'').replace(/\s+/g,' ').toLowerCase();
        if(r.width>100 && r.width<500 && r.height>30 && r.height<400 && txt.includes('liberado') && txt.includes('parado') && txt.includes('pronto')){
          p.style.setProperty('display','none','important');
          p.setAttribute('aria-hidden','true');
          break;
        }
      }
    });
  }

  function dateKey(card){
    const b=card.querySelector('.grouped-date b');
    const m=(b?.textContent||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if(!m) return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
  }
  function dateLabel(key){
    if(!key) return 'SEM DATA DE SAÍDA';
    const [y,m,d]=key.split('-');
    return `${d}/${m}/${y}`;
  }

  function regroup(){
    const list=document.getElementById(LIST_ID);
    if(!list) return;
    injectCss();
    hideColorLegend();
    [...list.querySelectorAll('.launch-group-divider')].forEach(x=>x.remove());
    const cards=[...list.querySelectorAll('.launch-card-v3')];
    if(!cards.length) return;
    const groups=new Map();
    cards.forEach(card=>{
      const key=dateKey(card)||'';
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(card);
    });
    const keys=[...groups.keys()].sort((a,b)=>{
      if(!a)return -1;if(!b)return 1;return b.localeCompare(a);
    });
    const frag=document.createDocumentFragment();
    keys.forEach(key=>{
      const divider=document.createElement('div');
      divider.className='launch-group-divider';
      divider.innerHTML=`<span>${dateLabel(key)}</span>`;
      frag.appendChild(divider);
      groups.get(key).forEach(card=>frag.appendChild(card));
    });
    list.appendChild(frag);
  }

  function install(){
    injectCss();hideColorLegend();regroup();
    const list=document.getElementById(LIST_ID);
    if(list&&!list.__groupsObserver){
      const obs=new MutationObserver(()=>{
        if(list.__groupsBusy)return;
        list.__groupsBusy=true;
        requestAnimationFrame(()=>{list.__groupsBusy=false;regroup()});
      });
      obs.observe(list,{childList:true});
      list.__groupsObserver=obs;
    }
    if(!document.body.__launchLegendObserver){
      const bodyObs=new MutationObserver(()=>hideColorLegend());
      bodyObs.observe(document.body,{childList:true,subtree:true});
      document.body.__launchLegendObserver=bodyObs;
    }
    const old=window.renderAll;
    if(typeof old==='function'&&!old.__groupsWrapped){
      const wrapped=function(){const r=old.apply(this,arguments);requestAnimationFrame(regroup);return r};
      wrapped.__groupsWrapped=true;window.renderAll=wrapped;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,500);setTimeout(install,1500);
})();

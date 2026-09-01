/* Agrupamento estável dos lançamentos — sem observers recursivos. */
(function(){
'use strict';
const LIST_ID='launchList', STYLE_ID='launch-groups-layout-css';
function css(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
.launch-color-legend,.launch-legend{display:none!important}
#${LIST_ID} .launch-day-separator{display:none!important}
#${LIST_ID} .launch-group-divider{display:flex!important;align-items:center!important;gap:9px!important;margin:8px 5px 5px!important;color:#17324d!important;font-weight:1000!important;font-size:10.5px!important}
#${LIST_ID} .launch-group-divider:before,#${LIST_ID} .launch-group-divider:after{content:"";height:1px;background:#cbd8e7;flex:1}
#${LIST_ID} .launch-group-divider span{background:#edf3fa;border:1px solid #d4e0ed;border-radius:14px;padding:4px 10px;white-space:nowrap}
#${LIST_ID} .launch-card-v3 .grouped-date b{font-size:11.5px!important;line-height:1.12!important}
#${LIST_ID} .launch-card-v3 .grouped-date small{font-size:10px!important;line-height:1.12!important;margin-top:2px!important}
#${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id{display:block!important;text-align:center!important;font-size:10.5px!important;line-height:1.12!important;font-weight:1000!important;margin-bottom:2px!important}
#${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{display:block!important;text-align:center!important;font-size:10.5px!important;line-height:1.12!important;font-weight:1000!important}
#${LIST_ID} .launch-card-v3.payment-pending,#${LIST_ID} .launch-card-v3.payment-em-aberto{background:#f5c542!important;background-color:#f5c542!important;border:2px solid #d7a900!important;color:#172033!important}
#${LIST_ID} .launch-card-v3.payment-falta-acertar{background:#2563eb!important;background-color:#2563eb!important;border:2px solid #1d4ed8!important;color:#fff!important}
@media(max-width:520px){#${LIST_ID} .launch-card-v3 .grouped-date b{font-size:11px!important}#${LIST_ID} .launch-card-v3 .grouped-date small{font-size:9.5px!important}#${LIST_ID} .launch-card-v3 .grouped-main .meta .order-id,#${LIST_ID} .launch-card-v3 .grouped-main .meta .vehicle-line{font-size:10px!important}}
`;document.head.appendChild(s)}
function hideLegend(){document.querySelectorAll('.launch-color-legend,.launch-legend').forEach(x=>x.remove())}
function key(card){const t=card.querySelector('.grouped-date b')?.textContent||'';const m=t.match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?`${m[3]}-${m[2]}-${m[1]}`:''}
function group(){const list=document.getElementById(LIST_ID);if(!list||list.__groupingRunning)return;list.__groupingRunning=true;try{css();hideLegend();const cards=[...list.querySelectorAll('.launch-card-v3')];if(!cards.length)return;const groups=new Map();cards.forEach(c=>{const k=key(c);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c)});const keys=[...groups.keys()].sort((a,b)=>{if(!a)return -1;if(!b)return 1;return b.localeCompare(a)});const frag=document.createDocumentFragment();keys.forEach(k=>{const d=document.createElement('div');d.className='launch-group-divider';d.innerHTML=`<span>${k?(()=>{const [y,m,day]=k.split('-');return `${day}/${m}/${y}`})():'SEM DATA DE SAÍDA'}</span>`;frag.appendChild(d);groups.get(k).forEach(c=>frag.appendChild(c))});list.replaceChildren(frag)}finally{list.__groupingRunning=false}}
function install(){css();hideLegend();const old=window.renderAll;if(typeof old==='function'&&!old.__groupingWrapped){const wrapped=function(){const r=old.apply(this,arguments);requestAnimationFrame(group);return r};wrapped.__groupingWrapped=true;window.renderAll=wrapped}requestAnimationFrame(group)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
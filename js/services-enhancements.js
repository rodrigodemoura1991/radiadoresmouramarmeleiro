/* Status FALTA ACERTAR: opção no cadastro/edição + destaque azul dos cartões. */
(function(){
'use strict';
const FLAG='FALTA ACERTAR';
function css(){if(document.getElementById('falta-acertar-css'))return;const s=document.createElement('style');s.id='falta-acertar-css';s.textContent=`
.payment-falta-acertar{background:#1476e8!important;color:#fff!important;border:2px solid #075fc5!important;box-shadow:0 6px 18px rgba(20,118,232,.30)!important}
.payment-falta-acertar *{color:#fff!important}.payment-falta-acertar .chip{background:#075fc5!important;border-color:#72b3ff!important;color:#fff!important}.payment-falta-acertar .chip:last-child{background:#fff!important;color:#075fc5!important}
`;document.head.appendChild(s)}
function addOption(id){const el=document.getElementById(id);if(!el||!el.options)return;if(!Array.from(el.options).some(o=>o.value===FLAG)){const o=document.createElement('option');o.value=FLAG;o.textContent=FLAG;el.appendChild(o)}}
function getOrders(){return (typeof orders!=='undefined'&&Array.isArray(orders))?orders:[]}
function decorate(){css();addOption('payment');addOption('servicePaymentFilter');const data=getOrders();document.querySelectorAll('#launchList .launch,#allServicesList .service-card,#allServicesList .grouped-service').forEach(card=>{const id=card.dataset.id||card.dataset.orderId;const o=data.find(x=>String(x.id)===String(id));card.classList.toggle('payment-falta-acertar',String(o?.payment_status||'').trim().toUpperCase()===FLAG)});}
function hook(){decorate();['renderLaunches','renderAllServices','renderAll'].forEach(name=>{const fn=window[name];if(typeof fn!=='function'||fn.__faltaHook)return;const w=function(){const r=fn.apply(this,arguments);requestAnimationFrame(decorate);return r};w.__faltaHook=true;window[name]=w})}
let n=0;const t=setInterval(()=>{hook();if(++n>100)clearInterval(t)},250);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();

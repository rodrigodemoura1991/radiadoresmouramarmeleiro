/* Status FALTA ACERTAR: opção no cadastro/edição + destaque azul dos cartões. */
(function(){
'use strict';
const FLAG='FALTA ACERTAR';
function css(){if(document.getElementById('falta-acertar-css'))return;const s=document.createElement('style');s.id='falta-acertar-css';s.textContent=`
.payment-falta-acertar{background:#1476e8!important;color:#fff!important;border:2px solid #075fc5!important;box-shadow:0 6px 18px rgba(20,118,232,.30)!important}
.payment-falta-acertar .lname,.payment-falta-acertar .meta,.payment-falta-acertar .ltop>b{color:#fff!important}
.payment-falta-acertar .btn,.payment-falta-acertar button{background:#fff!important;border-color:#fff!important;color:#173b67!important}
.payment-falta-acertar .chip{background:#e6f7ef!important;border-color:#d1eadf!important;color:#111827!important;-webkit-text-fill-color:#111827!important}
.payment-falta-acertar .chip:last-child{background:#fff!important;color:#075fc5!important;-webkit-text-fill-color:#075fc5!important}
.payment-falta-acertar .grouped-item,
.payment-falta-acertar .grouped-item span,
.payment-falta-acertar .grouped-item b,
.payment-falta-acertar .grouped-item strong,
.payment-falta-acertar .grouped-item small,
.payment-falta-acertar .grouped-item div{color:#111827!important;-webkit-text-fill-color:#111827!important;text-shadow:none!important}
.payment-falta-acertar .grouped-item{background:#e6f7ef!important;border-color:#d1eadf!important}

/* Destaque dos dados principais: cliente maior/negrito; informações secundárias normais e menores. */
#launchList .launch .lname{font-size:16px!important;font-weight:800!important;line-height:1.15!important}
#launchList .launch .meta{font-size:13px!important;font-weight:400!important;line-height:1.2!important}

/* Sem data de saída: verde claro sempre, independentemente do pagamento. */
#launchList .launch.no-exit-date,
#allServicesList .service-card.no-exit-date,
#allServicesList .grouped-service.no-exit-date{background:#dff5e6!important;color:#173b2a!important;border-color:#b8e6c8!important;box-shadow:0 4px 14px rgba(60,160,90,.16)!important}
#launchList .launch.no-exit-date .lname,
#launchList .launch.no-exit-date .meta,
#launchList .launch.no-exit-date .ltop>b,
#launchList .launch.no-exit-date .launch-values,
#launchList .launch.no-exit-date .launch-values b,
#launchList .launch.no-exit-date .launch-values span,
#launchList .launch.no-exit-date .launch-values em{color:#173b2a!important}
#launchList .launch.no-exit-date .chip{background:#effaf2!important;border-color:#c9ead3!important;color:#173b2a!important;-webkit-text-fill-color:#173b2a!important}
#allServicesList .service-card.no-exit-date .service-main,
#allServicesList .service-card.no-exit-date .service-main b,
#allServicesList .service-card.no-exit-date .service-main small,
#allServicesList .service-card.no-exit-date .service-desc,
#allServicesList .service-card.no-exit-date .service-values,
#allServicesList .service-card.no-exit-date .service-values b{color:#173b2a!important;-webkit-text-fill-color:#173b2a!important}
#allServicesList .service-card.no-exit-date .payment-badge{background:#effaf2!important;color:#173b2a!important;border-color:#c9ead3!important;-webkit-text-fill-color:#173b2a!important}
`;
document.head.appendChild(s)}
function addOption(id){const el=document.getElementById(id);if(!el||!el.options)return;if(!Array.from(el.options).some(o=>o.value===FLAG)){const o=document.createElement('option');o.value=FLAG;o.textContent=FLAG;el.appendChild(o)}}
function getOrders(){return (typeof orders!=='undefined'&&Array.isArray(orders))?orders:[]}
function decorate(){css();addOption('payment');addOption('servicePaymentFilter');const data=getOrders();document.querySelectorAll('#launchList .launch,#allServicesList .service-card,#allServicesList .grouped-service').forEach(card=>{const id=card.dataset.id||card.dataset.orderId;const o=data.find(x=>String(x.id)===String(id));const noExit=!o?.exit_date;card.classList.toggle('payment-falta-acertar',String(o?.payment_status||'').trim().toUpperCase()===FLAG);card.classList.toggle('no-exit-date',noExit)});}
function hook(){decorate();['renderLaunches','renderAllServices','renderAll'].forEach(name=>{const fn=window[name];if(typeof fn!=='function'||fn.__faltaHook)return;const w=function(){const r=fn.apply(this,arguments);requestAnimationFrame(decorate);return r};w.__faltaHook=true;window[name]=w})}
let n=0;const t=setInterval(()=>{hook();if(++n>100)clearInterval(t)},250);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();

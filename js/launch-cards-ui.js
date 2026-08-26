/* Ajustes visuais dos cartões de lançamentos e da página Todos os Serviços. */
(function(){
  let selectedServiceIndex=-1;
  let selectedLaunchIndex=-1;
  function ensureBlueStatusCss(){
    if(document.getElementById('falta-acertar-blue-css'))return;
    const s=document.createElement('style');s.id='falta-acertar-blue-css';s.textContent=`
      .launch.payment-falta-acertar,.grouped-service.payment-falta-acertar,.service-card.payment-falta-acertar{
        background:#1476e8!important;color:#fff!important;border:2px solid #075fc5!important;
        box-shadow:0 6px 18px rgba(20,118,232,.30)!important;
      }
      .launch.payment-falta-acertar h1,.launch.payment-falta-acertar h2,.launch.payment-falta-acertar h3,
      .launch.payment-falta-acertar b,.launch.payment-falta-acertar strong,.launch.payment-falta-acertar span,
      .launch.payment-falta-acertar small,.launch.payment-falta-acertar div,
      .grouped-service.payment-falta-acertar h1,.grouped-service.payment-falta-acertar h2,
      .grouped-service.payment-falta-acertar h3,.grouped-service.payment-falta-acertar b,
      .grouped-service.payment-falta-acertar strong,.grouped-service.payment-falta-acertar span,
      .grouped-service.payment-falta-acertar small,.grouped-service.payment-falta-acertar div{
        color:#fff!important;
      }
      .payment-falta-acertar .grouped-item{background:rgba(255,255,255,.14)!important;border-color:rgba(255,255,255,.30)!important}
      .payment-falta-acertar .payment-badge{background:#fff!important;color:#075fc5!important;border-color:#fff!important;font-weight:800!important}
      .payment-falta-acertar .chip{background:#075fc5!important;color:#fff!important;border-color:#72b3ff!important}
      .payment-falta-acertar .keyboard-selected{outline:3px solid rgba(255,255,255,.85)!important}
    `;document.head.appendChild(s);
  }
  function applyLaunches(){
    ensureBlueStatusCss();
    const list=document.getElementById('launchList');if(!list)return;
    list.querySelectorAll('.launch').forEach(card=>{
      const id=card.dataset.id;const order=(typeof orders!=='undefined'?orders:[]).find(o=>o.id===id);
      const payment=String(order?.payment_status||'').trim().toUpperCase();
      card.classList.toggle('payment-open',payment==='EM ABERTO');
      card.classList.toggle('payment-falta-acertar',payment==='FALTA ACERTAR');
      card.querySelectorAll('.chip').forEach(chip=>{if(chip.textContent.trim().startsWith('★'))chip.textContent=chip.textContent.trim().replace(/^★\s*/,'')});
    });
  }
  function ensureServicesCss(){
    if(document.getElementById('todos-servicos-ui-css'))return;const link=document.createElement('link');link.id='todos-servicos-ui-css';link.rel='stylesheet';link.href='css/todos-servicos-ui.css?v=20260826-1645';document.head.appendChild(link);
  }
  function removeOrder(id){
    if(!id)return;const o=(typeof orders!=='undefined'?orders:[]).find(x=>x.id===id);if(!o||!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.'))return;
    (async()=>{cloud('Excluindo...');const a=await sb.from('order_items').delete().eq('order_id',id);if(a.error){toast('Erro ao excluir serviços: '+a.error.message);cloud('Erro ao excluir',false);return}const r=await sb.from('orders').delete().eq('id',id);if(r.error){toast('Erro ao excluir lançamento: '+r.error.message);cloud('Erro ao excluir',false);return}await loadData();toast('Lançamento excluído com sucesso')})();
  }
  function editOrderFromServices(id){document.querySelector('.nav[data-view="launch"]')?.click();setTimeout(()=>{if(typeof window.editOrder==='function')window.editOrder(id)},20)}
  function addActions(){
    const list=document.getElementById('allServicesList');if(!list)return;
    list.querySelectorAll('.grouped-service').forEach(card=>{const id=card.dataset.orderId;if(!id)return;let actions=card.querySelector('.service-actions-v2');if(!actions){actions=document.createElement('div');actions.className='service-actions-v2';actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button><button type="button" class="service-delete-btn">Excluir</button>';card.appendChild(actions)}actions.querySelector('.service-edit-btn').onclick=e=>{e.preventDefault();e.stopPropagation();editOrderFromServices(id)};actions.querySelector('.service-delete-btn').onclick=e=>{e.preventDefault();e.stopPropagation();removeOrder(id)}});
  }
  function clearServiceSelection(){const list=document.getElementById('allServicesList');if(!list)return;list.querySelectorAll('.grouped-service.keyboard-selected').forEach(card=>{card.classList.remove('keyboard-selected');card.removeAttribute('aria-selected')})}
  function selectServiceCard(index,scroll=true){const list=document.getElementById('allServicesList');if(!list)return false;const cards=[...list.querySelectorAll('.grouped-service')];if(!cards.length)return false;if(index<0)index=cards.length-1;if(index>=cards.length)index=0;selectedServiceIndex=index;clearServiceSelection();const card=cards[index];card.classList.add('keyboard-selected');card.setAttribute('aria-selected','true');card.setAttribute('tabindex','-1');if(scroll)card.scrollIntoView({behavior:'smooth',block:'center'});return true}
  function selectLaunchCard(index,scroll=true){const list=document.getElementById('launchList');if(!list)return false;const cards=[...list.querySelectorAll('.launch')];if(!cards.length)return false;if(index<0)index=cards.length-1;if(index>=cards.length)index=0;selectedLaunchIndex=index;cards.forEach(card=>{card.classList.remove('keyboard-selected');card.removeAttribute('aria-selected')});const card=cards[index];card.classList.add('keyboard-selected');card.setAttribute('aria-selected','true');card.setAttribute('tabindex','-1');if(scroll)card.scrollIntoView({behavior:'smooth',block:'center'});return true}
  function isEditableTarget(target){if(!target)return false;const tag=(target.tagName||'').toLowerCase();return tag==='input'||tag==='textarea'||tag==='select'||tag==='button'||target.isContentEditable}
  function openSelectedCard(){const servicesView=document.getElementById('services'),launchView=document.getElementById('launch');if(servicesView?.classList.contains('active')){const card=document.querySelectorAll('#allServicesList .grouped-service')[selectedServiceIndex],id=card?.dataset.orderId;if(id){editOrderFromServices(id);return true}}if(launchView?.classList.contains('active')){const card=document.querySelectorAll('#launchList .launch')[selectedLaunchIndex],id=card?.dataset.id;if(id&&typeof window.editOrder==='function'){window.editOrder(id);return true}}return false}
  function keyboardNavigate(e){if(isEditableTarget(e.target))return;const servicesView=document.getElementById('services'),launchView=document.getElementById('launch'),servicesActive=servicesView?.classList.contains('active'),launchActive=launchView?.classList.contains('active');if(!servicesActive&&!launchActive)return;if(e.key==='Enter'){if(openSelectedCard())e.preventDefault();return}if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;const direction=e.key==='ArrowDown'?1:-1;let handled=false;if(servicesActive)handled=selectServiceCard(selectedServiceIndex<0?(direction>0?0:-1):selectedServiceIndex+direction);else if(launchActive)handled=selectLaunchCard(selectedLaunchIndex<0?(direction>0?0:-1):selectedLaunchIndex+direction);if(handled)e.preventDefault()}
  function renderGroupedServices(){
    const list=document.getElementById('allServicesList');if(!list||typeof allServiceRows!=='function')return;ensureBlueStatusCss();
    const q=(document.getElementById('allServicesSearch')?.value||'').toLowerCase().trim(),pf=document.getElementById('servicePaymentFilter')?.value||'',sf=document.getElementById('serviceStatusFilter')?.value||'';
    const groups=new Map();allServiceRows().forEach(x=>{const o=x.order||{};if(!groups.has(o.id))groups.set(o.id,{order:o,items:[]});groups.get(o.id).items.push(x)});
    const grouped=[...groups.values()].filter(g=>{const o=g.order,pay=o.payment_status||'EM ABERTO',searchText=[o.client_name,o.pedido,o.vehicle_make_model,o.plate,...g.items.map(i=>i.description)].join(' ').toLowerCase(),statusMatch=!sf||g.items.some(i=>i.service_status===sf);return(!q||searchText.includes(q))&&(!pf||pay===pf)&&statusMatch}).sort((a,b)=>String(b.order.exit_date||'').localeCompare(String(a.order.exit_date||'')));
    list.innerHTML=grouped.map(g=>{const o=g.order,pay=o.payment_status||'EM ABERTO',open=pay==='EM ABERTO',blue=String(pay).trim().toUpperCase()==='FALTA ACERTAR',statusClass=slug(g.items[0]?.service_status||'Liberado');return `<article class="service-card launch grouped-service ${statusClass} ${open?'payment-pending':'payment-'+slug(pay)} ${blue?'payment-falta-acertar':''}" data-order-id="${esc(o.id)}" aria-selected="false"><div class="grouped-top"><div class="grouped-date"><b>${esc(o.exit_date||'—')}</b><small>Entrada ${esc(o.entry_date||'—')}</small></div><div class="grouped-main"><div class="lname">${esc(o.client_name||'Sem cliente')}</div><div class="meta">Pedido ${esc(o.pedido||'—')}${o.vehicle_make_model?' • '+esc(o.vehicle_make_model):''}${o.plate?' • '+esc(o.plate):''}</div></div><b class="grouped-total">${money(o.total_sale)}</b></div><div class="grouped-items">${g.items.map(i=>`<div class="grouped-item ${slug(i.service_status)}"><span>${esc(i.description||'Sem descrição')} • ${money(i.sale_value)}</span><b>${esc(i.service_status||'—')}</b></div>`).join('')}</div><div class="grouped-payment"><span class="payment-badge">${esc(pay)}</span></div></article>`}).join('')||'<div class="empty">Nenhum serviço encontrado.</div>';
    if(selectedServiceIndex>=grouped.length)selectedServiceIndex=grouped.length-1;requestAnimationFrame(()=>{addActions();if(selectedServiceIndex>=0&&list.querySelectorAll('.grouped-service').length)selectServiceCard(selectedServiceIndex,false)});
  }
  function install(){ensureBlueStatusCss();ensureServicesCss();applyLaunches();const launchList=document.getElementById('launchList');if(launchList)new MutationObserver(()=>{selectedLaunchIndex=-1;requestAnimationFrame(applyLaunches)}).observe(launchList,{childList:true,subtree:true});const serviceList=document.getElementById('allServicesList');if(serviceList)new MutationObserver(()=>requestAnimationFrame(addActions)).observe(serviceList,{childList:true,subtree:true});const search=document.getElementById('allServicesSearch');if(search)search.placeholder='Buscar cliente, placa, pedido ou serviço';document.addEventListener('keydown',keyboardNavigate);window.renderAllServices=renderGroupedServices;renderGroupedServices();if(!document.getElementById('services-enhancements-loader')){const s=document.createElement('script');s.id='services-enhancements-loader';s.src='js/services-enhancements.js?v=20260826-1705';document.body.appendChild(s)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

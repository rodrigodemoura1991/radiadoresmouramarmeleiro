/* Lançamentos: cartões compactos, mantendo todas as informações. */
(function(){
  'use strict';
  const ordersList=()=>typeof orders!=='undefined'&&Array.isArray(orders)?orders:[];
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const slug=s=>String(s||'').replace(/\s+/g,'').replace('ç','c').replace('ã','a');
  const fmtDate=v=>{const s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:(s||'—')};
  const displayStatus=v=>String(v||'—').trim().toLowerCase()==='pronto entregue'?'PRONTO/ENTREGUE':String(v||'—');

  function injectCss(){
    let s=document.getElementById('launch-card-layout-css');
    if(!s){s=document.createElement('style');s.id='launch-card-layout-css';document.head.appendChild(s)}
    s.textContent=`
      #launchList{display:grid!important;gap:4px!important;padding-left:0!important}
      #launchList .launch-card-v3{display:block!important;position:relative!important;box-sizing:border-box!important;width:100%!important;min-height:0!important;padding:3px 5px!important;border-radius:6px!important;overflow:visible!important;cursor:default!important}
      #launchList .launch-card-v3 .grouped-top{display:grid!important;grid-template-columns:66px minmax(0,1fr) auto!important;gap:4px!important;align-items:start!important;padding-right:0!important}
      #launchList .launch-card-v3 .grouped-date{padding-top:0!important}
      #launchList .launch-card-v3 .grouped-date b{display:block!important;font-size:8.5px!important;line-height:1!important;font-weight:1000!important;color:#17324d!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .grouped-date small{display:block!important;color:#17324d!important;font-size:7.2px!important;line-height:1!important;margin-top:1px!important;font-weight:1000!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .grouped-main{min-width:0!important;text-align:center!important;display:flex!important;flex-direction:column!important;align-items:center!important}
      #launchList .launch-card-v3 .grouped-main .lname{font-size:9.5px!important;line-height:1!important;font-weight:1000!important;white-space:normal!important;word-break:break-word!important;color:#111827!important;width:100%!important;text-align:center!important}
      #launchList .launch-card-v3 .grouped-main .meta{font-size:7.2px!important;line-height:1!important;margin-top:1px!important;white-space:normal!important;word-break:break-word!important;color:#17324d!important;font-weight:1000!important;width:100%!important;text-align:center!important}
      #launchList .launch-card-v3 .grouped-main .meta .order-id{display:block!important;font-weight:1000!important;text-align:center!important;margin-bottom:0!important}
      #launchList .launch-card-v3 .grouped-main .meta .vehicle-line{display:block!important;font-weight:1000!important;text-align:center!important}
      #launchList .launch-card-v3 .grouped-vehicle{font-weight:1000!important;color:#111827!important}
      #launchList .launch-card-v3 .grouped-total{font-size:8.5px!important;line-height:1!important;white-space:nowrap!important;align-self:start!important;margin-top:0!important;font-weight:1000!important;color:#111827!important}
      #launchList .launch-card-v3 .launch-number{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-right:2px!important;padding:1px 3px!important;border-radius:4px!important;background:#111827!important;color:#fff!important;font-size:7.2px!important;font-weight:1000!important;line-height:1!important;vertical-align:middle!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .grouped-items{display:grid!important;gap:1px!important;margin-top:2px!important}
      #launchList .launch-card-v3 .grouped-item{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:5px!important;min-height:0!important;padding:1.5px 3px!important;border-radius:3px!important;font-size:7.3px!important;line-height:1!important;font-weight:900!important}
      #launchList .launch-card-v3 .grouped-item span{min-width:0!important;overflow-wrap:anywhere!important}
      #launchList .launch-card-v3 .grouped-item b{font-size:7.3px!important;line-height:1!important;white-space:nowrap!important;text-align:right!important;font-weight:1000!important}
      #launchList .launch-card-v3 .grouped-item.Liberado{background:#e8f2ff!important;color:#2364a9!important}
      #launchList .launch-card-v3 .grouped-item.Parado{background:#fff3df!important;color:#9b5c00!important}
      #launchList .launch-card-v3 .grouped-item.Pronto{background:#eee9ff!important;color:#6444ad!important}
      #launchList .launch-card-v3 .grouped-item.Prontoentregue{background:#e6f7ef!important;color:#087249!important}
      #launchList .launch-card-v3 .grouped-payment{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:3px!important;margin-top:1px!important;min-height:0!important}
      #launchList .launch-card-v3 .payment-badge{display:inline-block!important;padding:1.5px 3px!important;border-radius:3px!important;background:#eef2f7!important;font-size:7.2px!important;line-height:1!important;font-weight:1000!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .payment-badge::before,#launchList .launch-card-v3 .payment-badge::after{content:none!important;display:none!important}
      #launchList .launch-card-v3 .grouped-payment::before,#launchList .launch-card-v3 .grouped-payment::after{content:none!important;display:none!important}
      #launchList .launch-card-v3 .service-actions-v2{position:static!important;display:flex!important;gap:2px!important;transform:none!important;margin-left:auto!important}
      #launchList .launch-card-v3 .service-actions-v2 button{padding:1.5px 4px!important;font-size:7.2px!important;line-height:1!important;border-radius:3px!important;min-height:0!important}
      #launchList .launch-card-v3.payment-pending{border-left-color:#d7a900!important}
      #launchList .launch-card-v3.payment-cash{border-left-color:var(--green)!important}
      #launchList .launch-card-v3.payment-card{border-left-color:var(--blue)!important}
      #launchList .launch-card-v3.payment-pix{border-left-color:var(--purple)!important}
      #launchList .launch-card-v3.payment-check{border-left-color:var(--orange)!important}
      #launchList .launch-card-v3.payment-wallet{border-left-color:#b7791f!important}
      #launchList .launch-card-v3.payment-boleto{border-left-color:#0891b2!important}
      #launchList .launch-card-v3.payment-notinha{border-left-color:#64748b!important}
      #launchList .launch-card-v3.payment-falta-acertar{background:#2563eb!important;background-color:#2563eb!important;border:2px solid #1d4ed8!important;color:#fff!important;box-shadow:0 1px 3px rgba(37,99,235,.2)!important}
      #launchList .launch-card-v3.payment-falta-acertar .grouped-date b,#launchList .launch-card-v3.payment-falta-acertar .grouped-date small,#launchList .launch-card-v3.payment-falta-acertar .grouped-main .lname,#launchList .launch-card-v3.payment-falta-acertar .meta,#launchList .launch-card-v3.payment-falta-acertar .grouped-vehicle,#launchList .launch-card-v3.payment-falta-acertar .grouped-total{color:#fff!important;-webkit-text-fill-color:#fff!important}
      #launchList .launch-card-v3.payment-falta-acertar .grouped-item{background:#fff!important;color:#111827!important;border:1px solid #dbe4ef!important}
      #launchList .launch-card-v3.payment-falta-acertar .grouped-item *{color:#111827!important;-webkit-text-fill-color:#111827!important}
      #launchList .launch-card-v3.payment-falta-acertar .payment-badge{background:#fff!important;color:#1d4ed8!important}
      #launchList .launch-card-v3.payment-falta-acertar .service-actions-v2 button{background:#fff!important;color:#1d4ed8!important;border-color:#fff!important}
    `;
  }

  function cleanupPaymentDuplicates(card){
    const box=card?.querySelector('.grouped-payment');
    if(!box)return;
    const badges=[...box.querySelectorAll('.payment-badge')];
    badges.slice(1).forEach(x=>x.remove());
    const textNodes=[...box.childNodes].filter(n=>n.nodeType===3 && n.textContent.trim());
    textNodes.forEach(n=>n.remove());
  }

  function removeOrder(id){
    const o=ordersList().find(x=>String(x.id)===String(id));
    if(!o||!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.'))return;
    (async()=>{if(typeof cloud==='function')cloud('Excluindo...');const a=await sb.from('order_items').delete().eq('order_id',id);if(a.error){toast('Erro ao excluir serviços: '+a.error.message);return}const r=await sb.from('orders').delete().eq('id',id);if(r.error){toast('Erro ao excluir lançamento: '+r.error.message);return}if(typeof loadData==='function')await loadData();toast('Lançamento excluído com sucesso')})();
  }

  function render(){
    const list=document.getElementById('launchList');if(!list)return;
    injectCss();
    const q=(document.getElementById('launchSearch')?.value||'').toLowerCase().trim();
    const data=ordersList().filter(o=>[o.client_name,o.vehicle_make_model,o.plate,o.pedido,...(o.order_items||[]).map(i=>i.description)].join(' ').toLowerCase().includes(q));
    const count=document.getElementById('count');if(count)count.textContent=data.length+' lançamento(s)';
    list.innerHTML=data.map(o=>{
      const items=o.order_items||[],pay=String(o.payment_status||'EM ABERTO').trim()||'EM ABERTO';
      const open=pay==='EM ABERTO',blue=pay.toUpperCase()==='FALTA ACERTAR';
      const statusClass=slug(items[0]?.service_status||'Liberado');
      const vehicle=o.vehicle_make_model?`<span class="grouped-vehicle">${esc(o.vehicle_make_model)}</span>`:'';
      const pedido=o.pedido?`<span class="order-id">OS: ${esc(o.pedido)}</span>`:'';
      const placa=o.plate?`<span> • Placa: ${esc(o.plate)}</span>`:'';
      const vehicleLine=vehicle||placa?`<span class="vehicle-line">${vehicle?'Marca/Modelo: '+vehicle:''}${placa}</span>`:'';
      const number=o.numero_lancamento!=null?`<span class="launch-number">#${esc(o.numero_lancamento)}</span>`:'';
      return `<article class="launch service-card grouped-service launch-card-v3 ${statusClass} ${open?'payment-pending':'payment-'+slug(pay)} ${blue?'payment-falta-acertar':''}" data-id="${esc(o.id)}" data-order-id="${esc(o.id)}" aria-selected="false"><div class="grouped-top"><div class="grouped-date"><b>Saída: ${esc(fmtDate(o.exit_date))}</b><small>Entrada: ${esc(fmtDate(o.entry_date))}</small></div><div class="grouped-main"><div class="lname">${number}${esc(o.client_name||'Sem cliente')}</div><div class="meta">${pedido}${vehicleLine}</div></div><b class="grouped-total">${money(o.total_sale)}</b></div><div class="grouped-items">${items.map(i=>`<div class="grouped-item ${slug(i.service_status)}"><span>${esc(i.description||'Sem descrição')} • ${money(i.sale_value)}</span><b>${esc(displayStatus(i.service_status))}</b></div>`).join('')||'<div class="grouped-item"><span>Sem serviço informado</span></div>'}</div><div class="grouped-payment"><span class="payment-badge">${esc(pay)}</span></div></article>`;
    }).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';

    list.querySelectorAll('.launch-card-v3').forEach(card=>{
      const id=card.dataset.id;
      let actions=card.querySelector('.service-actions-v2');
      if(!actions){actions=document.createElement('div');actions.className='service-actions-v2';actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button><button type="button" class="service-delete-btn">Excluir</button>';card.querySelector('.grouped-payment').appendChild(actions)}
      actions.querySelector('.service-edit-btn').onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof editOrder==='function')editOrder(id)};
      actions.querySelector('.service-delete-btn').onclick=e=>{e.preventDefault();e.stopPropagation();removeOrder(id)};
      card.onclick=e=>{if(e.target.closest('button'))return;if(typeof editOrder==='function')editOrder(id)};
      cleanupPaymentDuplicates(card);
    });
  }

  function install(){
    injectCss();
    const original=window.renderAll;
    if(typeof original==='function'&&!original.__launchLayoutV4){
      const wrapped=function(){const r=original.apply(this,arguments);requestAnimationFrame(render);return r};
      wrapped.__launchLayoutV4=true;window.renderAll=wrapped;
    }
    render();
    const search=document.getElementById('launchSearch');if(search&&!search.dataset.launchLayoutBound){search.dataset.launchLayoutBound='1';search.addEventListener('input',render)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
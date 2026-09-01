/* Lançamentos: mesma estrutura visual dos cartões de Todos os Serviços. */
(function(){
  'use strict';
  const ordersList=()=>typeof orders!=='undefined'&&Array.isArray(orders)?orders:[];
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const slug=s=>String(s||'').replace(/\s+/g,'').replace('ç','c').replace('ã','a');
  const fmtDate=v=>{const s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}`:(s||'—')};
  const fmtDateFull=v=>{const s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:(s||'Sem data')};
  const displayStatus=v=>String(v||'—').trim().toLowerCase()==='pronto entregue'?'PRONTO/ENTREGUE':String(v||'—');

  function injectCss(){
    let s=document.getElementById('launch-card-layout-css');
    if(!s){s=document.createElement('style');s.id='launch-card-layout-css';document.head.appendChild(s)}
    s.textContent=`
      #launchList{display:grid!important;gap:6px!important;padding-left:0!important}
      #launchList .launch-card-v3{display:block!important;position:relative!important;box-sizing:border-box!important;width:100%!important;min-height:0!important;padding:7px 10px 6px!important;border-radius:10px!important;overflow:visible!important;cursor:default!important}
      #launchList .launch-card-v3 .grouped-top{display:grid!important;grid-template-columns:82px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding-right:112px!important}
      #launchList .launch-card-v3 .grouped-date b{display:block!important;font-size:13px!important;line-height:1.15!important}
      #launchList .launch-card-v3 .grouped-date small{display:block!important;color:var(--muted)!important;font-size:10px!important;line-height:1.2!important;margin-top:1px!important}
      #launchList .launch-card-v3 .grouped-main .lname{font-size:13px!important;line-height:1.15!important;font-weight:900!important;white-space:normal!important;word-break:break-word!important}
      #launchList .launch-card-v3 .grouped-main .meta{font-size:10px!important;line-height:1.2!important;margin-top:1px!important;white-space:normal!important;word-break:break-word!important}
      #launchList .launch-card-v3 .grouped-total{font-size:13px!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .launch-number{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-right:6px!important;padding:2px 5px!important;border-radius:6px!important;background:#111827!important;color:#fff!important;font-size:9px!important;font-weight:950!important;line-height:1!important;vertical-align:middle!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .grouped-items{display:grid!important;gap:2px!important;margin-top:4px!important}
      #launchList .launch-card-v3 .grouped-item{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;padding:2px 5px!important;border-radius:5px!important;font-size:9px!important;line-height:1.15!important;font-weight:800!important}
      #launchList .launch-card-v3 .grouped-item span{min-width:0!important;overflow-wrap:anywhere!important}
      #launchList .launch-card-v3 .grouped-item b{font-size:9px!important;white-space:nowrap!important}
      #launchList .launch-card-v3 .grouped-item.Liberado{background:#e8f2ff!important;color:#2364a9!important}
      #launchList .launch-card-v3 .grouped-item.Parado{background:#fff3df!important;color:#9b5c00!important}
      #launchList .launch-card-v3 .grouped-item.Pronto{background:#eee9ff!important;color:#6444ad!important}
      #launchList .launch-card-v3 .grouped-item.Prontoentregue{background:#e6f7ef!important;color:#087249!important}
      #launchList .launch-card-v3 .grouped-payment{margin-top:3px!important}
      #launchList .launch-card-v3 .payment-badge{display:inline-block!important;padding:2px 5px!important;border-radius:6px!important;background:#eef2f7!important;font-size:9px!important;line-height:1.1!important;font-weight:900!important}
      #launchList .launch-card-v3 .service-actions-v2{position:absolute!important;top:7px!important;right:8px!important;transform:none!important}
      #launchList .launch-card-v3 .service-actions-v2 button{padding:5px 8px!important;font-size:11px!important}
      #launchList .launch-card-v3.payment-pending{border-left-color:#111!important}
      #launchList .launch-card-v3.payment-cash{border-left-color:var(--green)!important}
      #launchList .launch-card-v3.payment-card{border-left-color:var(--blue)!important}
      #launchList .launch-card-v3.payment-pix{border-left-color:var(--purple)!important}
      #launchList .launch-card-v3.payment-check{border-left-color:var(--orange)!important}
      #launchList .launch-card-v3.payment-wallet{border-left-color:#b7791f!important}
      #launchList .launch-card-v3.payment-boleto{border-left-color:#0891b2!important}
      #launchList .launch-card-v3.payment-notinha{border-left-color:#64748b!important}
      #launchList .launch-card-v3.payment-falta-acertar{background:#2563eb!important;background-color:#2563eb!important;border:2px solid #1d4ed8!important;color:#fff!important;box-shadow:0 3px 10px rgba(37,99,235,.28)!important}
      #launchList .launch-card-v3.payment-falta-acertar .grouped-date small,#launchList .launch-card-v3.payment-falta-acertar .meta{color:#eaf2ff!important}
      #launchList .launch-card-v3.payment-falta-acertar .grouped-item{background:#fff!important;color:#111827!important;border:1px solid #dbe4ef!important}
      #launchList .launch-card-v3.payment-falta-acertar .grouped-item *{color:#111827!important;-webkit-text-fill-color:#111827!important}
      #launchList .launch-card-v3.payment-falta-acertar .payment-badge{background:#fff!important;color:#1d4ed8!important}
      #launchList .launch-card-v3.payment-falta-acertar .service-actions-v2 button{background:#fff!important;color:#1d4ed8!important;border-color:#fff!important}
      @media(max-width:800px){
        #launchList .launch-card-v3 .grouped-top{grid-template-columns:72px minmax(0,1fr) auto!important;padding-right:108px!important}
      }
      @media(max-width:520px){
        #launchList .launch-card-v3{padding:6px 8px!important}
        #launchList .launch-card-v3 .grouped-top{grid-template-columns:72px minmax(0,1fr) auto!important;padding-right:0!important;align-items:start!important}
        #launchList .launch-card-v3 .grouped-date{grid-column:1!important;grid-row:1!important}
        #launchList .launch-card-v3 .grouped-main{grid-column:2!important;grid-row:1!important;min-width:0!important}
        #launchList .launch-card-v3 .grouped-total{grid-column:1/-1!important;grid-row:2!important;justify-self:start!important;margin-top:2px!important}
        #launchList .launch-card-v3 .grouped-items{margin-top:7px!important}
        #launchList .launch-card-v3 .grouped-item{align-items:flex-start!important}
        #launchList .launch-card-v3 .grouped-item b{font-size:9px!important;text-align:right!important}
        #launchList .launch-card-v3 .service-actions-v2{top:6px!important;right:7px!important}
        #launchList .launch-card-v3 .launch-number{font-size:8px!important;padding:2px 5px!important}
      }
    `;
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
      const pedido=o.pedido?`<span>${esc(o.pedido)}</span>`:'';
      const placa=o.plate?`<span> • ${esc(o.plate)}</span>`:'';
      const number=o.numero_lancamento!=null?`<span class="launch-number">#${esc(o.numero_lancamento)}</span>`:'';
      return `<article class="launch service-card grouped-service launch-card-v3 ${statusClass} ${open?'payment-pending':'payment-'+slug(pay)} ${blue?'payment-falta-acertar':''}" data-id="${esc(o.id)}" data-order-id="${esc(o.id)}" aria-selected="false"><div class="grouped-top"><div class="grouped-date"><b>${esc(fmtDate(o.exit_date))}</b><small>Entrada ${esc(fmtDate(o.entry_date))}</small></div><div class="grouped-main"><div class="lname">${number}${esc(o.client_name||'Sem cliente')}</div><div class="meta">${pedido}${vehicle?' • '+vehicle:''}${placa}</div></div><b class="grouped-total">${money(o.total_sale)}</b></div><div class="grouped-items">${items.map(i=>`<div class="grouped-item ${slug(i.service_status)}"><span>${esc(i.description||'Sem descrição')} • ${money(i.sale_value)}</span><b>${esc(displayStatus(i.service_status))}</b></div>`).join('')||'<div class="grouped-item"><span>Sem serviço informado</span></div>'}</div><div class="grouped-payment"><span class="payment-badge">${esc(pay)}</span></div></article>`;
    }).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';

    list.querySelectorAll('.launch-card-v3').forEach(card=>{
      const id=card.dataset.id;
      let actions=card.querySelector('.service-actions-v2');
      if(!actions){actions=document.createElement('div');actions.className='service-actions-v2';actions.innerHTML='<button type="button" class="service-edit-btn">Editar</button><button type="button" class="service-delete-btn">Excluir</button>';card.appendChild(actions)}
      actions.querySelector('.service-edit-btn').onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof editOrder==='function')editOrder(id)};
      actions.querySelector('.service-delete-btn').onclick=e=>{e.preventDefault();e.stopPropagation();removeOrder(id)};
      card.onclick=e=>{if(e.target.closest('button'))return;if(typeof editOrder==='function')editOrder(id)};
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

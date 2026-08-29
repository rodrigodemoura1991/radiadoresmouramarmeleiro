/* Layout dos cartões de Lançamentos: preserva todas as informações e organiza a leitura. */
(function(){
  'use strict';

  const money = n => {
    try { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0); }
    catch(e){ return 'R$ '+(Number(n)||0).toFixed(2).replace('.',','); }
  };
  const esc = s => String(s ?? '').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const slug = s => String(s||'').replace(/\s+/g,'').replace('ç','c').replace('ã','a');
  const dateBR = v => {
    const s=String(v||'').slice(0,10), m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : (s || '—');
  };
  const status = v => String(v||'Liberado').trim().toLowerCase()==='pronto entregue' ? 'PRONTO/ENTREGUE' : String(v||'Liberado');

  function css(){
    if(document.getElementById('launch-card-layout-css')) return;
    const s=document.createElement('style'); s.id='launch-card-layout-css';
    s.textContent=`
      #launchList .launch-card-v3{position:relative;display:block;padding:16px 17px 15px!important;border-radius:24px!important;overflow:hidden}
      #launchList .launch-card-v3 .launch-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      #launchList .launch-card-v3 .launch-client-row{display:flex;align-items:flex-start;gap:8px;min-width:0}
      #launchList .launch-card-v3 .launch-no{flex:0 0 auto;background:#111827;color:#fff;border-radius:9px;padding:5px 9px;font-size:13px;font-weight:950;line-height:1}
      #launchList .launch-card-v3 .launch-client{font-size:21px;font-weight:950;line-height:1.12;color:#14243b;word-break:break-word}
      #launchList .launch-card-v3 .launch-total{font-size:16px;font-weight:950;color:#14243b;white-space:nowrap}
      #launchList .launch-card-v3 .launch-info{margin:8px 0 0;padding-left:2px;display:flex;flex-direction:column;gap:3px;color:#60728a;font-size:13px;font-weight:750}
      #launchList .launch-card-v3 .launch-info strong{color:#203653;font-weight:950}
      #launchList .launch-card-v3 .launch-services{margin-top:12px;display:flex;flex-direction:column;gap:7px}
      #launchList .launch-card-v3 .launch-service{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border-radius:13px;background:rgba(255,255,255,.72);border:1px solid rgba(190,205,220,.65)}
      #launchList .launch-card-v3 .launch-service-name{font-size:14px;font-weight:900;color:#193653;line-height:1.2;min-width:0}
      #launchList .launch-card-v3 .launch-service-value{font-size:13px;font-weight:900;color:#294766;white-space:nowrap}
      #launchList .launch-card-v3 .launch-service-status{font-size:12px;font-weight:950;white-space:nowrap}
      #launchList .launch-card-v3 .launch-service-status.liberado{color:#2563a8}.launch-service-status.parado{color:#c96d00}.launch-service-status.pronto{color:#7350c5}.launch-service-status.prontoentregue{color:#198b5c}
      #launchList .launch-card-v3 .launch-dates{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
      #launchList .launch-card-v3 .launch-date{background:#edf4fa;border:1px solid #d4e1ed;border-radius:10px;padding:6px 9px;color:#50657d;font-size:12px;font-weight:850}
      #launchList .launch-card-v3 .launch-payment{display:inline-flex;margin-top:10px;padding:6px 10px;border-radius:999px;background:#fff;color:#294766;font-size:12px;font-weight:950}
      #launchList .launch-card-v3 .launch-actions{display:flex;align-items:center;gap:7px;margin-top:11px;flex-wrap:wrap}
      #launchList .launch-card-v3 .launch-actions .launch-action-btn{border:1px solid #d5e0eb;background:#fff;color:#172b43;border-radius:11px;padding:8px 12px;font-weight:900;font-size:13px;cursor:pointer}
      #launchList .launch-card-v3 .launch-actions .launch-delete{color:#b52f24}
      #launchList .launch-card-v3 .launch-actions .launch-card-total{margin-left:auto;font-size:16px;font-weight:950;color:#172b43}
      #launchList .launch-card-v3.payment-falta-acertar{background:#1476e8!important;color:#fff!important;border-color:#075fc5!important;box-shadow:0 6px 18px rgba(20,118,232,.30)!important}
      #launchList .launch-card-v3.payment-falta-acertar .launch-client,#launchList .launch-card-v3.payment-falta-acertar .launch-total,#launchList .launch-card-v3.payment-falta-acertar .launch-info,#launchList .launch-card-v3.payment-falta-acertar .launch-info strong,#launchList .launch-card-v3.payment-falta-acertar .launch-card-total{color:#fff!important}
      #launchList .launch-card-v3.payment-falta-acertar .launch-no{background:#fff;color:#075fc5}
      #launchList .launch-card-v3.payment-falta-acertar .launch-service{background:#fff;border-color:#dbe4ef}
      #launchList .launch-card-v3.payment-falta-acertar .launch-payment{color:#075fc5}
      #launchList .launch-card-v3.payment-falta-acertar .launch-date{background:rgba(255,255,255,.9);color:#294766}
      @media(max-width:600px){
        #launchList .launch-card-v3 .launch-client{font-size:20px}
        #launchList .launch-card-v3 .launch-head{gap:8px}
        #launchList .launch-card-v3 .launch-total{font-size:14px}
        #launchList .launch-card-v3 .launch-service{align-items:flex-start;flex-wrap:wrap}
        #launchList .launch-card-v3 .launch-service-status{margin-left:auto}
      }
    `;
    document.head.appendChild(s);
  }

  function render(){
    const list=document.getElementById('launchList');
    if(!list || !Array.isArray(window.orders)) return;
    css();
    const q=(document.getElementById('launchSearch')?.value||'').toLowerCase().trim();
    const data=window.orders.filter(o=>[
      o.client_name,o.vehicle_make_model,o.plate,o.pedido,
      ...(o.order_items||[]).map(i=>i.description)
    ].join(' ').toLowerCase().includes(q));
    const count=document.getElementById('count'); if(count) count.textContent=data.length+' lançamento(s)';

    list.innerHTML=data.map(o=>{
      const items=o.order_items||[];
      const first=items[0]?.service_status||'Liberado';
      const payment=String(o.payment_status||'EM ABERTO').trim()||'EM ABERTO';
      const blue=payment.toUpperCase()==='FALTA ACERTAR';
      const vehicle=o.vehicle_make_model ? `<div><strong>Marca e modelo:</strong> ${esc(o.vehicle_make_model)}</div>` : '';
      const pedido=o.pedido ? `<div><strong>Nº do pedido:</strong> ${esc(o.pedido)}</div>` : '';
      const plate=o.plate ? `<div><strong>Placa:</strong> ${esc(o.plate)}</div>` : '';
      const services=items.map(i=>`<div class="launch-service"><span class="launch-service-name">${esc(i.description||'Sem descrição')}</span><span class="launch-service-value">${money(i.sale_value)}</span><span class="launch-service-status ${slug(i.service_status)}">${esc(status(i.service_status))}</span></div>`).join('');
      const no=o.numero_lancamento!=null ? '#'+o.numero_lancamento : '';
      return `<article class="launch launch-card-v3 ${slug(first)} ${blue?'payment-falta-acertar':''}" data-id="${esc(o.id)}">
        <div class="launch-head">
          <div class="launch-client-row">${no?`<span class="launch-no">${esc(no)}</span>`:''}<div class="launch-client">${esc(o.client_name||'Sem cliente')}</div></div>
          <div class="launch-total">${money(o.total_sale)}</div>
        </div>
        <div class="launch-info">${vehicle}${pedido}${plate}</div>
        <div class="launch-services">${services||'<div class="launch-service"><span class="launch-service-name">Sem serviço informado</span></div>'}</div>
        <div class="launch-dates"><span class="launch-date">Entrada: ${dateBR(o.entry_date)}</span><span class="launch-date">Saída: ${dateBR(o.exit_date)}</span></div>
        <span class="launch-payment">${esc(payment)}</span>
        <div class="launch-actions"><button type="button" class="launch-action-btn launch-edit">Editar</button><button type="button" class="launch-action-btn launch-delete">Excluir</button><span class="launch-card-total">Total: ${money(o.total_sale)}</span></div>
      </article>`;
    }).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';

    list.querySelectorAll('.launch-card-v3').forEach(card=>{
      card.querySelector('.launch-edit')?.addEventListener('click',e=>{e.stopPropagation(); if(typeof window.editOrder==='function') window.editOrder(card.dataset.id)});
      card.querySelector('.launch-delete')?.addEventListener('click',e=>{e.stopPropagation(); if(typeof window.removeLaunchCardOrder==='function') window.removeLaunchCardOrder(card.dataset.id);});
      card.addEventListener('click',e=>{if(e.target.closest('button'))return; if(typeof window.editOrder==='function')window.editOrder(card.dataset.id)});
    });
  }

  window.renderLaunches=render;
  window.removeLaunchCardOrder=function(id){
    const o=(window.orders||[]).find(x=>String(x.id)===String(id));
    if(!o || !confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return;
    (async()=>{
      if(typeof window.cloud==='function') window.cloud('Excluindo...');
      const a=await window.sb.from('order_items').delete().eq('order_id',id);
      if(a.error){ if(typeof window.toast==='function')window.toast('Erro ao excluir serviços: '+a.error.message); return; }
      const r=await window.sb.from('orders').delete().eq('id',id);
      if(r.error){ if(typeof window.toast==='function')window.toast('Erro ao excluir lançamento: '+r.error.message); return; }
      if(typeof window.loadData==='function') await window.loadData();
      if(typeof window.toast==='function')window.toast('Lançamento excluído com sucesso');
    })();
  };

  function install(){
    css();
    render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  document.getElementById('launchSearch')?.addEventListener('input',render);
})();

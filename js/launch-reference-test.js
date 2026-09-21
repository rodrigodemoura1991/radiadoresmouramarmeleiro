/* TESTE V28 — cartões no padrão de referência + filtros completos + exclusão independente + persistência raiz dos dados do cliente. */
(function(){
'use strict';

const PAYMENTS_DEFAULT = ['EM ABERTO','Dinheiro','Cartão','Pix','Cheque','Carteira','Boleto','Notinha','FALTA ACERTAR'];
function getOrders(){ return (typeof orders !== 'undefined' && Array.isArray(orders)) ? orders : []; }
function esc2(v){ if(typeof esc==='function') return esc(v); return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function money2(v){ if(typeof money==='function') return money(v); return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0); }
function slug2(v){ if(typeof slug==='function') return slug(v); return String(v||'').replace(/\s+/g,'').replace('ç','c').replace('ã','a'); }
function shortDate2(v){ const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}` : '—'; }
function fullDate2(v){ const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}` : 'Sem data'; }
function dateKey2(o){ const v=String(o?.exit_date||'').trim(); return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0,10) : ''; }

/* PERSISTÊNCIA RAIZ DOS DADOS DO CLIENTE.
   Este listener fica no documento e não depende da ordem em que os outros
   arquivos registram o onsubmit. Captura os valores antes de o formulário
   ser limpo e, depois que o salvamento do lançamento termina, atualiza o
   cadastro do cliente diretamente no Supabase. */
let clientSaveBusy=false;
async function persistLaunchClientAfterSubmit(snapshot){
  if(clientSaveBusy || !snapshot?.name || typeof sb==='undefined' || typeof company==='undefined' || !company) return;
  clientSaveBusy=true;
  try{
    const wanted=String(snapshot.name).trim();
    let clientId=snapshot.clientId||null;
    if(!clientId){
      for(let attempt=0;attempt<5&&!clientId;attempt++){
        const q=await sb.from('clients').select('id').eq('company_id',company.id).ilike('name',wanted).limit(1);
        if(!q.error&&q.data?.[0]) clientId=q.data[0].id;
        if(!clientId) await new Promise(r=>setTimeout(r,300));
      }
    }
    if(!clientId){console.warn('[Radiadores Moura] Cliente não localizado para persistência:',wanted);return;}
    const payload={cpf_cnpj:snapshot.cpf_cnpj,phone:snapshot.phone,cep:snapshot.cep,address:snapshot.address};
    const upd=await sb.from('clients').update(payload).eq('id',clientId).eq('company_id',company.id);
    if(upd.error){console.error('[Radiadores Moura] Erro ao atualizar cliente:',upd.error);if(typeof toast==='function')toast('Lançamento salvo, mas os dados do cliente não foram atualizados: '+upd.error.message);return;}
    try{
      if(typeof clients!=='undefined'&&Array.isArray(clients)){
        const idx=clients.findIndex(c=>String(c.id)===String(clientId));
        if(idx>=0)Object.assign(clients[idx],payload);
      }
    }catch(_){ }
    if(typeof cloud==='function') cloud('Salvo na nuvem');
  }catch(err){
    console.error('[Radiadores Moura] Persistência dos dados do cliente:',err);
    if(typeof toast==='function')toast('Lançamento salvo, mas houve erro ao salvar os dados do cliente.');
  }finally{clientSaveBusy=false;}
}
function installClientPersistence(){
  const form=document.getElementById('order');
  if(!form || form.dataset.rootClientPersistence==='1') return;
  form.dataset.rootClientPersistence='1';
  form.addEventListener('submit',function(){
    const name=(document.getElementById('clientInput')?.value||'').trim();
    const vehicle=(document.getElementById('vehicle')?.value||'').trim();
    const plate=(document.getElementById('plate')?.value||'').trim();
    const pedido=(document.getElementById('pedido')?.value||'').trim();
    let clientId=null;
    const existing=getOrders().find(o=>String(o.client_name||'').trim().toLowerCase()===name.toLowerCase()&&String(o.vehicle_make_model||'').trim()===vehicle&&String(o.plate||'').trim()===plate&&String(o.pedido||'').trim()===pedido);
    if(existing?.client_id) clientId=existing.client_id;
    const snapshot={
      name,
      clientId,
      cpf_cnpj:(document.getElementById('launchClientCnpj')?.value||'').trim(),
      phone:(document.getElementById('launchClientPhone')?.value||'').trim(),
      cep:(document.getElementById('launchClientCep')?.value||'').trim(),
      address:(document.getElementById('launchClientAddress')?.value||'').trim()
    };
    /* O app.js limpa o formulário após salvar. A captura acima ocorre antes
       disso; aguardamos a conclusão do save e então persistimos o cliente. */
    setTimeout(()=>persistLaunchClientAfterSubmit(snapshot),1200);
  },true);
}

/* EXCLUSÃO NA RAIZ: não depende de servicos-actions.js/servicos-edicao.js. */
let deletingLaunchId=null;
async function deleteLaunchDirect(id){
  if(!id || deletingLaunchId) return;
  const order=getOrders().find(x=>String(x.id)===String(id));
  if(!order){ if(typeof toast==='function') toast('Lançamento não encontrado.'); return; }
  if(!confirm(`Excluir o lançamento de ${order.client_name||'este cliente'}?\n\nEsta ação não pode ser desfeita.`)) return;
  deletingLaunchId=String(id);
  const buttons=[...document.querySelectorAll(`[data-delete="${CSS.escape(String(id))}"]`)];
  buttons.forEach(b=>{b.disabled=true;b.textContent='Excluindo...';});
  try{
    if(typeof cloud==='function') cloud('Excluindo lançamento...');
    const itemsResult=await sb.from('order_items').delete().eq('order_id',id);
    if(itemsResult.error) throw new Error('Erro ao excluir os serviços: '+itemsResult.error.message);
    const orderResult=await sb.from('orders').delete().eq('id',id);
    if(orderResult.error) throw new Error('Erro ao excluir o lançamento: '+orderResult.error.message);
    const idx=getOrders().findIndex(x=>String(x.id)===String(id));
    if(idx>=0) getOrders().splice(idx,1);
    if(typeof loadData==='function') await loadData();
    if(typeof window.renderLaunches==='function') window.renderLaunches();
    if(typeof toast==='function') toast('Lançamento excluído com sucesso.');
    if(typeof cloud==='function') cloud('Salvo na nuvem');
  }catch(err){
    console.error('Erro ao excluir lançamento:',err);
    if(typeof toast==='function') toast(err?.message||'Erro ao excluir lançamento.');
    if(typeof cloud==='function') cloud('Erro ao excluir');
    buttons.forEach(b=>{b.disabled=false;b.textContent='Excluir';});
  }finally{deletingLaunchId=null;}
}
window.removeLaunchDirect=deleteLaunchDirect;
window.removeServiceOrder=window.removeServiceOrder||deleteLaunchDirect;

function updateLaunchFilters(){
  const pay=document.getElementById('launchPaymentFilter'), svc=document.getElementById('launchStatusFilter');
  if(!pay || !svc) return;
  const currentPay=pay.value, currentSvc=svc.value, ordersNow=getOrders();
  const payments=[...PAYMENTS_DEFAULT,...ordersNow.map(o=>String(o?.payment_status||'').trim()).filter(Boolean)].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>{const ai=PAYMENTS_DEFAULT.indexOf(a),bi=PAYMENTS_DEFAULT.indexOf(b);if(ai>=0&&bi>=0)return ai-bi;if(ai>=0)return -1;if(bi>=0)return 1;return a.localeCompare(b,'pt-BR');});
  const statuses=['Liberado','Pronto','Parado','Pronto entregue'];
  pay.innerHTML='<option value="">Todos os pagamentos</option>'+payments.map(v=>`<option value="${esc2(v)}">${esc2(v)}</option>`).join('');
  svc.innerHTML='<option value="">Todas as situações</option>'+statuses.map(v=>`<option value="${esc2(v)}">${esc2(v)==='Pronto entregue'?'Pronto/Entregue':esc2(v)}</option>`).join('');
  try{if(pay.querySelector(`option[value="${CSS.escape(currentPay)}"]`))pay.value=currentPay;else pay.value='';}catch(e){pay.value='';}
  try{if(svc.querySelector(`option[value="${CSS.escape(currentSvc)}"]`))svc.value=currentSvc;else svc.value='';}catch(e){svc.value='';}
}
function renderLaunchesReference(){
  if(typeof updateCatalog==='function') updateCatalog();
  const list=document.getElementById('launchList');if(!list)return;
  updateLaunchFilters();
  const q=(document.getElementById('launchSearch')?.value||'').toLowerCase().trim();
  const pf=(document.getElementById('launchPaymentFilter')?.value||'').trim();
  const sf=(document.getElementById('launchStatusFilter')?.value||'').trim();
  const normalizeStatus=v=>{const t=String(v||'').trim().toLowerCase().replace(/\s+/g,' ');if(t==='pronto/entregue'||t==='pronto entregue')return 'Pronto entregue';if(t==='liberado')return 'Liberado';if(t==='pronto')return 'Pronto';if(t==='parado')return 'Parado';return String(v||'').trim();};
  const a=getOrders().filter(o=>{const items=o.order_items||[];const text=[o.client_name,o.vehicle_make_model,o.plate,o.pedido,o.numero_lancamento,...items.map(i=>i.description)].join(' ').toLowerCase();const pay=String(o.payment_status||'EM ABERTO').trim();return(!q||text.includes(q))&&(!pf||pay===pf)&&(!sf||items.some(i=>normalizeStatus(i?.service_status||'Pronto entregue')===sf));});
  const sorted=[...a].sort((x,y)=>{const dx=dateKey2(x),dy=dateKey2(y);if(!dx&&!dy)return String(y.entry_date||'').localeCompare(String(x.entry_date||''));if(!dx)return -1;if(!dy)return 1;if(dx!==dy)return dy.localeCompare(dx);return String(y.entry_date||'').localeCompare(String(x.entry_date||''));});
  const count=document.getElementById('count');if(count)count.textContent=sorted.length+' lançamento(s)';
  let lastDay=null;
  list.innerHTML=sorted.map(o=>{
    const day=dateKey2(o),sep=day!==lastDay?`<div class="launch-day-separator"><span>${fullDate2(day)}</span></div>`:'';lastDay=day;
    const first=(o.order_items||[])[0],payment=String(o.payment_status||'EM ABERTO').trim(),paymentUpper=payment.toUpperCase();
    const paymentClass=paymentUpper==='FALTA ACERTAR'?'payment-falta-acertar':(paymentUpper==='EM ABERTO'?'payment-em-aberto':'payment-paid');
    const noExitClass=!String(o.exit_date||'').trim()?'no-exit-service':'';
    const gross=Number(o.total_sale||0),net=Number(o.net_profit||0),vehicle=String(o.vehicle_make_model||'').trim(),plate=String(o.plate||'').trim(),pedido=String(o.pedido||'').trim(),os=String(o.numero_lancamento||'').trim();
    const entry=shortDate2(o.entry_date),exit=shortDate2(o.exit_date),vehicleLine=[vehicle,plate].filter(Boolean).join(' • '),statusText=o.exit_date?`Saída ${exit}`:'Serviço ainda não entregue',statusClass=slug2(first?.service_status||'Pronto entregue');
    return sep+`<article class="launch launch-reference-card ${statusClass} ${paymentClass} ${noExitClass}" data-id="${esc2(o.id)}">
      <div class="launch-reference-top">
        <div class="launch-reference-left">
          ${pedido?`<div class="launch-pedido"><span>Pedido</span> <b>${esc2(pedido)}</b></div>`:''}
          <div class="launch-dates"><span>Ent. <b>${esc2(entry)}</b></span><span>${esc2(statusText)}</span></div>
        </div>
        <div class="launch-reference-center">
          <div class="launch-os">${os?`OS ${esc2(os)}`:'OS —'}</div>
          <div class="launch-client">${esc2(o.client_name||'Sem cliente')}</div>
          ${vehicleLine?`<div class="launch-vehicle">${esc2(vehicleLine)}</div>`:''}
          <div class="launch-payment">${esc2(payment)}</div>
        </div>
        <div class="launch-reference-right">
          <div class="launch-reference-values"><b>${money2(gross)}</b><span>${money2(net)}</span><em>Líquido</em></div>
          <div class="launch-reference-actions"><button type="button" class="launch-action" data-edit="${esc2(o.id)}">Editar</button><button type="button" class="launch-action delete" data-delete="${esc2(o.id)}">Excluir</button></div>
        </div>
      </div>
      <div class="launch-services">${(o.order_items||[]).map(i=>{const st=String(i?.service_status||'Pronto entregue');return `<div class="service-line status-${slug2(st)}"><span><b>${esc2(i.description||'Sem descrição')}</b> • ${money2(i.sale_value)}</span><span class="service-status">${esc2(st)}</span></div>`;}).join('')}</div>
      ${String(o.notes||'').trim()?`<div class="launch-observation-card"><span>⚠ Observação:</span> ${esc2(o.notes.trim())}</div>`:''}
    </article>`;
  }).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof openFix==='function')openFix(b.dataset.edit);else if(typeof editOrder==='function')editOrder(b.dataset.edit);});
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteLaunchDirect(b.dataset.delete);});
  list.querySelectorAll('.launch-reference-card').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-edit],[data-delete]'))return;if(typeof openFix==='function')openFix(x.dataset.id);else if(typeof editOrder==='function')editOrder(x.dataset.id);});
}
function install(){
  installClientPersistence();
  const search=document.getElementById('launchSearch'),pf=document.getElementById('launchPaymentFilter'),sf=document.getElementById('launchStatusFilter');
  [search,pf,sf].forEach(el=>{if(!el||el.dataset.refFilterBound==='1')return;el.dataset.refFilterBound='1';el.addEventListener('input',renderLaunchesReference);el.addEventListener('change',renderLaunchesReference);});
  window.renderLaunches=renderLaunchesReference;
  updateLaunchFilters();
  setTimeout(renderLaunchesReference,0);
  setTimeout(renderLaunchesReference,300);
  setTimeout(installClientPersistence,500);
  setTimeout(installClientPersistence,1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
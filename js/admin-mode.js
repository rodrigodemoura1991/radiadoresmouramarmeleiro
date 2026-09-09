/* MODO ADMINISTRADOR — controle de inclusão no balanço */
(function(){
'use strict';
const PASS=String.fromCharCode(57,53,56,52,50,54,53,57);
let admin=false;const $=id=>document.getElementById(id);window.enterAdminWithPassword=function(p){p=String(p??'').replace(/[^0-9]/g,'');if(p.length!==8||p!==PASS)return false;admin=true;const b=$('balanceAdminBtn');if(b)b.textContent='🔓 Administrador ativo';if(typeof renderBalanceAdmin==='function')renderBalanceAdmin();if(typeof syncHistoricalAdminUI==='function')syncHistoricalAdminUI();if(typeof decorate==='function')decorate();if(typeof toast==='function')toast('Modo administrador ativado');return true};
function install(){const head=document.querySelector('#services .head');if(!head||$('adminModeBtn'))return;const b=document.createElement('button');b.id='adminModeBtn';b.className='btn';b.textContent='🔒 Administrador';b.title='Área administrativa';b.onclick=()=>{if(admin){admin=false;b.textContent='🔒 Administrador';decorate();return}const p=prompt('Senha de administrador:');if(String(p??'').trim()===PASS){admin=true;b.textContent='🔓 Administrador ativo';decorate();if(typeof toast==='function')toast('Modo administrador ativado')}else if(p!==null&&typeof toast==='function')toast('Senha incorreta')};head.appendChild(b);decorate()}
async function toggle(id,checked){if(!admin)return;const r=await sb.from('orders').update({exclude_from_balance:checked}).eq('id',id);if(r.error){if(typeof toast==='function')toast('Erro ao atualizar: '+r.error.message);return}const o=(window.orders||[]).find(x=>x.id===id);if(o){o.exclude_from_balance=checked;(o.order_items||[]).forEach(i=>i.exclude_from_balance=checked)}if(typeof toast==='function')toast(checked?'Serviço retirado do balanço':'Serviço incluído novamente no balanço');if(typeof window.renderBalance==='function')window.renderBalance()}
function decorate(){const list=$('allServicesList');if(!list)return;list.querySelectorAll('.service-card').forEach(card=>{let box=card.querySelector('.admin-balance-control');if(!admin){if(box)box.remove();return}const id=card.dataset.orderId||card.dataset.id;if(!id)return;const o=(window.orders||[]).find(x=>x.id===id);if(!box){box=document.createElement('label');box.className='admin-balance-control';box.style.cssText='display:flex;align-items:center;gap:7px;margin-top:8px;padding:7px 9px;border:1px dashed #999;border-radius:8px;font-size:12px;font-weight:700';box.innerHTML='<input type="checkbox"> Não considerar no balanço';card.appendChild(box);box.querySelector('input').onchange=e=>toggle(id,e.target.checked)}box.querySelector('input').checked=!!o?.exclude_from_balance})}
const st=document.createElement('style');st.textContent='.admin-balance-control{background:#fff8df;color:#5a4700}.admin-balance-control input{width:16px;height:16px}';document.head.appendChild(st);
let n=0;const t=setInterval(()=>{install();decorate();if(++n>120)clearInterval(t)},300);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
function installBalance(){
 const head=document.querySelector('#balance .head'); if(!head||$('balanceAdminBtn'))return;
 const b=document.createElement('button');b.id='balanceAdminBtn';b.className='btn';b.textContent='🔒 Administrador';
 b.onclick=()=>{if(admin){admin=false;b.textContent='🔒 Administrador';renderBalanceAdmin();syncHistoricalAdminUI();if(typeof window.renderBalance==='function')window.renderBalance();return}const p=prompt('Senha de administrador:');if(p===PASS){admin=true;b.textContent='🔓 Administrador ativo';renderBalanceAdmin();syncHistoricalAdminUI();if(typeof window.renderBalance==='function')window.renderBalance();if(typeof toast==='function')toast('Modo administrador ativado')}else if(p!==null&&typeof toast==='function')toast('Senha incorreta')};
 head.appendChild(b);renderBalanceAdmin();
}
function renderBalanceAdmin(){
 let box=$('balanceAdminPanel');if(!box)return;
 if(!admin){box.classList.add('hidden');return} box.classList.remove('hidden');
 const rows=[];(window.orders||[]).filter(o=>typeof inPeriod!=='function'||inPeriod(o)).forEach(o=>(o.order_items||[]).forEach(i=>rows.push({o,i})));
 box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b>Controle administrativo dos serviços</b><div><button class="btn" id="realBalanceBtn">💰 Ver valor real</button> <button class="btn" id="balanceAdminExit">Sair</button></div></div><p style="color:var(--muted);font-size:13px">Desmarque os serviços que não devem entrar no balanço. Eles continuam salvos no sistema.</p>'+(rows.map(r=>'<label style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--line)"><input type="checkbox" data-admin-order="'+r.o.id+'" '+(r.o.exclude_from_balance?'':'checked')+'><span>'+esc(r.o.exit_date||'—')+' • '+esc(r.o.client_name||'Sem cliente')+' • '+esc(r.i.description||'')+' • '+money(r.i.sale_value||0)+'</span></label>').join('')||'<div class="empty">Nenhum serviço no período.</div>');
 $('realBalanceBtn').onclick=showRealBalance;$('balanceAdminExit').onclick=()=>{admin=false;$('balanceAdminBtn').textContent='🔒 Administrador';renderBalanceAdmin();syncHistoricalAdminUI()};
 box.querySelectorAll('[data-admin-order]').forEach(ch=>ch.onchange=async()=>{const id=ch.dataset.adminOrder;const excluded=!ch.checked;const r=await sb.from('orders').update({exclude_from_balance:excluded}).eq('id',id);if(r.error){ch.checked=!excluded;toast('Erro ao salvar: '+r.error.message);return}const o=(window.orders||[]).find(x=>x.id===id);if(o)o.exclude_from_balance=excluded;renderBalanceAdmin();renderBalance()});
}
function showRealBalance(){
 const hidden=(window.orders||[]).filter(o=>o.exclude_from_balance);
 let sale=0,cost=0,freight=0,tax=0,count=0;
 hidden.forEach(o=>(o.order_items||[]).forEach(i=>{const s=Number(i.sale_value)||0,c=Number(i.cost_value)||0,f=Number(i.freight_value)||0,t=s*(Number(i.tax_rate)||0)/100;sale+=s;cost+=c;freight+=f;tax+=t;count++}));
 const profit=sale-cost-freight-tax; const fmt=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
 let m=$('realBalanceModal');if(!m){m=document.createElement('div');m.id='realBalanceModal';m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';document.body.appendChild(m)}
 m.innerHTML='<div style="background:var(--card,#fff);color:var(--text,#222);border-radius:14px;padding:22px;max-width:520px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Balanço real</h2><button class="btn" id="closeRealBalance">Fechar</button></div><p style="color:var(--muted)">Serviços ocultados do balanço normal.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><small>Vendas ocultadas</small><b style="display:block;font-size:20px">'+fmt(sale)+'</b></div><div><small>Custos</small><b style="display:block;font-size:20px">'+fmt(cost)+'</b></div><div><small>Fretes</small><b style="display:block;font-size:20px">'+fmt(freight)+'</b></div><div><small>Impostos</small><b style="display:block;font-size:20px">'+fmt(tax)+'</b></div><div style="grid-column:1/-1"><small>Lucro líquido dos ocultados</small><b style="display:block;font-size:26px">'+fmt(profit)+'</b></div><div style="grid-column:1/-1"><small>Serviços ocultados</small><b style="display:block">'+count+'</b></div></div></div>';
 m.style.display='flex';$('closeRealBalance').onclick=()=>m.style.display='none';
}

function renderHistoricalServiceControl(){
 const box=$('adminHistoricalServices'); if(!box)return;
 const os=(window.orders||[]).filter(o=>typeof inPeriod!=='function'||inPeriod(o));
 const rows=os.map(o=>{const items=(o.order_items||[]).filter(i=>['pronto entregue'].includes(String(i.service_status||'').trim().toLowerCase()));const sale=items.reduce((s,i)=>s+(Number(i.sale_value)||0),0);const cost=items.reduce((s,i)=>s+(Number(i.cost_value)||0),0);const tax=items.reduce((s,i)=>s+sale*(Number(i.tax_rate)||0)/100,0);return{o,items,sale,cost,tax}}).filter(x=>x.items.length);
 const fmt=n=>money(Number(n)||0);
 let html='<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">🔐 Controle dos serviços</h3><p style="margin:4px 0 0;color:var(--muted);font-size:13px">Aqui você decide quais serviços entram no Balanço normal. Os ocultados continuam registrados e aparecem nos valores reais.</p></div><span class="pill">'+rows.filter(x=>x.o.exclude_from_balance).length+' ocultados</span></div>';
 if(!rows.length){html+='<div class="empty" style="margin-top:12px">Nenhum serviço PRONTO/ENTREGUE no período selecionado.</div></div>';box.innerHTML=html;return}
 html+='<div style="margin-top:12px;overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">Considerar</th><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">Data</th><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">Cliente</th><th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">Serviço</th><th style="text-align:right;padding:8px;border-bottom:1px solid var(--line)">Venda</th></tr></thead><tbody>';
 rows.forEach(x=>{const desc=x.items.map(i=>i.description||'').filter(Boolean).join(' + ');html+='<tr><td style="padding:8px;border-bottom:1px solid var(--line)"><input type="checkbox" class="histExclude" data-id="'+x.o.id+'" '+(x.o.exclude_from_balance?'':'checked')+'></td><td style="padding:8px;border-bottom:1px solid var(--line)">'+esc(x.o.exit_date||'—')+'</td><td style="padding:8px;border-bottom:1px solid var(--line)">'+esc(x.o.client_name||'Sem cliente')+'</td><td style="padding:8px;border-bottom:1px solid var(--line)">'+esc(desc)+'</td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--line)">'+fmt(x.sale)+'</td></tr>});
 html+='</tbody></table></div></div>';
 box.innerHTML=html;
 box.querySelectorAll('.histExclude').forEach(ch=>ch.addEventListener('change',async()=>{const id=ch.dataset.id,excluded=!ch.checked;const rr=await sb.from('orders').update({exclude_from_balance:excluded}).eq('id',id);if(rr.error){ch.checked=!excluded;toast('Erro ao salvar: '+rr.error.message);return}const o=(window.orders||[]).find(x=>x.id===id);if(o)o.exclude_from_balance=excluded;renderHistoricalAdminSummary();renderHistoricalServiceControl();}));
}
function renderHistoricalAdminSummary(){
 const box=$('adminHistoricalSummary');if(!box)return;
 const os=(window.orders||[]).filter(o=>typeof inPeriod!=='function'||inPeriod(o));
 let real={sale:0,cost:0,freight:0,tax:0,count:0},normal={sale:0,cost:0,freight:0,tax:0,count:0};
 os.forEach(o=>(o.order_items||[]).filter(i=>String(i.service_status||'').trim().toLowerCase()==='pronto entregue').forEach(i=>{
  const target=o.exclude_from_balance?real:normal; const s=Number(i.sale_value)||0;
  target.sale+=s;target.cost+=Number(i.cost_value)||0;target.freight+=Number(i.freight_value)||0;target.tax+=s*(Number(i.tax_rate)||0)/100;target.count++;
 }));
 // normal starts as included only; add hidden into real, then real is all.
 const all={sale:real.sale+normal.sale,cost:real.cost+normal.cost,freight:real.freight+normal.freight,tax:real.tax+normal.tax,count:real.count+normal.count};
 const p=x=>x.sale-x.cost-x.freight-x.tax,fmt=n=>money(n);
 box.innerHTML='<div class="card" style="margin-bottom:16px"><h3 style="margin:0 0 12px">📊 Resumo real dos serviços</h3><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>💰 Valor real — todos os serviços</small><b style="display:block;font-size:23px;margin-top:4px">'+fmt(all.sale)+'</b><span style="font-size:12px;color:var(--muted)">Lucro líquido: '+fmt(p(all))+' • '+all.count+' serviços</span></div><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>📋 Valor após retirar os ocultos</small><b style="display:block;font-size:23px;margin-top:4px">'+fmt(normal.sale)+'</b><span style="font-size:12px;color:var(--muted)">Lucro líquido: '+fmt(p(normal))+' • '+normal.count+' serviços</span></div><div style="padding:12px;border:1px dashed var(--line);border-radius:12px"><small>Valor dos serviços ocultos</small><b style="display:block;margin-top:4px">'+fmt(real.sale)+'</b></div><div style="padding:12px;border:1px dashed var(--line);border-radius:12px"><small>Lucro dos serviços ocultos</small><b style="display:block;margin-top:4px">'+fmt(p(real))+'</b></div></div><p style="margin:12px 0 0;color:var(--muted);font-size:12px">Este resumo existe somente no Balanço Administrativo e não altera os lançamentos.</p></div>';
}
async function loadHistoricalBalance(){
 const box=$('adminHistoricalContent'); if(!box)return;
 const companyId=sessionStorage.getItem('companyId'); if(!companyId){box.innerHTML='<div class="empty">Nenhuma empresa selecionada.</div>';return}
 box.innerHTML='<div class="card">Carregando balanço histórico...</div>';
 const r=await sb.from('admin_historical_balance').select('*').eq('company_id',companyId).order('balance_year',{ascending:false}).order('is_annual_total',{ascending:true}).order('balance_month',{ascending:true});
 if(r.error){box.innerHTML='<div class="card"><b>Erro ao carregar:</b> '+esc(r.error.message)+'</div>';return}
 const data=r.data||[], months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 const years=[...new Set(data.map(x=>x.balance_year))].sort((a,b)=>b-a);
 const fmt=n=>money(Number(n)||0);
 const overall1=data.filter(x=>x.is_annual_total).reduce((s,x)=>s+(Number(x.value_1)||0),0);
 const overall2=data.filter(x=>x.is_annual_total).reduce((s,x)=>s+(Number(x.value_2)||0),0);
 let html='<div class="card" style="margin-bottom:16px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h3 style="margin:0">📊 Balanço histórico administrativo</h3><p style="margin:4px 0 0;color:var(--muted);font-size:13px">Marmeleiro e Francisco Beltrão. Estes valores ficam totalmente separados dos lançamentos normais.</p></div><button class="btn" id="histAddYear">＋ Adicionar ano</button></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px"><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>Total geral — Marmeleiro</small><b id="histOverall1" style="display:block;font-size:24px;margin-top:5px">'+fmt(overall1)+'</b></div><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>Total geral — Francisco Beltrão</small><b id="histOverall2" style="display:block;font-size:24px;margin-top:5px">'+fmt(overall2)+'</b></div></div></div>';
 years.forEach(y=>{
   const annual=data.find(x=>x.balance_year===y&&x.is_annual_total);
   const monthly=data.filter(x=>x.balance_year===y&&!x.is_annual_total).sort((a,b)=>a.balance_month-b.balance_month);
   html+='<div class="card hist-year" data-year="'+y+'" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0">'+y+'</h2><button class="btn histAddMonth" data-year="'+y+'">＋ Adicionar mês</button></div>';
   html+='<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:14px 0"><label><small>Total anual — Marmeleiro</small><input class="histAnnual1" type="number" step="0.01" value="'+(annual?.value_1??0)+'"></label><label><small>Total anual — Francisco Beltrão</small><input class="histAnnual2" type="number" step="0.01" value="'+(annual?.value_2??0)+'"></label></div>';
   html+='<div style="text-align:right;margin-bottom:10px"><button class="btn histSaveAnnual" data-year="'+y+'">💾 Salvar total '+y+'</button></div>';
   html+='<div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:9px;border-bottom:1px solid var(--line)">Mês</th><th style="text-align:right;padding:9px;border-bottom:1px solid var(--line)">Marmeleiro</th><th style="text-align:right;padding:9px;border-bottom:1px solid var(--line)">Francisco Beltrão</th><th style="text-align:right;padding:9px;border-bottom:1px solid var(--line)">Ação</th></tr></thead><tbody>';
   monthly.forEach(x=>html+='<tr data-id="'+x.id+'"><td style="padding:8px;border-bottom:1px solid var(--line)">'+months[x.balance_month-1]+'</td><td style="padding:8px;border-bottom:1px solid var(--line)"><input class="histM1" type="number" step="0.01" value="'+(x.value_1??0)+'" style="width:150px;text-align:right"></td><td style="padding:8px;border-bottom:1px solid var(--line)"><input class="histM2" type="number" step="0.01" value="'+(x.value_2??0)+'" style="width:150px;text-align:right"></td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--line)"><button class="btn histSaveMonth" data-id="'+x.id+'" data-year="'+y+'">Salvar</button></td></tr>');
   html+='</tbody></table></div></div>';
 });
 box.innerHTML=html;
 renderHistoricalAdminSummary(); renderHistoricalServiceControl();
 box.querySelector('#histAddYear')?.addEventListener('click',async()=>{
   const y=Number(prompt('Qual ano deseja adicionar? Ex.: 2027')); if(!Number.isInteger(y)||y<2000||y>2100)return;
   const exists=data.some(x=>x.balance_year===y&&x.is_annual_total); if(exists){toast('Esse ano já existe.');return}
   const ins=await sb.from('admin_historical_balance').insert({company_id:companyId,balance_year:y,balance_month:null,value_1:0,value_2:0,is_annual_total:true,source_file:'Cadastro administrativo'});
   if(ins.error){toast('Erro: '+ins.error.message);return}
   toast('Ano '+y+' criado.');loadHistoricalBalance();
 });
 box.querySelectorAll('.histAddMonth').forEach(btn=>btn.addEventListener('click',async()=>{
   const y=Number(btn.dataset.year); const m=Number(prompt('Digite o mês (1 a 12) para '+y)); if(!Number.isInteger(m)||m<1||m>12)return;
   if(data.some(x=>x.balance_year===y&&x.balance_month===m&&!x.is_annual_total)){toast('Esse mês já existe.');return}
   const ins=await sb.from('admin_historical_balance').insert({company_id:companyId,balance_year:y,balance_month:m,value_1:0,value_2:0,is_annual_total:false,source_file:'Cadastro administrativo'});
   if(ins.error){toast('Erro: '+ins.error.message);return}
   toast(months[m-1]+' de '+y+' criado.');loadHistoricalBalance();
 }));
 box.querySelectorAll('.histSaveAnnual').forEach(btn=>btn.addEventListener('click',async()=>{
   const card=btn.closest('.hist-year'),y=Number(btn.dataset.year),annualRow=data.find(x=>x.balance_year===y&&x.is_annual_total);
   const value1=Number(card.querySelector('.histAnnual1').value)||0,value2=Number(card.querySelector('.histAnnual2').value)||0;
   let rr=annualRow?await sb.from('admin_historical_balance').update({value_1:value1,value_2:value2}).eq('id',annualRow.id):await sb.from('admin_historical_balance').insert({company_id:companyId,balance_year:y,balance_month:null,value_1:value1,value_2:value2,is_annual_total:true,source_file:'Cadastro administrativo'});
   if(rr.error){toast('Erro ao salvar: '+rr.error.message);return} toast('Total de '+y+' salvo.');loadHistoricalBalance();
 }));
 box.querySelectorAll('.histSaveMonth').forEach(btn=>btn.addEventListener('click',async()=>{
   const row=btn.closest('tr'),id=btn.dataset.id,y=Number(btn.dataset.year);
   const value1=Number(row.querySelector('.histM1').value)||0,value2=Number(row.querySelector('.histM2').value)||0;
   const rr=await sb.from('admin_historical_balance').update({value_1:value1,value_2:value2}).eq('id',id);
   if(rr.error){toast('Erro ao salvar: '+rr.error.message);return}
   // Ao alterar um mês, o total anual passa a refletir a soma dos meses cadastrados.
   const mr=await sb.from('admin_historical_balance').select('value_1,value_2').eq('company_id',companyId).eq('balance_year',y).eq('is_annual_total',false);
   if(!mr.error){
     const t1=(mr.data||[]).reduce((s,x)=>s+(Number(x.value_1)||0),0),t2=(mr.data||[]).reduce((s,x)=>s+(Number(x.value_2)||0),0);
     const ar=data.find(x=>x.balance_year===y&&x.is_annual_total);
     if(ar) await sb.from('admin_historical_balance').update({value_1:t1,value_2:t2}).eq('id',ar.id);
     else await sb.from('admin_historical_balance').insert({company_id:companyId,balance_year:y,balance_month:null,value_1:t1,value_2:t2,is_annual_total:true,source_file:'Cadastro administrativo'});
   }
   toast('Valor do mês salvo e total de '+y+' atualizado.');loadHistoricalBalance();
 }));
}
function syncHistoricalAdminUI(){
 const n=$('adminHistoricalNav'); if(!n)return;
 const ok=admin;
 n.classList.toggle('hidden',!ok);
 if(!ok && $('adminHistorical')?.classList.contains('active')){
   document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$('balance').classList.add('active');
   document.querySelectorAll('.nav').forEach(v=>v.classList.toggle('active',v.dataset.view==='balance'));
 }
 /* carregamento ocorre apenas ao entrar na aba ou clicar em Atualizar */
}
window.loadHistoricalBalance=loadHistoricalBalance;

window.__activateAdmin=()=>{admin=true;const b=$('balanceAdminBtn');if(b)b.textContent='🔓 Administrador ativo';const n=$('adminHistoricalNav');if(n)n.classList.remove('hidden');renderBalanceAdmin();syncHistoricalAdminUI();decorate();if(typeof window.renderBalance==='function')window.renderBalance();};window.__adminMode=()=>admin;window.renderBalanceAdmin=renderBalanceAdmin;
$('adminHistoricalRefresh')?.addEventListener('click',loadHistoricalBalance);document.querySelector('[data-view="adminHistorical"]')?.addEventListener('click',()=>{if(!admin)return;loadHistoricalBalance()});syncHistoricalAdminUI();let btries=0;const bt=setInterval(()=>{installBalance();if(++btries>120)clearInterval(bt)},300);
})();
/* Balanço Administrativo — versão robusta */
(function(){
'use strict';
const PASS='95842659';
let admin=false;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function syncHistoricalAdminUI(){
  const nav=$('adminHistoricalNav');
  if(nav)nav.classList.toggle('hidden',!admin);
  if(!admin && $('adminHistorical')?.classList.contains('active')){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    $('balance')?.classList.add('active');
    document.querySelectorAll('.nav').forEach(v=>v.classList.toggle('active',v.dataset.view==='balance'));
  }
}
window.__adminMode=()=>admin;

async function toggleExcluded(id,excluded){
  if(!admin)return;
  const r=await sb.from('orders').update({exclude_from_balance:excluded}).eq('id',id);
  if(r.error){toast('Erro ao salvar: '+r.error.message);return}
  const o=(window.orders||[]).find(x=>x.id===id);
  if(o)o.exclude_from_balance=excluded;
  toast(excluded?'Serviço retirado do balanço':'Serviço incluído no balanço');
  renderHistoricalServiceControl();
  renderHistoricalAdminSummary();
  if(typeof window.renderBalance==='function')window.renderBalance();
}

function renderHistoricalAdminSummary(){
  const box=$('adminHistoricalSummary'); if(!box)return;
  const os=(window.orders||[]).filter(o=>String(o.exit_date||'').trim());
  let all={sale:0,cost:0,tax:0,freight:0,count:0},normal={sale:0,cost:0,tax:0,freight:0,count:0},hidden={sale:0,cost:0,tax:0,freight:0,count:0};
  os.forEach(o=>(o.order_items||[]).filter(i=>String(i.service_status||'').trim().toLowerCase()==='pronto entregue').forEach(i=>{
    const t=o.exclude_from_balance?hidden:normal,s=Number(i.sale_value)||0;
    t.sale+=s;t.cost+=Number(i.cost_value)||0;t.freight+=Number(i.freight_value)||0;t.tax+=s*(Number(i.tax_rate)||0)/100;t.count++;
  }));
  all={sale:normal.sale+hidden.sale,cost:normal.cost+hidden.cost,tax:normal.tax+hidden.tax,freight:normal.freight+hidden.freight,count:normal.count+hidden.count};
  const profit=x=>x.sale-x.cost-x.tax-x.freight;
  box.innerHTML='<div class="card" style="margin-bottom:16px"><h3 style="margin:0 0 12px">📊 Resumo dos serviços</h3><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>💰 Valor real — todos os serviços</small><b style="display:block;font-size:23px;margin-top:4px">'+money(all.sale)+'</b><span style="font-size:12px;color:var(--muted)">Lucro líquido: '+money(profit(all))+' • '+all.count+' serviços</span></div><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>📋 Valor considerado no balanço</small><b style="display:block;font-size:23px;margin-top:4px">'+money(normal.sale)+'</b><span style="font-size:12px;color:var(--muted)">Lucro líquido: '+money(profit(normal))+' • '+normal.count+' serviços</span></div><div style="padding:12px;border:1px dashed var(--line);border-radius:12px"><small>Valor dos serviços ocultos</small><b style="display:block;margin-top:4px">'+money(hidden.sale)+'</b></div><div style="padding:12px;border:1px dashed var(--line);border-radius:12px"><small>Lucro dos serviços ocultos</small><b style="display:block;margin-top:4px">'+money(profit(hidden))+'</b></div></div><p style="margin:12px 0 0;color:var(--muted);font-size:12px">Os valores administrativos históricos ficam separados dos lançamentos normais.</p></div>';
}

function renderHistoricalServiceControl(){
  const box=$('adminHistoricalServices');if(!box)return;
  const rows=(window.orders||[]).map(o=>({o,items:(o.order_items||[]).filter(i=>String(i.service_status||'').trim().toLowerCase()==='pronto entregue')})).filter(x=>x.items.length);
  let html='<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">🔐 Controle dos serviços</h3><p style="margin:4px 0 0;color:var(--muted);font-size:13px">Marque/desmarque os serviços que entram no Balanço normal.</p></div><span class="pill">'+rows.filter(x=>x.o.exclude_from_balance).length+' ocultados</span></div>';
  if(!rows.length){box.innerHTML=html+'<div class="empty" style="margin-top:12px">Nenhum serviço PRONTO/ENTREGUE encontrado.</div></div>';return}
  html+='<div style="margin-top:12px;overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;text-align:left;border-bottom:1px solid var(--line)">Considerar</th><th style="padding:8px;text-align:left;border-bottom:1px solid var(--line)">Data</th><th style="padding:8px;text-align:left;border-bottom:1px solid var(--line)">Cliente</th><th style="padding:8px;text-align:left;border-bottom:1px solid var(--line)">Serviço</th><th style="padding:8px;text-align:right;border-bottom:1px solid var(--line)">Venda</th></tr></thead><tbody>';
  rows.forEach(x=>{
    const sale=x.items.reduce((s,i)=>s+(Number(i.sale_value)||0),0),desc=x.items.map(i=>i.description||'').filter(Boolean).join(' + ');
    html+='<tr><td style="padding:8px;border-bottom:1px solid var(--line)"><input type="checkbox" data-hist-exclude="'+x.o.id+'" '+(x.o.exclude_from_balance?'':'checked')+'></td><td style="padding:8px;border-bottom:1px solid var(--line)">'+esc(x.o.exit_date||'—')+'</td><td style="padding:8px;border-bottom:1px solid var(--line)">'+esc(x.o.client_name||'Sem cliente')+'</td><td style="padding:8px;border-bottom:1px solid var(--line)">'+esc(desc)+'</td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--line)">'+money(sale)+'</td></tr>';
  });
  box.innerHTML=html+'</tbody></table></div></div>';
  box.querySelectorAll('[data-hist-exclude]').forEach(ch=>ch.onchange=()=>toggleExcluded(ch.dataset.histExclude,!ch.checked));
}

async function loadHistoricalBalance(){
  const box=$('adminHistoricalContent');if(!box)return;
  const companyId=company?.id||sessionStorage.getItem('companyId');
  if(!companyId){box.innerHTML='<div class="card">Nenhuma empresa selecionada.</div>';return}
  box.innerHTML='<div class="card">Carregando balanço histórico...</div>';
  const r=await sb.from('admin_historical_balance').select('*').eq('company_id',companyId).order('balance_year',{ascending:false}).order('is_annual_total',{ascending:false}).order('balance_month',{ascending:true});
  if(r.error){box.innerHTML='<div class="card"><b>Erro ao carregar o balanço administrativo:</b><br>'+esc(r.error.message)+'</div>';return}
  const data=r.data||[];
  if(!data.length){
    box.innerHTML='<div class="card"><h3 style="margin-top:0">Nenhum balanço histórico cadastrado</h3><p style="color:var(--muted)">Use “Adicionar ano” para começar. Os dados desta aba são independentes dos lançamentos normais.</p><button class="btn primary" id="histAddYearEmpty">＋ Adicionar ano</button></div>';
    $('histAddYearEmpty').onclick=addYear;
    renderHistoricalAdminSummary();renderHistoricalServiceControl();return;
  }
  const annual=data.filter(x=>x.is_annual_total);
  const overall1=annual.reduce((s,x)=>s+(Number(x.value_1)||0),0),overall2=annual.reduce((s,x)=>s+(Number(x.value_2)||0),0);
  let html='<div class="card" style="margin-bottom:16px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h3 style="margin:0">📊 Balanço histórico administrativo</h3><p style="margin:4px 0 0;color:var(--muted);font-size:13px">Valor 1 = Marmeleiro • Valor 2 = Francisco Beltrão</p></div><button class="btn primary" id="histAddYear">＋ Adicionar ano</button></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px"><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>Total geral — Marmeleiro</small><b style="display:block;font-size:24px;margin-top:5px">'+money(overall1)+'</b></div><div style="padding:14px;border:1px solid var(--line);border-radius:12px"><small>Total geral — Francisco Beltrão</small><b style="display:block;font-size:24px;margin-top:5px">'+money(overall2)+'</b></div></div></div>';
  [...new Set(data.map(x=>Number(x.balance_year)))].sort((a,b)=>b-a).forEach(y=>{
    const ar=data.find(x=>Number(x.balance_year)===y&&x.is_annual_total);
    const monthly=data.filter(x=>Number(x.balance_year)===y&&!x.is_annual_total).sort((a,b)=>Number(a.balance_month)-Number(b.balance_month));
    html+='<div class="card hist-year" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0">'+y+'</h2><button class="btn histAddMonth" data-year="'+y+'">＋ Adicionar mês</button></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:14px 0"><label><small>Total anual — Marmeleiro</small><input class="histAnnual1" type="number" step="0.01" value="'+(ar?.value_1??0)+'"></label><label><small>Total anual — Francisco Beltrão</small><input class="histAnnual2" type="number" step="0.01" value="'+(ar?.value_2??0)+'"></label></div><div style="text-align:right;margin-bottom:10px"><button class="btn histSaveAnnual" data-id="'+(ar?.id||'')+'" data-year="'+y+'">💾 Salvar total '+y+'</button></div><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:9px;text-align:left;border-bottom:1px solid var(--line)">Mês</th><th style="padding:9px;text-align:right;border-bottom:1px solid var(--line)">Marmeleiro</th><th style="padding:9px;text-align:right;border-bottom:1px solid var(--line)">Francisco Beltrão</th><th style="padding:9px;text-align:right;border-bottom:1px solid var(--line)">Ação</th></tr></thead><tbody>';
    monthly.forEach(x=>{html+='<tr><td style="padding:8px;border-bottom:1px solid var(--line)">'+months[Number(x.balance_month)-1]+'</td><td style="padding:8px;border-bottom:1px solid var(--line)"><input class="histM1" type="number" step="0.01" value="'+(x.value_1??0)+'" style="width:150px;text-align:right"></td><td style="padding:8px;border-bottom:1px solid var(--line)"><input class="histM2" type="number" step="0.01" value="'+(x.value_2??0)+'" style="width:150px;text-align:right"></td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--line)"><button class="btn histSaveMonth" data-id="'+x.id+'">Salvar</button></td></tr>'});
    html+='</tbody></table></div></div>';
  });
  box.innerHTML=html;
  $('histAddYear')?.addEventListener('click',addYear);
  box.querySelectorAll('.histAddMonth').forEach(b=>b.onclick=()=>addMonth(Number(b.dataset.year)));
  box.querySelectorAll('.histSaveAnnual').forEach(b=>b.onclick=async()=>{
    const card=b.closest('.hist-year'),y=Number(b.dataset.year),id=b.dataset.id;
    const p={value_1:Number(card.querySelector('.histAnnual1').value)||0,value_2:Number(card.querySelector('.histAnnual2').value)||0};
    const rr=id?await sb.from('admin_historical_balance').update(p).eq('id',id):await sb.from('admin_historical_balance').insert({...p,company_id:companyId,balance_year:y,balance_month:null,is_annual_total:true,source_file:'Cadastro administrativo'});
    if(rr.error){toast('Erro ao salvar: '+rr.error.message);return}toast('Total anual salvo.');loadHistoricalBalance();
  });
  box.querySelectorAll('.histSaveMonth').forEach(b=>b.onclick=async()=>{
    const row=b.closest('tr'),id=b.dataset.id;
    const rr=await sb.from('admin_historical_balance').update({value_1:Number(row.querySelector('.histM1').value)||0,value_2:Number(row.querySelector('.histM2').value)||0}).eq('id',id);
    if(rr.error){toast('Erro ao salvar: '+rr.error.message);return}
    toast('Valor do mês salvo. O total geral permanece baseado nos totais anuais.');loadHistoricalBalance();
  });
  renderHistoricalAdminSummary();renderHistoricalServiceControl();
}

async function addYear(){
  const y=Number(prompt('Qual ano deseja adicionar? Ex.: 2027'));
  if(!Number.isInteger(y)||y<2000||y>2100)return;
  const cid=company?.id||sessionStorage.getItem('companyId');
  const exists=await sb.from('admin_historical_balance').select('id').eq('company_id',cid).eq('balance_year',y).eq('is_annual_total',true).maybeSingle();
  if(exists.data){toast('Esse ano já existe.');return}
  const r=await sb.from('admin_historical_balance').insert({company_id:cid,balance_year:y,balance_month:null,value_1:0,value_2:0,is_annual_total:true,source_file:'Cadastro administrativo'});
  if(r.error){toast('Erro ao criar ano: '+r.error.message);return}
  toast('Ano '+y+' criado.');loadHistoricalBalance();
}
async function addMonth(y){
  const m=Number(prompt('Digite o mês (1 a 12) para '+y));
  if(!Number.isInteger(m)||m<1||m>12)return;
  const cid=company?.id||sessionStorage.getItem('companyId');
  const ex=await sb.from('admin_historical_balance').select('id').eq('company_id',cid).eq('balance_year',y).eq('balance_month',m).eq('is_annual_total',false).maybeSingle();
  if(ex.data){toast('Esse mês já existe.');return}
  const r=await sb.from('admin_historical_balance').insert({company_id:cid,balance_year:y,balance_month:m,value_1:0,value_2:0,is_annual_total:false,source_file:'Cadastro administrativo'});
  if(r.error){toast('Erro ao criar mês: '+r.error.message);return}
  toast(months[m-1]+' de '+y+' criado.');loadHistoricalBalance();
}

function renderBalanceAdmin(){
  let box=$('balanceAdminPanel');if(!box)return;
  if(!admin){box.classList.add('hidden');return}
  box.classList.remove('hidden');
}

function installBalance(){
  const head=document.querySelector('#balance .head');if(!head||$('balanceAdminBtn'))return;
  const b=document.createElement('button');b.id='balanceAdminBtn';b.className='btn';b.textContent='🔒 Administrador';
  b.onclick=()=>{if(admin){admin=false;b.textContent='🔒 Administrador';syncHistoricalAdminUI();return}const p=prompt('Senha de administrador:');if(String(p??'').trim()===PASS){admin=true;b.textContent='🔓 Administrador ativo';syncHistoricalAdminUI();toast('Modo administrador ativado')}else if(p!==null)toast('Senha incorreta')};
  head.appendChild(b);
}

function decorate(){
  const list=$('allServicesList');if(!list)return;
  list.querySelectorAll('.service-card').forEach(card=>{
    let box=card.querySelector('.admin-balance-control');
    if(!admin){if(box)box.remove();return}
    const id=card.dataset.orderId||card.dataset.id;if(!id)return;
    const o=(window.orders||[]).find(x=>x.id===id);
    if(!box){
      box=document.createElement('label');box.className='admin-balance-control';box.innerHTML='<input type="checkbox"> Não considerar no balanço';
      card.appendChild(box);box.querySelector('input').onchange=e=>toggleExcluded(id,e.target.checked);
    }
    box.querySelector('input').checked=!!o?.exclude_from_balance;
  });
}

function activate(){
  admin=true;
  const b=$('balanceAdminBtn');if(b)b.textContent='🔓 Administrador ativo';
  syncHistoricalAdminUI();renderBalanceAdmin();decorate();
  setTimeout(()=>{const v=$('adminHistorical');if(v){document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));v.classList.add('active')}document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.view==='adminHistorical'));loadHistoricalBalance()},80);
}
window.enterAdminWithPassword=p=>{const ok=String(p??'').replace(/\D/g,'')===PASS;if(ok)activate();return ok};
window.__activateAdmin=activate;
window.__forceAdminHistorical=()=>{if(admin)loadHistoricalBalance()};
window.loadHistoricalBalance=loadHistoricalBalance;
window.renderBalanceAdmin=renderBalanceAdmin;
window.syncHistoricalAdminUI=syncHistoricalAdminUI;

document.addEventListener('DOMContentLoaded',()=>{
  $('adminHistoricalRefresh')?.addEventListener('click',loadHistoricalBalance);
  $('adminHistoricalNav')?.addEventListener('click',e=>{if(!admin){e.preventDefault();return}setTimeout(loadHistoricalBalance,30)});
  installBalance();syncHistoricalAdminUI();
});
let tries=0;const timer=setInterval(()=>{installBalance();decorate();if(++tries>100)clearInterval(timer)},300);
})();
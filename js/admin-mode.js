/* Balanço Administrativo — interface e edição */
(function(){
'use strict';
const PASS='95842659';
let admin=false;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const companyId=()=>window.company?.id||sessionStorage.getItem('companyId');

function toastSafe(msg){if(typeof toast==='function')toast(msg);else console.log(msg)}
function syncHistoricalAdminUI(){
  const nav=$('adminHistoricalNav');
  if(nav)nav.classList.toggle('hidden',!admin);
  if(!admin&&$('adminHistorical')?.classList.contains('active')){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    $('balance')?.classList.add('active');
    document.querySelectorAll('.nav').forEach(v=>v.classList.toggle('active',v.dataset.view==='balance'));
  }
}
window.__adminMode=()=>admin;

async function toggleExcluded(id,excluded){
  if(!admin)return;
  const r=await sb.from('orders').update({exclude_from_balance:excluded}).eq('id',id);
  if(r.error){toastSafe('Erro ao salvar: '+r.error.message);return}
  const o=(window.orders||[]).find(x=>x.id===id);if(o)o.exclude_from_balance=excluded;
  toastSafe(excluded?'Serviço retirado do balanço':'Serviço incluído no balanço');
  renderHistoricalServiceControl();renderHistoricalAdminSummary();
  if(typeof window.renderBalance==='function')window.renderBalance();
}

function renderHistoricalAdminSummary(){
  const box=$('adminHistoricalSummary');if(!box)return;
  const os=(window.orders||[]).filter(o=>String(o.exit_date||'').trim());
  let all={sale:0,cost:0,tax:0,freight:0,count:0},normal={sale:0,cost:0,tax:0,freight:0,count:0},hidden={sale:0,cost:0,tax:0,freight:0,count:0};
  os.forEach(o=>(o.order_items||[]).filter(i=>String(i.service_status||'').trim().toLowerCase()==='pronto entregue').forEach(i=>{
    const t=o.exclude_from_balance?hidden:normal,s=Number(i.sale_value)||0;
    t.sale+=s;t.cost+=Number(i.cost_value)||0;t.freight+=Number(i.freight_value)||0;t.tax+=s*(Number(i.tax_rate)||0)/100;t.count++;
  }));
  all={sale:normal.sale+hidden.sale,cost:normal.cost+hidden.cost,tax:normal.tax+hidden.tax,freight:normal.freight+hidden.freight,count:normal.count+hidden.count};
  const profit=x=>x.sale-x.cost-x.tax-x.freight;
  box.innerHTML='<div class="card admin-summary-card"><div class="admin-section-title"><div><h3>Resumo dos serviços</h3><p>Controle administrativo dos serviços, separado do Balanço normal.</p></div></div><div class="admin-stat-grid"><div class="admin-stat"><span>Valor real — todos os serviços</span><strong>'+money(all.sale)+'</strong><small>'+all.count+' serviços • Lucro líquido '+money(profit(all))+'</small></div><div class="admin-stat"><span>Valor considerado no balanço</span><strong>'+money(normal.sale)+'</strong><small>'+normal.count+' serviços • Lucro líquido '+money(profit(normal))+'</small></div><div class="admin-stat muted"><span>Serviços ocultos</span><strong>'+money(hidden.sale)+'</strong><small>Lucro oculto '+money(profit(hidden))+'</small></div></div></div>';
}

function renderHistoricalServiceControl(){
  const box=$('adminHistoricalServices');if(!box)return;
  const rows=(window.orders||[]).map(o=>({o,items:(o.order_items||[]).filter(i=>String(i.service_status||'').trim().toLowerCase()==='pronto entregue')})).filter(x=>x.items.length);
  let html='<div class="card admin-services-card"><div class="admin-section-title"><div><h3>Controle dos serviços</h3><p>Marque ou desmarque quais serviços entram no Balanço normal. Nenhum serviço é apagado.</p></div><span class="admin-badge">'+rows.filter(x=>x.o.exclude_from_balance).length+' ocultados</span></div>';
  if(!rows.length){box.innerHTML=html+'<div class="empty">Nenhum serviço PRONTO/ENTREGUE encontrado.</div></div>';return}
  html+='<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Considerar</th><th>Data</th><th>Cliente</th><th>Serviço</th><th class="num">Venda</th></tr></thead><tbody>';
  rows.forEach(x=>{const sale=x.items.reduce((s,i)=>s+(Number(i.sale_value)||0),0),desc=x.items.map(i=>i.description||'').filter(Boolean).join(' + ');html+='<tr><td><input type="checkbox" data-hist-exclude="'+x.o.id+'" '+(x.o.exclude_from_balance?'':'checked')+'></td><td>'+String(x.o.exit_date||'—')+'</td><td>'+esc(x.o.client_name||'Sem cliente')+'</td><td>'+esc(desc)+'</td><td class="num">'+money(sale)+'</td></tr>'});
  box.innerHTML=html+'</tbody></table></div></div>';
  box.querySelectorAll('[data-hist-exclude]').forEach(ch=>ch.onchange=()=>toggleExcluded(ch.dataset.histExclude,!ch.checked));
}

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function yearCard(y,data){
  const ar=data.find(x=>Number(x.balance_year)===y&&x.is_annual_total);
  const monthly=Array.from({length:12},(_,idx)=>data.find(x=>Number(x.balance_year)===y&&!x.is_annual_total&&Number(x.balance_month)===idx+1)||{balance_year:y,balance_month:idx+1,value_1:0,value_2:0});
  const m1=monthly.reduce((s,x)=>s+(Number(x.value_1)||0),0),m2=monthly.reduce((s,x)=>s+(Number(x.value_2)||0),0);
  let rows='';
  monthly.forEach((x,idx)=>{rows+='<div class="admin-month-row" data-year="'+y+'" data-month="'+(idx+1)+'" data-id="'+(x.id||'')+'"><div class="admin-month-name"><span>'+String(idx+1).padStart(2,'0')+'</span><b>'+months[idx]+'</b></div><div class="admin-input-wrap"><span>R$</span><input class="histM1" type="number" step="0.01" min="0" value="'+Number(x.value_1||0).toFixed(2)+'" aria-label="Marmeleiro '+months[idx]+' '+y+'"></div><div class="admin-input-wrap"><span>R$</span><input class="histM2" type="number" step="0.01" min="0" value="'+Number(x.value_2||0).toFixed(2)+'" aria-label="Francisco Beltrão '+months[idx]+' '+y+'"></div><button class="btn histSaveMonth" type="button" '+(x.id?'':'data-new="1"')+'>Salvar</button></div>'});
  return '<div class="admin-year-card" data-year-card="'+y+'"><div class="admin-year-head"><div><div class="admin-year-title">'+y+'</div><div class="admin-year-sub">Lançamentos mensais</div></div><div class="admin-year-totals"><div><span>Marmeleiro</span><b class="year-total-1">'+money(m1)+'</b></div><div><span>Francisco Beltrão</span><b class="year-total-2">'+money(m2)+'</b></div></div></div><div class="admin-month-head"><span>Mês</span><span>Marmeleiro</span><span>Francisco Beltrão</span><span></span></div><div class="admin-months">'+rows+'</div><div class="admin-year-foot"><span>O total anual é a soma dos 12 meses.</span><button class="btn primary histSaveYear" type="button">💾 Salvar alterações de '+y+'</button></div></div>';
}

async function loadHistoricalBalance(){
  const box=$('adminHistoricalContent');if(!box)return;
  const cid=companyId();if(!cid){box.innerHTML='<div class="card">Nenhuma empresa selecionada.</div>';return}
  box.innerHTML='<div class="card">Carregando balanço administrativo...</div>';
  const r=await sb.from('admin_historical_balance').select('*').eq('company_id',cid).order('balance_year',{ascending:false}).order('is_annual_total',{ascending:false}).order('balance_month',{ascending:true});
  if(r.error){box.innerHTML='<div class="card"><b>Erro ao carregar:</b><br>'+esc(r.error.message)+'</div>';return}
  const data=r.data||[];
  if(!data.length){box.innerHTML='<div class="card"><h3>Nenhum balanço histórico cadastrado</h3><p>Use o botão abaixo para criar o primeiro ano.</p><button class="btn primary" id="histAddYearEmpty">＋ Adicionar ano</button></div>';$('histAddYearEmpty').onclick=addYear;renderHistoricalAdminSummary();renderHistoricalServiceControl();return}
  const years=[...new Set(data.map(x=>Number(x.balance_year)))].sort((a,b)=>b-a);
  const total1=years.reduce((s,y)=>{const ms=data.filter(x=>Number(x.balance_year)===y&&!x.is_annual_total);return s+ms.reduce((a,x)=>a+(Number(x.value_1)||0),0)},0);
  const total2=years.reduce((s,y)=>{const ms=data.filter(x=>Number(x.balance_year)===y&&!x.is_annual_total);return s+ms.reduce((a,x)=>a+(Number(x.value_2)||0),0)},0);
  let html='<div class="admin-dashboard"><div><span>Todos os anos — Marmeleiro</span><strong>'+money(total1)+'</strong></div><div><span>Todos os anos — Francisco Beltrão</span><strong>'+money(total2)+'</strong></div><button class="btn primary" id="histAddYear">＋ Novo ano</button></div>';
  years.forEach(y=>{html+=yearCard(y,data)});
  box.innerHTML=html;
  $('histAddYear')?.addEventListener('click',addYear);
  box.querySelectorAll('.histSaveYear').forEach(b=>b.onclick=()=>saveYear(b.closest('[data-year-card]')));
  box.querySelectorAll('.histSaveMonth').forEach(b=>b.onclick=()=>saveMonth(b.closest('.admin-month-row')));
  box.querySelectorAll('.histM1,.histM2').forEach(i=>i.addEventListener('input',()=>updateYearTotals(i.closest('[data-year-card]'))));
  renderHistoricalAdminSummary();renderHistoricalServiceControl();
}

function updateYearTotals(card){
  if(!card)return;
  let a=0,b=0;
  card.querySelectorAll('.histM1').forEach(i=>a+=Number(i.value)||0);
  card.querySelectorAll('.histM2').forEach(i=>b+=Number(i.value)||0);
  card.querySelector('.year-total-1').textContent=money(a);
  card.querySelector('.year-total-2').textContent=money(b);
}

async function saveMonth(row){
  if(!row)return;
  const cid=companyId(),y=Number(row.dataset.year),m=Number(row.dataset.month),v1=Number(row.querySelector('.histM1').value)||0,v2=Number(row.querySelector('.histM2').value)||0,id=row.dataset.id;
  let r=id?await sb.from('admin_historical_balance').update({value_1:v1,value_2:v2}).eq('id',id):await sb.from('admin_historical_balance').insert({company_id:cid,balance_year:y,balance_month:m,value_1:v1,value_2:v2,is_annual_total:false,source_file:'Cadastro administrativo'}).select().single();
  if(r.error){toastSafe('Erro ao salvar '+months[m-1]+': '+r.error.message);return}
  if(r.data?.id)row.dataset.id=r.data.id;
  await syncAnnual(y);
  toastSafe(months[m-1]+' de '+y+' salvo.');
  updateYearTotals(row.closest('[data-year-card]'));
  refreshGlobalTotals();
}

async function saveYear(card){
  const y=Number(card.dataset.year);
  const btn=card.querySelector('.histSaveYear');btn.disabled=true;
  try{
    const rows=[...card.querySelectorAll('.admin-month-row')],cid=companyId();
    for(const row of rows){
      const m=Number(row.dataset.month),v1=Number(row.querySelector('.histM1').value)||0,v2=Number(row.querySelector('.histM2').value)||0,id=row.dataset.id;
      const r=id?await sb.from('admin_historical_balance').update({value_1:v1,value_2:v2}).eq('id',id):await sb.from('admin_historical_balance').insert({company_id:cid,balance_year:y,balance_month:m,value_1:v1,value_2:v2,is_annual_total:false,source_file:'Cadastro administrativo'}).select().single();
      if(r.error)throw new Error(months[m-1]+': '+r.error.message);
      if(r.data?.id)row.dataset.id=r.data.id;
    }
    await syncAnnual(y);
    updateYearTotals(card);refreshGlobalTotals();toastSafe('Todos os meses de '+y+' foram salvos.');
  }catch(e){toastSafe('Erro ao salvar '+y+': '+e.message)}finally{btn.disabled=false}
}

async function syncAnnual(y){
  const cid=companyId();
  const r=await sb.from('admin_historical_balance').select('id,value_1,value_2').eq('company_id',cid).eq('balance_year',y).eq('is_annual_total',false);
  if(r.error)return;
  const v1=(r.data||[]).reduce((s,x)=>s+(Number(x.value_1)||0),0),v2=(r.data||[]).reduce((s,x)=>s+(Number(x.value_2)||0),0);
  const ar=await sb.from('admin_historical_balance').select('id').eq('company_id',cid).eq('balance_year',y).eq('is_annual_total',true).maybeSingle();
  if(ar.data)await sb.from('admin_historical_balance').update({value_1:v1,value_2:v2}).eq('id',ar.data.id);
  else await sb.from('admin_historical_balance').insert({company_id:cid,balance_year:y,balance_month:null,value_1:v1,value_2:v2,is_annual_total:true,source_file:'Cadastro administrativo'});
}

function refreshGlobalTotals(){
  const cards=[...document.querySelectorAll('[data-year-card]')];let a=0,b=0;
  cards.forEach(c=>{a+=c.querySelectorAll('.histM1').length?Number(c.querySelector('.year-total-1').textContent.replace(/[^0-9,-]/g,'').replace('.','').replace(',','.'))||0:0;b+=c.querySelectorAll('.histM2').length?Number(c.querySelector('.year-total-2').textContent.replace(/[^0-9,-]/g,'').replace('.','').replace(',','.'))||0:0});
  const ds=document.querySelectorAll('.admin-dashboard strong');if(ds[0])ds[0].textContent=money(a);if(ds[1])ds[1].textContent=money(b);
}

async function addYear(){
  const raw=prompt('Qual ano deseja adicionar? Ex.: 2027');
  const y=Number(raw);if(!Number.isInteger(y)||y<2000||y>2100)return;
  const cid=companyId();
  const ex=await sb.from('admin_historical_balance').select('id').eq('company_id',cid).eq('balance_year',y).eq('is_annual_total',true).maybeSingle();
  if(ex.data){toastSafe('Esse ano já existe.');return}
  const records=[{company_id:cid,balance_year:y,balance_month:null,value_1:0,value_2:0,is_annual_total:true,source_file:'Cadastro administrativo'}];
  for(let m=1;m<=12;m++)records.push({company_id:cid,balance_year:y,balance_month:m,value_1:0,value_2:0,is_annual_total:false,source_file:'Cadastro administrativo'});
  const r=await sb.from('admin_historical_balance').insert(records);
  if(r.error){toastSafe('Erro ao criar '+y+': '+r.error.message);return}
  toastSafe('Ano '+y+' criado com os 12 meses.');loadHistoricalBalance();
}

function installStyles(){
  if($('adminHistoricalStyles'))return;
  const s=document.createElement('style');s.id='adminHistoricalStyles';s.textContent=`
#adminHistorical{max-width:none}
#adminHistorical .head{margin-bottom:18px}
.admin-summary-card,.admin-services-card{margin-bottom:18px}
.admin-section-title{display:flex;align-items:center;justify-content:space-between;gap:16px}
.admin-section-title h3{margin:0;font-size:18px}.admin-section-title p{margin:4px 0 0;color:var(--muted);font-size:13px}
.admin-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
.admin-stat{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--card,#fff)}.admin-stat span,.admin-stat small{display:block;color:var(--muted);font-size:12px}.admin-stat strong{display:block;font-size:24px;margin:5px 0}.admin-stat.muted{background:var(--soft,#f7f8fa)}
.admin-badge{padding:7px 10px;border-radius:999px;background:#fff2f2;color:#a33;font-size:12px;font-weight:700}
.admin-table-wrap{overflow:auto;margin-top:14px}.admin-table{width:100%;border-collapse:separate;border-spacing:0;min-width:760px}.admin-table th,.admin-table td{padding:11px 10px;border-bottom:1px solid var(--line);text-align:left}.admin-table th{font-size:11px;text-transform:uppercase;color:var(--muted);background:var(--soft,#f7f8fa)}.admin-table .num{text-align:right}
.admin-dashboard{display:grid;grid-template-columns:1fr 1fr auto;gap:14px;align-items:stretch;margin-bottom:18px}.admin-dashboard>div{padding:18px 20px;border:1px solid var(--line);border-radius:16px;background:var(--card,#fff)}.admin-dashboard span{display:block;color:var(--muted);font-size:12px}.admin-dashboard strong{display:block;font-size:27px;margin-top:6px}
.admin-year-card{background:var(--card,#fff);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-bottom:18px;box-shadow:0 2px 8px rgba(0,0,0,.035)}
.admin-year-head{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:20px 22px;border-bottom:1px solid var(--line);background:var(--soft,#f7f8fa)}.admin-year-title{font-size:26px;font-weight:800}.admin-year-sub{color:var(--muted);font-size:12px;margin-top:2px}
.admin-year-totals{display:flex;gap:12px}.admin-year-totals>div{min-width:190px;padding:10px 14px;border-radius:12px;background:#fff;border:1px solid var(--line)}.admin-year-totals span{display:block;color:var(--muted);font-size:11px}.admin-year-totals b{font-size:18px}
.admin-month-head,.admin-month-row{display:grid;grid-template-columns:1.2fr 1.35fr 1.35fr 86px;gap:12px;align-items:center}.admin-month-head{padding:10px 22px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);background:#fbfbfc}.admin-month-row{padding:10px 22px;border-top:1px solid var(--line)}.admin-month-row:hover{background:var(--soft,#fafafa)}
.admin-month-name{display:flex;align-items:center;gap:10px}.admin-month-name span{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:var(--soft,#f3f4f6);font-size:10px;font-weight:700;color:var(--muted)}.admin-month-name b{font-size:14px}
.admin-input-wrap{display:flex;align-items:center;border:1px solid var(--line);border-radius:10px;background:#fff;overflow:hidden}.admin-input-wrap span{padding-left:10px;color:var(--muted);font-size:12px}.admin-input-wrap input{border:0!important;outline:0!important;width:100%;padding:10px 10px 10px 5px;background:transparent;text-align:right;font-weight:600}
.admin-month-row .btn{padding:9px 12px}.admin-year-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 22px;background:var(--soft,#f7f8fa);border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
@media(max-width:900px){.admin-stat-grid{grid-template-columns:1fr}.admin-dashboard{grid-template-columns:1fr}.admin-year-head{align-items:flex-start;flex-direction:column}.admin-year-totals{width:100%;flex-wrap:wrap}.admin-month-head{display:none}.admin-month-row{grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px}.admin-month-name{grid-column:1/-1}.admin-month-row .btn{grid-column:1/-1}.admin-year-foot{align-items:stretch;flex-direction:column}}
`;document.head.appendChild(s)
}

function installBalance(){
  const head=document.querySelector('#balance .head');if(!head||$('balanceAdminBtn'))return;
  const b=document.createElement('button');b.id='balanceAdminBtn';b.className='btn';b.textContent='🔒 Administrador';
  b.onclick=()=>{if(admin){admin=false;b.textContent='🔒 Administrador';syncHistoricalAdminUI();return}const p=prompt('Senha de administrador:');if(String(p??'').trim()===PASS){activate()}else if(p!==null)toastSafe('Senha incorreta')};
  head.appendChild(b);
}
function decorate(){
  const list=$('allServicesList');if(!list)return;
  list.querySelectorAll('.service-card').forEach(card=>{
    let box=card.querySelector('.admin-balance-control');if(!admin){if(box)box.remove();return}
    const id=card.dataset.orderId||card.dataset.id;if(!id)return;const o=(window.orders||[]).find(x=>x.id===id);
    if(!box){box=document.createElement('label');box.className='admin-balance-control';box.innerHTML='<input type="checkbox"> Não considerar no balanço';card.appendChild(box);box.querySelector('input').onchange=e=>toggleExcluded(id,e.target.checked)}
    box.querySelector('input').checked=!!o?.exclude_from_balance;
  });
}
function activate(){
  admin=true;const b=$('balanceAdminBtn');if(b)b.textContent='🔓 Administrador ativo';syncHistoricalAdminUI();installStyles();decorate();
  setTimeout(()=>{const v=$('adminHistorical');if(v){document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));v.classList.add('active')}document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.view==='adminHistorical'));loadHistoricalBalance()},80)
}
window.enterAdminWithPassword=p=>{const ok=String(p??'').replace(/\D/g,'')===PASS;if(ok)activate();return ok};
window.__activateAdmin=activate;window.__forceAdminHistorical=()=>{if(admin)loadHistoricalBalance()};window.loadHistoricalBalance=loadHistoricalBalance;window.renderBalanceAdmin=()=>{};window.syncHistoricalAdminUI=syncHistoricalAdminUI;
document.addEventListener('DOMContentLoaded',()=>{$('adminHistoricalRefresh')?.addEventListener('click',loadHistoricalBalance);$('adminHistoricalNav')?.addEventListener('click',e=>{if(!admin){e.preventDefault();return}setTimeout(loadHistoricalBalance,30)});installBalance();installStyles();syncHistoricalAdminUI()});
let tries=0;const timer=setInterval(()=>{installBalance();decorate();if(++tries>100)clearInterval(timer)},300);
})();
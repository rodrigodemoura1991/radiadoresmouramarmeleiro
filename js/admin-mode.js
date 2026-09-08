/* MODO ADMINISTRADOR — controle de inclusão no balanço */
(function(){
'use strict';
const PASS=[57,53,56,52,50,54,53,57].map(x=>String.fromCharCode(x)).join('');
let admin=false;const $=id=>document.getElementById(id);
function install(){const head=document.querySelector('#services .head');if(!head||$('adminModeBtn'))return;const b=document.createElement('button');b.id='adminModeBtn';b.className='btn';b.textContent='🔒 Administrador';b.title='Área administrativa';b.onclick=()=>{if(admin){admin=false;b.textContent='🔒 Administrador';decorate();return}const p=prompt('Senha de administrador:');if(p===PASS){admin=true;b.textContent='🔓 Administrador ativo';decorate();if(typeof toast==='function')toast('Modo administrador ativado')}else if(p!==null&&typeof toast==='function')toast('Senha incorreta')};head.appendChild(b);decorate()}
async function toggle(id,checked){if(!admin)return;const r=await sb.from('orders').update({exclude_from_balance:checked}).eq('id',id);if(r.error){if(typeof toast==='function')toast('Erro ao atualizar: '+r.error.message);return}const o=(window.orders||[]).find(x=>x.id===id);if(o){o.exclude_from_balance=checked;(o.order_items||[]).forEach(i=>i.exclude_from_balance=checked)}if(typeof toast==='function')toast(checked?'Serviço retirado do balanço':'Serviço incluído novamente no balanço');if(typeof window.renderBalance==='function')window.renderBalance()}
function decorate(){const list=$('allServicesList');if(!list)return;list.querySelectorAll('.service-card').forEach(card=>{let box=card.querySelector('.admin-balance-control');if(!admin){if(box)box.remove();return}const id=card.dataset.orderId||card.dataset.id;if(!id)return;const o=(window.orders||[]).find(x=>x.id===id);if(!box){box=document.createElement('label');box.className='admin-balance-control';box.style.cssText='display:flex;align-items:center;gap:7px;margin-top:8px;padding:7px 9px;border:1px dashed #999;border-radius:8px;font-size:12px;font-weight:700';box.innerHTML='<input type="checkbox"> Não considerar no balanço';card.appendChild(box);box.querySelector('input').onchange=e=>toggle(id,e.target.checked)}box.querySelector('input').checked=!!o?.exclude_from_balance})}
const st=document.createElement('style');st.textContent='.admin-balance-control{background:#fff8df;color:#5a4700}.admin-balance-control input{width:16px;height:16px}';document.head.appendChild(st);
let n=0;const t=setInterval(()=>{install();decorate();if(++n>120)clearInterval(t)},300);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
function installBalance(){
 const head=document.querySelector('#balance .head'); if(!head||$('balanceAdminBtn'))return;
 const b=document.createElement('button');b.id='balanceAdminBtn';b.className='btn';b.textContent='🔒 Administrador';
 b.onclick=()=>{if(admin){admin=false;b.textContent='🔒 Administrador';renderBalanceAdmin();return}const p=prompt('Senha de administrador:');if(p===PASS){admin=true;b.textContent='🔓 Administrador ativo';renderBalanceAdmin();if(typeof toast==='function')toast('Modo administrador ativado')}else if(p!==null&&typeof toast==='function')toast('Senha incorreta')};
 head.appendChild(b);renderBalanceAdmin();
}
function renderBalanceAdmin(){
 let box=$('balanceAdminPanel');if(!box)return;
 if(!admin){box.classList.add('hidden');return} box.classList.remove('hidden');
 const rows=[];(window.orders||[]).filter(o=>typeof inPeriod!=='function'||inPeriod(o)).forEach(o=>(o.order_items||[]).forEach(i=>rows.push({o,i})));
 box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b>Controle administrativo dos serviços</b><div><button class="btn" id="realBalanceBtn">💰 Ver valor real</button> <button class="btn" id="balanceAdminExit">Sair</button></div></div><p style="color:var(--muted);font-size:13px">Desmarque os serviços que não devem entrar no balanço. Eles continuam salvos no sistema.</p>'+(rows.map(r=>'<label style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--line)"><input type="checkbox" data-admin-order="'+r.o.id+'" '+(r.o.exclude_from_balance?'':'checked')+'><span>'+esc(r.o.exit_date||'—')+' • '+esc(r.o.client_name||'Sem cliente')+' • '+esc(r.i.description||'')+' • '+money(r.i.sale_value||0)+'</span></label>').join('')||'<div class="empty">Nenhum serviço no período.</div>');
 $('realBalanceBtn').onclick=showRealBalance;$('balanceAdminExit').onclick=()=>{admin=false;$('balanceAdminBtn').textContent='🔒 Administrador';renderBalanceAdmin()};
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
window.__adminMode=()=>admin;window.renderBalanceAdmin=renderBalanceAdmin;
let btries=0;const bt=setInterval(()=>{installBalance();if(++btries>120)clearInterval(bt)},300);
})();
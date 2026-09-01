
const sb=supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.key);
const COMPANIES=[{id:'48f0eb3d-22ff-4506-9d9c-b6dd4455946b',name:'Radiadores Moura'},{id:'f3cd9d20-a341-41fe-87fe-c0726a19b65b',name:'Radiadores Moura Marmeleiro'}];
let company=null,orders=[],clients=[],catalog=[],editing=null,period='day';
const $=id=>document.getElementById(id),today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
function sanitizeDates(payload){if(!payload||typeof payload!=='object')return payload;const copy={...payload};for(const k of ['entry_date','exit_date']){if(Object.prototype.hasOwnProperty.call(copy,k)){const v=copy[k];copy[k]=(v===null||v===undefined||String(v).trim()==='')?null:String(v).trim()}}return copy;}
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));const slug=s=>String(s||'').replace(/\s+/g,'').replace('ç','c').replace('ã','a');
function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),2500)}function cloud(t,ok=true){$('cloud').textContent=(ok?'● ':'⚠ ')+t;$('cloud').style.color=ok?'var(--green)':'#c43d3d'}function showAuth(){$('auth').classList.remove('hidden');$('app').classList.add('hidden')}
async function showApp(){$('auth').classList.add('hidden');$('app').classList.remove('hidden');renderCompanies();const saved=sessionStorage.getItem('companyId');const found=COMPANIES.find(x=>x.id===saved);if(found)chooseCompany(found);else $('companyModal').classList.remove('hidden')}
function renderCompanies(){$('companies').innerHTML=COMPANIES.map(c=>`<button class="companychoice" data-id="${c.id}"><b>${esc(c.name)}</b><small style="display:block;color:var(--muted);margin-top:4px">Abrir este banco</small></button>`).join('');$('companies').querySelectorAll('button').forEach(b=>b.onclick=()=>chooseCompany(COMPANIES.find(c=>c.id===b.dataset.id)))}
async function chooseCompany(c){if(!c)return;company=c;sessionStorage.setItem('companyId',c.id);$('companyPill').textContent='Banco: '+c.name;$('companyModal').classList.add('hidden');await loadData()}$('switch').onclick=()=>$('companyModal').classList.remove('hidden');
$('login').onsubmit=async e=>{e.preventDefault();$('authmsg').textContent='Entrando...';const r=await sb.auth.signInWithPassword({email:$('email').value,password:$('pass').value});$('authmsg').textContent=r.error?'Erro: '+r.error.message:''};$('signup').onclick=async()=>{const r=await sb.auth.signUp({email:$('email').value,password:$('pass').value});$('authmsg').textContent=r.error?'Erro: '+r.error.message:'Conta criada. Confirme o e-mail.'};$('logout').onclick=()=>sb.auth.signOut();sb.auth.onAuthStateChange((e,s)=>{if(s)showApp();else showAuth()});
async function init(){const r=await sb.auth.getSession();$('entry').value=today();$('exit').value=today();if($('notDelivered'))$('notDelivered').checked=false;$('balanceDate').value=today();addRow();if(r.data.session)showApp();else showAuth()}
async function loadData(){if(!company)return;cloud('Sincronizando...');const [o,c,p]=await Promise.all([sb.from('orders').select('*,order_items(*)').eq('company_id',company.id).order('entry_date',{ascending:false}),sb.from('clients').select('*').eq('company_id',company.id).order('name'),sb.from('catalog_items').select('*').eq('company_id',company.id).order('description')]);if(o.error||c.error||p.error){cloud('Erro na nuvem',false);toast('Não foi possível carregar os dados desta empresa: '+(o.error?.message||c.error?.message||p.error?.message||''));return}orders=o.data||[];clients=c.data||[];catalog=p.data||[];cloud('Salvo na nuvem');renderAll()}
function parseMoney(v){let s=String(v||'').replace('R$','').replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)||0}
function rowItems(){return [...document.querySelectorAll('.svc-row')].map(r=>({description:r.querySelector('.desc').value.trim(),sale_value:parseMoney(r.querySelector('.sale').value),cost_value:parseMoney(r.querySelector('.cost').value),tax_rate:Number(r.querySelector('.tax').value)||0,service_status:r.querySelector('.status').value})).filter(x=>x.description||x.sale_value||x.cost_value)}
function calc(){const a=rowItems(),sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);$('saleTotal').textContent=money(sale);$('costTotal').textContent=money(cost);$('taxTotal').textContent=money(tax);$('profitTotal').textContent=money(sale-cost-tax);$('grand').textContent=money(sale)}
function addRow(item={}){const r=document.createElement('div');r.className='svc-row';r.innerHTML=`<input class="desc" list="catalogList" placeholder="Descrição serviço / produto" value="${esc(item.description||'')}"><input class="sale money" inputmode="decimal" placeholder="R$ 0,00" value="${item.sale_value?money(item.sale_value):''}"><input class="cost money" inputmode="decimal" placeholder="R$ 0,00" value="${item.cost_value?money(item.cost_value):''}"><input class="tax" type="number" min="0" step=".01" placeholder="%" value="${item.tax_rate??''}"><select class="status"><option>Liberado</option><option>Parado</option><option>Pronto</option><option>Pronto entregue</option></select><button type="button" class="btn">×</button>`;$('rows').appendChild(r);r.querySelector('.status').value=item.service_status||'Liberado';r.querySelector('button').onclick=()=>{r.remove();calc()};r.querySelectorAll('input,select').forEach(x=>x.oninput=calc);['sale','cost'].forEach(k=>{const x=r.querySelector('.'+k);x.onblur=()=>{const n=parseMoney(x.value);x.value=n?money(n):'';calc()}});calc()}
$('add').onclick=()=>addRow();function updateCatalog(){let d=document.getElementById('catalogList');if(!d){d=document.createElement('datalist');d.id='catalogList';document.body.appendChild(d)}d.innerHTML=catalog.map(x=>`<option value="${esc(x.description)}"></option>`).join('')}
$('clientInput').oninput=()=>{const q=$('clientInput').value.toLowerCase().trim();if(!q){$('clientSug').classList.add('hidden');return}const a=clients.filter(c=>c.name.toLowerCase().includes(q)).slice(0,8);$('clientSug').innerHTML=a.map(c=>`<button type="button" data-id="${c.id}"><b>${esc(c.name)}</b><small style="display:block;color:var(--muted)">${esc(c.phone||c.whatsapp||'')}</small></button>`).join('')||'<div style="padding:11px;color:var(--muted)">Nenhum cliente encontrado</div>';$('clientSug').classList.remove('hidden');$('clientSug').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('clientInput').value=clients.find(c=>c.id===b.dataset.id).name;$('clientSug').classList.add('hidden')})};document.addEventListener('click',e=>{if(!e.target.closest('.search'))$('clientSug').classList.add('hidden')});
$('order').onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'){if(e.target.id==='add'){e.preventDefault();addRow();requestAnimationFrame(()=>{const rows=document.querySelectorAll('#rows .svc-row');rows[rows.length-1]?.querySelector('.desc')?.focus()});return}e.preventDefault();const f=[...$('order').querySelectorAll('input,select,button')].filter(x=>!x.disabled);const i=f.indexOf(e.target);if(i>=0&&f[i+1])f[i+1].focus()}};
async function saveCatalog(a){for(const x of a){if(!x.description||catalog.some(c=>c.description.toLowerCase()===x.description.toLowerCase()))continue;const r=await sb.from('catalog_items').insert({company_id:company.id,description:x.description,type:'servico'}).select().single();if(!r.error&&r.data)catalog.unshift(r.data)}updateCatalog()}
$('order').onsubmit=async e=>{e.preventDefault();if(!company)return toast('Escolha a empresa primeiro');const a=rowItems();if(!a.length)return toast('Adicione pelo menos um serviço ou produto');cloud('Salvando...');let c=clients.find(x=>x.name.toLowerCase()===$('clientInput').value.trim().toLowerCase());if(!c&&$('clientInput').value.trim()){const r=await sb.from('clients').insert({company_id:company.id,name:$('clientInput').value.trim()}).select().single();if(r.error)return toast(r.error.message);c=r.data;clients.unshift(c)}const sale=a.reduce((s,x)=>s+x.sale_value,0),cost=a.reduce((s,x)=>s+x.cost_value,0),tax=a.reduce((s,x)=>s+x.sale_value*x.tax_rate/100,0);const payment=String($('payment').value||'').trim();const p=sanitizeDates({company_id:company.id,client_id:c?.id||null,entry_date:$('entry').value||null,exit_date:$('notDelivered')?.checked?null:($('exit').value||null),client_name:$('clientInput').value.trim(),vehicle_make_model:$('vehicle').value.trim(),plate:$('plate').value.trim(),pedido:$('pedido').value.trim(),payment_status:payment||null,total_sale:sale,total_cost:cost,total_tax:tax,net_profit:sale-cost-tax,notes:$('orderNotes')?.value.trim()||''});let r=editing?await sb.from('orders').update(p).eq('id',editing.id).select().single():await sb.from('orders').insert(p).select().single();if(r.error){cloud('Erro ao salvar',false);return toast('Erro ao salvar lançamento: '+r.error.message)}if(editing){const dr=await sb.from('order_items').delete().eq('order_id',editing.id);if(dr.error){cloud('Erro ao salvar',false);return toast('Erro ao atualizar serviços: '+dr.error.message)}}const ir=await sb.from('order_items').insert(a.map(x=>({...x,order_id:r.data.id})));if(ir.error){cloud('Erro ao salvar',false);return toast('Lançamento salvo, mas os serviços falharam: '+ir.error.message)}await saveCatalog(a);editing=null;clearOrder();await loadData();toast('Lançamento salvo na nuvem')};
function clearOrder(){editing=null;$('order').reset();$('entry').value=today();$('exit').value=today();if($('notDelivered'))$('notDelivered').checked=false;$('rows').innerHTML='';addRow();$('payment').value='';if($('orderNotes'))$('orderNotes').value=''}$('clear').onclick=clearOrder;
const paymentFlag=()=>'';
function renderLaunches(){
  updateCatalog();
  const q=($('launchSearch').value||'').toLowerCase();
  const a=orders.filter(o=>[o.client_name,o.vehicle_make_model,o.plate,...(o.order_items||[]).map(i=>i.description)].join(' ').toLowerCase().includes(q));
  $('count').textContent=a.length+' lançamento(s)';
  $('launchList').innerHTML=a.map(o=>{
    const st=(o.order_items||[])[0]?.service_status||'Liberado';
    const cl=slug(st);
    const payStatus=String(o.payment_status||'EM ABERTO').trim();
    const pc=payStatus==='FALTA ACERTAR'?'payment-falta-acertar':(payStatus==='EM ABERTO'?'payment-em-aberto':'');
    const gross=Number(o.total_sale||0);
    const net=Number(o.net_profit||0);
    const note=String(o.notes||'').trim();
    return `<article class="launch ${cl} ${pc}" data-id="${o.id}"><div class="ltop"><div><div class="lname">${esc(o.client_name||'Sem cliente')}</div><div class="meta">${o.entry_date||''} • Saída ${o.exit_date||''}${o.vehicle_make_model?' • '+esc(o.vehicle_make_model):''}${o.plate?' • '+esc(o.plate):''}</div></div><div class="launch-values"><b>${money(gross)}</b><span>${money(net)}</span><em>Líquido</em></div></div><div class="chips">${(o.order_items||[]).map(i=>`<span class="chip ${slug(i.service_status)}">${esc(i.description)} • ${esc(i.service_status)}</span>`).join('')}<span class="chip">${paymentFlag(o)}${esc(o.payment_status||'EM ABERTO')}</span></div>${note?`<div class="launch-observation-card"><span>⚠ Observação:</span> ${esc(note)}</div>`:''}</article>`
  }).join('')||'<div class="empty">Nenhum lançamento encontrado.</div>';
  $('launchList').querySelectorAll('.launch').forEach(x=>x.onclick=()=>editOrder(x.dataset.id));
}
$('launchSearch').oninput=renderLaunches;async function editOrder(id){const o=orders.find(x=>x.id===id);if(!o)return;editing=o;$('entry').value=o.entry_date||'';$('exit').value=o.exit_date||'';if($('notDelivered'))$('notDelivered').checked=!o.exit_date;$('clientInput').value=o.client_name||'';$('vehicle').value=o.vehicle_make_model||'';$('plate').value=o.plate||'';$('pedido').value=o.pedido||'';$('payment').value=o.payment_status||'';$('orderNotes').value=o.notes||'';$('rows').innerHTML='';(o.order_items||[]).forEach(addRow);if(!o.order_items?.length)addRow();scrollTo({top:0,behavior:'smooth'})}
function renderClients(){const q=($('clientSearch').value||'').toLowerCase();const a=clients.filter(c=>c.name.toLowerCase().includes(q));$('clientGrid').innerHTML=a.map(c=>`<div class="client" data-id="${c.id}"><b>${esc(c.name)}</b><small>${esc(c.phone||c.whatsapp||c.email||'Sem contato')}</small><small>${esc(c.city||'')}</small></div>`).join('')||'<div class="empty" style="grid-column:1/-1">Nenhum cliente cadastrado.</div>';$('clientGrid').querySelectorAll('.client').forEach(x=>x.onclick=()=>openClient(x.dataset.id))}$('clientSearch').oninput=renderClients;
function openClient(id=''){const c=clients.find(x=>x.id===id);$('clientTitle').textContent=c?'Editar cliente':'Novo cliente';$('clientId').value=c?.id||'';$('clientName').value=c?.name||'';$('doc').value=c?.cpf_cnpj||'';$('phone').value=c?.phone||'';$('whatsapp').value=c?.whatsapp||'';$('mail').value=c?.email||'';$('address').value=c?.address||'';$('city').value=c?.city||'';$('uf').value=c?.uf||'';$('notes').value=c?.notes||'';$('clientModal').classList.remove('hidden')}$('newClient').onclick=()=>openClient();$('closeClient').onclick=$('cancelClient').onclick=()=>$('clientModal').classList.add('hidden');
$('clientForm').onsubmit=async e=>{e.preventDefault();const p={company_id:company.id,name:$('clientName').value.trim(),cpf_cnpj:$('doc').value.trim(),phone:$('phone').value.trim(),whatsapp:$('whatsapp').value.trim(),email:$('mail').value.trim(),address:$('address').value.trim(),city:$('city').value.trim(),uf:$('uf').value.trim().toUpperCase(),notes:$('notes').value.trim()},id=$('clientId').value,r=id?await sb.from('clients').update(p).eq('id',id).select().single():await sb.from('clients').insert(p).select().single();if(r.error)return toast(r.error.message);$('clientModal').classList.add('hidden');await loadData();toast('Cliente salvo')};
function inPeriod(o){const d=o.entry_date;if(!d)return false;const ref=new Date($('balanceDate').value+'T00:00:00'),x=new Date(d+'T00:00:00');if(period==='day')return d===$('balanceDate').value;if(period==='year')return x.getFullYear()===ref.getFullYear();const start=new Date(ref);start.setDate(start.getDate()-start.getDay());const end=new Date(start);end.setDate(start.getDate()+6);return x>=start&&x<=end}
function renderBalance(){const a=orders.filter(inPeriod),sale=a.reduce((s,o)=>s+Number(o.total_sale),0),cost=a.reduce((s,o)=>s+Number(o.total_cost),0),tax=a.reduce((s,o)=>s+Number(o.total_tax),0),profit=a.reduce((s,o)=>s+Number(o.net_profit),0);$('balanceCards').innerHTML=[['Vendas',sale],['Custos',cost],['Impostos',tax],['Lucro líquido',profit]].map(x=>`<div class="bcard"><small>${x[0]}</small><b>${money(x[1])}</b></div>`).join('');const counts={'Liberado':0,'Parado':0,'Pronto':0,'Pronto entregue':0};a.forEach(o=>(o.order_items||[]).forEach(i=>counts[i.service_status]=(counts[i.service_status]||0)+1));$('breakdown').innerHTML=Object.entries(counts).map(([k,v])=>`<div style="display:grid;grid-template-columns:150px 1fr 40px;gap:10px;align-items:center;margin:9px 0"><b>${k}</b><div class="bar"><i style="width:${v/Math.max(1,...Object.values(counts))*100}%"></i></div><span>${v}</span></div>`).join('')}
function renderAll(){renderLaunches();renderClients();calc();renderBalance()}$('balanceDate').onchange=renderBalance;document.querySelectorAll('.period').forEach(b=>b.onclick=()=>{document.querySelectorAll('.period').forEach(x=>x.classList.remove('active'));b.classList.add('active');period=b.dataset.p;renderBalance()});document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));$(b.dataset.view).classList.add('active');if(b.dataset.view==='balance')renderBalance()});init();


/* ===== Navegação por teclado: campos de lançamento/edição e seleção de cartões ===== */
(function installKeyboardNavigation(){
  const isField=el=>el&&el.matches?.('input,select,textarea')&&!el.disabled&&!el.readOnly&&el.offsetParent!==null;
  const formFields=form=>[...form.querySelectorAll('input,select,textarea')].filter(isField);
  const visibleCards=()=>[...document.querySelectorAll('#launchList .launch')].filter(x=>x.offsetParent!==null);
  let selectedCardId=null;

  function setSelectedCard(card,focus=true){
    const cards=visibleCards();
    cards.forEach(c=>{c.classList.remove('keyboard-selected');c.setAttribute('aria-selected','false')});
    if(!card)return;
    selectedCardId=card.dataset.id||null;
    card.classList.add('keyboard-selected');
    card.setAttribute('aria-selected','true');
    if(focus){card.focus({preventScroll:true});card.scrollIntoView({block:'nearest',behavior:'smooth'})}
  }

  function selectCard(delta){
    const cards=visibleCards();
    if(!cards.length)return false;
    let i=cards.findIndex(c=>c.dataset.id===selectedCardId);
    if(i<0)i=delta>0?-1:cards.length;
    i=Math.max(0,Math.min(cards.length-1,i+delta));
    setSelectedCard(cards[i]);
    return true;
  }

  function nearestField(current,fields,key){
    const r=current.getBoundingClientRect();
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const candidates=fields.filter(x=>x!==current).map(el=>{
      const q=el.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2;
      const dx=x-cx,dy=y-cy;
      let primary,secondary;
      if(key==='ArrowLeft'||key==='ArrowRight'){
        if(key==='ArrowLeft'&&dx>=-1)return null;
        if(key==='ArrowRight'&&dx<=1)return null;
        const vertical=Math.abs(dy);
        const horizontal=Math.abs(dx);
        primary=horizontal; secondary=vertical;
        const sameRow=(Math.max(r.top,q.top)<=Math.min(r.bottom,q.bottom)+8);
        return {el,score:(sameRow?0:500)+primary+secondary*3};
      }
      if(key==='ArrowUp'&&dy>=-1)return null;
      if(key==='ArrowDown'&&dy<=1)return null;
      const horizontal=Math.abs(dx),vertical=Math.abs(dy);
      primary=vertical; secondary=horizontal;
      const sameColumn=(Math.max(r.left,q.left)<=Math.min(r.right,q.right)+14);
      return {el,score:(sameColumn?0:500)+primary+secondary*3};
    }).filter(Boolean).sort((a,b)=>a.score-b.score);
    return candidates[0]?.el||null;
  }

  function moveField(current,key){
    const form=current.closest('#order,#fixEditForm');
    if(!form)return false;
    const fields=formFields(form);
    if(!fields.includes(current))return false;
    const next=nearestField(current,fields,key);
    if(!next)return false;
    next.focus();
    if(next.select && (next.tagName==='INPUT'||next.tagName==='TEXTAREA') && next.type!=='date' && next.type!=='checkbox')next.select();
    return true;
  }

  document.addEventListener('keydown',e=>{
    const key=e.key;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(key))return;
    const target=e.target;

    // Dentro dos formulários de Novo lançamento e Editar: as quatro setas navegam entre campos.
    if(target.closest?.('#order,#fixEditForm') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key) && isField(target)){
      if(moveField(target,key))e.preventDefault();
      return;
    }

    // Dentro da lista de lançamentos: ↑/↓ selecionam os cartões.
    const card=target.closest?.('#launchList .launch');
    if(card && (key==='ArrowUp'||key==='ArrowDown')){
      setSelectedCard(card,false);
      if(selectCard(key==='ArrowDown'?1:-1))e.preventDefault();
      return;
    }

    // Se a lista estiver focada, ↑/↓ começam a seleção pelo primeiro/último cartão.
    if((target===document.body||target===$('launchList')) && (key==='ArrowUp'||key==='ArrowDown')){
      if(selectCard(key==='ArrowDown'?1:-1))e.preventDefault();
    }

    // Enter no cartão selecionado abre a edição.
    if(card && key==='Enter' && !target.closest('button,input,select,textarea')){
      const id=card.dataset.id;
      if(id && typeof openFix==='function')openFix(id);
      else if(id && typeof editOrder==='function')editOrder(id);
      e.preventDefault();
    }
  });

  document.addEventListener('click',e=>{
    const card=e.target.closest?.('#launchList .launch');
    if(card)setSelectedCard(card,false);
  },true);

  const prepareCards=()=>document.querySelectorAll('#launchList .launch').forEach(card=>{
    card.tabIndex=0;
    card.setAttribute('role','option');
    card.setAttribute('aria-selected',card.classList.contains('keyboard-selected')?'true':'false');
  });
  const list=$('launchList');
  if(list){prepareCards();new MutationObserver(prepareCards).observe(list,{childList:true,subtree:true})}
})();

/* ===== Módulo de serviços e financeiro ===== */
const paymentColors={'EM ABERTO':'pending','FALTA ACERTAR':'falta-acertar','Dinheiro':'cash','Cartão':'card','Pix':'pix','Cheque':'check','Carteira':'wallet','Boleto':'boleto','Notinha':'notinha'};
function allServiceRows(){return orders.flatMap(o=>(o.order_items||[]).map(i=>({...i,order:o})))}
function renderAllServices(){const q=($('allServicesSearch')?.value||'').toLowerCase().trim();const pf=$('servicePaymentFilter')?.value||'';const sf=$('serviceStatusFilter')?.value||'';let a=allServiceRows().filter(x=>{const text=[x.order.client_name,x.order.pedido,x.description,x.order.vehicle_make_model,x.order.plate].join(' ').toLowerCase();return (!q||text.includes(q))&&(!pf||(x.order.payment_status||'EM ABERTO')===pf)&&(!sf||x.service_status===sf)});a.sort((x,y)=>String(y.order.exit_date||'').localeCompare(String(x.order.exit_date||'')));$('allServicesList').innerHTML=a.map(x=>{const pay=x.order.payment_status||'EM ABERTO';const cls=paymentColors[pay]||'other';const profit=Number(x.sale_value||0)-Number(x.cost_value||0)-Number(x.freight_value||0)-(Number(x.sale_value||0)*Number(x.tax_rate||0)/100);return `<article class="service-card payment-${cls}"><div class="service-date"><b>${esc(x.order.exit_date||'—')}</b><small>Entrada ${esc(x.order.entry_date||'—')}</small></div><div class="service-main"><b>${esc(x.order.client_name||'Sem cliente')}</b><small>Pedido ${esc(x.order.pedido||'—')} ${x.order.vehicle_make_model?'• '+esc(x.order.vehicle_make_model):''}</small><div class="service-desc">${esc(x.description||'Sem descrição')}</div></div><div class="service-values"><span>Venda <b>${money(x.sale_value)}</b></span><span>Custo <b>${money(x.cost_value)}</b></span><span>Lucro <b>${money(profit)}</b></span></div><div class="service-badges"><span class="status-badge status-${slug(x.service_status)}">${esc(x.service_status||'—')}</span><span class="payment-badge">${esc(pay)}</span></div></article>`}).join('')||'<div class="empty">Nenhum serviço encontrado.</div>'}
function balancePeriodOrders(){if(period==='custom'){const a=$('balanceStart').value,b=$('balanceEnd').value;return orders.filter(o=>o.entry_date&&(!a||o.entry_date>=a)&&(!b||o.entry_date<=b))}const ref=$('balanceDate').value;if(!ref)return [];const r=new Date(ref+'T00:00:00');return orders.filter(o=>{if(!o.entry_date)return false;const x=new Date(o.entry_date+'T00:00:00');if(period==='day')return o.entry_date===ref;if(period==='year')return x.getFullYear()===r.getFullYear();if(period==='month')return x.getFullYear()===r.getFullYear()&&x.getMonth()===r.getMonth();const start=new Date(r);start.setDate(r.getDate()-r.getDay());const end=new Date(start);end.setDate(start.getDate()+6);return x>=start&&x<=end})}
function renderAdvancedBalance(){const a=balancePeriodOrders();const sale=a.reduce((s,o)=>s+Number(o.total_sale||0),0),cost=a.reduce((s,o)=>s+Number(o.total_cost||0),0),tax=a.reduce((s,o)=>s+Number(o.total_tax||0),0),profit=a.reduce((s,o)=>s+Number(o.net_profit||0),0);$('balanceCards').innerHTML=[['Vendas',sale],['Custos',cost],['Impostos',tax],['Lucro líquido',profit]].map(x=>`<div class="bcard"><small>${x[0]}</small><b>${money(x[1])}</b></div>`).join('');const payments={};a.forEach(o=>{const p=o.payment_status||'EM ABERTO';payments[p]=(payments[p]||0)+Number(o.total_sale||0)});$('paymentBreakdown').innerHTML=Object.entries(payments).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="payment-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">Sem pagamentos no período.</div>';const margin=sale?profit/sale*100:0,costPct=sale?cost/sale*100:0,taxPct=sale?tax/sale*100:0;$('profitManagement').innerHTML=`<div class="profit-grid"><div><small>Margem líquida</small><b>${margin.toFixed(1)}%</b></div><div><small>Custos sobre vendas</small><b>${costPct.toFixed(1)}%</b></div><div><small>Impostos sobre vendas</small><b>${taxPct.toFixed(1)}%</b></div><div><small>Serviços</small><b>${a.reduce((n,o)=>n+(o.order_items||[]).length,0)}</b></div></div>`;const counts={'Liberado':0,'Parado':0,'Pronto':0,'Pronto entregue':0};a.forEach(o=>(o.order_items||[]).forEach(i=>counts[i.service_status]=(counts[i.service_status]||0)+1));$('breakdown').innerHTML=Object.entries(counts).map(([k,v])=>`<div class="break-row"><b>${k}</b><div class="bar"><i style="width:${v/Math.max(1,...Object.values(counts))*100}%"></i></div><span>${v}</span></div>`).join('')}
const _oldRenderAll=renderAll;renderAll=function(){_oldRenderAll();renderAllServices();renderAdvancedBalance()};
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='services')renderAllServices();if(b.dataset.view==='balance')renderAdvancedBalance()}));
['allServicesSearch','servicePaymentFilter','serviceStatusFilter'].forEach(id=>$(id)?.addEventListener('input',renderAllServices));$('servicePaymentFilter')?.addEventListener('change',renderAllServices);$('serviceStatusFilter')?.addEventListener('change',renderAllServices);$('balanceDate')?.addEventListener('change',renderAdvancedBalance);document.querySelectorAll('.period').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.p;renderAdvancedBalance()}));$('applyCustomBalance')?.addEventListener('click',()=>{period='custom';document.querySelectorAll('.period').forEach(x=>x.classList.remove('active'));renderAdvancedBalance()});

/* Etapa 13: lógica anteriormente concentrada em supabase-config.js */
// Correcoes da lista de lancamentos: editar, excluir, asterisco preto e opcoes atualizadas.
window.paymentFlag='';

document.addEventListener('DOMContentLoaded',()=>{

  document.body.insertAdjacentHTML('beforeend',`<div id="orderFixModal" class="modal hidden"><div class="modalbox" style="width:min(900px,100%)"><div class="modalhead"><h2>Editar lançamento</h2><button class="btn" id="fixClose">×</button></div><form id="fixEditForm"><div class="order-edit-grid"><div class="field g4"><label>Entrada</label><input id="fixEntry" type="date" required></div><div class="field g4"><label>Saída</label><input id="fixExit" type="date"><label class="date-pending"><input id="fixNotDelivered" type="checkbox"> Serviço ainda não foi entregue</label></div><div class="field g4"><label>Nome do cliente</label><input id="fixClient" required></div><div class="field g4"><label>Marca e modelo</label><input id="fixVehicle"></div><div class="field g4"><label>Placa</label><input id="fixPlate"></div><div class="field g4"><label>Número do pedido</label><input id="fixPedido"></div><div class="field g4"><label>Forma de pagamento</label><select id="fixPayment"><option value="EM ABERTO">EM ABERTO</option><option>Dinheiro</option><option>Cartão</option><option>Pix</option><option>Cheque</option><option>Carteira</option><option>Boleto</option><option>Notinha</option><option value="FALTA ACERTAR">FALTA ACERTAR</option></select></div><div class="g12"><div class="sectiontitle"><h3>Serviços e produtos</h3></div><div class="edit-services"><div class="edit-svc-head"><span>Descrição</span><span>Venda</span><span>Custo</span><span>Alíquota</span><span>Situação</span><span></span></div><div id="fixRows"></div></div><button type="button" class="btn" id="fixAdd">＋ Adicionar serviço / produto</button></div></div><div class="field g12 order-notes-field"><label>Observações</label><textarea id="fixNotes" placeholder="Ex.: peça com avaria, cliente solicitou retorno, detalhes importantes..."></textarea></div><div class="edit-totals"><div class="edit-total"><small>Venda total</small><b id="fixSale">R$ 0,00</b></div><div class="edit-total"><small>Custo total</small><b id="fixCost">R$ 0,00</b></div><div class="edit-total"><small>Imposto</small><b id="fixTax">R$ 0,00</b></div><div class="edit-total"><small>Lucro líquido</small><b id="fixProfit">R$ 0,00</b></div></div><div class="foot" style="justify-content:space-between"><button type="button" class="btn" id="fixDelete" style="color:#b42318;border-color:#f0c9c5">Excluir lançamento</button><div style="display:flex;gap:8px"><button type="button" class="btn" id="fixCancel">Cancelar</button><button class="btn primary">Salvar alterações</button></div></div></form></div></div>`);

  const pay=$('payment');
  if(pay && ![...pay.options].some(o=>o.value==='Boleto')) pay.insertAdjacentHTML('beforeend','<option value="Boleto">Boleto</option>');
  const rows=$('rows');
  function normalizeStatus(s,v){if(!s)return;s.innerHTML='<option value="Pronto entregue">Pronto/Entregue</option><option value="Liberado">Liberado</option><option value="Parado">Parado</option><option value="Pronto">Pronto</option>';s.value=v||'Pronto entregue'}
  if(rows) rows.querySelectorAll('.status').forEach(s=>normalizeStatus(s,s.value));
  if(typeof addRow==='function'){
    const oldAddRow=addRow;
    addRow=function(item={}){oldAddRow({...item,service_status:item.service_status||'Pronto entregue'});const r=$('rows')?.lastElementChild;normalizeStatus(r?.querySelector('.status'),item.service_status||'Pronto entregue')};
  }

  let currentId=null;
  const editRows=()=>[...document.querySelectorAll('#fixRows .edit-svc-row')].map(r=>({description:r.querySelector('.fd').value.trim(),sale_value:parseMoney(r.querySelector('.fs').value),cost_value:parseMoney(r.querySelector('.fc').value),tax_rate:Number(r.querySelector('.ft').value)||0,service_status:r.querySelector('.fst').value})).filter(x=>x.description||x.sale_value||x.cost_value);
  const calcFix=()=>{const a=editRows(),s=a.reduce((t,x)=>t+x.sale_value,0),c=a.reduce((t,x)=>t+x.cost_value,0),tx=a.reduce((t,x)=>t+x.sale_value*x.tax_rate/100,0);$('fixSale').textContent=money(s);$('fixCost').textContent=money(c);$('fixTax').textContent=money(tx);$('fixProfit').textContent=money(s-c-tx)};
  function addFixRow(item={}){const r=document.createElement('div');r.className='edit-svc-row';r.innerHTML=`<input class="fd" list="catalogList" placeholder="Descrição" value="${esc(item.description||'')}"><input class="fs" inputmode="decimal" placeholder="R$ 0,00" value="${item.sale_value?money(item.sale_value):''}"><input class="fc" inputmode="decimal" placeholder="R$ 0,00" value="${item.cost_value?money(item.cost_value):''}"><input class="ft" type="number" min="0" step=".01" placeholder="%" value="${item.tax_rate??''}"><select class="fst"><option value="Pronto entregue">Pronto/Entregue</option><option>Liberado</option><option>Parado</option><option>Pronto</option></select><button type="button" class="btn">×</button>`;$('fixRows').appendChild(r);r.querySelector('.fst').value=item.service_status||'Pronto entregue';r.querySelector('button').onclick=()=>{r.remove();calcFix()};r.querySelectorAll('input,select').forEach(x=>x.oninput=calcFix);['fs','fc'].forEach(k=>{r.querySelector('.'+k).onblur=e=>{const n=parseMoney(e.target.value);e.target.value=n?money(n):'';calcFix()}});calcFix()}
  function closeFix(){$('orderFixModal').classList.add('hidden');currentId=null}
  function openFix(id){const o=orders.find(x=>x.id===id);if(!o)return;currentId=id;$('fixEntry').value=o.entry_date||today();$('fixExit').value=o.exit_date||'';if($('fixNotDelivered'))$('fixNotDelivered').checked=!o.exit_date;$('fixClient').value=o.client_name||'';$('fixVehicle').value=o.vehicle_make_model||'';$('fixPlate').value=o.plate||'';$('fixPedido').value=o.pedido||'';$('fixPayment').value=o.payment_status||'EM ABERTO';if($('fixNotes'))$('fixNotes').value=o.notes||'';if($('fixNotDelivered')){ $('fixNotDelivered').checked=!o.exit_date; $('fixExit').disabled=!o.exit_date; }$('fixRows').innerHTML='';(o.order_items||[]).forEach(addFixRow);if(!o.order_items?.length)addFixRow();$('orderFixModal').classList.remove('hidden');calcFix()}
  $('fixClose').onclick=closeFix;$('fixCancel').onclick=closeFix;$('fixAdd').onclick=()=>addFixRow();

  async function removeOrder(id){const o=orders.find(x=>x.id===id);if(!o)return;if(!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.'))return;cloud('Excluindo...');const r=await sb.from('orders').delete().eq('id',id);if(r.error){cloud('Erro ao excluir',false);return toast(r.error.message)}closeFix();await loadData();toast('Lançamento excluído')}
  $('fixNotDelivered')?.addEventListener('change',()=>{if($('fixNotDelivered').checked){$('fixExit').value='';$('fixExit').disabled=true}else{$('fixExit').disabled=false}});
  $('fixDelete').onclick=()=>{if(currentId)removeOrder(currentId)};
  renderLaunches=function(){
    updateCatalog();
    const q=($('launchSearch').value||'').toLowerCase();
    const a=orders.filter(o=>[o.client_name,o.vehicle_make_model,o.plate,o.pedido,o.numero_lancamento,...(o.order_items||[]).map(i=>i.description)].join(' ').toLowerCase().includes(q));
    $('count').textContent=a.length+' lançamento(s)';
    // Regra aprovada: sem data de saída primeiro; depois agrupado por data de saída, mais recente para mais antiga.
    const dateKey=o=>{const v=String(o?.exit_date||'').trim();return /^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):''};
    const fullDate=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:'Sem data'};
    const shortDate=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${String(m[1]).slice(-2)}`:'—'};
    const sorted=[...a].sort((x,y)=>{
      const dx=dateKey(x),dy=dateKey(y);
      if(!dx&&!dy)return String(y.entry_date||'').localeCompare(String(x.entry_date||''));
      if(!dx)return -1;
      if(!dy)return 1;
      if(dx!==dy)return dy.localeCompare(dx);
      return String(y.entry_date||'').localeCompare(String(x.entry_date||''));
    });
    let lastDay=null;
    const cards=sorted.map(o=>{
      const day=dateKey(o),sep=day!==lastDay?`<div class="launch-day-separator"><span>${fullDate(day)}</span></div>`:'';lastDay=day;
      const first=(o.order_items||[])[0];
      const st=first?.service_status||'Pronto entregue';
      const cl=slug(st);
      const payStatus=String(o.payment_status||'EM ABERTO').trim().toUpperCase();
      const paymentClass=payStatus==='FALTA ACERTAR'?'payment-falta-acertar':(payStatus==='EM ABERTO'?'payment-em-aberto':'');
      const gross=Number(o.total_sale||0),net=Number(o.net_profit||0),note=String(o.notes||'').trim();
      const vehicle=String(o.vehicle_make_model||'').trim();
      const plate=String(o.plate||'').trim();
      const pedido=String(o.pedido||'').trim();
      const entry=shortDate(o.entry_date);
      const exit=shortDate(o.exit_date);
      const os=String(o.numero_lancamento||'').trim();
      const vehicleLine=[vehicle,plate].filter(Boolean).join(' • ');
      const dateLine=o.exit_date?'Saída':'Serviço ainda não entregue';
      const card=`<article class="launch ${cl} ${paymentClass}" data-id="${o.id}">
        <div class="launch-card-top">
          <div class="launch-card-left">
            ${pedido?`<div class="launch-pedido"><span>Pedido</span> <b>${esc(pedido)}</b></div>`:''}
            <div class="launch-dates"><span>Ent. <b>${esc(entry)}</b></span><span>${esc(dateLine)} <b>${o.exit_date?esc(exit):''}</b></span></div>
          </div>
          <div class="launch-card-center">
            <div class="launch-os">${os?`OS ${esc(os)}`:'OS —'}</div>
            <div class="lname">${esc(o.client_name||'Sem cliente')}</div>
            ${vehicleLine?`<div class="launch-vehicle-highlight">${esc(vehicleLine)}</div>`:''}
          </div>
          <div class="launch-actions">
            <div class="launch-values"><b>${money(gross)}</b><span>${money(net)}</span><em>Líquido</em></div>
            <button type="button" class="launch-action" data-edit="${o.id}">Editar</button>
            <button type="button" class="launch-action delete" data-delete="${o.id}">Excluir</button>
          </div>
        </div>
        <div class="chips services-under-client"><span class="chip ${paymentClass}">${esc(o.payment_status||'EM ABERTO')}</span></div>
        <div class="launch-services">${(o.order_items||[]).map(i=>`<div class="service-line status-${slug(i.service_status||'Pronto entregue')}"><span><b>${esc(i.description)}</b> • ${money(i.sale_value)}</span><span class="service-status">${esc(i.service_status||'Pronto entregue')}</span></div>`).join('')}</div>
        ${note?`<div class="launch-observation-card"><span>⚠ Observação:</span> ${esc(note)}</div>`:''}
      </article>`;
      return sep+card;
    }).join('');
    $('launchList').innerHTML=cards||'<div class="empty">Nenhum lançamento encontrado.</div>';
    $('launchList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();openFix(b.dataset.edit)});
    $('launchList').querySelectorAll('[data-delete]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeOrder(b.dataset.delete)});
    $('launchList').querySelectorAll('.launch').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-edit],[data-delete]'))return;openFix(x.dataset.id)});
  };
  if($('launchSearch'))$('launchSearch').oninput=renderLaunches;
  setTimeout(()=>{try{renderLaunches()}catch(e){console.error(e)}},50);
});

// Clientes em formato de lista, com edição pelo nome e exclusão confirmada.
document.addEventListener('DOMContentLoaded',()=>{


  async function removeClient(id){
    const c=clients.find(x=>x.id===id);
    if(!c||!company)return;
    if(!confirm(`Excluir o cliente "${c.name}"? Os lançamentos já registrados serão mantidos.`))return;
    cloud('Excluindo cliente...');
    const r=await sb.from('clients').delete().eq('id',id).eq('company_id',company.id).select('id').single();
    if(r.error){cloud('Erro ao excluir',false);return toast('Não foi possível excluir o cliente: '+r.error.message)}
    clients=clients.filter(x=>x.id!==id);
    renderClients();
    cloud('Salvo na nuvem');
    toast('Cliente excluído');
  }

  renderClients=function(){
    const q=($('clientSearch').value||'').toLowerCase().trim();
    const a=clients.filter(c=>[c.name,c.phone,c.whatsapp,c.email,c.city].join(' ').toLowerCase().includes(q));
    $('clientGrid').innerHTML=a.map(c=>{
      const contact=c.phone||c.whatsapp||c.email||'Sem contato';
      const location=[c.city,c.uf].filter(Boolean).join(' / ');
      return `<article class="client" data-id="${c.id}"><div class="client-details"><button type="button" class="client-name" data-edit-client="${c.id}" title="Editar cliente">${esc(c.name)}</button><span class="client-meta">${esc(contact)}${location?' • '+esc(location):''}</span></div><button type="button" class="client-delete" data-delete-client="${c.id}">Excluir</button></article>`;
    }).join('')||'<div class="empty">Nenhum cliente cadastrado.</div>';
    $('clientGrid').querySelectorAll('[data-edit-client]').forEach(b=>b.onclick=()=>openClient(b.dataset.editClient));
    $('clientGrid').querySelectorAll('[data-delete-client]').forEach(b=>b.onclick=()=>removeClient(b.dataset.deleteClient));
  };
  $('clientSearch').oninput=renderClients;
  setTimeout(()=>{try{renderClients()}catch(e){console.error(e)}},75);
});

// Layout dedicado para navegador de celular: navegação inferior, campos maiores, cartões compactos e sem rolagem horizontal da página.
document.addEventListener('DOMContentLoaded',()=>{

});

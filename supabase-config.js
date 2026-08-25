window.SUPABASE_CONFIG={url:'https://uwnzpoqhxioxjegflksv.supabase.co',key:atob('c2JfcHVibGlzaGFibGVfV0xYSF9mZWZMbFNPLXI5ZWJRSEFud19NdFVkN3c3cg==')};window.$=id=>document.getElementById(id);

// Corrige os redirecionamentos de autenticação para o GitHub Pages.
// O projeto anteriormente estava usando localhost:3000 como URL de retorno.
(function(){
  const APP_URL='https://rodrigodemoura1991.github.io/radiadoresmouramarmeleiro/';
  function patch(){
    const s=document.getElementById('signup');
    const r=document.getElementById('resetpass');
    if(s && !s.dataset.redirectFixed){
      s.dataset.redirectFixed='1';
      s.onclick=async function(){
        const email=document.getElementById('ae')?.value.trim();
        const password=document.getElementById('ap')?.value;
        const msg=document.getElementById('amsg');
        if(!email||!password){msg.textContent='Informe e-mail e senha.';return}
        msg.textContent='Criando sua conta...';
        const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:APP_URL}});
        msg.textContent=error?('Erro: '+error.message):'Conta criada. Verifique seu e-mail para confirmar.';
      };
    }
    if(r && !r.dataset.redirectFixed){
      r.dataset.redirectFixed='1';
      r.onclick=async function(){
        const email=document.getElementById('ae')?.value.trim();
        const msg=document.getElementById('amsg');
        if(!email){msg.textContent='Informe seu e-mail primeiro.';return}
        msg.textContent='Enviando...';
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:APP_URL});
        msg.textContent=error?('Erro: '+error.message):'Enviamos o link para seu e-mail.';
      };
    }
  }
  new MutationObserver(patch).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',patch);
})();

// Seleção de empresa e separação dos lançamentos.
(function(){
  const DEFAULT_COMPANY='Radiadores Moura';
  const COMPANIES=['Radiadores Moura','Radiadores Moura Marmeleiro'];
  const MAP_KEY='gestao_lancamentos_empresas_v1';
  let companyMap={};
  try{companyMap=JSON.parse(localStorage.getItem(MAP_KEY)||'{}')||{}}catch(e){companyMap={}}
  window.__selectedCompany=null;
  window.__companyOrders=[];

  function persistMap(){try{localStorage.setItem(MAP_KEY,JSON.stringify(companyMap))}catch(e){}}

  // Intercepta somente a comunicação do finance-api para manter a empresa junto do lançamento.
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    let url=typeof input==='string'?input:(input&&input.url)||'';
    let method=((init&&init.method)||((input&&input.method)||'GET')).toUpperCase();
    let body=init&&init.body;
    const isFinance=/\/functions\/v1\/finance-api(?:\?|$)/.test(url);

    if(isFinance && method==='PUT' && typeof body==='string'){
      try{
        const payload=JSON.parse(body);
        if(Array.isArray(payload.orders)){
          payload.orders=payload.orders.map(o=>{
            const id=o&&o.id;
            const existing=companyMap[id];
            const company=o&&o.company || existing || window.__selectedCompany || DEFAULT_COMPANY;
            if(id)companyMap[id]=company;
            return {...o,company};
          });
          persistMap();
          body=JSON.stringify(payload);
          init={...(init||{}),body};
        }
      }catch(e){console.warn('Empresa: não foi possível preparar o salvamento.',e)}
    }

    const response=await originalFetch(input,init);

    if(isFinance && method==='GET'){
      try{
        const copy=response.clone();
        const data=await copy.json();
        if(Array.isArray(data.orders)){
          data.orders=data.orders.map(o=>{
            const company=o&&o.company || companyMap[o&&o.id] || DEFAULT_COMPANY;
            if(o&&o.id)companyMap[o.id]=company;
            return {...o,company};
          });
          persistMap();
          window.__companyOrders=data.orders.slice();
          return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
        }
      }catch(e){/* resposta não-JSON; mantém original */}
    }
    return response;
  };

  function esc(s){return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}

  function buildModal(){
    if(document.getElementById('companyModal'))return;
    const style=document.createElement('style');
    style.id='companyStyle';
    style.textContent=`#companyModal{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.68);display:flex;align-items:center;justify-content:center;padding:20px}#companyModal .box{width:min(460px,100%);background:#fff;border-radius:24px;padding:28px;box-shadow:0 18px 60px #0005;text-align:center}#companyModal h2{margin:0 0 8px;color:#334155;font-size:25px}#companyModal p{margin:0 0 22px;color:#64748b}#companyModal .companyBtn{display:block;width:100%;border:1px solid #cbd5e1;background:#f8fafc;color:#334155;border-radius:15px;padding:16px 14px;margin:10px 0;font-size:17px;font-weight:800;cursor:pointer}#companyModal .companyBtn:active{transform:scale(.99)}#companyModal .companyBtn small{display:block;font-size:12px;font-weight:500;color:#64748b;margin-top:4px}.companyBadge{display:inline-block;margin-top:5px;padding:5px 9px;border-radius:999px;background:#fff;color:#64748b;font-size:12px;font-weight:800}.companySwitch{margin-left:8px;border:0;border-radius:9px;padding:6px 9px;background:#fff;color:#64748b;font-weight:800;cursor:pointer}`;
    document.head.appendChild(style);
    const modal=document.createElement('div');
    modal.id='companyModal';
    modal.innerHTML=`<div class="box"><h2>Selecione a empresa</h2><p>Escolha a empresa onde você fará os lançamentos.</p>${COMPANIES.map(c=>`<button class="companyBtn" data-company="${esc(c)}">${esc(c)}<small>Usar esta empresa</small></button>`).join('')}</div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('.companyBtn').forEach(b=>b.addEventListener('click',()=>selectCompany(b.dataset.company)));
  }

  function showModal(){
    buildModal();
    const m=document.getElementById('companyModal');
    if(m)m.style.display='flex';
  }

  function updateHeader(){
    const who=document.getElementById('who');
    if(!who||!window.__selectedCompany)return;
    let badge=document.getElementById('companyBadge');
    if(!badge){
      badge=document.createElement('div');
      badge.id='companyBadge';
      badge.className='companyBadge';
      who.parentNode.appendChild(badge);
    }
    badge.textContent='Empresa: '+window.__selectedCompany;
    let sw=document.getElementById('companySwitch');
    if(!sw){
      sw=document.createElement('button');
      sw.id='companySwitch';
      sw.className='companySwitch';
      sw.textContent='Trocar empresa';
      sw.onclick=showModal;
      badge.appendChild(sw);
    }
  }

  function filterList(){
    if(!window.__selectedCompany)return;
    const box=document.getElementById('list');
    if(!box)return;
    box.querySelectorAll('.client').forEach(row=>{
      const btn=row.querySelector('button[onclick*="editL"]');
      const match=btn&&btn.getAttribute('onclick').match(/editL\('([^']+)'\)/);
      const id=match&&match[1];
      const company=id?companyMap[id]:DEFAULT_COMPANY;
      row.style.display=company===window.__selectedCompany?'flex':'none';
    });
  }

  function filterReport(){
    if(!window.__selectedCompany)return;
    const orders=window.__companyOrders.filter(o=>(o.company||companyMap[o.id]||DEFAULT_COMPANY)===window.__selectedCompany);
    const per=document.getElementById('per')?.value||'m';
    const rd=document.getElementById('rd')?.value||new Date().toISOString().slice(0,10);
    const ref=new Date(rd+'T00:00:00');
    const inPeriod=o=>{
      const d=o.saida||o.entrada;
      if(!d)return false;
      const x=new Date(d+'T00:00:00');
      if(per==='d')return d===rd;
      if(per==='m')return x.getFullYear()===ref.getFullYear()&&x.getMonth()===ref.getMonth();
      const diff=Math.floor((ref-x)/86400000);
      return diff>=0&&diff<7;
    };
    const rows=orders.filter(inPeriod);
    const venda=rows.reduce((s,o)=>s+(+o.venda||0),0);
    const custo=rows.reduce((s,o)=>s+(+o.custo||0),0);
    const imposto=rows.reduce((s,o)=>s+(+o.imposto||0),0);
    const lucro=rows.reduce((s,o)=>s+(+o.lucro||0),0);
    const fmt=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
    if(document.getElementById('rv'))rv.textContent=fmt(venda);
    if(document.getElementById('rc'))rc.textContent=fmt(custo);
    if(document.getElementById('ri'))ri.textContent=fmt(imposto);
    if(document.getElementById('rl'))rl.textContent=fmt(lucro);
    if(document.getElementById('rq'))rq.textContent=rows.length;
    if(document.getElementById('rm'))rm.textContent=(venda?((lucro/venda)*100).toFixed(1):'0')+'%';
    const rs=document.getElementById('rs');
    if(rs)rs.innerHTML=`<b>${esc(window.__selectedCompany)}</b><br><small>${rows.length} lançamento(s) no período selecionado.</small>`;
  }

  function selectCompany(company){
    if(!COMPANIES.includes(company))return;
    window.__selectedCompany=company;
    sessionStorage.setItem('gestao_empresa_atual',company);
    const m=document.getElementById('companyModal');
    if(m)m.style.display='none';
    updateHeader();
    try{if(typeof window.render==='function')window.render()}catch(e){}
    try{if(typeof window.report==='function')window.report()}catch(e){}
    setTimeout(filterList,0);
    setTimeout(filterReport,20);
  }

  function installHooks(){
    if(!document.getElementById('app'))return;
    buildModal();
    if(window.__companyHooksInstalled)return;
    window.__companyHooksInstalled=true;

    if(typeof window.render==='function'){
      const oldRender=window.render;
      window.render=function(){const r=oldRender.apply(this,arguments);filterList();return r};
    }
    if(typeof window.report==='function'){
      const oldReport=window.report;
      window.report=function(){const r=oldReport.apply(this,arguments);filterReport();return r};
    }

    const per=document.getElementById('per'),rd=document.getElementById('rd');
    per?.addEventListener('change',filterReport);rd?.addEventListener('change',filterReport);

    const app=document.getElementById('app');
    const observer=new MutationObserver(()=>{
      if(app.style.display!=='none' && !window.__selectedCompany)showModal();
    });
    observer.observe(app,{attributes:true,attributeFilter:['style']});

    // Sempre pede a empresa ao entrar no app.
    setTimeout(()=>{if(app.style.display!=='none')showModal()},100);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const ready=()=>installHooks();
    ready();
    setTimeout(ready,300);
    setTimeout(ready,1000);
  });
})();
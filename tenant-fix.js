/* Radiadores Moura - isolamento real por usuário. */
(function(){
  'use strict';
  let userCompanies=[];
  let refreshRunning=false;

  async function getMyCompanies(){
    const r=await sb.rpc('ensure_my_company');
    if(r.error){ console.error('[tenant]',r.error); return []; }
    return r.data||[];
  }

  function drawCompanies(){
    const root=$('companies');
    if(!root)return;
    root.innerHTML=userCompanies.map(c=>`<button class="companychoice" data-id="${esc(c.id)}"><b>${esc(c.name)}</b><small style="display:block;color:var(--muted);margin-top:4px">Abrir este banco</small></button>`).join('')||'<div style="padding:12px;color:var(--muted)">Nenhuma empresa disponível.</div>';
    root.querySelectorAll('button[data-id]').forEach(b=>b.onclick=async()=>{const c=userCompanies.find(x=>x.id===b.dataset.id);if(c)await selectCompany(c)});
  }

  async function selectCompany(c){
    if(!c)return;
    company=c;
    sessionStorage.setItem('companyId',c.id);
    $('companyPill').textContent='Banco: '+c.name;
    $('companyModal').classList.add('hidden');
    await loadData();
  }

  async function refreshTenant(){
    if(refreshRunning)return;
    const session=(await sb.auth.getSession()).data.session;
    if(!session)return;
    refreshRunning=true;
    try{
      userCompanies=await getMyCompanies();
      drawCompanies();
      const saved=sessionStorage.getItem('companyId');
      const found=userCompanies.find(c=>c.id===saved);
      if(found){
        await selectCompany(found);
      }else if(userCompanies.length===1){
        sessionStorage.removeItem('companyId');
        await selectCompany(userCompanies[0]);
      }else if(userCompanies.length>1){
        sessionStorage.removeItem('companyId');
        $('companyModal').classList.remove('hidden');
      }else{
        sessionStorage.removeItem('companyId');
        company=null;
        $('companyModal').classList.add('hidden');
      }
    }finally{ refreshRunning=false; }
  }

  sb.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){
      sessionStorage.removeItem('companyId');
      userCompanies=[];
      company=null;
      return;
    }
    if(session && ['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED'].includes(event))setTimeout(refreshTenant,0);
  });

  document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshTenant,150));
})();

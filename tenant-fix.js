/* Radiadores Moura - isolamento por conta autenticada.
   Cada usuário vê somente as empresas às quais está vinculado.
   Primeiro usuário sem empresa recebe automaticamente uma empresa vazia.
*/
(function(){
  'use strict';
  let userCompanies=[];

  async function getMyCompanies(){
    const r=await sb.rpc('ensure_my_company');
    if(r.error){
      console.error('[tenant] erro ao carregar empresas:',r.error);
      cloud('Erro de acesso',false);
      toast('Não foi possível carregar sua empresa: '+r.error.message);
      return [];
    }
    return r.data||[];
  }

  window.renderCompanies=function(){
    const root=$('companies');
    if(!root)return;
    root.innerHTML=userCompanies.map(c=>`<button class="companychoice" data-id="${esc(c.id)}"><b>${esc(c.name)}</b><small style="display:block;color:var(--muted);margin-top:4px">Abrir este banco</small></button>`).join('')||'<div style="padding:12px;color:var(--muted)">Nenhuma empresa disponível.</div>';
    root.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>chooseCompany(userCompanies.find(c=>c.id===b.dataset.id)));
  };

  window.chooseCompany=async function(c){
    if(!c)return;
    company=c;
    sessionStorage.setItem('companyId',c.id);
    $('companyPill').textContent='Banco: '+c.name;
    $('companyModal').classList.add('hidden');
    await loadData();
  };

  window.showApp=async function(){
    $('auth').classList.add('hidden');
    $('app').classList.remove('hidden');
    userCompanies=await getMyCompanies();
    renderCompanies();
    const saved=sessionStorage.getItem('companyId');
    const found=userCompanies.find(c=>c.id===saved);
    if(found){
      await chooseCompany(found);
      return;
    }
    sessionStorage.removeItem('companyId');
    if(userCompanies.length===1){
      await chooseCompany(userCompanies[0]);
    }else if(userCompanies.length>1){
      $('companyModal').classList.remove('hidden');
    }
  };

  if($('logout')){
    $('logout').onclick=async function(){
      sessionStorage.removeItem('companyId');
      await sb.auth.signOut();
    };
  }

  sb.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT'){
      sessionStorage.removeItem('companyId');
      userCompanies=[];
    }
  });
})();

/* Radiadores Moura - correção de criação/troca de contas.
   O Supabase mantém a sessão atual quando signUp é chamado.
   Por isso, antes de criar outra conta, encerramos a sessão anterior.
*/
(function(){
  'use strict';
  function install(){
    const signup=document.getElementById('signup');
    const login=document.getElementById('login');
    const email=document.getElementById('email');
    const pass=document.getElementById('pass');
    const msg=document.getElementById('authmsg');
    if(!signup||!login||!email||!pass||!msg||!window.supabase)return;

    signup.onclick=async function(){
      const e=email.value.trim(), p=pass.value;
      if(!e||!p){msg.textContent='Informe e-mail e senha para criar a conta.';return;}
      signup.disabled=true;
      try{
        sessionStorage.removeItem('companyId');
        msg.textContent='Saindo da conta atual...';
        await sb.auth.signOut();
        msg.textContent='Criando conta...';
        const {data,error}=await sb.auth.signUp({
          email:e,password:p,
          options:{emailRedirectTo:new URL('./',window.location.href).href}
        });
        if(error){msg.textContent='Erro: '+error.message;return;}
        msg.textContent=data?.session
          ? 'Conta criada. Entrando...'
          : 'Conta criada. Confirme o e-mail recebido e depois entre com essa conta.';
      }catch(err){
        console.error('[Radiadores Moura] Erro no cadastro:',err);
        msg.textContent='Não foi possível criar a conta: '+(err?.message||err);
      }finally{signup.disabled=false;}
    };

    login.onsubmit=async function(ev){
      ev.preventDefault();
      msg.textContent='Entrando...';
      sessionStorage.removeItem('companyId');
      const {error}=await sb.auth.signInWithPassword({email:email.value.trim(),password:pass.value});
      if(error)msg.textContent='Erro: '+error.message;else msg.textContent='';
    };
  }

  function installLaunchClientFields(){
    const order=document.getElementById('order');
    const clientField=document.getElementById('clientInput')?.closest('.field');
    if(!order||!clientField||document.getElementById('launchClientDetails'))return;

    const box=document.createElement('div');
    box.id='launchClientDetails';
    box.className='g12 client-launch-details';
    box.innerHTML=`
      <div class="client-launch-title">Dados do cliente</div>
      <div class="client-launch-grid">
        <div class="field"><label>Razão social</label><input id="launchClientLegalName" autocomplete="organization" placeholder="Razão social"></div>
        <div class="field"><label>CNPJ</label><input id="launchClientCnpj" inputmode="numeric" autocomplete="off" placeholder="00.000.000/0000-00"></div>
        <div class="field"><label>Telefone</label><input id="launchClientPhone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></div>
        <div class="field client-address-field"><label>Endereço completo</label><input id="launchClientAddress" autocomplete="street-address" placeholder="Rua, número, bairro, cidade - UF"></div>
      </div>`;
    clientField.after(box);

    if(!document.getElementById('launch-client-fields-style')){
      const s=document.createElement('style');s.id='launch-client-fields-style';s.textContent=`
        #launchClientDetails{margin-top:2px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:#fafcff}
        #launchClientDetails .client-launch-title{font-weight:800;font-size:14px;margin-bottom:10px;color:var(--ink)}
        #launchClientDetails .client-launch-grid{display:grid;grid-template-columns:1.2fr .9fr .9fr 2fr;gap:10px;align-items:end}
        #launchClientDetails .client-launch-grid .field{margin:0}
        #launchClientDetails input{width:100%;box-sizing:border-box}
        @media(max-width:900px){#launchClientDetails .client-launch-grid{grid-template-columns:1fr 1fr}.client-address-field{grid-column:1/-1}}
        @media(max-width:600px){#launchClientDetails .client-launch-grid{grid-template-columns:1fr}.client-address-field{grid-column:auto}}
      `;document.head.appendChild(s);
    }

    const getClient=()=>{
      const name=(document.getElementById('clientInput')?.value||'').trim().toLowerCase();
      return (window.clients||[]).find(c=>String(c.name||'').trim().toLowerCase()===name)||null;
    };
    const setFields=c=>{
      const legal=document.getElementById('launchClientLegalName');
      const cnpj=document.getElementById('launchClientCnpj');
      const phone=document.getElementById('launchClientPhone');
      const address=document.getElementById('launchClientAddress');
      if(!legal)return;
      legal.value=c?.legal_name||c?.razao_social||c?.name||'';
      cnpj.value=c?.cpf_cnpj||c?.cnpj||'';
      phone.value=c?.phone||c?.whatsapp||'';
      address.value=c?.address||[c?.street,c?.number,c?.neighborhood,c?.city,c?.uf].filter(Boolean).join(', ')||'';
    };
    const fillFromName=()=>{const c=getClient();if(c)setFields(c)};

    document.getElementById('clientInput')?.addEventListener('input',()=>setTimeout(fillFromName,0));
    document.addEventListener('click',e=>{if(e.target.closest('#clientSug button'))setTimeout(fillFromName,20)});
    const originalClear=window.clearOrder;
    setInterval(()=>{if(document.getElementById('clientInput')?.value.trim()&&!document.activeElement?.closest('#launchClientDetails'))fillFromName()},700);

    order.addEventListener('submit',()=>{
      const name=document.getElementById('clientInput');
      const legal=document.getElementById('launchClientLegalName');
      if(name&&!name.value.trim()&&legal?.value.trim())name.value=legal.value.trim();
      setTimeout(async()=>{
        if(!window.company||!window.sb)return;
        const clientName=(document.getElementById('clientInput')?.value||'').trim();
        if(!clientName)return;
        const payload={
          cpf_cnpj:(document.getElementById('launchClientCnpj')?.value||'').trim(),
          phone:(document.getElementById('launchClientPhone')?.value||'').trim(),
          address:(document.getElementById('launchClientAddress')?.value||'').trim()
        };
        const legalName=(document.getElementById('launchClientLegalName')?.value||'').trim();
        if(legalName)payload.name=legalName;
        let q=await sb.from('clients').select('id').eq('company_id',window.company.id).ilike('name',clientName).limit(1);
        if(!q.error&&q.data?.[0]){
          const upd={...payload};
          if(!upd.name)delete upd.name;
          await sb.from('clients').update(upd).eq('id',q.data[0].id);
        }
      },1800);
    },true);

    window.__fillLaunchClientFields=setFields;
  }

  function boot(){installLaunchClientFields();setTimeout(installLaunchClientFields,500);setTimeout(installLaunchClientFields,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();boot()},{once:true});
  else{install();boot()}
})();

/* Radiadores Moura - correção de criação/troca de contas e persistência dos dados do cliente no editor. */
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
        sessionStorage.removeItem('companyId');msg.textContent='Saindo da conta atual...';await sb.auth.signOut();
        msg.textContent='Criando conta...';
        const {data,error}=await sb.auth.signUp({email:e,password:p,options:{emailRedirectTo:new URL('./',window.location.href).href}});
        if(error){msg.textContent='Erro: '+error.message;return;}
        msg.textContent=data?.session?'Conta criada. Entrando...':'Conta criada. Confirme o e-mail recebido e depois entre com essa conta.';
      }catch(err){console.error('[Radiadores Moura] Erro no cadastro:',err);msg.textContent='Não foi possível criar a conta: '+(err?.message||err)}finally{signup.disabled=false}
    };
    login.onsubmit=async function(ev){ev.preventDefault();msg.textContent='Entrando...';sessionStorage.removeItem('companyId');const {error}=await sb.auth.signInWithPassword({email:email.value.trim(),password:pass.value});if(error)msg.textContent='Erro: '+error.message;else msg.textContent=''};
  }

  function installLaunchClientFields(){
    const order=document.getElementById('order'), clientField=document.getElementById('clientInput')?.closest('.field');
    if(!order||!clientField||document.getElementById('launchClientDetails'))return;
    const box=document.createElement('div');box.id='launchClientDetails';box.className='g12 client-launch-details';
    box.innerHTML=`<div class="client-launch-title">Dados completos do cliente</div><div class="client-launch-grid">
      <div class="field"><label>CPF / CNPJ</label><input id="launchClientCnpj" inputmode="numeric" autocomplete="off" placeholder="CPF ou CNPJ"></div>
      <div class="field"><label>Telefone</label><input id="launchClientPhone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></div>
      <div class="field"><label>E-mail</label><input id="launchClientEmail" type="email" autocomplete="email" placeholder="cliente@email.com"></div>
      <div class="field"><label>CEP</label><input id="launchClientCep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"></div>
      <div class="field client-address-field"><label>Endereço</label><input id="launchClientAddress" autocomplete="street-address" placeholder="Rua, bairro ou endereço completo"></div>
      <div class="field"><label>Cidade</label><input id="launchClientCity" autocomplete="address-level2" placeholder="Cidade"></div>
      <div class="field"><label>UF</label><input id="launchClientUf" maxlength="2" autocomplete="address-level1" placeholder="PR"></div>
    </div>`;
    clientField.after(box);
    if(!document.getElementById('launch-client-fields-style')){const s=document.createElement('style');s.id='launch-client-fields-style';s.textContent=`
      #launchClientDetails{margin-top:2px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:#fafcff}
      #launchClientDetails .client-launch-title{font-weight:800;font-size:14px;margin-bottom:10px;color:var(--ink)}
      #launchClientDetails .client-launch-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:end}
      #launchClientDetails .client-launch-grid .field{margin:0;min-width:0}#launchClientDetails input{width:100%;min-width:0;box-sizing:border-box}
      #launchClientDetails .client-address-field{grid-column:span 2}
      @media(max-width:900px){#launchClientDetails .client-launch-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#launchClientDetails .client-address-field{grid-column:span 2}}
      @media(max-width:600px){#launchClientDetails .client-launch-grid{grid-template-columns:1fr}#launchClientDetails .client-address-field{grid-column:auto}}
    `;document.head.appendChild(s)}
    const clientList=()=>{try{return typeof clients!=='undefined'&&Array.isArray(clients)?clients:[]}catch(_){return[]}};
    const getClient=()=>{const name=(document.getElementById('clientInput')?.value||'').trim().toLowerCase();return clientList().find(c=>String(c.name||'').trim().toLowerCase()===name)||null};
    const setFields=c=>{const val=id=>document.getElementById(id);if(!val('launchClientCnpj'))return;val('launchClientCnpj').value=c?.cpf_cnpj||'';val('launchClientPhone').value=c?.phone||'';val('launchClientEmail').value=c?.email||'';val('launchClientCep').value=c?.cep||'';val('launchClientAddress').value=c?.address||'';val('launchClientCity').value=c?.city||'';val('launchClientUf').value=c?.uf||''};
    let lastClientName='',lastClientSignature='';
    const fillFromName=force=>{
      const name=(document.getElementById('clientInput')?.value||'').trim().toLowerCase();
      const c=getClient();
      const signature=c?JSON.stringify([c.id,c.cpf_cnpj,c.phone,c.email,c.cep,c.address,c.city,c.uf]):'';
      if(!force&&name===lastClientName&&signature===lastClientSignature)return;
      lastClientName=name;lastClientSignature=signature;
      if(c)setFields(c);else if(!name)setFields(null);
    };
    document.getElementById('clientInput')?.addEventListener('input',()=>fillFromName(false));
    document.addEventListener('click',e=>{if(e.target.closest('#clientSug button')){lastClientName='';setTimeout(()=>fillFromName(true),20)}});
    setInterval(()=>fillFromName(false),900);

    /* Persiste todos os dados do cliente no registro de clientes, inclusive
       cidade e UF. Os valores são capturados antes do submit limpar o formulário. */
    if(order.dataset.clientPersistenceBound!=='1'){
      const originalSubmit=order.onsubmit;
      if(typeof originalSubmit==='function'){
        order.onsubmit=async function(ev){
          const clientName=(document.getElementById('clientInput')?.value||'').trim();
          const field=id=>(document.getElementById(id)?.value||'').trim();
          const address=field('launchClientAddress');
          const clientData={
            cpf_cnpj:field('launchClientCnpj'),
            phone:field('launchClientPhone'),
            email:field('launchClientEmail'),
            cep:field('launchClientCep'),
            address,
            city:field('launchClientCity'),
            uf:field('launchClientUf').toUpperCase()
          };
          try{
            await originalSubmit.call(this,ev);
            if(!clientName||typeof sb==='undefined'||typeof company==='undefined'||!company)return;
            const currentClient=clientList().find(c=>String(c.name||'').trim().toLowerCase()===clientName.toLowerCase());
            let clientId=currentClient?.id||null;
            if(!clientId){
              const q=await sb.from('clients').select('id').eq('company_id',company.id).ilike('name',clientName).limit(1);
              if(q.error||!q.data?.[0])return;
              clientId=q.data[0].id;
            }
            const upd=await sb.from('clients').update(clientData).eq('id',clientId).eq('company_id',company.id);
            if(upd.error){console.error('[Radiadores Moura] Erro ao salvar dados do cliente:',upd.error);toast('Lançamento salvo, mas os dados do cliente não foram atualizados: '+upd.error.message);return}
            const idx=clientList().findIndex(c=>c.id===q.data[0].id);
            if(idx>=0)Object.assign(clients[idx],clientData);
          }catch(err){console.error('[Radiadores Moura] Persistência do cliente:',err);if(typeof toast==='function')toast('Lançamento salvo, mas houve erro nos dados do cliente.');}
        };
        order.dataset.clientPersistenceBound='1';
      }
    }

    /* Hierarquia visual dos cartões de lançamentos: cliente e serviço mais legíveis. */
    if(!document.getElementById('launch-card-typography-style')){const s=document.createElement('style');s.id='launch-card-typography-style';s.textContent=`
      #launchList .launch .lname{font-size:18px!important;font-weight:900!important;line-height:1.2!important}
      #launchList .launch .meta{font-size:13px!important;font-weight:400!important;line-height:1.25!important}
      #launchList .launch .chips{gap:6px!important;margin-top:5px!important}
      #launchList .launch .chip{font-size:13px!important;font-weight:800!important;line-height:1.3!important;padding:4px 8px!important;white-space:normal!important}
    `;document.head.appendChild(s)}
  }
  function boot(){installLaunchClientFields();setTimeout(installLaunchClientFields,500);setTimeout(installLaunchClientFields,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();boot()},{once:true});else{install();boot()}
})();

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


  async function lookupCompanyByCnpj(raw, target){
    const cnpj=String(raw||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
    if(!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)){
      if(typeof toast==='function')toast('Digite um CNPJ válido com 14 caracteres.');
      else alert('Digite um CNPJ válido com 14 caracteres.');
      return;
    }
    const button=target?.querySelector('button[data-cnpj-search]');
    const status=target?.querySelector('[data-cnpj-status]');
    if(button){button.disabled=true;button.textContent='Consultando...'}
    if(status)status.textContent='Consultando base pública...';
    try{
      const response=await fetch('https://brasilapi.com.br/api/cnpj/v1/'+encodeURIComponent(cnpj),{headers:{'Accept':'application/json'}});
      if(!response.ok){
        let message='Não foi possível consultar o CNPJ.';
        if(response.status===404)message='CNPJ não encontrado na base pública.';
        else if(response.status===400)message='CNPJ inválido ou mal formatado.';
        else if(response.status===429)message='Muitas consultas em sequência. Aguarde um pouco e tente novamente.';
        else if(response.status>=500)message='Serviço de consulta temporariamente indisponível.';
        throw new Error(message);
      }
      const d=await response.json();
      const put=(id,value)=>{const el=document.getElementById(id);if(el&&value!==undefined&&value!==null&&String(value).trim()!=='')el.value=String(value).trim()};
      const phone=String(d.ddd_telefone_1||d.ddd_telefone_2||'').trim();
      put(target.dataset.mode==='modal'?'clientReasonSocial':'launchClientReasonSocial',d.razao_social);
      put(target.dataset.mode==='modal'?'clientName':'clientInput',d.razao_social);
      put(target.dataset.mode==='modal'?'doc':'launchClientCnpj',d.cnpj||cnpj);
      put(target.dataset.mode==='modal'?'phone':'launchClientPhone',phone);
      put(target.dataset.mode==='modal'?'mail':'launchClientEmail',d.email);
      put(target.dataset.mode==='modal'?'clientCep':'launchClientCep',d.cep);
      put(target.dataset.mode==='modal'?'address':'launchClientAddress',d.logradouro);
      put(target.dataset.mode==='modal'?'addressNumber':'launchClientNumber',d.numero);
      put(target.dataset.mode==='modal'?'neighborhood':'launchClientNeighborhood',d.bairro);
      put(target.dataset.mode==='modal'?'complement':'launchClientComplement',d.complemento);
      put(target.dataset.mode==='modal'?'city':'launchClientCity',d.municipio);
      put(target.dataset.mode==='modal'?'uf':'launchClientUf',d.uf);
      if(status)status.textContent='Dados encontrados. Confira e complete os campos antes de salvar.';
      if(typeof toast==='function')toast('Dados da empresa preenchidos. Confira antes de salvar.');
    }catch(err){
      console.error('[Radiadores Moura] Consulta CNPJ:',err);
      if(status)status.textContent=err.message||'Falha na consulta.';
      if(typeof toast==='function')toast(err.message||'Falha ao consultar CNPJ.');
      else alert(err.message||'Falha ao consultar CNPJ.');
    }finally{
      if(button){button.disabled=false;button.textContent='Consultar CNPJ'}
    }
  }
  function installCnpjLookup(){
    const addButton=(input,mode)=>{
      if(!input||input.dataset.cnpjLookupInstalled==='1')return;
      input.dataset.cnpjLookupInstalled='1';
      const wrap=document.createElement('div');wrap.className='cnpj-lookup-wrap';wrap.dataset.mode=mode;
      input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
      const button=document.createElement('button');button.type='button';button.className='btn cnpj-lookup-btn';button.dataset.cnpjSearch='1';button.textContent='Consultar CNPJ';
      const status=document.createElement('small');status.dataset.cnpjStatus='1';status.className='cnpj-lookup-status';
      wrap.appendChild(button);wrap.appendChild(status);
      button.addEventListener('click',()=>{input.dataset.lastCnpjLookup=input.value.toUpperCase().replace(/[^0-9A-Z]/g,'');lookupCompanyByCnpj(input.value,wrap)});
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupCompanyByCnpj(input.value,wrap)}});
      input.addEventListener('blur',e=>{if(e.relatedTarget?.closest?.('button[data-cnpj-search]'))return;const value=input.value.toUpperCase().replace(/[^0-9A-Z]/g,'');if(value.length===14&&input.dataset.lastCnpjLookup!==value){input.dataset.lastCnpjLookup=value;lookupCompanyByCnpj(value,wrap)}});
    };
    addButton(document.getElementById('launchClientCnpj'),'launch');
    addButton(document.getElementById('doc'),'modal');
    if(!document.getElementById('cnpj-lookup-style')){
      const style=document.createElement('style');style.id='cnpj-lookup-style';style.textContent=`
        .cnpj-lookup-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .cnpj-lookup-wrap input{flex:1;min-width:120px}
        .cnpj-lookup-btn{white-space:nowrap;padding:8px 10px;font-size:12px}
        .cnpj-lookup-status{flex-basis:100%;color:var(--muted);font-size:11px;min-height:13px}
      `;document.head.appendChild(style);
    }
  }

  function installLaunchClientFields(){
    const order=document.getElementById('order'), clientField=document.getElementById('clientInput')?.closest('.field');
    if(!order||!clientField||document.getElementById('launchClientDetails'))return;
    const box=document.createElement('div');box.id='launchClientDetails';box.className='g12 client-launch-details';
    box.innerHTML=`<div class="client-launch-title">Dados completos do cliente</div><div class="client-launch-grid">
      <div class="field client-reason-field"><label>Razão social</label><input id="launchClientReasonSocial" autocomplete="organization" placeholder="Razão social"></div>
      <div class="field client-cnpj-field"><label>CPF / CNPJ</label><input id="launchClientCnpj" inputmode="numeric" autocomplete="off" placeholder="CPF ou CNPJ"></div>
      <div class="field client-phone-field"><label>Telefone</label><input id="launchClientPhone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></div>
      <div class="field client-email-field"><label>E-mail</label><input id="launchClientEmail" type="email" autocomplete="email" placeholder="cliente@email.com"></div>
      <div class="field client-cep-field"><label>CEP</label><input id="launchClientCep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"></div>
      <div class="field client-address-field"><label>Endereço (rua)</label><input id="launchClientAddress" autocomplete="address-line1" placeholder="Nome da rua"></div>
      <div class="field client-number-field"><label>Número</label><input id="launchClientNumber" autocomplete="address-line2" placeholder="Número"></div>
      <div class="field client-neighborhood-field"><label>Bairro</label><input id="launchClientNeighborhood" autocomplete="address-level3" placeholder="Bairro"></div>
      <div class="field client-complement-field"><label>Complemento</label><input id="launchClientComplement" placeholder="Sala, bloco, barracão..."></div>
      <div class="field client-city-field"><label>Cidade</label><input id="launchClientCity" autocomplete="address-level2" placeholder="Cidade"></div>
      <div class="field client-uf-field"><label>UF</label><input id="launchClientUf" maxlength="2" autocomplete="address-level1" placeholder="PR"></div>
    </div>`;
    clientField.after(box);
    if(!document.getElementById('launch-client-fields-style')){const s=document.createElement('style');s.id='launch-client-fields-style';s.textContent=`
      #launchClientDetails{margin-top:2px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#fafcff;display:block!important;width:100%;box-sizing:border-box}
      #launchClientDetails .client-launch-title{font-weight:800;font-size:13px;margin-bottom:7px;color:var(--ink)}
      #launchClientDetails .client-launch-grid{display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:7px 9px!important;align-items:end!important;width:100%;min-width:0}
      #launchClientDetails .client-launch-grid>.field{margin:0!important;min-width:0!important;width:auto!important;grid-column:auto!important}
      #launchClientDetails .client-reason-field,#launchClientDetails .client-cnpj-field{grid-column:span 4!important}
      #launchClientDetails .client-phone-field,#launchClientDetails .client-email-field,#launchClientDetails .client-cep-field,#launchClientDetails .client-uf-field{grid-column:span 2!important}
      #launchClientDetails .client-address-field{grid-column:span 3!important}
      #launchClientDetails .client-number-field,#launchClientDetails .client-neighborhood-field,#launchClientDetails .client-complement-field{grid-column:span 1!important}
      #launchClientDetails .client-city-field{grid-column:span 2!important}
      #launchClientDetails .client-launch-grid>.field label{display:block;margin-bottom:3px}
      #launchClientDetails input{display:block;width:100%!important;min-width:0!important;max-width:100%;box-sizing:border-box}
      #launchClientDetails .cnpj-lookup-wrap{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:5px;align-items:center;width:100%;min-width:0}
      #launchClientDetails .cnpj-lookup-wrap input{min-width:0!important;width:100%!important}
      #launchClientDetails .cnpj-lookup-wrap .cnpj-lookup-btn{white-space:nowrap;min-height:36px;padding:6px 8px;font-size:11px}
      #launchClientDetails .cnpj-lookup-wrap .cnpj-lookup-status{display:none!important}
      @media(max-width:900px){#launchClientDetails .client-launch-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}#launchClientDetails .client-launch-grid>.field{grid-column:span 2!important}#launchClientDetails .client-launch-grid>.client-address-field{grid-column:span 4!important}}
      @media(max-width:600px){#launchClientDetails .client-launch-grid{grid-template-columns:minmax(0,1fr)!important}#launchClientDetails .client-launch-grid>.field{grid-column:span 1!important}}    `;document.head.appendChild(s)}
    const clientList=()=>{try{return typeof clients!=='undefined'&&Array.isArray(clients)?clients:[]}catch(_){return[]}};
    const getClient=()=>{const name=(document.getElementById('clientInput')?.value||'').trim().toLowerCase();return clientList().find(c=>[c.name,c.reason_social].some(v=>String(v||'').trim().toLowerCase()===name))||null};
    const setFields=c=>{const val=id=>document.getElementById(id);if(!val('launchClientCnpj'))return;val('launchClientReasonSocial').value=c?.reason_social||'';val('launchClientCnpj').value=c?.cpf_cnpj||'';val('launchClientPhone').value=c?.phone||'';val('launchClientEmail').value=c?.email||'';val('launchClientCep').value=c?.cep||'';val('launchClientAddress').value=c?.address||'';val('launchClientNumber').value=c?.address_number||'';val('launchClientNeighborhood').value=c?.neighborhood||'';val('launchClientComplement').value=c?.complement||'';val('launchClientCity').value=c?.city||'';val('launchClientUf').value=c?.uf||''};
    let lastClientName='',lastClientSignature='';
    const fillFromName=force=>{
      const name=(document.getElementById('clientInput')?.value||'').trim().toLowerCase();
      const c=getClient();
      const signature=c?JSON.stringify([c.id,c.reason_social,c.cpf_cnpj,c.phone,c.email,c.cep,c.address,c.address_number,c.neighborhood,c.complement,c.city,c.uf]):'';
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
            reason_social:field('launchClientReasonSocial'),
            cpf_cnpj:field('launchClientCnpj'),
            phone:field('launchClientPhone'),
            email:field('launchClientEmail'),
            cep:field('launchClientCep'),
            address,
            address_number:field('launchClientNumber'),
            neighborhood:field('launchClientNeighborhood'),
            complement:field('launchClientComplement'),
            city:field('launchClientCity'),
            uf:field('launchClientUf').toUpperCase()
          };
          try{
            await originalSubmit.call(this,ev);
            if(!clientName||typeof sb==='undefined'||typeof company==='undefined'||!company)return;
            const currentClient=clientList().find(c=>[c.name,c.reason_social].some(v=>String(v||'').trim().toLowerCase()===clientName.toLowerCase()));
            let clientId=currentClient?.id||null;
            if(!clientId){
              const q=await sb.from('clients').select('id').eq('company_id',company.id).ilike('name',clientName).limit(1);
              if(q.error||!q.data?.[0])return;
              clientId=q.data[0].id;
            }
            const upd=await sb.from('clients').update(clientData).eq('id',clientId).eq('company_id',company.id);
            if(upd.error){console.error('[Radiadores Moura] Erro ao salvar dados do cliente:',upd.error);toast('Lançamento salvo, mas os dados do cliente não foram atualizados: '+upd.error.message);return}
            const idx=clientList().findIndex(c=>c.id===clientId);
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
  function boot(){installLaunchClientFields();installCnpjLookup();setTimeout(()=>{installLaunchClientFields();installCnpjLookup()},500);setTimeout(()=>{installLaunchClientFields();installCnpjLookup()},1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();boot()},{once:true});else{install();boot()}
})();

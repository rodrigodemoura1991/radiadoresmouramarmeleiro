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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

/* Ajustes visuais do campo Frete + correção do redirecionamento de confirmação de e-mail */
(function(){
  'use strict';

  function addHeaders(){
    document.querySelectorAll('.svc-head').forEach(h=>{
      if(!h.querySelector('.freight-head')){
        const cost=[...h.children].find(x=>x.textContent.trim().toLowerCase()==='custo');
        const s=document.createElement('span');s.className='freight-head';s.textContent='Frete';
        cost?cost.after(s):h.appendChild(s);
      }
    });
    document.querySelectorAll('.edit-svc-head').forEach(h=>{
      if(!h.querySelector('.freight-head')){
        const cost=[...h.children].find(x=>x.textContent.trim().toLowerCase()==='custo');
        const s=document.createElement('span');s.className='freight-head';s.textContent='Frete';
        cost?cost.after(s):h.appendChild(s);
      }
    });
  }

  function installSignupRedirect(){
    const signup=document.getElementById('signup');
    const email=document.getElementById('email');
    const pass=document.getElementById('pass');
    const msg=document.getElementById('authmsg');
    if(!signup||!email||!pass||!msg||!window.supabase)return;

    // O app está dentro de /radiadoresmouramarmeleiro/ no GitHub Pages.
    // O handler original não informava emailRedirectTo e o Supabase usava
    // o Site URL antigo (raiz do domínio), causando a página 404.
    signup.onclick=async()=>{
      const e=email.value.trim();
      const p=pass.value;
      if(!e||!p){msg.textContent='Informe e-mail e senha para criar a conta.';return}
      msg.textContent='Criando conta...';
      signup.disabled=true;
      try{
        const redirectTo=new URL('./',window.location.href).href;
        const r=await window.supabase.auth.signUp({
          email:e,
          password:p,
          options:{emailRedirectTo:redirectTo}
        });
        msg.textContent=r.error?'Erro: '+r.error.message:'Conta criada. Confirme o e-mail recebido para entrar no sistema.';
      }catch(err){
        console.error('[Radiadores Moura] Cadastro:',err);
        msg.textContent='Não foi possível criar a conta.';
      }finally{
        signup.disabled=false;
      }
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    addHeaders();
    installSignupRedirect();
    document.addEventListener('click',()=>requestAnimationFrame(addHeaders));
  });
})();

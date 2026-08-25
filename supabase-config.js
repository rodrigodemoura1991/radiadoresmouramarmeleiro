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
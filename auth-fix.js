/* Correção do redirecionamento de confirmação de e-mail no GitHub Pages. */
(function () {
  'use strict';

  function getAppUrl() {
    // Mantém exatamente a pasta onde o index.html está hospedado.
    return new URL('./', window.location.href).href;
  }

  function install() {
    const signup = document.getElementById('signup');
    const email = document.getElementById('email');
    const pass = document.getElementById('pass');
    const msg = document.getElementById('authmsg');
    if (!signup || !email || !pass || !msg || !window.supabase || !window.SUPABASE_CONFIG) return;

    // Substitui o handler antigo do app.js.
    signup.onclick = async function () {
      const e = email.value.trim();
      const p = pass.value;
      if (!e || !p) {
        msg.textContent = 'Informe e-mail e senha para criar a conta.';
        return;
      }

      msg.textContent = 'Criando conta...';
      signup.disabled = true;

      try {
        const redirectTo = getAppUrl();
        const { error } = await window.supabase.auth.signUp({
          email: e,
          password: p,
          options: { emailRedirectTo: redirectTo }
        });

        if (error) {
          msg.textContent = 'Erro: ' + error.message;
          return;
        }

        msg.textContent = 'Conta criada. Confirme o e-mail recebido para entrar no sistema.';
      } catch (err) {
        console.error('[Radiadores Moura] Erro no cadastro:', err);
        msg.textContent = 'Não foi possível criar a conta.';
      } finally {
        signup.disabled = false;
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();

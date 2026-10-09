/* Painel de lançamento + bloco de notas na coluna lateral esquerda */
(function () {
  'use strict';
  function init() {
    const launch = document.getElementById('launch');
    const form = document.getElementById('order');
    const list = document.getElementById('launchList');
    const side = document.querySelector('.side');
    if (!launch || !form || !list || !side) return false;
    if (document.getElementById('localLaunchPanel')) return true;

    const formCard = form.closest('.card') || form.parentElement;
    const listCard = list.closest('.card') || list.parentElement;
    if (!formCard || !listCard) return false;

    if (!document.getElementById('localHomeNotepad')) {
      const noteCard = document.createElement('div');
      noteCard.id = 'localHomeNotepad';
      noteCard.className = 'card local-home-notepad';
      noteCard.innerHTML = '<div class="local-home-notepad-head"><strong>📝 Bloco de notas — informações importantes</strong><span>Salvo neste navegador</span></div><textarea id="localHomeNotes" placeholder="Anote aqui informações importantes, pendências e lembretes..."></textarea>';
      side.appendChild(noteCard);
      const notes = noteCard.querySelector('#localHomeNotes');
      try { notes.value = window.localStorage.getItem('radiadoresMouraHomeNotes') || ''; } catch (e) {}
      notes.addEventListener('input', function () {
        try { window.localStorage.setItem('radiadoresMouraHomeNotes', notes.value); } catch (e) {}
      });
    }

    if (listCard.parentElement && formCard.parentElement === listCard.parentElement) {
      listCard.parentElement.insertBefore(listCard, formCard);
    }
    formCard.style.display = 'none';

    const title = listCard.querySelector('.sectiontitle h3');
    if (title) title.textContent = 'Lançamentos';
    const h1 = launch.querySelector('.head h1');
    if (h1) h1.textContent = 'Lançamentos';
    const subtitle = launch.querySelector('.head p');
    if (subtitle) subtitle.textContent = 'Consulte os serviços ou faça um novo lançamento.';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'localCreateLaunch';
    button.className = 'btn primary local-create-launch local-create-launch-sidebar';
    button.textContent = 'LANÇAR SERVIÇO/VENDA';
    // Importante: inserir diretamente na barra lateral, antes das abas, não no cabeçalho à direita.
    side.insertBefore(button, side.firstChild);

    const panel = document.createElement('div');
    panel.id = 'localLaunchPanel';
    panel.className = 'local-launch-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = '<div class="local-launch-panel-head"><div><strong>Novo lançamento de serviço</strong><div class="local-launch-panel-sub">Preencha os dados do cliente e do veículo</div></div><button type="button" class="local-launch-panel-close" aria-label="Fechar">×</button></div><div class="local-launch-panel-layout"><div class="local-launch-panel-body"></div></div>';
    document.body.appendChild(panel);
    panel.querySelector('.local-launch-panel-body').appendChild(formCard);
    formCard.style.display = 'block';
    formCard.style.visibility = 'visible';

    function openPanel() {
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('local-launch-panel-open');
      button.setAttribute('aria-expanded', 'true');
      setTimeout(function () {
        const input = document.querySelector('#order input:not([type="hidden"]):not([disabled])');
        if (input) input.focus({ preventScroll: true });
      }, 120);
    }
    function closePanel() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('local-launch-panel-open');
      button.setAttribute('aria-expanded', 'false');
    }
    button.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openPanel(); });
    panel.querySelector('.local-launch-panel-close').addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel(); });
    panel.addEventListener('click', function (e) { if (e.target === panel) closePanel(); });
    const toast = document.getElementById('toast');
    if (toast) new MutationObserver(function () {
      if (/lançamento salvo na nuvem/i.test(toast.textContent || '')) closePanel();
    }).observe(toast, { childList: true, subtree: true, characterData: true });
    return true;
  }
  function retry() {
    let n = 0;
    const timer = setInterval(function () {
      if (init() || ++n > 80) clearInterval(timer);
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();
  window.addEventListener('load', init);
})();
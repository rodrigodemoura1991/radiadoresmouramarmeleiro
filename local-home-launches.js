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
      noteCard.innerHTML = '<div class="local-home-notepad-head"><strong>📝 Bloco de notas — informações importantes</strong><span id="localHomeNotesStatus">Carregando notas...</span></div><textarea id="localHomeNotes" placeholder="Anote aqui informações importantes, pendências e lembretes..."></textarea>';
      side.appendChild(noteCard);
      const notes = noteCard.querySelector('#localHomeNotes');
      try { const cid = window.company && window.company.id; const key = typeof window.homeNotesStorageKey === 'function' ? window.homeNotesStorageKey(cid) : ('radiadoresMouraHomeNotes:' + String(cid || 'sem-empresa')); notes.value = window.localStorage.getItem(key) || ''; } catch (e) {}
      if (typeof window.loadHomeNotesFromCloud === 'function') window.loadHomeNotesFromCloud();
      let notesSaveTimer = null;
      notes.addEventListener('input', function () {
        try { const cid = window.company && window.company.id; const key = typeof window.homeNotesStorageKey === 'function' ? window.homeNotesStorageKey(cid) : ('radiadoresMouraHomeNotes:' + String(cid || 'sem-empresa')); window.localStorage.setItem(key, notes.value); } catch (e) {}
        const status = document.getElementById('localHomeNotesStatus');
        if (status) status.textContent = 'Salvando na nuvem...';
        clearTimeout(notesSaveTimer);
        notesSaveTimer = setTimeout(function () {
          if (typeof window.saveHomeNotesToCloud === 'function') window.saveHomeNotesToCloud(notes.value);
        }, 800);
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

    // Em telas pequenas, notas e ação principal passam para o fluxo do conteúdo.
    // Em telas maiores, ambos retornam à barra lateral original.
    const moveMobileElements = () => {
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const note = document.getElementById('localHomeNotepad');
      const create = document.getElementById('launchNewService') || document.getElementById('localCreateLaunch');
      const launchHead = launch.querySelector('.head');
      if (mobile) {
        if (note && note.parentElement !== launch) listCard.insertAdjacentElement('afterend', note);
        if (create && create.parentElement !== launch) {
          if (launchHead) launchHead.insertAdjacentElement('afterend', create);
          else launch.insertBefore(create, launch.firstChild);
        }
      } else {
        if (note && note.parentElement !== side) side.appendChild(note);
        if (create && create.parentElement !== side) side.insertBefore(create, side.firstChild);
      }
    };
    moveMobileElements();
    if (!window.__radiadoresMobileLayoutBound) {
      window.__radiadoresMobileLayoutBound = true;
      const mq = window.matchMedia('(max-width: 760px)');
      if (mq.addEventListener) mq.addEventListener('change', () => setTimeout(init, 0));
      else if (mq.addListener) mq.addListener(() => setTimeout(init, 0));
      const sideObserver = new MutationObserver(() => {
        const mobile = window.matchMedia('(max-width: 760px)').matches;
        if (mobile) {
          const button = document.getElementById('launchNewService') || document.getElementById('localCreateLaunch');
          const head = launch.querySelector('.head');
          if (button && button.parentElement === side && head) head.insertAdjacentElement('afterend', button);
        }
      });
      sideObserver.observe(side, { childList: true });
    }

    // O botão único de novo lançamento é criado por js/servicos-popup-edicao.js no cabeçalho.
    // Mantemos o formulário oculto até que esse botão abra a janela de lançamento.
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
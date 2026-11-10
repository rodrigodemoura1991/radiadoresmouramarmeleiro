/* RELATÓRIO DE COBRANÇA POR CLIENTE — Radiadores Moura
   Seleciona lançamentos existentes e gera documento imprimível/PDF.
   Não grava, altera ou exclui dados no Supabase. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateBR = v => {
    const m = String(v || '').slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3]+'/'+m[2]+'/'+m[1] : '—';
  };
  let activeClient = null;
  let modal = null;

  function allOrders() { return Array.isArray(window.orders) ? window.orders : []; }
  function clientOrders(client) {
    return allOrders().filter(o =>
      (o.client_id && String(o.client_id) === String(client.id)) ||
      (!o.client_id && String(o.client_name || '').trim().toLowerCase() === String(client.name || '').trim().toLowerCase())
    ).sort((a,b) => String(b.entry_date || '').localeCompare(String(a.entry_date || '')));
  }
  function itemsOf(order) {
    return Array.isArray(order.order_items) && order.order_items.length
      ? order.order_items
      : [{ description: 'Serviço / produto', sale_value: Number(order.total_sale) || 0 }];
  }
  function amountOf(order) {
    const items = itemsOf(order);
    const subtotal = items.reduce((s,i) => s + (Number(i.sale_value) || 0), 0) || Number(order.total_sale) || 0;
    const discount = subtotal * Math.min(100, Math.max(0, Number(order.discount_percent) || 0)) / 100;
    const itemFreight = items.reduce((s,i) => s + (Number(i.freight_value) || 0), 0);
    const freight = itemFreight || Number(order.total_freight) || 0;
    return Math.max(0, subtotal - discount + freight);
  }
  function orderLabel(o) {
    return o.numero_lancamento ?? o.os_number ?? o.order_number ?? 'Não informada';
  }
  function css() {
    if ($('clientBillingCss')) return;
    const style = document.createElement('style');
    style.id = 'clientBillingCss';
    style.textContent = `
      #clientGrid .client{position:relative}
      .client-billing-btn{display:inline-flex;align-items:center;justify-content:center;margin:8px 0 0;padding:8px 11px;border:0;border-radius:8px;background:#173b67;color:#fff;font-size:11px;font-weight:800;cursor:pointer}
      .client-billing-btn:hover{background:#24548c}
      #clientBillingOverlay{position:fixed;inset:0;z-index:2147482500;background:rgba(8,20,36,.62);display:flex;align-items:center;justify-content:center;padding:14px}
      #clientBillingOverlay.hidden{display:none}
      #clientBillingBox{width:min(850px,97vw);max-height:94vh;overflow:auto;background:#fff;border-radius:16px;padding:20px;box-shadow:0 22px 70px rgba(0,0,0,.35);color:#172b46}
      .cb-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:14px}
      .cb-head h2{font-size:21px;margin:0}.cb-muted{color:#64748b;font-size:12px}
      .cb-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
      .cb-field{display:flex;flex-direction:column;gap:5px;min-width:150px;flex:1}
      .cb-field label{font-size:11px;font-weight:800;color:#52657d}
      .cb-field input,.cb-field textarea{border:1px solid #d7e1ec;border-radius:8px;padding:9px;font:inherit;min-width:0}
      .cb-list{display:grid;gap:8px;margin:12px 0}
      .cb-order{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e0e7ef;border-radius:10px;padding:10px}
      .cb-order input{width:17px;height:17px}.cb-order b{font-size:12px}.cb-order small{display:block;color:#64748b;font-size:10px;margin-top:3px}
      .cb-order strong{white-space:nowrap;font-size:13px}
      .cb-total{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #dbe4ee;padding:13px 2px;font-weight:900}
      .cb-total strong{font-size:22px;color:#173b67}
      .cb-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;border-top:1px solid #e2e8f0;padding-top:13px}
      .cb-btn{border:1px solid #d5deea;background:#fff;color:#233b59;border-radius:8px;padding:9px 13px;font-weight:800;cursor:pointer}
      .cb-btn.primary{background:#173b67;color:#fff;border-color:#173b67}
      @media(max-width:600px){#clientBillingBox{padding:13px}.cb-order{grid-template-columns:22px minmax(0,1fr)}.cb-order strong{grid-column:2}.cb-head h2{font-size:18px}}
    `;
    document.head.appendChild(style);
  }
  function ensureModal() {
    if (modal) return;
    css();
    modal = document.createElement('div');
    modal.id = 'clientBillingOverlay';
    modal.className = 'hidden';
    modal.innerHTML = `<section id="clientBillingBox" role="dialog" aria-modal="true" aria-labelledby="cbTitle">
      <header class="cb-head"><div><h2 id="cbTitle">Relatório de cobrança</h2><div class="cb-muted" id="cbClientName"></div></div><button type="button" class="cb-btn" id="cbClose">Fechar ×</button></header>
      <div class="cb-tools"><button type="button" class="cb-btn" id="cbSelectAll">Selecionar todos</button><button type="button" class="cb-btn" id="cbClearAll">Limpar seleção</button><span class="cb-muted" id="cbCount"></span></div>
      <div id="cbOrders" class="cb-list"></div>
      <div class="cb-tools">
        <div class="cb-field"><label for="cbDueDate">VENCIMENTO (OPCIONAL)</label><input id="cbDueDate" type="date"></div>
      </div>
      <div class="cb-field"><label for="cbTerms">CONDIÇÕES DE PAGAMENTO (OPCIONAL)</label><input id="cbTerms" type="text" placeholder="Ex.: Pix, transferência ou boleto"></div>
      <div class="cb-field" style="margin-top:9px"><label for="cbNotes">OBSERVAÇÕES</label><textarea id="cbNotes" rows="2" placeholder="Informações adicionais para o cliente"></textarea></div>
      <div class="cb-total"><span>TOTAL SELECIONADO</span><strong id="cbTotal">R$ 0,00</strong></div>
      <footer class="cb-actions"><button type="button" class="cb-btn" id="cbCancel">Cancelar</button><button type="button" class="cb-btn primary" id="cbGenerate">Gerar PDF / Imprimir</button></footer>
    </section>`;
    document.body.appendChild(modal);
    $('cbClose').onclick = closeModal;
    $('cbCancel').onclick = closeModal;
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    $('cbSelectAll').onclick = () => { modal.querySelectorAll('.cb-check').forEach(x => x.checked = true); refreshTotal(); };
    $('cbClearAll').onclick = () => { modal.querySelectorAll('.cb-check').forEach(x => x.checked = false); refreshTotal(); };
    $('cbGenerate').onclick = generate;
  }
  function closeModal() { if (modal) modal.classList.add('hidden'); }
  function refreshTotal() {
    const selected = [...modal.querySelectorAll('.cb-check:checked')];
    const sum = selected.reduce((s,x) => s + Number(x.dataset.amount || 0), 0);
    $('cbTotal').textContent = money(sum);
    $('cbCount').textContent = selected.length + ' lançamento(s) selecionado(s)';
  }
  function openForClient(clientId) {
    const clients = Array.isArray(window.clients) ? window.clients : [];
    activeClient = clients.find(c => String(c.id) === String(clientId));
    if (!activeClient) return;
    ensureModal();
    const list = clientOrders(activeClient);
    $('cbClientName').textContent = activeClient.name + ' • ' + list.length + ' lançamento(s) encontrado(s)';
    $('cbOrders').innerHTML = list.map((o,index) => {
      const items = itemsOf(o);
      const descriptions = items.map(i => i.description || 'Serviço / produto').filter(Boolean).join(' • ');
      const details = 'OS ' + orderLabel(o) + ' • Entrada ' + dateBR(o.entry_date) + (o.exit_date ? ' • Saída ' + dateBR(o.exit_date) : ' • NÃO ENTREGUE');
      return `<label class="cb-order"><input class="cb-check" type="checkbox" data-index="${index}" data-amount="${amountOf(o)}"><span><b>${esc(details)}</b><small>${esc(descriptions)} • Pagamento: ${esc(o.payment_status || 'Não informado')}</small></span><strong>${money(amountOf(o))}</strong></label>`;
    }).join('') || '<div class="cb-muted">Este cliente ainda não possui lançamentos vinculados.</div>';
    $('cbDueDate').value = '';
    $('cbTerms').value = '';
    $('cbNotes').value = '';
    modal.querySelectorAll('.cb-check').forEach(x => x.addEventListener('change',refreshTotal));
    refreshTotal();
    modal.classList.remove('hidden');
  }
  function printDocument(client, selected, dueDate, terms, notes) {
    const company = window.company || {};
    const isMarmeleiro = String(company.id || '') === 'f3cd9d20-a341-41fe-87fe-c0726a19b65b';
    const isMoura = String(company.id || '') === '48f0eb3d-22ff-4506-9d9c-b6dd4455946b';
    const companyName = company.name || 'RADIADORES MOURA';
    const details = isMarmeleiro
      ? 'CNPJ: 48.903.995/0001-27 • Rua dos Miosótis, 203 • Alvorada • Marmeleiro - PR • CEP: 85615-013<br>Tel.: (46) 9976-0694 • radiadoresmouramarmeleiro@gmail.com'
      : isMoura
        ? 'CNPJ: 65.435.170/0001-44 • Avenida Dom Agostinho José Sartori, 2695 • São Cristóvão • Francisco Beltrão - PR • CEP: 85601-090<br>Tel.: (46) 3524-5810 • radiadoresmoura@gmail.com'
        : '';
    const total = selected.reduce((s,o) => s + amountOf(o), 0);
    const rows = selected.map((o,i) => {
      const desc = itemsOf(o).map(x => x.description || 'Serviço / produto').join(' • ');
      return '<tr><td>'+(i+1)+'</td><td>OS '+esc(orderLabel(o))+'</td><td>'+esc(desc)+'</td><td>'+dateBR(o.entry_date)+'</td><td class="money">'+money(amountOf(o))+'</td></tr>';
    }).join('');
    const issued = dateBR(new Date().toISOString().slice(0,10));
    const due = dueDate ? dateBR(dueDate) : 'Não informado';
    const logo = new URL('8857A320-4E57-4A00-933D-C76434BC6953.png', location.href).href;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>COBRANÇA - ${esc(client.name)} - ${issued.replaceAll('/','-')}</title><style>
      @page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font:12px Arial,Helvetica,sans-serif;color:#172b46;margin:0}
      .sheet{max-width:190mm;margin:auto}.head{display:flex;gap:18px;align-items:center;border-bottom:3px solid #173b67;padding-bottom:13px}
      .logo{width:82px;height:82px;object-fit:contain}.company h1{font-size:21px;margin:0 0 6px;color:#173b67;text-transform:uppercase}.company p{font-size:9px;line-height:1.5;margin:0;color:#52657d}
      h2{font-size:18px;letter-spacing:1px;text-align:center;margin:25px 0 16px}
      .client{border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin-bottom:17px;line-height:1.7}
      .client b{color:#173b67}.meta{display:flex;justify-content:space-between;gap:12px;margin-top:6px;font-size:10px;color:#64748b}
      table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#173b67;color:#fff;text-align:left;font-size:10px;padding:10px 8px}
      td{border-bottom:1px solid #dbe3ec;padding:11px 8px;vertical-align:top}td:first-child{text-align:center;width:7%}.money{text-align:right;white-space:nowrap;font-weight:bold}
      .total{display:flex;justify-content:space-between;align-items:center;background:#edf3f9;border:1px solid #cbd8e6;border-radius:8px;padding:15px;margin-top:14px;font-weight:bold}
      .total strong{font-size:22px;color:#173b67}.payment{margin-top:16px;line-height:1.7}.notes{margin-top:10px;white-space:pre-wrap;line-height:1.6}
      .foot{margin-top:30px;border-top:1px solid #dbe3ec;padding-top:10px;text-align:center;font-size:9px;color:#718096}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><main class="sheet">
      <header class="head"><img class="logo" src="${esc(logo)}"><div class="company"><h1>${esc(companyName)}</h1><p>${details}</p></div></header>
      <h2>RELAÇÃO DE SERVIÇOS PARA COBRANÇA</h2>
      <section class="client"><b>CLIENTE:</b> ${esc(client.name)}<br><b>CPF/CNPJ:</b> ${esc(client.cpf_cnpj || '—')}<br><b>ENDEREÇO:</b> ${esc([client.address,client.city,client.uf].filter(Boolean).join(' - ') || '—')}<div class="meta"><span>EMITIDO EM: ${issued}</span><span>VENCIMENTO: ${due}</span></div></section>
      <table><thead><tr><th>ITEM</th><th>OS</th><th>DESCRIÇÃO DOS SERVIÇOS</th><th>ENTRADA</th><th style="text-align:right">VALOR</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total"><span>TOTAL A PAGAR</span><strong>${money(total)}</strong></div>
      <div class="payment"><b>CONDIÇÕES DE PAGAMENTO:</b> ${esc(terms || 'A combinar')}</div>
      ${notes ? '<div class="notes"><b>OBSERVAÇÕES:</b><br>'+esc(notes)+'</div>' : ''}
      <div class="foot">Documento de conferência e cobrança • ${esc(companyName)}</div>
    </main><script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print()},450)});<\/script></body></html>`;
    const win = window.open('', '_blank');
    if (!win) { alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este aplicativo e tente novamente.'); return; }
    win.document.open(); win.document.write(html); win.document.close();
  }
  function generate() {
    const indexes = [...modal.querySelectorAll('.cb-check:checked')].map(x => Number(x.dataset.index));
    const list = clientOrders(activeClient);
    const selected = indexes.map(i => list[i]).filter(Boolean);
    if (!selected.length) { alert('Selecione pelo menos um lançamento para gerar a cobrança.'); return; }
    const due = $('cbDueDate').value;
    const terms = $('cbTerms').value.trim();
    const notes = $('cbNotes').value.trim();
    printDocument(activeClient, selected, due, terms, notes);
  }
  function decorateClients() {
    const grid = $('clientGrid');
    if (!grid) return;
    grid.querySelectorAll('.client[data-id]').forEach(card => {
      if (card.querySelector('.client-billing-btn')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'client-billing-btn';
      button.textContent = 'Gerar cobrança PDF';
      button.dataset.billingClient = card.dataset.id;
      button.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openForClient(button.dataset.billingClient); });
      card.appendChild(button);
    });
  }
  function init() {
    const grid = $('clientGrid');
    if (!grid || document.documentElement.dataset.clientBillingReady === '1') return;
    document.documentElement.dataset.clientBillingReady = '1';
    decorateClients();
    new MutationObserver(decorateClients).observe(grid, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
})();
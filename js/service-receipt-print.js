/* Notinha de serviço — Radiadores Moura Marmeleiro
   Impressão compacta em A4. Não grava nem altera dados no Supabase. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const dateBR = value => {
    const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? match[3] + '/' + match[2] + '/' + match[1] : (value || '—');
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function findOrder(id) {
    const orders = Array.isArray(window.orders) ? window.orders : [];
    return orders.find(order => String(order.id) === String(id));
  }

  function receiptHtml(order) {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const itemRows = items.length
      ? items.map(item => '<tr><td>' + escapeHtml(item.description || 'Serviço') +
        '</td><td class="right">' + money(item.sale_value) + '</td></tr>').join('')
      : '<tr><td>Serviço</td><td class="right">' + money(order.total_sale) + '</td></tr>';
    const total = order.total_sale != null
      ? Number(order.total_sale) || 0
      : items.reduce((sum, item) => sum + (Number(item.sale_value) || 0), 0);
    const companyName = window.company?.name || 'RADIADORES MOURA MARMELEIRO';
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>Notinha de serviço</title><style>
      @page{size:A4;margin:10mm}
      *{box-sizing:border-box}
      body{margin:0;font:11px Arial,Helvetica,sans-serif;color:#111}
      .receipt{width:78mm;max-width:100%;padding:4mm;border:1px dashed #777}
      h1{font-size:14px;text-align:center;margin:0 0 3px;text-transform:uppercase}
      .subtitle{text-align:center;font-size:10px;margin-bottom:8px}
      .rule{border-top:1px dashed #555;margin:7px 0}
      .line{margin:4px 0;overflow-wrap:anywhere}
      .label{font-weight:bold}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th,td{padding:4px 0;text-align:left;vertical-align:top;border-bottom:1px dotted #bbb}
      th{font-size:10px}.right{text-align:right;white-space:nowrap;padding-left:5px}
      .total{display:flex;justify-content:space-between;gap:8px;font-weight:bold;font-size:13px;margin-top:8px}
      .thanks{text-align:center;font-size:10px;margin-top:10px}
      .print-hint{font-size:9px;color:#555;text-align:center;margin-top:5px}
      @media print{.receipt{break-inside:avoid}}
      </style></head><body><main class="receipt">
      <h1>${escapeHtml(companyName)}</h1><div class="subtitle">COMPROVANTE DE SERVIÇO</div>
      <div class="rule"></div>
      <div class="line"><span class="label">OS / Pedido:</span> ${escapeHtml(order.numero_lancamento || order.pedido || '—')}</div>
      <div class="line"><span class="label">Entrada:</span> ${escapeHtml(dateBR(order.entry_date))}</div>
      <div class="line"><span class="label">Saída:</span> ${escapeHtml(order.exit_date ? dateBR(order.exit_date) : 'Não entregue')}</div>
      <div class="line"><span class="label">Cliente:</span> ${escapeHtml(order.client_name || 'Não informado')}</div>
      ${order.vehicle_make_model ? '<div class="line"><span class="label">Veículo:</span> ' + escapeHtml(order.vehicle_make_model) + '</div>' : ''}
      ${order.plate ? '<div class="line"><span class="label">Placa:</span> ' + escapeHtml(order.plate) + '</div>' : ''}
      <div class="rule"></div><table><thead><tr><th>Descrição</th><th class="right">Valor</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="total"><span>TOTAL</span><span>${money(total)}</span></div>
      ${order.payment_status ? '<div class="line" style="margin-top:7px"><span class="label">Pagamento:</span> ' + escapeHtml(order.payment_status) + '</div>' : ''}
      ${order.notes ? '<div class="line" style="margin-top:7px"><span class="label">Observações:</span> ' + escapeHtml(order.notes) + '</div>' : ''}
      <div class="rule"></div><div class="thanks">Obrigado pela preferência!</div>
      <div class="print-hint">Radiadores Moura Marmeleiro</div>
      </main><script>window.onload=function(){setTimeout(function(){window.focus();window.print()},250)};<\/script></body></html>`;
  }

  function printServiceReceipt(id) {
    const order = findOrder(id);
    if (!order) {
      if (typeof window.toast === 'function') window.toast('Não encontrei este lançamento para imprimir.');
      else alert('Não encontrei este lançamento para imprimir.');
      return;
    }
    // Iframe evita depender da abertura de uma nova janela após salvar o formulário.
    let frame = document.getElementById('serviceReceiptPrintFrame');
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.id = 'serviceReceiptPrintFrame';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(receiptHtml(order));
    doc.close();
    frame.onload = () => {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); }
      catch (error) { console.error('Falha ao imprimir notinha:', error); }
      setTimeout(() => frame.remove(), 1500);
    };
  }
  window.printServiceReceipt = printServiceReceipt;

  function addButton(parent, id, label, className) {
    if (!parent || !id || parent.querySelector(':scope > [data-receipt-print]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className || 'btn';
    button.dataset.receiptPrint = id;
    button.textContent = label || '🖨 Imprimir notinha';
    button.title = 'Imprimir comprovante compacto em papel A4';
    button.style.cssText = 'font-size:11px;padding:7px 10px;white-space:nowrap';
    parent.appendChild(button);
  }

  function decorateLaunches() {
    const list = $('launchList');
    if (!list) return;
    list.querySelectorAll('.launch[data-id]').forEach(card => {
      let actions = card.querySelector('.receipt-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'receipt-actions';
        actions.style.cssText = 'display:flex;justify-content:flex-end;margin-top:7px';
        card.appendChild(actions);
      }
      addButton(actions, card.dataset.id);
    });
  }

  function decorateServices() {
    const list = $('allServicesList');
    if (!list) return;
    list.querySelectorAll('[data-order-id]').forEach(record => {
      const id = record.dataset.orderId;
      if (!id) return;
      const head = record.querySelector('.os-final-record-head,.service-order-top,.service-os-record-head') || record;
      addButton(head, id, '🖨 Notinha', 'btn');
    });
  }

  function addSaveAndPrintButton() {
    const form = $('order');
    if (!form || $('saveAndPrintReceipt')) return;
    const submit = form.querySelector('button[type="submit"]');
    if (!submit) return;
    const button = document.createElement('button');
    button.type = 'submit';
    button.id = 'saveAndPrintReceipt';
    button.className = 'btn';
    button.textContent = '🖨 Salvar e imprimir';
    button.title = 'Salvar o lançamento e abrir a notinha para impressão';
    submit.parentElement.insertBefore(button, submit);
  }

  function bind() {
    addSaveAndPrintButton();
    decorateLaunches();
    decorateServices();

    const form = $('order');
    if (form && form.dataset.receiptPrintBound !== '1') {
      form.dataset.receiptPrintBound = '1';
      form.addEventListener('click', event => {
        const button = event.target.closest('#saveAndPrintReceipt');
        if (button) window.__printReceiptAfterSave = true;
      }, true);
      form.addEventListener('submit', event => {
        if (event.submitter?.id === 'saveAndPrintReceipt') window.__printReceiptAfterSave = true;
      }, true);
    }

    document.addEventListener('click', event => {
      const button = event.target.closest('[data-receipt-print]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      printServiceReceipt(button.dataset.receiptPrint);
    }, true);
  }

  function install() {
    bind();
    ['launchList', 'allServicesList'].forEach(id => {
      const node = $(id);
      if (node && !node.dataset.receiptObserver) {
        node.dataset.receiptObserver = '1';
        new MutationObserver(() => {
          if (id === 'launchList') decorateLaunches();
          else decorateServices();
        }).observe(node, { childList: true, subtree: true });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
  let attempts = 0;
  const timer = setInterval(() => { install(); if (++attempts >= 40) clearInterval(timer); }, 500);
})();
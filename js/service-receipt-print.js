/* Notinha de serviço — Radiadores Moura Marmeleiro
   Impressão em meia folha A4 (formato A5). Não grava nem altera dados no Supabase. */
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

  function receiptHtml(order, paymentConditions = [], extraObservations = '') {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const client = (Array.isArray(window.clients) ? window.clients : []).find(c => String(c.id) === String(order.client_id)) || {};
    const subtotal = items.reduce((sum, item) => sum + (Number(item.sale_value) || 0), 0) || Number(order.total_sale) || 0;
    const discountRate = Math.min(100, Math.max(0, Number(order.discount_percent) || 0)) / 100;
    const discount = subtotal * discountRate;
    const hasItemFreight = items.some(item => Number(item.freight_value) || 0);
    const freight = hasItemFreight ? items.reduce((sum, item) => sum + (Number(item.freight_value) || 0), 0) : Number(order.total_freight) || 0;
    const total = subtotal - discount + freight;
    const companyName = window.company?.name || 'RADIADORES MOURA MARMELEIRO';
    const isMarmeleiro = String(window.company?.id || '') === 'f3cd9d20-a341-41fe-87fe-c0726a19b65b';
    const isRadiadoresMoura = String(window.company?.id || '') === '48f0eb3d-22ff-4506-9d9c-b6dd4455946b';
    const companyHeaderDetails = isMarmeleiro
      ? '<div class="small">CNPJ: 48.903.995/0001-27</div><div class="small">Rua dos Miosótis, 203 • Alvorada • Marmeleiro - PR • CEP: 85615-013</div><div class="small">Tel.: (46) 9976-0694 • E-mail: radiadoresmouramarmeleiro@gmail.com</div>'
      : isRadiadoresMoura
        ? '<div class="small">CNPJ: 65.435.170/0001-44</div><div class="small">Avenida Dom Agostinho José Sartori, 2695 • São Cristóvão</div><div class="small">Francisco Beltrão - PR • CEP: 85601-090</div><div class="small">Tel.: (46) 3524-5810 • E-mail: radiadoresmoura@gmail.com</div>'
        : '';
    const logoUrl = new URL('8857A320-4E57-4A00-933D-C76434BC6953.png', window.location.href).href;
    const today = new Date();
    const issued = String(today.getDate()).padStart(2,'0')+'/'+String(today.getMonth()+1).padStart(2,'0')+'/'+today.getFullYear();
    const validityDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const validUntil = String(validityDate.getDate()).padStart(2,'0')+'/'+String(validityDate.getMonth()+1).padStart(2,'0')+'/'+validityDate.getFullYear();
    const number = order.numero_lancamento || order.pedido || '—';
    const clientName = client.razao_social || client.name || order.client_name || 'Não informado';
    const phone = client.phone || client.whatsapp || '';
    const address = [client.address, client.city, client.uf].filter(Boolean).join(' - ');
    const itemRows = items.map((item,index) => '<tr><td class="center">'+(index+1)+'</td><td>'+escapeHtml(item.description || 'Serviço / produto')+'</td><td class="center">1</td><td class="right">'+money(item.sale_value)+'</td></tr>').join('');
    const blankRows = Array.from({length:Math.max(0,10-items.length)},()=>'<tr class="blank"><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('');
    const notes = escapeHtml([order.notes || '', extraObservations || ''].filter(Boolean).join('\n'));\n    const paymentText = paymentConditions.length ? paymentConditions.map(escapeHtml).join(' • ') : 'A combinar';
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>Orçamento ${escapeHtml(number)}</title><style>
      @page{size:A4 portrait;margin:9mm}*{box-sizing:border-box}
      body{margin:0;font:11px Arial,Helvetica,sans-serif;color:#111}
      .sheet{width:100%;max-width:190mm;margin:0 auto}
      .company{min-height:37mm;border:1.5px solid #243e5a;border-bottom:3px solid #243e5a;display:flex;align-items:center;padding:5mm 6mm;gap:7mm;background:#fff}
      .logo{width:32mm;height:32mm;object-fit:contain;flex:0 0 32mm}
      .company-info{flex:1;text-align:left;line-height:1.5}
      .company-info h1{font-size:20px;letter-spacing:.35px;color:#183653;margin:0 0 3px;text-transform:uppercase;font-weight:800}
      .company-info .small{font-size:9.5px;color:#263746;line-height:1.45}
      .meta{display:grid;grid-template-columns:1.15fr 1fr 1fr;border:1.5px solid #243e5a;border-top:0;text-align:center;align-items:stretch}
      .meta div{padding:6px 4px;border-right:1px solid #9aa8b5;display:flex;flex-direction:column;justify-content:center;gap:2px}
      .meta div:last-child{border:0}
      .meta .quote-number strong{font-size:17px;line-height:1.1;color:#183653;font-weight:800}
      .meta .quote-number span{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.35px}
      .meta .meta-date{font-size:10px;font-weight:600;color:#263746}
      .section-title{border:2px solid #222;border-top:0;text-align:center;font-weight:bold;letter-spacing:2px;padding:5px}
      .client{border:2px solid #222;border-top:0}
      .client-row{display:grid;grid-template-columns:95px 1fr;border-bottom:1px solid #555;min-height:20px}
      .client-row:last-child{border:0}.client-row b{padding:4px 6px;border-right:1px solid #555}
      .client-row span{padding:4px 6px}
      .items{width:100%;border-collapse:collapse;border:2px solid #222;border-top:0}
      .items th,.items td{border:1px solid #333;padding:5px 6px;height:22px}
      .items th{font-weight:bold;text-align:center;background:#f4f4f4}
      .items .center{text-align:center}.items .right{text-align:right;white-space:nowrap}.items .blank td{height:17px}
      .totals{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border:2px solid #222;border-top:0}
      .totals div{text-align:center;padding:8px 4px;border-right:1px solid #222;font-weight:bold}
      .totals div:last-child{border:0}.totals strong{display:block;margin-top:3px}
      .observations{border:2px solid #222;border-top:0;min-height:39mm}
      .observations-title{text-align:center;letter-spacing:2px;font-weight:bold;padding:6px;border-bottom:1px solid #222}
      .observations-body{padding:9px;line-height:1.65;white-space:pre-wrap;min-height:30mm}
      .signatures{display:flex;justify-content:space-between;gap:20px;margin-top:15mm;text-align:center}
      .signature{width:46%;border-top:1px solid #333;padding-top:5px;font-weight:bold}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{break-inside:avoid}}
      </style></head><body><main class="sheet">
      <header class="company"><img class="logo" src="${escapeHtml(logoUrl)}" alt="Logo"><div class="company-info">
        <h1>${escapeHtml(companyName)}</h1>${companyHeaderDetails}
      </div></header>
      <div class="meta"><div class="quote-number"><span>Orçamento nº</span><strong>${escapeHtml(number)}</strong></div><div class="meta-date"><b>Emitido em</b><span>${issued}</span></div><div class="meta-date"><b>Válido até</b><span>${validUntil}</span></div></div>
      <div class="section-title">CLIENTE</div><section class="client">
        <div class="client-row"><b>NOME</b><span>${escapeHtml(clientName)}</span></div>
        <div class="client-row"><b>TELEFONE</b><span>${escapeHtml(phone || '—')}</span></div>
        <div class="client-row"><b>CPF/CNPJ</b><span>${escapeHtml(client.cpf_cnpj || '—')}</span></div>
        <div class="client-row"><b>EMAIL</b><span>${escapeHtml(client.email || '—')}</span></div>
        <div class="client-row"><b>ENDEREÇO</b><span>${escapeHtml(address || '—')}${client.cep ? ' • CEP: '+escapeHtml(client.cep) : ''}</span></div>
        ${order.vehicle_make_model || order.plate ? '<div class="client-row"><b>VEÍCULO</b><span>'+escapeHtml([order.vehicle_make_model,order.plate].filter(Boolean).join(' • '))+'</span></div>' : ''}
      </section>
      <div class="section-title">ORÇAMENTO</div>
      <table class="items"><thead><tr><th style="width:8%">ITEM</th><th>PRODUTO / SERVIÇO</th><th style="width:12%">QUANT.</th><th style="width:20%">VALOR</th></tr></thead><tbody>${itemRows}${blankRows}</tbody></table>
      <div class="totals"><div>SUBTOTAL<strong>${money(subtotal)}</strong></div><div>DESCONTO<strong>${money(discount)}</strong></div><div>ACRÉSCIMO<strong>${money(freight)}</strong></div><div>TOTAL<strong>${money(total)}</strong></div></div>
      <section class="observations"><div class="observations-title">OBSERVAÇÕES</div><div class="observations-body"><b>Formas de pagamento:</b> ${paymentText}
      ${notes ? '\n'+notes : ''}
      ${freight ? '\n<b>Acréscimo / frete:</b> '+money(freight)+'.' : ''}
      </div></section>
      <footer class="signatures"><div class="signature">${escapeHtml(companyName)}</div><div class="signature">${escapeHtml(clientName)}</div></footer>
      </main><script>window.onload=function(){setTimeout(function(){window.focus();window.print()},400)};<\\/script></body></html>`;
  }

  const PAYMENT_OPTIONS = [
    'PIX',
    'Dinheiro',
    'Cartão de débito',
    'Cartão de crédito — até 3x sem juros',
    'Cartão de crédito — 4x a 12x com juros',
    'Transferência bancária',
    'A combinar'
  ];

  function showPrintOptions(order) {
    return new Promise(resolve => {
      const old = document.getElementById('receiptPaymentDialog');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = 'receiptPaymentDialog';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,sans-serif';
      const options = PAYMENT_OPTIONS.map((option, index) =>
        '<label style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid #eee;font-size:14px;cursor:pointer"><input type="checkbox" value="' + escapeHtml(option) + '" ' + (index === 0 ? '' : '') + ' style="width:17px;height:17px"> <span>' + escapeHtml(option) + '</span></label>'
      ).join('');
      overlay.innerHTML = '<section role="dialog" aria-modal="true" style="background:#fff;color:#17212b;width:min(100%,480px);max-height:90vh;overflow:auto;border-radius:12px;padding:22px;box-shadow:0 12px 40px #0005">' +
        '<h2 style="margin:0 0 6px;font-size:20px">Condições de pagamento</h2>' +
        '<p style="margin:0 0 14px;color:#596675;font-size:13px">Selecione uma ou mais formas para aparecerem no orçamento.</p>' +
        '<div class="receipt-payment-options">' + options + '</div>' +
        '<label style="display:block;font-size:13px;font-weight:700;margin:18px 0 7px">Observações adicionais</label>' +
        '<textarea id="receiptExtraObservations" rows="4" placeholder="Digite uma observação específica para este orçamento..." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd3dc;border-radius:7px;font:14px Arial;resize:vertical"></textarea>' +
        '<div style="display:flex;justify-content:flex-end;gap:9px;margin-top:18px;flex-wrap:wrap">' +
        '<button type="button" data-action="cancel" style="padding:10px 16px;border:1px solid #bbc4ce;background:#fff;border-radius:7px;cursor:pointer">Cancelar</button>' +
        '<button type="button" data-action="print" style="padding:10px 18px;border:0;background:#243e5a;color:#fff;border-radius:7px;font-weight:700;cursor:pointer">Continuar e imprimir</button></div></section>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', event => {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'cancel' || event.target === overlay) {
          overlay.remove();
          resolve(null);
        } else if (action === 'print') {
          const selected = Array.from(overlay.querySelectorAll('.receipt-payment-options input:checked')).map(input => input.value);
          const observations = overlay.querySelector('#receiptExtraObservations').value.trim();
          overlay.remove();
          resolve({ paymentConditions: selected, extraObservations: observations });
        }
      });
      overlay.querySelector('textarea').focus();
    });
  }

  async function printServiceReceipt(id) {
    const order = findOrder(id);
    if (!order) {
      if (typeof window.toast === 'function') window.toast('Não encontrei este lançamento para imprimir.');
      else alert('Não encontrei este lançamento para imprimir.');
      return;
    }
    const printOptions = await showPrintOptions(order);\n    if (!printOptions) return;\n    // Iframe evita depender da abertura de uma nova janela após salvar o formulário.
    let frame = document.getElementById('serviceReceiptPrintFrame');
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.id = 'serviceReceiptPrintFrame';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(receiptHtml(order, printOptions.paymentConditions, printOptions.extraObservations));
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
    button.textContent = label || '🖨 Imprimir orçamento';
    button.title = 'Imprimir orçamento no modelo A4';
    button.style.cssText = 'font-size:11px;padding:7px 10px;white-space:nowrap';
    parent.appendChild(button);
  }

  function decorateLaunches() {
    // A impressão fica dentro do popup de edição, nunca nos cartões.
    document.querySelectorAll('#launchList .receipt-actions, #launchList [data-receipt-print]').forEach(node => node.remove());
  }

  function decorateServices() {
    // Remove botões antigos dos cartões da lista Todos os Serviços.
    document.querySelectorAll('#allServicesList [data-receipt-print]').forEach(node => node.remove());
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
    button.textContent = '🖨 Salvar e imprimir orçamento';
    button.title = 'Salvar o lançamento e abrir o orçamento para impressão';
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
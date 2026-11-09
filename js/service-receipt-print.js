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
    const number = order.numero_lancamento ?? order.os_number ?? order.order_number ?? order.id ?? '—';
    const clientName = order.client_name || client.razao_social || client.name || 'Não informado';
    const phone = client.phone || client.whatsapp || '';
    const address = [client.address, client.city, client.uf].filter(Boolean).join(' - ');
    const itemRows = items.map((item,index) => '<tr><td class="center">'+(index+1)+'</td><td>'+escapeHtml(item.description || 'Serviço / produto')+'</td><td class="center">1</td><td class="right">'+money(item.sale_value)+'</td></tr>').join('');
    const blankRows = Array.from({length:Math.max(0,10-items.length)},()=>'<tr class="blank"><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('');
    const notes = escapeHtml([order.notes || '', extraObservations || ''].filter(Boolean).join('\n'));
    const paymentText = paymentConditions.length ? paymentConditions.map(escapeHtml).join(' • ') : 'A combinar';
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


  async function receiptPdfData(order, paymentConditions = [], extraObservations = '') {
    const JsPDF = window.jspdf?.jsPDF;
    if (!JsPDF) throw new Error('A biblioteca de PDF não foi carregada. Atualize o aplicativo e tente novamente.');
    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const client = (Array.isArray(window.clients) ? window.clients : []).find(x => String(x.id) === String(order.client_id)) || {};
    const subtotal = items.reduce((sum, item) => sum + (Number(item.sale_value) || 0), 0) || Number(order.total_sale) || 0;
    const discount = subtotal * Math.min(100, Math.max(0, Number(order.discount_percent) || 0)) / 100;
    const hasItemFreight = items.some(item => Number(item.freight_value) || 0);
    const freight = hasItemFreight ? items.reduce((sum, item) => sum + (Number(item.freight_value) || 0), 0) : Number(order.total_freight) || 0;
    const total = subtotal - discount + freight;
    const companyName = window.company?.name || 'RADIADORES MOURA';
    const companyId = String(window.company?.id || '');
    const companyLines = companyId === 'f3cd9d20-a341-41fe-87fe-c0726a19b65b'
      ? ['CNPJ: 48.903.995/0001-27', 'Rua dos Miosótis, 203 • Alvorada • Marmeleiro - PR • CEP: 85615-013', 'Tel.: (46) 9976-0694 • radiadoresmouramarmeleiro@gmail.com']
      : companyId === '48f0eb3d-22ff-4506-9d9c-b6dd4455946b'
        ? ['CNPJ: 65.435.170/0001-44', 'Avenida Dom Agostinho José Sartori, 2695 • São Cristóvão', 'Francisco Beltrão - PR • CEP: 85601-090', 'Tel.: (46) 3524-5810 • radiadoresmoura@gmail.com']
        : [];
    const number = order.numero_lancamento ?? order.os_number ?? order.order_number ?? order.id ?? '—';
    const clientName = order.client_name || client.razao_social || client.name || 'Não informado';
    const paymentText = paymentConditions.length ? paymentConditions.join(' • ') : 'A combinar';
    const notes = [order.notes || '', extraObservations || ''].filter(Boolean).join('\n');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;
    const navy = [31, 55, 82];
    const blue = [55, 91, 126];
    const ink = [45, 52, 60];
    const muted = [105, 115, 125];
    const pale = [241, 245, 249];
    const border = [220, 226, 232];
    let y = 15;
    const fmt = value => String(value ?? '—');
    const line = (x1, y1, x2, y2, color = border, width = 0.25) => {
      doc.setDrawColor(...color); doc.setLineWidth(width); doc.line(x1, y1, x2, y2);
    };
    const txt = (value, x, yy, size = 9, style = 'normal', color = ink, opts = {}) => {
      doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
      doc.text(fmt(value), x, yy, opts);
    };
    const wrap = (value, width, size = 8, style = 'normal') => {
      doc.setFont('helvetica', style); doc.setFontSize(size);
      return doc.splitTextToSize(fmt(value), width);
    };
    const moneyText = value => money(Number(value) || 0);
    const ensure = height => {
      if (y + height > pageH - 22) {
        doc.addPage();
        y = 18;
        line(margin, y, pageW - margin, y, navy, 0.8);
        y += 8;
      }
    };
    const section = title => {
      ensure(11);
      doc.setFillColor(...pale);
      doc.roundedRect(margin, y, contentW, 7, 1.2, 1.2, 'F');
      txt(title.toUpperCase(), margin + 3, y + 4.7, 8, 'bold', navy);
      y += 11;
    };
    const field = (label, value, x, yy, width, valueSize = 8.5) => {
      txt(label.toUpperCase(), x, yy, 6.5, 'bold', muted);
      const lines = wrap(value || '—', width, valueSize);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(valueSize); doc.setTextColor(...ink);
      doc.text(lines.slice(0, 2), x, yy + 5);
    };

    // Cabeçalho editorial limpo: sem faixa azul, logo original e dados completos da unidade.
    let logoData = null;
    try {
      const response = await fetch(new URL('8857A320-4E57-4A00-933D-C76434BC6953.png', window.location.href).href);
      if (response.ok) {
        const blob = await response.blob();
        logoData = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch (_) {}

    const companyObj = window.company || {};
    const dynamicCompanyLines = [
      companyObj.cnpj || companyObj.document || companyObj.cpf_cnpj ? 'CNPJ: ' + (companyObj.cnpj || companyObj.document || companyObj.cpf_cnpj) : '',
      companyObj.address || companyObj.endereco || '',
      [companyObj.city || companyObj.cidade, companyObj.uf || companyObj.state, companyObj.cep ? 'CEP: ' + companyObj.cep : ''].filter(Boolean).join(' • '),
      [companyObj.phone || companyObj.telefone, companyObj.email].filter(Boolean).join(' • ')
    ].filter(Boolean);
    const knownCompanyLines = companyLines.length ? companyLines : (
      dynamicCompanyLines.length ? dynamicCompanyLines :
      ['CNPJ: 48.903.995/0001-27', 'Rua dos Miosótis, 203 • Alvorada • Marmeleiro - PR • CEP: 85615-013', 'Tel.: (46) 9976-0694 • radiadoresmouramarmeleiro@gmail.com']
    );

    const headerTop = y;
    if (logoData) {
      try {
        // Logo em proporção original, sem moldura ou recorte.
        doc.addImage(logoData, 'PNG', margin, headerTop + 1, 31, 31, undefined, 'FAST');
      } catch (_) {}
    }
    const companyX = margin + (logoData ? 39 : 2);
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...navy);
    doc.text(companyName.toUpperCase(), companyX, headerTop + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...blue);
    doc.text('RADIADORES • AR-CONDICIONADO • SERVIÇOS AUTOMOTIVOS', companyX, headerTop + 15);

    const infoX = companyX;
    const infoW = pageW - margin - infoX;
    const infoFont = 7.2;
    const infoLines = knownCompanyLines.slice(0, 4);
    infoLines.forEach((lineText, i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(infoFont);
      doc.setTextColor(...muted);
      const wrapped = doc.splitTextToSize(String(lineText), infoW);
      doc.text(wrapped.slice(0, 1), infoX, headerTop + 21 + i * 3.8);
    });
    // Filete fino apenas para separar o cabeçalho do conteúdo.
    line(margin, headerTop + 36, pageW - margin, headerTop + 36, navy, 0.55);
    y = headerTop + 43;

    // Faixa de identificação da ordem de serviço e datas.
    const serviceDates = [
      ['ORDEM DE SERVIÇO Nº', String(number)],
      ['ENTRADA', dateBR(order.entry_date) || '—']
    ];
    if (order.exit_date) serviceDates.push(['SAÍDA', dateBR(order.exit_date)]);
    const cellW = contentW / serviceDates.length;
    serviceDates.forEach((entry, i) => {
      const x = margin + i * cellW;
      doc.setFillColor(...(i === 0 ? [232, 238, 245] : pale));
      doc.roundedRect(x + (i ? 1 : 0), y, cellW - 1, 17, 1.2, 1.2, 'F');
      txt(entry[0], x + 4, y + 5.5, 6.5, 'bold', muted);
      txt(entry[1], x + 4, y + 12.5, i === 0 ? 12 : 9, 'bold', navy);
    });
    y += 24;

    section('Dados do cliente');
    const half = (contentW - 12) / 2;
    const address = [client.address, client.city, client.uf].filter(Boolean).join(' - ');
    const vehicle = [order.vehicle_make_model, order.plate].filter(Boolean).join(' • ');
    const rows = [
      [['CLIENTE', clientName], ['TELEFONE', client.phone || client.whatsapp || '—']],
      [['CPF / CNPJ', client.cpf_cnpj || '—'], ['E-MAIL', client.email || '—']],
      [['ENDEREÇO', [address, client.cep ? 'CEP: ' + client.cep : ''].filter(Boolean).join(' • ') || '—'], ['VEÍCULO', vehicle || '—']]
    ];
    rows.forEach((row, index) => {
      ensure(16);
      const yy = y;
      field(row[0][0], row[0][1], margin + 1, yy + 2, half, index === 0 ? 8.5 : 8);
      field(row[1][0], row[1][1], margin + half + 10, yy + 2, half, 8);
      line(margin, yy + 14, margin + contentW, yy + 14);
      y += 17;
    });
    y += 2;

    section('Serviços e produtos');
    const cols = [11, 105, 20, contentW - 136];
    const heads = ['#', 'DESCRIÇÃO', 'QTD.', 'VALOR'];
    doc.setFillColor(...navy);
    doc.roundedRect(margin, y, contentW, 9, 1, 1, 'F');
    let x = margin;
    heads.forEach((head, i) => {
      txt(head, x + 2.5, y + 5.8, 7, 'bold', [255, 255, 255]);
      x += cols[i];
    });
    y += 9;
    const pdfItems = items.length ? items : [{ description: 'Serviços / produtos', sale_value: order.total_sale || 0 }];
    pdfItems.forEach((item, index) => {
      const description = item.description || item.name || 'Serviço / produto';
      const descLines = wrap(description, cols[1] - 5, 8);
      const rowH = Math.max(10, descLines.length * 4 + 5);
      ensure(rowH + 1);
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentW, rowH, 'F');
      }
      txt(index + 1, margin + 3, y + 6.5, 8, 'normal', muted);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...ink);
      doc.text(descLines, margin + cols[0] + 2, y + 6.5);
      txt('1', margin + cols[0] + cols[1] + 7, y + 6.5, 8);
      txt(moneyText(item.sale_value), margin + cols[0] + cols[1] + cols[2] + 2, y + 6.5, 8, 'bold');
      line(margin, y + rowH, margin + contentW, y + rowH);
      y += rowH;
    });
    y += 5;

    ensure(25);
    const summaryW = contentW / 4;
    const summary = [
      ['SUBTOTAL', moneyText(subtotal)],
      ['DESCONTO', moneyText(discount)],
      ['ACRÉSCIMOS', moneyText(freight)],
      ['TOTAL DO ORÇAMENTO', moneyText(total)]
    ];
    summary.forEach((entry, i) => {
      const x = margin + i * summaryW;
      const isTotal = i === 3;
      doc.setFillColor(...(isTotal ? navy : pale));
      doc.roundedRect(x + 0.5, y, summaryW - 1, 20, 1.5, 1.5, 'F');
      txt(entry[0], x + 3, y + 6, isTotal ? 6 : 6.5, 'bold', isTotal ? [220, 232, 244] : muted);
      txt(entry[1], x + 3, y + 14, isTotal ? 10 : 8.5, 'bold', isTotal ? [255, 255, 255] : ink);
    });
    y += 27;

    section('Pagamento e observações');
    const blocks = [['FORMAS DE PAGAMENTO', paymentText]];
    if (notes) blocks.push(['OBSERVAÇÕES', notes]);
    if (freight) blocks.push(['FRETE / ACRÉSCIMOS', moneyText(freight)]);
    blocks.forEach((block, index) => {
      const lines = wrap(block[1], contentW - 8, 8);
      const blockH = Math.max(9, lines.length * 4 + 4);
      ensure(blockH + 2);
      txt(block[0], margin + 3, y + 3, 6.5, 'bold', muted);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...ink);
      doc.text(lines, margin + 3, y + 8);
      y += blockH + 3;
      if (index < blocks.length - 1) line(margin + 3, y, margin + contentW - 3, y);
    });
    y += 4;

    // Assinaturas discretas no rodapé.
    ensure(18);
    const sigW = (contentW - 18) / 2;
    line(margin, y, margin + sigW, y, [150, 160, 170], 0.35);
    line(margin + sigW + 18, y, margin + contentW, y, [150, 160, 170], 0.35);
    txt(companyName, margin, y + 5, 7, 'bold', navy);
    txt(clientName, margin + sigW + 18, y + 5, 7, 'bold', navy);
    txt('RESPONSÁVEL', margin, y + 9, 6, 'normal', muted);
    txt('CLIENTE', margin + sigW + 18, y + 9, 6, 'normal', muted);

    // Rodapé em todas as páginas.
    const pages = doc.internal.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      line(margin, pageH - 14, pageW - margin, pageH - 14, border, 0.3);
      txt(companyName, margin, pageH - 8, 6.5, 'normal', muted);
      txt('ORDEM DE SERVIÇO Nº ' + number + '  •  ' + page + '/' + pages, pageW - margin, pageH - 8, 6.5, 'normal', muted, { align: 'right' });
    }
    return doc;
  }

  function receiptFilename(order) {
    const client = (Array.isArray(window.clients) ? window.clients : []).find(x => String(x.id) === String(order.client_id)) || {};
    const clientName = order.client_name || client.razao_social || client.name || 'cliente';
    const number = order.numero_lancamento ?? order.os_number ?? order.order_number ?? order.id ?? '—';
    const safePart = value => String(value ?? '').normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
    return 'ORCAMENTO-' + (safePart(clientName) || 'CLIENTE') + '-OS-' + (safePart(number) || 'SEM-NUMERO') + '.pdf';
  }

  async function sendReceiptWhatsApp(order, paymentConditions, extraObservations) {
    const number = order.numero_lancamento ?? order.pedido ?? order.os_number ?? order.order_number ?? order.id ?? '—';
    const client = (Array.isArray(window.clients) ? window.clients : []).find(x => String(x.id) === String(order.client_id)) || {};
    const clientName = order.client_name || client.razao_social || client.name || 'cliente';
    const message = 'Olá, ' + clientName + '! Segue o orçamento nº ' + number + ' da ' + (window.company?.name || 'Radiadores Moura') + '.';
    try {
      const doc = await receiptPdfData(order, paymentConditions, extraObservations);
      const filename = receiptFilename(order);
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      // Compartilhamento nativo: o usuário escolhe WhatsApp no menu do próprio dispositivo.
      // Não abre WhatsApp Web, não cria abas e não tenta acessar conversas automaticamente.
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Orçamento ' + number, text: message });
          if (typeof window.toast === 'function') window.toast('Compartilhamento concluído ou encaminhado pelo menu do dispositivo.');
          return;
        } catch (shareError) {
          if (shareError?.name === 'AbortError') return;
          console.warn('Compartilhamento nativo indisponível:', shareError);
        }
      }

      // Alternativa sem abrir qualquer aba: baixa o PDF para anexar manualmente no WhatsApp.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      const msg = 'PDF baixado. Este navegador não oferece compartilhamento direto de arquivos. Abra o WhatsApp manualmente e anexe o PDF baixado.';
      if (typeof window.toast === 'function') window.toast(msg);
      else alert(msg);
    } catch (error) {
      console.error('Erro ao gerar PDF para compartilhamento:', error);
      alert('Não foi possível gerar o PDF: ' + (error?.message || error));
    }
  }

  function showPrintOptions(order) {
    return new Promise(resolve => {
      const old = document.getElementById('receiptPaymentDialog');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = 'receiptPaymentDialog';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,sans-serif';
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
        '<button type="button" data-action="print" style="padding:10px 18px;border:0;background:#243e5a;color:#fff;border-radius:7px;font-weight:700;cursor:pointer">Continuar e imprimir</button>' +
        '<button type="button" data-action="whatsapp" style="padding:10px 18px;border:0;background:#168447;color:#fff;border-radius:7px;font-weight:700;cursor:pointer">Enviar PDF pelo WhatsApp</button></div></section>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', event => {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'cancel' || event.target === overlay) {
          overlay.remove();
          resolve(null);
        } else if (action === 'print' || action === 'whatsapp') {
          const selected = Array.from(overlay.querySelectorAll('.receipt-payment-options input:checked')).map(input => input.value);
          const observations = overlay.querySelector('#receiptExtraObservations').value.trim();
          if (action === 'whatsapp') {
            const button = overlay.querySelector('[data-action="whatsapp"]');
            button.disabled = true;
            button.textContent = 'Gerando PDF...';
            sendReceiptWhatsApp(order, selected, observations).finally(() => {
              if (button.isConnected) { button.disabled = false; button.textContent = 'Enviar PDF pelo WhatsApp'; }
            });
          } else {
            overlay.remove();
            resolve({ paymentConditions: selected, extraObservations: observations });
          }
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
    const printOptions = await showPrintOptions(order);
    if (!printOptions) return;
    let frame;
    let objectUrl;
    try {
      // Impressão e WhatsApp geram o mesmo arquivo PDF, com o mesmo layout e conteúdo.
      const pdf = await receiptPdfData(order, printOptions.paymentConditions, printOptions.extraObservations);
      const blob = pdf.output('blob');
      objectUrl = URL.createObjectURL(blob);
      frame = document.getElementById('serviceReceiptPrintFrame');
      if (frame) frame.remove();
      frame = document.createElement('iframe');
      frame.id = 'serviceReceiptPrintFrame';
      frame.title = receiptFilename(order);
      frame.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;background:#fff;z-index:2147483000;opacity:.01;pointer-events:none';
      document.body.appendChild(frame);
      let printed = false;
      const startPrint = () => {
        if (printed || !frame?.isConnected) return;
        printed = true;
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } catch (error) {
          console.error('Falha ao imprimir orçamento PDF:', error);
          if (typeof window.toast === 'function') window.toast('Não foi possível abrir a impressão. Tente novamente.');
        }
        setTimeout(() => {
          if (frame?.isConnected) frame.remove();
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }, 5000);
      };
      frame.onload = () => setTimeout(startPrint, 500);
      frame.src = objectUrl;
      setTimeout(startPrint, 1800);
    } catch (error) {
      if (frame?.isConnected) frame.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      console.error('Erro ao gerar PDF para impressão:', error);
      alert('Não foi possível gerar o PDF: ' + (error?.message || error));
    }
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
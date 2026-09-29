/* Backup Excel dos lançamentos — Radiadores Moura
 * Exporta somente a empresa atualmente selecionada no sistema.
 */
(function(){
  'use strict';

  const moneyNumber = v => Number(v) || 0;
  const dateBR = v => {
    const m = String(v || '').slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3]+'/'+m[2]+'/'+m[1] : (v || '');
  };
  const safe = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  };
  const setWidths = (ws, widths) => {
    ws['!cols'] = widths.map(w => ({wch:w}));
    ws['!autofilter'] = {ref: ws['!ref']};
  };
  const formatCurrencyColumns = (ws, headers) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    headers.forEach(header => {
      const c = header.index;
      for(let r=1;r<=range.e.r;r++){
        const cell = ws[XLSX.utils.encode_cell({r,c})];
        if(cell && typeof cell.v === 'number') cell.z = 'R$ #,##0.00';
      }
    });
  };

  function buildLaunchRows(data){
    const rows = data.map(o => ({
      'ID do lançamento': safe(o.id),
      'Empresa': safe(window.company?.name || ''),
      'Nº lançamento / OS': safe(o.numero_lancamento),
      'Pedido': safe(o.pedido),
      'Data de entrada': dateBR(o.entry_date),
      'Data de saída': dateBR(o.exit_date),
      'Cliente': safe(o.client_name),
      'ID cliente': safe(o.client_id),
      'Marca / modelo': safe(o.vehicle_make_model),
      'Placa': safe(o.plate),
      'Pagamento': safe(o.payment_status),
      'Valor de venda': moneyNumber(o.total_sale),
      'Custo total': moneyNumber(o.total_cost),
      'Imposto': moneyNumber(o.total_tax),
      'Frete': moneyNumber(o.total_freight),
      'Lucro líquido': moneyNumber(o.net_profit),
      'Observações': safe(o.notes),
      'Oculto do balanço': o.exclude_from_balance ? 'SIM' : 'NÃO',
      'Criado em': safe(o.created_at),
      'Atualizado em': safe(o.updated_at)
    }));
    return rows.sort((a,b)=>{
      const da=String(a['Data de entrada']||'').split('/').reverse().join('');
      const db=String(b['Data de entrada']||'').split('/').reverse().join('');
      return db.localeCompare(da) || String(a['Cliente']).localeCompare(String(b['Cliente']),'pt-BR');
    });
  }

  function buildServiceRows(data){
    const rows=[];
    data.forEach(o=>{
      const items=Array.isArray(o.order_items) ? o.order_items : [];
      if(!items.length){
        rows.push({
          'ID do lançamento':safe(o.id),'Empresa':safe(window.company?.name || ''),
          'Nº lançamento / OS':safe(o.numero_lancamento),'Pedido':safe(o.pedido),
          'Data de entrada':dateBR(o.entry_date),'Data de saída':dateBR(o.exit_date),
          'Cliente':safe(o.client_name),'ID cliente':safe(o.client_id),
          'Marca / modelo':safe(o.vehicle_make_model),'Placa':safe(o.plate),
          'Pagamento':safe(o.payment_status),'Serviço / produto':'',
          'Situação do serviço':'','Valor venda':0,'Custo':0,'Alíquota (%)':0,
          'Imposto do item':0,'Lucro do item':0,'Venda total do lançamento':moneyNumber(o.total_sale),
          'Custo total do lançamento':moneyNumber(o.total_cost),'Imposto total do lançamento':moneyNumber(o.total_tax),
          'Frete do lançamento':moneyNumber(o.total_freight),'Lucro líquido do lançamento':moneyNumber(o.net_profit),
          'Observações':safe(o.notes),'ID do item':''
        });
        return;
      }
      items.forEach(i=>{
        const sale=moneyNumber(i.sale_value), cost=moneyNumber(i.cost_value), taxRate=moneyNumber(i.tax_rate);
        const tax=sale*taxRate/100;
        rows.push({
          'ID do lançamento':safe(o.id),'Empresa':safe(window.company?.name || ''),
          'Nº lançamento / OS':safe(o.numero_lancamento),'Pedido':safe(o.pedido),
          'Data de entrada':dateBR(o.entry_date),'Data de saída':dateBR(o.exit_date),
          'Cliente':safe(o.client_name),'ID cliente':safe(o.client_id),
          'Marca / modelo':safe(o.vehicle_make_model),'Placa':safe(o.plate),
          'Pagamento':safe(o.payment_status),'Serviço / produto':safe(i.description),
          'Situação do serviço':safe(i.service_status),'Valor venda':sale,'Custo':cost,
          'Alíquota (%)':taxRate,'Imposto do item':tax,'Lucro do item':sale-cost-tax,
          'Venda total do lançamento':moneyNumber(o.total_sale),
          'Custo total do lançamento':moneyNumber(o.total_cost),
          'Imposto total do lançamento':moneyNumber(o.total_tax),
          'Frete do lançamento':moneyNumber(o.total_freight),
          'Lucro líquido do lançamento':moneyNumber(o.net_profit),
          'Observações':safe(o.notes),'ID do item':safe(i.id)
        });
      });
    });
    return rows.sort((a,b)=>{
      const da=String(a['Data de entrada']||'').split('/').reverse().join('');
      const db=String(b['Data de entrada']||'').split('/').reverse().join('');
      return db.localeCompare(da)
        || String(a['Cliente']).localeCompare(String(b['Cliente']),'pt-BR')
        || String(a['Serviço / produto']).localeCompare(String(b['Serviço / produto']),'pt-BR');
    });
  }

  function buildClientRows(){
    return (window.clients || []).map(c=>({
      'ID':safe(c.id),'Nome / Razão social':safe(c.name),'CPF / CNPJ':safe(c.cpf_cnpj),
      'Telefone':safe(c.phone),'WhatsApp':safe(c.whatsapp),'E-mail':safe(c.email),
      'Endereço':safe(c.address),'Cidade':safe(c.city),'UF':safe(c.uf),
      'Observações':safe(c.notes),'Criado em':safe(c.created_at),'Atualizado em':safe(c.updated_at)
    })).sort((a,b)=>String(a['Nome / Razão social']).localeCompare(String(b['Nome / Razão social']),'pt-BR'));
  }

  function exportBackup(){
    if(typeof XLSX === 'undefined'){
      if(typeof toast==='function') toast('Biblioteca Excel ainda não carregou. Tente novamente.');
      return;
    }
    if(!window.company){
      if(typeof toast==='function') toast('Escolha a empresa antes de fazer o backup.');
      return;
    }
    const data=Array.isArray(window.orders)?window.orders:[];
    if(!data.length){
      if(typeof toast==='function') toast('Não há lançamentos para exportar.');
      return;
    }

    const wb=XLSX.utils.book_new();
    const services=buildServiceRows(data);
    const launches=buildLaunchRows(data);
    const clientsRows=buildClientRows();

    const wsServices=XLSX.utils.json_to_sheet(services);
    const wsLaunches=XLSX.utils.json_to_sheet(launches);
    const wsClients=XLSX.utils.json_to_sheet(clientsRows);

    const serviceHeaders=[
      'Valor venda','Custo','Imposto do item','Lucro do item',
      'Venda total do lançamento','Custo total do lançamento',
      'Imposto total do lançamento','Frete do lançamento','Lucro líquido do lançamento'
    ];
    const launchHeaders=['Valor de venda','Custo total','Imposto','Frete','Lucro líquido'];

    formatCurrencyColumns(wsServices,serviceHeaders.map(h=>({index:Object.keys(services[0]||{}).indexOf(h)})).filter(x=>x.index>=0));
    formatCurrencyColumns(wsLaunches,launchHeaders.map(h=>({index:Object.keys(launches[0]||{}).indexOf(h)})).filter(x=>x.index>=0));

    setWidths(wsServices,[38,22,18,12,16,16,30,18,23,18,14,34,22,15,15,16,16,20,23,23,22,23,45,38]);
    setWidths(wsLaunches,[38,22,18,12,16,16,30,38,38,22,14,18,18,18,18,18,45,18,22,22,22]);
    setWidths(wsClients,[38,30,18,18,18,30,40,20,8,45,22,22]);

    XLSX.utils.book_append_sheet(wb,wsServices,'Serviços');
    XLSX.utils.book_append_sheet(wb,wsLaunches,'Lançamentos');
    XLSX.utils.book_append_sheet(wb,wsClients,'Clientes');

    const now=new Date();
    const stamp=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+'_'+String(now.getHours()).padStart(2,'0')+'h'+String(now.getMinutes()).padStart(2,'0');
    const companySlug=String(window.company.name||'Radiadores_Moura').replace(/[^a-zA-Z0-9À-ÿ]+/g,'_');
    XLSX.writeFile(wb,'Backup_'+companySlug+'_'+stamp+'.xlsx');
    if(typeof toast==='function') toast('Backup Excel gerado com '+services.length+' serviço(s).');
  }

  window.exportRadiadoresBackup=exportBackup;
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.getElementById('backupExcel');
    if(btn) btn.addEventListener('click',exportBackup);
  });
})();
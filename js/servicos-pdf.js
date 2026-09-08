/* RELATORIO PDF — Todos os Serviços
   Gera um PDF exatamente com os filtros ativos da aba Serviços.
   Não altera nem grava dados no banco.
*/
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const dateBR=v=>{const m=String(v||'').slice(0,10).match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:(v||'—')};
  const escText=v=>String(v??'').replace(/[&<>]/g,'');
  const norm=v=>String(v??'').toLowerCase().trim();

  function getPeriod(){
    const active=document.querySelector('#services .services-period-buttons [data-period].active');
    const mode=active?.dataset.period||'all';
    const ref=$('servicesPeriodDate')?.value||'';
    const customStart=$('pdfDateStart')?.value||'';
    const customEnd=$('pdfDateEnd')?.value||'';
    if(customStart||customEnd){
      return {mode:'custom',start:customStart||null,end:customEnd||null,
        label:'Período personalizado: '+(customStart?dateBR(customStart):'início')+' até '+(customEnd?dateBR(customEnd):'fim')};
    }
    if(mode==='all')return {mode,label:'Todos os períodos',start:null,end:null};
    const d=ref?new Date(ref+'T00:00:00'):new Date();
    if(Number.isNaN(d.getTime()))return {mode,label:'Todos os períodos',start:null,end:null};
    let start,end;
    if(mode==='week'){
      const day=d.getDay()||7; start=new Date(d); start.setDate(d.getDate()-day+1);
      end=new Date(start); end.setDate(start.getDate()+6);
    }else if(mode==='month'){
      start=new Date(d.getFullYear(),d.getMonth(),1); end=new Date(d.getFullYear(),d.getMonth()+1,0);
    }else{
      start=new Date(d.getFullYear(),0,1); end=new Date(d.getFullYear(),11,31);
    }
    const iso=x=>x.toISOString().slice(0,10);
    return {mode,start:iso(start),end:iso(end),label:(mode==='week'?'Semana: ':mode==='month'?'Mês: ':'Ano: ')+dateBR(iso(start))+' até '+dateBR(iso(end))};
  }

  function filteredRows(){
    if(typeof window.allServiceRows!=='function')return [];
    const q=norm($('allServicesSearch')?.value);
    const pf=$('servicePaymentFilter')?.value||'';
    const sf=$('serviceStatusFilter')?.value||'';
    const p=getPeriod();
    return window.allServiceRows().filter(x=>{
      const text=norm([x.order?.client_name,x.order?.pedido,x.description,x.order?.vehicle_make_model,x.order?.plate].join(' '));
      if(q&&!text.includes(q))return false;
      if(pf&&(x.order?.payment_status||'EM ABERTO')!==pf)return false;
      if(sf&&x.service_status!==sf)return false;
      if(p.start||p.end){
        const d=String(x.order?.exit_date||x.order?.entry_date||'').slice(0,10);
        if(!d|| (p.start&&d<p.start) || (p.end&&d>p.end))return false;
      }
      return true;
    }).sort((a,b)=>{
      const d=String(b.order?.exit_date||b.order?.entry_date||'').localeCompare(String(a.order?.exit_date||a.order?.entry_date||''));
      return d||norm(a.order?.client_name).localeCompare(norm(b.order?.client_name));
    }).map(x=>{
      const sale=Number(x.sale_value)||0;
      const cost=Number(x.cost_value)||0;
      const freight=Number(x.freight_value)||0;
      const tax=sale*(Number(x.tax_rate)||0)/100;
      return {...x,sale,cost,freight,tax,net:sale-cost-freight-tax};
    });
  }

  function filterSummary(){
    const q=$('allServicesSearch')?.value?.trim()||'';
    const pay=$('servicePaymentFilter')?.value||'';
    const status=$('serviceStatusFilter')?.value||'';
    const p=getPeriod();
    return [
      p.label,
      q?'Busca: '+q:'Busca: todos',
      pay?'Pagamento: '+pay:'Pagamento: todos',
      status?'Situação: '+status:'Situação: todas'
    ];
  }

  function addButton(){
    const toolbar=document.querySelector('#services .service-toolbar');
    if(!toolbar)return;
    if(!$('pdfDateStart')){
      const box=document.createElement('div'); box.id='pdfDateFilter'; box.style.cssText='display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-left:8px';
      box.innerHTML='<label style="font-size:12px;font-weight:600">PDF de:</label><input id="pdfDateStart" type="date" title="Data inicial do PDF"><label style="font-size:12px;font-weight:600">até:</label><input id="pdfDateEnd" type="date" title="Data final do PDF">';
      toolbar.appendChild(box);
      $('pdfDateStart').addEventListener('change',()=>{if($('pdfDateEnd').value&&$('pdfDateStart').value>$('pdfDateEnd').value){$('pdfDateEnd').value=$('pdfDateStart').value}});
    }
    if($('generateServicesPdf'))return;
    const b=document.createElement('button');
    b.type='button';b.id='generateServicesPdf';b.className='btn primary';
    b.textContent='📄 Gerar PDF';
    b.title='Gerar relatório PDF com os filtros atuais';
    b.addEventListener('click',generate);
    toolbar.appendChild(b);
  }

  function drawHeader(doc,title,subtitle){
    const pageW=doc.internal.pageSize.getWidth();
    doc.setFontSize(16);doc.setFont(undefined,'bold');doc.text(title,14,16);
    doc.setFontSize(9);doc.setFont(undefined,'normal');doc.text(subtitle,14,22);
    doc.line(14,25,pageW-14,25);
  }

  function generate(){
    const rows=filteredRows();
    if(!rows.length){
      if(typeof toast==='function')toast('Nenhum serviço encontrado com os filtros atuais.');
      else alert('Nenhum serviço encontrado com os filtros atuais.');
      return;
    }
    if(!window.jspdf?.jsPDF){
      alert('A biblioteca do PDF ainda não foi carregada. Atualize a página e tente novamente.');
      return;
    }
    const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const companyName=window.company?.name||'Radiadores Moura';
    const now=new Date().toLocaleString('pt-BR');
    const p=getPeriod();
    const sale=rows.reduce((s,r)=>s+r.sale,0);
    const cost=rows.reduce((s,r)=>s+r.cost,0);
    const freight=rows.reduce((s,r)=>s+r.freight,0);
    const tax=rows.reduce((s,r)=>s+r.tax,0);
    const net=rows.reduce((s,r)=>s+r.net,0);
    const margin=sale?net/sale*100:0;

    drawHeader(doc,'Relatório de Serviços e Resultado',companyName+' • Gerado em '+now);
    doc.setFontSize(9);
    doc.text(filterSummary().map(escText).join('  |  '),14,30);

    const body=rows.map(r=>[
      dateBR(r.order?.exit_date||r.order?.entry_date),
      escText(r.order?.client_name||'Sem cliente'),
      escText(r.order?.numero_lancamento||r.order?.pedido||'—'),
      escText(r.description||'Sem descrição'),
      money(r.sale),money(r.cost),money(r.freight),money(r.tax),money(r.net)
    ]);

    if(typeof doc.autoTable==='function'){
      doc.autoTable({
        startY:35,
        head:[['Data','Cliente','OS/Pedido','Serviço / Produto','Venda (Bruto)','Custo','Frete','Imposto','Líquido']],
        body,
        theme:'grid',
        styles:{fontSize:7,cellPadding:2,overflow:'linebreak'},
        headStyles:{fontStyle:'bold'},
        columnStyles:{
          0:{cellWidth:22},1:{cellWidth:42},2:{cellWidth:22},3:{cellWidth:67},
          4:{cellWidth:27,halign:'right'},5:{cellWidth:25,halign:'right'},6:{cellWidth:23,halign:'right'},
          7:{cellWidth:25,halign:'right'},8:{cellWidth:28,halign:'right'}
        },
        margin:{left:14,right:14,top:35,bottom:20},
        didDrawPage:function(data){
          const pageH=doc.internal.pageSize.getHeight();
          doc.setFontSize(7);doc.setFont(undefined,'normal');
          doc.text('Página '+doc.internal.getNumberOfPages(),doc.internal.pageSize.getWidth()-14,pageH-8,{align:'right'});
        }
      });
    }else{
      // Fallback simples caso o plugin AutoTable não carregue.
      let y=38;
      doc.setFontSize(7);doc.setFont(undefined,'bold');
      doc.text('Data | Cliente | OS/Pedido | Serviço | Venda | Custo | Frete | Imposto | Líquido',14,y);
      y+=5;doc.setFont(undefined,'normal');
      rows.forEach(r=>{
        const line=dateBR(r.order?.exit_date||r.order?.entry_date)+' | '+String(r.order?.client_name||'').slice(0,24)+' | '+String(r.description||'').slice(0,38)+' | '+money(r.sale)+' | '+money(r.cost)+' | '+money(r.freight)+' | '+money(r.tax)+' | '+money(r.net);
        if(y>190){doc.addPage();y=16;drawHeader(doc,'Relatório de Serviços e Resultado',companyName);y=32}
        doc.text(line,14,y);y+=4;
      });
    }

    let finalY=(doc.lastAutoTable?.finalY||190)+8;
    if(finalY>185){doc.addPage();finalY=16;drawHeader(doc,'Balanço geral do relatório',companyName);}
    doc.setFont(undefined,'bold');doc.setFontSize(12);doc.text('Balanço geral',14,finalY);
    finalY+=7;doc.setFontSize(9);doc.setFont(undefined,'normal');
    const totals=[
      ['Serviços',String(rows.length)],
      ['Valor bruto / vendas',money(sale)],
      ['Custo',money(cost)],
      ['Frete',money(freight)],
      ['Impostos',money(tax)],
      ['Valor líquido / lucro líquido',money(net)],
      ['Margem líquida',margin.toFixed(1)+'%']
    ];
    totals.forEach(([label,value],i)=>doc.text(label+': '+value,14+(i%4)*68,finalY+Math.floor(i/4)*7));

    finalY+=Math.ceil(totals.length/4)*7+8;
    doc.setFontSize(8);doc.setFont(undefined,'normal');
    doc.text('Critério: o relatório utiliza os mesmos filtros da aba Todos os Serviços. O líquido é calculado como Venda − Custo − Frete − Imposto.',14,finalY);
    doc.save('relatorio-servicos-'+new Date().toISOString().slice(0,10)+'.pdf');
    if(typeof toast==='function')toast('PDF gerado com sucesso.');
  }

  function install(){
    addButton();
    const toolbar=document.querySelector('#services .service-toolbar');
    if(toolbar&&!toolbar.dataset.pdfObserver){
      toolbar.dataset.pdfObserver='1';
      new MutationObserver(()=>addButton()).observe(toolbar,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  let tries=0;const timer=setInterval(()=>{install();if(++tries>80)clearInterval(timer)},250);
  window.generateServicesPdf=generate;
})();
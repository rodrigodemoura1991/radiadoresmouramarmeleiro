/* Cálculo financeiro único — usado pelo Balanço e pelo Resumo da página inicial. */
(function(){
  'use strict';
  function calculateFinancialPeriod(sourceOrders,startDate,endDate,includeHidden){
    const rows=[];
    (Array.isArray(sourceOrders)?sourceOrders:[]).forEach(order=>{
      const exit=String(order?.exit_date||'').slice(0,10);
      if(!exit || (startDate && exit<startDate) || (endDate && exit>endDate)) return;
      if(!includeHidden && order.exclude_from_balance) return;
      const items=Array.isArray(order.order_items)?order.order_items:[];
      if(!items.length) return; // mesma regra histórica do Balanço: só conta itens detalhados
      const rate=Math.min(100,Math.max(0,Number(order.discount_percent)||0))/100;
      const hasItemFreight=items.some(item=>Number(item?.freight_value)||0);
      const orderRows=[];
      items.forEach(item=>{
        const sale=Number(item?.sale_value)||0;
        const cost=Number(item?.cost_value)||0;
        const itemFreight=Number(item?.freight_value)||0;
        const discount=sale*rate;
        const tax=sale*(Number(item?.tax_rate)||0)/100*(1-rate);
        orderRows.push({order,item,sale,discount,netSale:sale-discount,cost,freight:itemFreight,tax,profit:sale-discount-cost-itemFreight-tax});
      });
      // Frete antigo salvo no pedido: acrescenta uma única vez, no último item.
      if(!hasItemFreight && Number(order.total_freight||0) && orderRows.length){
        const last=orderRows[orderRows.length-1];
        last.freight+=Number(order.total_freight)||0;
        last.profit-=Number(order.total_freight)||0;
      }
      rows.push(...orderRows);
    });
    const totals=rows.reduce((t,row)=>{
      t.gross+=row.sale;t.discounts+=row.discount;t.netSales+=row.netSale;
      t.cost+=row.cost;t.freight+=row.freight;t.tax+=row.tax;t.profit+=row.profit;
      return t;
    },{gross:0,discounts:0,netSales:0,cost:0,freight:0,tax:0,profit:0});
    totals.margin=totals.gross?totals.profit/totals.gross*100:0;
    totals.services=rows.length;
    totals.launches=new Set(rows.map(row=>row.order.id)).size;
    return {rows,totals};
  }
  window.calculateFinancialPeriod=calculateFinancialPeriod;
})();
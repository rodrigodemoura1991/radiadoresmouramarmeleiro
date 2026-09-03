/* Calculadora rápida de preço de venda */
(function(){
'use strict';
function br(n){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0)}
function init(){
 const launch=document.getElementById('launch'); if(!launch||document.getElementById('saleCalculator'))return;
 const layout=launch.querySelector('.launch-dashboard-layout');
 const container=layout||launch;
 const aside=document.createElement('aside'); aside.id='saleCalculator'; aside.className='sale-calculator card';
 aside.innerHTML=`
 <div class="sale-calc-head"><div><h3>Calculadora de preço</h3><small>Preço de venda por margem</small></div></div>
 <label class="sale-calc-label">Custo do serviço<input id="calcCost" inputmode="decimal" placeholder="R$ 0,00"></label>
 <div class="sale-calc-label">Margem desejada<div class="margin-options">${[20,25,30,35,40,45,50].map((x,i)=>`<button type="button" class="margin-btn${i===2?' active':''}" data-margin="${x}">${x}%</button>`).join('')}</div></div>
 <label class="sale-calc-label">Alíquota de imposto<input id="calcTax" type="number" min="0" step=".1" value="6"></label>
 <label class="sale-calc-label">Frete<input id="calcFreight" inputmode="decimal" placeholder="R$ 0,00"></label>
 <div class="sale-calc-result"><span>Preço de venda</span><strong id="calcPrice">R$ 0,00</strong></div>
 <div class="sale-calc-details"><div><span>Custo total</span><b id="calcTotalCost">R$ 0,00</b></div><div><span>Imposto</span><b id="calcTaxValue">R$ 0,00</b></div><div><span>Lucro</span><b id="calcProfit">R$ 0,00</b></div></div>
 <button type="button" class="btn primary sale-copy" id="calcCopy">📋 Copiar valor</button>`;
 container.appendChild(aside);
 let margin=30;
 const num=v=>{let s=String(v||'').replace(/R\$\s?/g,'').trim(); if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')} return Number(s.replace(/[^0-9.-]/g,''))||0};
 function calc(){
   const cost=num(document.getElementById('calcCost').value), freight=num(document.getElementById('calcFreight').value);
   const tax=(Number(document.getElementById('calcTax').value)||0)/100, total=cost+freight;
   const denom=1-margin/100-tax, price=denom>0?total/denom:0, taxValue=price*tax, profit=price-taxValue-total;
   document.getElementById('calcPrice').textContent=br(price);
   document.getElementById('calcTotalCost').textContent=br(total);
   document.getElementById('calcTaxValue').textContent=br(taxValue);
   document.getElementById('calcProfit').textContent=br(profit);
 }
 aside.querySelectorAll('.margin-btn').forEach(b=>b.addEventListener('click',()=>{margin=Number(b.dataset.margin);aside.querySelectorAll('.margin-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');calc()}));
 ['calcCost','calcTax','calcFreight'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
 document.getElementById('calcCopy').addEventListener('click',async()=>{const v=document.getElementById('calcPrice').textContent; try{await navigator.clipboard.writeText(v); const b=document.getElementById('calcCopy');b.textContent='✓ Valor copiado';setTimeout(()=>b.textContent='📋 Copiar valor',1500)}catch(e){}});
 calc();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
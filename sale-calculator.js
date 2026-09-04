/* Calculadora rápida de preço de venda */
(function(){
'use strict';
function br(n){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0)}
function init(){
 const launch=document.getElementById('launch'); if(!launch||document.getElementById('saleCalculator'))return;
 const layout=launch.querySelector('.launch-dashboard-layout');
 const container=layout?.querySelector('.launch-dashboard-side')||layout||launch;
 const aside=document.createElement('aside'); aside.id='saleCalculator'; aside.className='sale-calculator card';
 aside.innerHTML=`
 <div class="sale-calc-head"><div><h3>Calculadora de preço</h3><small>Preço de venda por margem</small></div></div>
 <label class="sale-calc-label">Custo do serviço<input id="calcCost" inputmode="decimal" placeholder="R$ 0,00"></label>
 <div class="sale-calc-label">Margem desejada<div class="margin-options">${[20,25,30,35,40,45,50].map((x,i)=>`<button type="button" class="margin-btn${i===2?' active':''}" data-margin="${x}">${x}%</button>`).join('')}</div></div>
 <label class="sale-calc-label">Alíquota de imposto<input id="calcTax" type="number" min="0" step=".1" value="6"></label>
 <label class="sale-calc-label">Frete<input id="calcFreight" inputmode="decimal" placeholder="R$ 0,00"></label>
 <div class="sale-calc-label">Condição de pagamento
   <div class="payment-options">
     <button type="button" class="payment-btn active" data-payment="cash">À vista <small>5% de desconto</small></button>
     <button type="button" class="payment-btn" data-payment="card3">Cartão <small>3x sem juros</small></button>
     <button type="button" class="payment-btn" data-payment="card12">Cartão <small>4x a 12x com juros</small></button>
   </div>
 </div>
 <label class="sale-calc-label card-interest hidden" id="cardInterestWrap">Juros do cartão (%)
   <input id="calcCardInterest" type="number" min="0" step=".01" value="0" placeholder="Ex.: 2,99">
 </label>
 <div class="sale-calc-result"><span>Preço de venda</span><strong id="calcPrice">R$ 0,00</strong></div>
 <div class="sale-calc-details"><div><span>Custo total</span><b id="calcTotalCost">R$ 0,00</b></div><div><span>Imposto</span><b id="calcTaxValue">R$ 0,00</b></div><div><span id="calcConditionLabel">Condição</span><b id="calcCondition">À vista</b></div><div><span>Lucro</span><b id="calcProfit">R$ 0,00</b></div></div>
 <button type="button" class="btn primary sale-copy" id="calcCopy">📋 Copiar valor</button>`;
 container.appendChild(aside);
 let margin=30, payment='cash';
 const num=v=>{let s=String(v||'').replace(/R\$\s?/g,'').trim(); if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')} return Number(s.replace(/[^0-9.-]/g,''))||0};
 function calc(){
   const cost=num(document.getElementById('calcCost').value), freight=num(document.getElementById('calcFreight').value);
   const tax=(Number(document.getElementById('calcTax').value)||0)/100, total=cost+freight;
   const discount=payment==='cash'?0.05:0;
   const cardInterest=payment==='card12'?(Number(document.getElementById('calcCardInterest').value)||0)/100:0;
   const denom=1-margin/100-tax-discount, base=denom>0?total/denom:0;
   const rawPrice=payment==='card12'?(base/(1-cardInterest)):base;
   const price=rawPrice>0?Math.ceil(rawPrice/5)*5:0;
   const taxValue=price*tax, discountValue=payment==='cash'?price*discount:0, cardFee=payment==='card12'?price*cardInterest:0, profit=price-taxValue-discountValue-cardFee-total;
   document.getElementById('calcPrice').textContent=br(price);
   document.getElementById('calcTotalCost').textContent=br(total);
   document.getElementById('calcTaxValue').textContent=br(taxValue);
   document.getElementById('calcProfit').textContent=br(profit);
   document.getElementById('calcCondition').textContent=payment==='cash'?'À vista — 5% de desconto':payment==='card3'?'Cartão — 3x sem juros':`Cartão — até 12x com juros${cardInterest?' ('+document.getElementById('calcCardInterest').value+'%)':''}`;
 }
 aside.querySelectorAll('.margin-btn').forEach(b=>b.addEventListener('click',()=>{margin=Number(b.dataset.margin);aside.querySelectorAll('.margin-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');calc()}));
 ['calcCost','calcTax','calcFreight','calcCardInterest'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
 aside.querySelectorAll('.payment-btn').forEach(b=>b.addEventListener('click',()=>{payment=b.dataset.payment;aside.querySelectorAll('.payment-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('cardInterestWrap').classList.toggle('hidden',payment!=='card12');calc()}));
 document.getElementById('calcCopy').addEventListener('click',async()=>{const priceText=document.getElementById('calcPrice').textContent; const interest=document.getElementById('calcCardInterest').value||'0'; const cash=Math.ceil((price*0.95)/5)*5; const card3=priceText; const card12=interest==='0'?priceText:br(Math.ceil((price/(1-Number(interest)/100))/5)*5); const v=`Preço de venda: ${priceText}\nÀ vista: ${br(cash)} — 5% de desconto\nCartão: ${card3} — 3x sem juros\nCartão: ${card12} — até 12x com juros (${interest}%)`; try{await navigator.clipboard.writeText(v); const b=document.getElementById('calcCopy');b.textContent='✓ Valor copiado';setTimeout(()=>b.textContent='📋 Copiar valor',1500)}catch(e){}});
 calc();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
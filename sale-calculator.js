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
 <div class="sale-calc-head"><div><h3>Calculadora de preço</h3><small>Margem somatória sobre o custo</small></div></div>
 <label class="sale-calc-label">Custo do serviço<input id="calcCost" inputmode="decimal" placeholder="R$ 0,00"></label>
 <div class="sale-calc-label">Margens para somar<div class="margin-options">${[20,25,30,35,40,45,50].map(x=>`<button type="button" class="margin-btn" data-margin="${x}">${x}%</button>`).join('')}</div><small style="display:block;margin-top:6px;color:var(--muted)">Selecione uma ou várias. Os percentuais serão somados.</small></div>
 <label class="sale-calc-label">Alíquota de imposto<input id="calcTax" type="number" min="0" step=".1" value="6"></label>
 <label class="sale-calc-label">Frete<input id="calcFreight" inputmode="decimal" placeholder="R$ 0,00"></label>
 <div class="sale-calc-result"><span>Preço de venda</span><strong id="calcPrice">R$ 0,00</strong></div>
 <div class="sale-calc-details"><div><span>Custo total</span><b id="calcTotalCost">R$ 0,00</b></div><div><span>Margem somada</span><b id="calcMargin">0%</b></div><div><span>Imposto</span><b id="calcTaxValue">R$ 0,00</b></div><div><span>Valor antes do imposto</span><b id="calcBasePrice">R$ 0,00</b></div></div>
 <button type="button" class="btn primary sale-copy" id="calcCopy">Copiar valor e condições</button>`;
 container.appendChild(aside);
 let selectedMargins=new Set();
 const num=v=>{let s=String(v||'').replace(/R\$\s?/g,'').trim(); if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')} return Number(s.replace(/[^0-9.-]/g,''))||0};
 function calc(){
   const cost=num(document.getElementById('calcCost').value), freight=num(document.getElementById('calcFreight').value);
   const total=cost+freight;
   const margin=[...selectedMargins].reduce((sum,x)=>sum+x,0)/100;
   const tax=(Number(document.getElementById('calcTax').value)||0)/100;
   const basePrice=total*(1+margin);
   const taxValue=basePrice*tax;
   const rawPrice=basePrice+taxValue;
   const price=rawPrice>0?Math.ceil(rawPrice/5)*5:0;
   document.getElementById('calcPrice').textContent=br(price);
   document.getElementById('calcTotalCost').textContent=br(total);
   document.getElementById('calcMargin').textContent=(margin*100).toFixed(0)+'%';
   document.getElementById('calcTaxValue').textContent=br(taxValue);
   document.getElementById('calcBasePrice').textContent=br(basePrice);
 }
 aside.querySelectorAll('.margin-btn').forEach(b=>b.addEventListener('click',()=>{const value=Number(b.dataset.margin);if(selectedMargins.has(value)){selectedMargins.delete(value);b.classList.remove('active')}else{selectedMargins.add(value);b.classList.add('active')}calc()}));
 ['calcCost','calcTax','calcFreight'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
 document.getElementById('calcCopy').addEventListener('click',async()=>{const price=document.getElementById('calcPrice').textContent;const v=`*${price}*\n\n*Condições de pagamento:*\nÀ vista — 5% de desconto\nCartão de crédito — até 3x sem juros\nCartão de crédito — até 12x com acréscimo`;try{await navigator.clipboard.writeText(v);const b=document.getElementById('calcCopy');b.textContent='Valor e condições copiados';setTimeout(()=>b.textContent='Copiar valor e condições',1800)}catch(e){}});
 calc();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
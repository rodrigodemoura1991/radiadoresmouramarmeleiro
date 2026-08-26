/* Correções finais: saída em branco, Enter no botão adicionar e legendas de cores. */
(function(){
  const $=id=>document.getElementById(id);
  const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
  function injectCss(){
    if(document.getElementById('final-fixes-css')) return;
    const s=document.createElement('style');s.id='final-fixes-css';s.textContent=`
      .color-legend{position:sticky;top:76px;z-index:12;display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 10px;padding:7px 9px;background:rgba(255,255,255,.97);border:1px solid var(--line);border-radius:10px;box-shadow:0 4px 14px #17203312;font-size:10px}
      .color-legend strong{font-size:10px;margin-right:3px}
      .legend-item{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:var(--muted);font-weight:800}
      .legend-dot{width:9px;height:9px;border-radius:50%;display:inline-block;border:1px solid #0002}
      .legend-black{background:#111}.legend-green{background:#138a5b}.legend-blue{background:#2f80ed}.legend-purple{background:#7356c8}.legend-orange{background:#d97706}.legend-brown{background:#b7791f}.legend-cyan{background:#0891b2}.legend-gray{background:#64748b}
      @media(max-width:700px){.color-legend{top:62px;font-size:9px}.legend-item{font-size:9px}}
    `;document.head.appendChild(s);
  }
  function legend(id,title,items){
    const host=$(id);if(!host)return;
    let el=host.querySelector(':scope > .color-legend');
    if(!el){el=document.createElement('div');el.className='color-legend';host.insertBefore(el,host.firstChild)}
    el.innerHTML='<strong>'+title+'</strong>'+items.map(x=>`<span class="legend-item"><i class="legend-dot ${x[0]}"></i>${x[1]}</span>`).join('');
  }
  const launchItems=[['legend-blue','Liberado'],['legend-orange','Parado'],['legend-purple','Pronto'],['legend-green','Pronto entregue']];
  const serviceItems=[['legend-black','EM ABERTO'],['legend-green','Dinheiro'],['legend-blue','Cartão'],['legend-purple','Pix'],['legend-orange','Cheque'],['legend-brown','Carteira'],['legend-cyan','Boleto'],['legend-gray','Notinha']];
  function addLegends(){legend('launch','Cores dos cartões:',launchItems);legend('services','Cores dos cartões:',serviceItems)}
  function syncExit(){
    const exit=$('exit'), rows=document.querySelectorAll('#rows .svc-row');if(!exit||!rows.length)return;
    const allDelivered=[...rows].every(r=>r.querySelector('.status')?.value==='Pronto entregue');
    if(!allDelivered){exit.value='';return}
    if(!exit.value)exit.value=today();
  }
  function bindStatus(){
    document.querySelectorAll('#rows .status').forEach(s=>{if(s.dataset.exitBound)return;s.dataset.exitBound='1';s.addEventListener('change',syncExit)})
  }
  function installEnter(){
    const add=$('add');if(!add||add.dataset.enterFixed)return;
    add.dataset.enterFixed='1';
    add.addEventListener('keydown',function(e){
      if(e.key!=='Enter')return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(typeof addRow!=='function')return;
      addRow();
      requestAnimationFrame(()=>{const rows=document.querySelectorAll('#rows .svc-row');rows[rows.length-1]?.querySelector('.desc')?.focus();bindStatus()});
    },true);
    add.addEventListener('click',()=>requestAnimationFrame(bindStatus));
  }
  function wrapEdit(){
    if(typeof window.editOrder!=='function'||window.editOrder.__exitFixed)return;
    const original=window.editOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{syncExit();bindStatus()},30);return r};wrapped.__exitFixed=true;window.editOrder=wrapped;
  }
  function wrapClear(){
    if(typeof window.clearOrder!=='function'||window.clearOrder.__exitFixed)return;
    const original=window.clearOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{if($('exit'))$('exit').value='';bindStatus()},20);return r};wrapped.__exitFixed=true;window.clearOrder=wrapped;
  }
  function install(){
    injectCss();addLegends();installEnter();wrapEdit();wrapClear();bindStatus();
    const order=$('order');if(order&&!order.dataset.exitSubmitFixed){order.dataset.exitSubmitFixed='1';order.addEventListener('submit',function(){syncExit()},true)}
    const observer=new MutationObserver(()=>{addLegends();installEnter();wrapEdit();wrapClear();bindStatus()});observer.observe(document.body,{childList:true,subtree:true});
    const exit=$('exit');if(exit)exit.removeAttribute('required');
    if(exit)exit.value='';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

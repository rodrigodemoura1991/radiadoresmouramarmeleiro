/* Correções finais: saída em branco, Enter no botão adicionar e legenda lateral dinâmica. */
(function(){
  const $=id=>document.getElementById(id);
  const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};

  function injectCss(){
    if(document.getElementById('final-fixes-css')) return;
    const s=document.createElement('style');
    s.id='final-fixes-css';
    s.textContent=`
      /* Legenda fica realmente ao lado da lista e acompanha a rolagem. */
      .dynamic-legend-layout{
        display:grid !important;
        grid-template-columns:minmax(0,1fr) 150px !important;
        gap:12px !important;
        align-items:start !important;
        width:100% !important;
      }
      .dynamic-legend-layout > .dynamic-list-host{
        min-width:0 !important;
        grid-column:1 !important;
      }
      .dynamic-legend-layout > .color-legend{
        grid-column:2 !important;
        grid-row:1 !important;
        position:sticky !important;
        top:86px !important;
        align-self:start !important;
        display:flex !important;
        flex-direction:column !important;
        gap:8px !important;
        width:150px !important;
        box-sizing:border-box !important;
        margin:0 !important;
        padding:11px 10px !important;
        background:#fff !important;
        border:1px solid var(--line) !important;
        border-radius:10px !important;
        box-shadow:0 4px 14px #17203312 !important;
        z-index:20 !important;
        font-size:10px !important;
      }
      .dynamic-legend-layout > .color-legend strong{
        display:block !important;
        margin:0 0 2px !important;
        font-size:10px !important;
        line-height:1.2 !important;
      }
      .dynamic-legend-layout > .color-legend .legend-item{
        display:flex !important;
        align-items:center !important;
        gap:7px !important;
        white-space:nowrap !important;
        color:var(--muted) !important;
        font-weight:800 !important;
        line-height:1.25 !important;
      }
      .legend-dot{width:9px !important;height:9px !important;min-width:9px !important;border-radius:50% !important;display:inline-block !important;border:1px solid #0002 !important}
      .legend-black{background:#111}.legend-green{background:#138a5b}.legend-blue{background:#2f80ed}.legend-purple{background:#7356c8}.legend-orange{background:#d97706}.legend-brown{background:#b7791f}.legend-cyan{background:#0891b2}.legend-gray{background:#64748b}
      @media(max-width:1000px){
        .dynamic-legend-layout{grid-template-columns:minmax(0,1fr) 125px !important;gap:8px !important}
        .dynamic-legend-layout > .color-legend{width:125px !important;padding:9px 7px !important}
        .dynamic-legend-layout > .color-legend .legend-item{font-size:9px !important}
        .dynamic-legend-layout > .color-legend strong{font-size:9px !important}
      }
      @media(max-width:700px){
        .dynamic-legend-layout{display:block !important}
        .dynamic-legend-layout > .color-legend{position:sticky !important;top:64px !important;width:150px !important;margin:0 0 8px auto !important}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureLegendLayout(hostId,title,items){
    const host=$(hostId); if(!host)return;
    let layout=host.closest('.dynamic-legend-layout');
    if(!layout){
      layout=document.createElement('div');
      layout.className='dynamic-legend-layout';
      host.parentNode.insertBefore(layout,host);
      layout.appendChild(host);
      host.classList.add('dynamic-list-host');
    }
    let legend=layout.querySelector(':scope > .color-legend');
    if(!legend){
      legend=document.createElement('aside');
      legend.className='color-legend';
      layout.appendChild(legend);
    }
    const html='<strong>'+title+'</strong>'+items.map(x=>`<span class="legend-item"><i class="legend-dot ${x[0]}"></i>${x[1]}</span>`).join('');
    if(legend.innerHTML!==html)legend.innerHTML=html;
  }

  const launchItems=[['legend-blue','Liberado'],['legend-orange','Parado'],['legend-purple','Pronto'],['legend-green','Pronto entregue']];
  const serviceItems=[['legend-black','EM ABERTO'],['legend-green','Dinheiro'],['legend-blue','Cartão'],['legend-purple','Pix'],['legend-orange','Cheque'],['legend-brown','Carteira'],['legend-cyan','Boleto'],['legend-gray','Notinha']];
  function addLegends(){
    ensureLegendLayout('launchList','Cores dos cartões:',launchItems);
    ensureLegendLayout('allServicesList','Cores dos cartões:',serviceItems);
  }

  function syncExit(){
    const exit=$('exit'),rows=document.querySelectorAll('#rows .svc-row');if(!exit||!rows.length)return;
    const allDelivered=[...rows].every(r=>r.querySelector('.status')?.value==='Pronto entregue');
    if(!allDelivered){exit.value='';return}
    if(!exit.value)exit.value=today();
  }
  function bindStatus(){document.querySelectorAll('#rows .status').forEach(s=>{if(s.dataset.exitBound)return;s.dataset.exitBound='1';s.addEventListener('change',syncExit)})}
  function installEnter(){
    const add=$('add');if(!add||add.dataset.enterFixed)return;add.dataset.enterFixed='1';
    add.addEventListener('keydown',function(e){
      if(e.key!=='Enter')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof addRow!=='function')return;
      addRow();requestAnimationFrame(()=>{const rows=document.querySelectorAll('#rows .svc-row');rows[rows.length-1]?.querySelector('.desc')?.focus();bindStatus()});
    },true);
    add.addEventListener('click',()=>requestAnimationFrame(bindStatus));
  }
  function wrapEdit(){if(typeof window.editOrder!=='function'||window.editOrder.__exitFixed)return;const original=window.editOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{syncExit();bindStatus()},30);return r};wrapped.__exitFixed=true;window.editOrder=wrapped}
  function wrapClear(){if(typeof window.clearOrder!=='function'||window.clearOrder.__exitFixed)return;const original=window.clearOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{if($('exit'))$('exit').value='';bindStatus()},20);return r};wrapped.__exitFixed=true;window.clearOrder=wrapped}
  function install(){
    injectCss();addLegends();installEnter();wrapEdit();wrapClear();bindStatus();
    const order=$('order');if(order&&!order.dataset.exitSubmitFixed){order.dataset.exitSubmitFixed='1';order.addEventListener('submit',function(){syncExit()},true)}
    const observer=new MutationObserver(()=>{addLegends();installEnter();wrapEdit();wrapClear();bindStatus()});observer.observe(document.body,{childList:true,subtree:true});
    const exit=$('exit');if(exit)exit.removeAttribute('required');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* Correções finais: saída em branco, Enter no botão adicionar e legenda lateral vertical. */
(function(){
  const $=id=>document.getElementById(id);
  const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
  function injectCss(){
    if(document.getElementById('final-fixes-css'))return;
    const s=document.createElement('style');s.id='final-fixes-css';s.textContent=`
      .services-legend-shell{display:grid!important;grid-template-columns:minmax(0,1fr) 150px!important;gap:12px!important;align-items:start!important;width:100%!important}
      .services-legend-shell>#allServicesList,.services-legend-shell>#launchList{grid-column:1!important;grid-row:1!important;min-width:0!important;width:100%!important}
      .services-color-legend{grid-column:2!important;grid-row:1!important;position:sticky!important;top:90px!important;align-self:start!important;width:150px!important;margin:0!important;padding:10px!important;display:flex!important;flex-direction:column!important;gap:7px!important;background:#fff!important;border:1px solid var(--line)!important;border-radius:10px!important;box-shadow:0 4px 14px #17203312!important;z-index:10!important;box-sizing:border-box!important}
      .services-color-legend strong{display:block!important;margin:0 0 2px!important;font-size:10px!important;line-height:1.2!important}
      .services-color-legend .legend-item{display:flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important;font-size:10px!important;font-weight:800!important;line-height:1.2!important;color:var(--muted)!important}
      .services-color-legend .legend-dot{display:inline-block!important;width:9px!important;height:9px!important;min-width:9px!important;border-radius:50%!important}
      .legend-black{background:#111}.legend-green{background:#138a5b}.legend-blue{background:#2f80ed}.legend-purple{background:#7356c8}.legend-orange{background:#d97706}.legend-brown{background:#b7791f}.legend-cyan{background:#0891b2}.legend-gray{background:#64748b}
      @media(max-width:1000px){.services-legend-shell{grid-template-columns:minmax(0,1fr) 125px!important;gap:8px!important}.services-color-legend{width:125px!important}}
      @media(max-width:700px){.services-legend-shell{grid-template-columns:minmax(0,1fr) 105px!important;gap:6px!important}.services-color-legend{width:105px!important;top:65px!important;padding:7px 6px!important}.services-color-legend .legend-item,.services-color-legend strong{font-size:8px!important}}
    `;document.head.appendChild(s);
  }
  function makeSideLegend(hostId,title,items){
    const host=$(hostId);if(!host)return;
    let shell=host.parentElement;
    if(!shell||!shell.classList.contains('services-legend-shell')){
      shell=document.createElement('div');shell.className='services-legend-shell';host.parentNode.insertBefore(shell,host);shell.appendChild(host);
    }
    let legend=shell.querySelector(':scope>.services-color-legend');
    if(!legend){legend=document.createElement('aside');legend.className='services-color-legend';shell.appendChild(legend)}
    legend.innerHTML='<strong>'+title+'</strong>'+items.map(x=>`<span class="legend-item"><i class="legend-dot ${x[0]}"></i>${x[1]}</span>`).join('');
    Object.assign(shell.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) 150px',gap:'12px',alignItems:'start',width:'100%'});
    Object.assign(legend.style,{position:'sticky',top:'90px',alignSelf:'start',width:'150px',margin:'0'});
  }
  const launchItems=[['legend-blue','Liberado'],['legend-orange','Parado'],['legend-purple','Pronto'],['legend-green','Pronto entregue']];
  const serviceItems=[['legend-black','EM ABERTO'],['legend-green','Dinheiro'],['legend-blue','Cartão'],['legend-purple','Pix'],['legend-orange','Cheque'],['legend-brown','Carteira'],['legend-cyan','Boleto'],['legend-gray','Notinha']];
  function addLegends(){makeSideLegend('launchList','Cores dos cartões:',launchItems);makeSideLegend('allServicesList','Cores dos cartões:',serviceItems)}
  function syncExit(){const exit=$('exit'),rows=document.querySelectorAll('#rows .svc-row');if(!exit||!rows.length)return;const allDelivered=[...rows].every(r=>r.querySelector('.status')?.value==='Pronto entregue');if(!allDelivered){exit.value='';return}if(!exit.value)exit.value=today()}
  function bindStatus(){document.querySelectorAll('#rows .status').forEach(s=>{if(s.dataset.exitBound)return;s.dataset.exitBound='1';s.addEventListener('change',syncExit)})}
  function installEnter(){const add=$('add');if(!add||add.dataset.enterFixed)return;add.dataset.enterFixed='1';add.addEventListener('keydown',function(e){if(e.key!=='Enter')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof addRow!=='function')return;addRow();requestAnimationFrame(()=>{const rows=document.querySelectorAll('#rows .svc-row');rows[rows.length-1]?.querySelector('.desc')?.focus();bindStatus()})},true);add.addEventListener('click',()=>requestAnimationFrame(bindStatus))}
  function wrapEdit(){if(typeof window.editOrder!=='function'||window.editOrder.__exitFixed)return;const original=window.editOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{syncExit();bindStatus()},30);return r};wrapped.__exitFixed=true;window.editOrder=wrapped}
  function wrapClear(){if(typeof window.clearOrder!=='function'||window.clearOrder.__exitFixed)return;const original=window.clearOrder;const wrapped=function(){const r=original.apply(this,arguments);setTimeout(()=>{if($('exit'))$('exit').value='';bindStatus()},20);return r};wrapped.__exitFixed=true;window.clearOrder=wrapped}
  function install(){
    injectCss();addLegends();installEnter();wrapEdit();wrapClear();bindStatus();
    const order=$('order');if(order&&!order.dataset.exitSubmitFixed){order.dataset.exitSubmitFixed='1';order.addEventListener('submit',()=>syncExit(),true)}
    const exit=$('exit');if(exit)exit.removeAttribute('required');
    const observer=new MutationObserver(()=>{addLegends();installEnter();wrapEdit();wrapClear();bindStatus()});observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

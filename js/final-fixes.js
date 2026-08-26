/* Correções finais: legenda lateral real e opção de deixar saída em branco no EDITAR. */
(function(){
  const $=id=>document.getElementById(id);
  const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};

  function injectCss(){
    let s=$('final-fixes-css');
    if(!s){s=document.createElement('style');s.id='final-fixes-css';document.head.appendChild(s)}
    s.textContent=`
      /* A legenda pertence à lista de cartões e fica ao lado dela. */
      .services-side-shell{display:grid!important;grid-template-columns:minmax(0,1fr) 150px!important;gap:12px!important;align-items:start!important;width:100%!important;box-sizing:border-box!important}
      .services-side-shell>.all-services,.services-side-shell>.launches{grid-column:1!important;grid-row:1!important;min-width:0!important;width:100%!important}
      .services-color-legend{grid-column:2!important;grid-row:1!important;position:sticky!important;top:90px!important;align-self:start!important;width:150px!important;margin:0!important;padding:10px!important;display:flex!important;flex-direction:column!important;gap:7px!important;background:#fff!important;border:1px solid var(--line)!important;border-radius:10px!important;box-shadow:0 4px 14px #17203312!important;z-index:20!important;box-sizing:border-box!important}
      .services-color-legend strong{display:block!important;margin:0 0 2px!important;font-size:10px!important;line-height:1.2!important}
      .services-color-legend .legend-item{display:flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important;font-size:10px!important;font-weight:800!important;line-height:1.2!important;color:var(--muted)!important}
      .services-color-legend .legend-dot{display:inline-block!important;width:9px!important;height:9px!important;min-width:9px!important;border-radius:50%!important}
      .legend-black{background:#111}.legend-green{background:#138a5b}.legend-blue{background:#2f80ed}.legend-purple{background:#7356c8}.legend-orange{background:#d97706}.legend-brown{background:#b7791f}.legend-cyan{background:#0891b2}.legend-gray{background:#64748b}
      .edit-exit-option{display:none;align-items:center;gap:6px;margin-top:6px;font-size:10px;font-weight:800;color:var(--muted)}
      .edit-exit-option.visible{display:flex}
      .edit-exit-option input{width:14px;height:14px;margin:0;accent-color:#111}
      @media(max-width:1000px){.services-side-shell{grid-template-columns:minmax(0,1fr) 125px!important;gap:8px!important}.services-color-legend{width:125px!important}}
      @media(max-width:700px){.services-side-shell{grid-template-columns:minmax(0,1fr) 105px!important;gap:6px!important}.services-color-legend{width:105px!important;top:65px!important;padding:7px 6px!important}.services-color-legend .legend-item,.services-color-legend strong{font-size:8px!important}}
    `;
  }

  function unwrapOldLegendLayouts(){
    document.querySelectorAll('.services-legend-shell').forEach(shell=>{
      const host=shell.querySelector('#allServicesList,#launchList');
      if(host&&shell.parentNode){shell.parentNode.insertBefore(host,shell);}
      shell.remove();
    });
    document.querySelectorAll('.services-color-legend').forEach(x=>x.remove());
  }

  function makeSideLegend(hostId,title,items){
    const host=$(hostId);if(!host)return;
    let shell=host.parentElement;
    if(!shell||!shell.classList.contains('services-side-shell')){
      const oldShell=host.closest('.services-legend-shell');
      if(oldShell)oldShell.remove();
      shell=document.createElement('div');
      shell.className='services-side-shell';
      host.parentNode.insertBefore(shell,host);
      shell.appendChild(host);
    }
    shell.querySelectorAll(':scope>.services-color-legend').forEach(x=>x.remove());
    const legend=document.createElement('aside');
    legend.className='services-color-legend';
    legend.innerHTML='<strong>'+title+'</strong>'+items.map(x=>`<span class="legend-item"><i class="legend-dot ${x[0]}"></i>${x[1]}</span>`).join('');
    shell.appendChild(legend);
  }

  const launchItems=[['legend-blue','Liberado'],['legend-orange','Parado'],['legend-purple','Pronto'],['legend-green','Pronto entregue']];
  const serviceItems=[['legend-black','EM ABERTO'],['legend-green','Dinheiro'],['legend-blue','Cartão'],['legend-purple','Pix'],['legend-orange','Cheque'],['legend-brown','Carteira'],['legend-cyan','Boleto'],['legend-gray','Notinha']];

  function addLegends(){
    /* Remove os layouts antigos para não haver duas legendas ou uma legenda no topo. */
    document.querySelectorAll('.services-color-legend').forEach(x=>x.remove());
    makeSideLegend('launchList','Cores dos cartões:',launchItems);
    makeSideLegend('allServicesList','Cores dos cartões:',serviceItems);
  }

  function ensureExitOption(){
    const exit=$('exit');
    if(!exit)return null;
    const field=exit.closest('.field');
    if(!field)return null;
    let box=$('editExitOption');
    if(!box){
      box=document.createElement('label');
      box.id='editExitOption';
      box.className='edit-exit-option';
      box.innerHTML='<input id="editExitBlank" type="checkbox"><span>Deixar sem data de saída</span>';
      field.appendChild(box);
      const check=$('editExitBlank');
      check.addEventListener('change',()=>{
        if(check.checked)exit.value='';
        else if(!exit.value){
          const rows=[...document.querySelectorAll('#rows .svc-row')];
          const allDelivered=rows.length>0&&rows.every(r=>r.querySelector('.status')?.value==='Pronto entregue');
          if(allDelivered)exit.value=today();
        }
      });
    }
    return box;
  }

  function setEditExitOption(){
    const box=ensureExitOption();
    const check=$('editExitBlank');
    const isEditing=typeof editing!=='undefined'&&!!editing;
    if(box)box.classList.toggle('visible',isEditing);
    if(check){
      check.checked=isEditing&&(!$('exit')?.value);
      if(check.checked&&$('exit'))$('exit').value='';
    }
  }

  function syncExit(){
    const exit=$('exit'),rows=document.querySelectorAll('#rows .svc-row');
    if(!exit)return;
    const check=$('editExitBlank');
    if(check?.checked){exit.value='';return}
    if(!rows.length)return;
    const allDelivered=[...rows].every(r=>r.querySelector('.status')?.value==='Pronto entregue');
    if(!allDelivered){exit.value='';return}
    if(!exit.value)exit.value=today();
  }

  function bindStatus(){
    document.querySelectorAll('#rows .status').forEach(s=>{
      if(s.dataset.exitBound)return;
      s.dataset.exitBound='1';
      s.addEventListener('change',syncExit);
    });
  }

  function installEnter(){
    const add=$('add');
    if(!add||add.dataset.enterFixed)return;
    add.dataset.enterFixed='1';
    add.addEventListener('keydown',function(e){
      if(e.key!=='Enter')return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(typeof addRow!=='function')return;
      addRow();
      requestAnimationFrame(()=>{
        const rows=document.querySelectorAll('#rows .svc-row');
        rows[rows.length-1]?.querySelector('.desc')?.focus();
        bindStatus();
      });
    },true);
    add.addEventListener('click',()=>requestAnimationFrame(bindStatus));
  }

  function wrapEdit(){
    if(typeof window.editOrder!=='function'||window.editOrder.__finalFixWrapped)return;
    const original=window.editOrder;
    const wrapped=function(){
      const r=original.apply(this,arguments);
      setTimeout(()=>{ensureExitOption();setEditExitOption();syncExit();bindStatus()},50);
      return r;
    };
    wrapped.__finalFixWrapped=true;
    window.editOrder=wrapped;
  }

  function wrapClear(){
    if(typeof window.clearOrder!=='function'||window.clearOrder.__finalFixWrapped)return;
    const original=window.clearOrder;
    const wrapped=function(){
      const r=original.apply(this,arguments);
      setTimeout(()=>{
        if($('exit'))$('exit').value=today();
        if($('editExitBlank'))$('editExitBlank').checked=false;
        if($('editExitOption'))$('editExitOption').classList.remove('visible');
        bindStatus();
      },20);
      return r;
    };
    wrapped.__finalFixWrapped=true;
    window.clearOrder=wrapped;
  }

  function bindSubmit(){
    const order=$('order');
    if(!order||order.dataset.finalSubmitFixed)return;
    order.dataset.finalSubmitFixed='1';
    order.addEventListener('submit',()=>{
      if($('editExitBlank')?.checked&&$('exit'))$('exit').value='';
    },true);
  }

  function install(){
    injectCss();
    unwrapOldLegendLayouts();
    addLegends();
    ensureExitOption();
    installEnter();
    wrapEdit();
    wrapClear();
    bindStatus();
    bindSubmit();
    const exit=$('exit');if(exit)exit.removeAttribute('required');
    setEditExitOption();
  }

  let timer=0;
  const observer=new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      injectCss();
      installEnter();
      wrapEdit();
      wrapClear();
      bindStatus();
      bindSubmit();
      ensureExitOption();
      setEditExitOption();
      /* Reposiciona a legenda somente se o render do app a removeu/recriou. */
      if(!$('launchList')?.parentElement?.classList.contains('services-side-shell')||!$('launchList')?.parentElement?.querySelector('.services-color-legend')||!$('allServicesList')?.parentElement?.classList.contains('services-side-shell')||!$('allServicesList')?.parentElement?.querySelector('.services-color-legend'))addLegends();
    },30);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

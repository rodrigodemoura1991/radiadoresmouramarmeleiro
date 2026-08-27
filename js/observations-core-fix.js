/* Observações — implementação final: cada observação pertence somente ao ID do lançamento. */
(function(){
  'use strict';
  if(window.__observationsCoreInstalled)return;
  window.__observationsCoreInstalled=true;

  const originalCreateClient=window.supabase?.createClient;
  if(!originalCreateClient||!window.SUPABASE_CONFIG)return;
  const notesClient=originalCreateClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.key);
  const cid=()=>sessionStorage.getItem('companyId');
  const norm=v=>String(v??'').trim().toLowerCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function editId(){
    const m=document.getElementById('orderFixModal'),f=document.getElementById('fixEditForm');
    return window.__freteEditId||m?.dataset.orderId||f?.dataset.orderId||window.editing?.id||null;
  }
  function currentNotes(){
    const f=document.getElementById('fixNotes');
    if(f&&document.getElementById('orderFixModal')&&!document.getElementById('orderFixModal').classList.contains('hidden'))return f.value;
    return document.getElementById('orderNotes')?.value||'';
  }

  // Corrige os salvamentos normais: o notes entra no MESMO INSERT/UPDATE do lançamento.
  // Assim não existe mais uma segunda pesquisa por cliente/data que possa atingir outro registro.
  if(window.sb&&!window.sb.__observationsPayloadFix){
    const globalClient=window.sb;
    const originalFrom=globalClient.from.bind(globalClient);
    globalClient.from=function(table){
      const builder=originalFrom(table);
      if(table!=='orders')return builder;
      const originalInsert=builder.insert.bind(builder);
      const originalUpdate=builder.update.bind(builder);
      builder.insert=function(values,...args){
        if(values&&typeof values==='object'&&!Array.isArray(values)&&!Object.prototype.hasOwnProperty.call(values,'notes'))values={...values,notes:String(currentNotes()??'').trim()};
        return originalInsert(values,...args);
      };
      builder.update=function(values,...args){
        if(values&&typeof values==='object'&&!Array.isArray(values)&&!Object.prototype.hasOwnProperty.call(values,'notes'))values={...values,notes:String(currentNotes()??'').trim()};
        return originalUpdate(values,...args);
      };
      return builder;
    };
    globalClient.__observationsPayloadFix=true;
  }

  // As rotinas antigas de observação criam outro client e tentam fazer update({notes})
  // procurando por cliente/data. Esses updates são bloqueados; somente o ID correto acima grava.
  window.supabase.createClient=function(){
    const client=originalCreateClient.apply(this,arguments);
    const originalFrom=client.from.bind(client);
    client.from=function(table){
      const builder=originalFrom(table);
      if(table!=='orders')return builder;
      const originalUpdate=builder.update.bind(builder);
      builder.update=function(values){
        const keys=values&&typeof values==='object'&&!Array.isArray(values)?Object.keys(values):[];
        if(keys.length===1&&keys[0]==='notes')return {eq:()=>Promise.resolve({data:null,error:null}),then:(resolve,reject)=>Promise.resolve({data:null,error:null}).then(resolve,reject)};
        return originalUpdate(values);
      };
      return builder;
    };
    return client;
  };

  async function loadNoteIntoEditor(){
    const id=editId(),field=document.getElementById('fixNotes');
    if(!id||!field)return;
    if(field.dataset.loadedFor===String(id))return;
    const r=await notesClient.from('orders').select('notes').eq('id',id).maybeSingle();
    if(!r.error&&r.data){field.value=r.data.notes||'';field.dataset.loadedFor=String(id)}
  }

  function renderCards(){
    const data=Array.isArray(window.orders)?window.orders:[];
    document.querySelectorAll('#launchList .launch[data-id]').forEach(card=>{
      card.querySelector('.launch-observation')?.remove();
      const o=data.find(x=>String(x.id)===String(card.dataset.id));
      const n=String(o?.notes||'').trim();
      if(!n)return;
      const el=document.createElement('div');el.className='launch-observation';el.innerHTML='<b>Observação:</b> '+esc(n);card.appendChild(el);
    });
  }

  async function refreshCorrectNotes(){
    const company=cid();if(!company)return;
    const r=await notesClient.from('orders').select('id,notes').eq('company_id',company);
    if(r.error)return;
    const map=new Map((r.data||[]).map(x=>[String(x.id),x.notes||'']));
    if(Array.isArray(window.orders))window.orders.forEach(o=>{if(map.has(String(o.id)))o.notes=map.get(String(o.id))});
    renderCards();
  }

  const observer=new MutationObserver(()=>{loadNoteIntoEditor();renderCards()});
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{loadNoteIntoEditor();renderCards()},{once:true});
  else {loadNoteIntoEditor();renderCards()}
})();

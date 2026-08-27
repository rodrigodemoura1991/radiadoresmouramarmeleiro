/* Observações — implementação final: cada observação pertence somente ao ID do lançamento. */
(function(){
  'use strict';
  if(window.__observationsCoreInstalled)return;
  window.__observationsCoreInstalled=true;

  const originalCreateClient=window.supabase?.createClient;
  if(!originalCreateClient||!window.SUPABASE_CONFIG)return;
  const notesClient=originalCreateClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.key);
  const cid=()=>sessionStorage.getItem('companyId');
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

  function getOrders(){
    // app.js declara "orders" com let, portanto ele não fica em window.orders.
    // Use a referência global lexical quando disponível e só depois o fallback em window.
    try { if(typeof orders!=='undefined' && Array.isArray(orders)) return orders; } catch(e) {}
    return Array.isArray(window.orders)?window.orders:[];
  }

  function renderCards(){
    const data=getOrders();
    document.querySelectorAll('#launchList .launch[data-id]').forEach(card=>{
      card.querySelector('.launch-observation')?.remove();
      const o=data.find(x=>String(x.id)===String(card.dataset.id));
      const n=String(o?.notes||'').trim();
      if(!n)return;
      const el=document.createElement('div');
      el.className='launch-observation';
      el.innerHTML='<b>Observação:</b> '+esc(n);
      card.appendChild(el);
    });
  }

  async function refreshCorrectNotes(){
    const company=cid();if(!company)return;
    const r=await notesClient.from('orders').select('id,notes').eq('company_id',company);
    if(r.error)return;
    const data=getOrders();
    const map=new Map((r.data||[]).map(x=>[String(x.id),x.notes||'']));
    data.forEach(o=>{if(map.has(String(o.id)))o.notes=map.get(String(o.id))});
    renderCards();
  }

  function addObservationStyles(){
    if(document.getElementById('launch-observation-style'))return;
    const s=document.createElement('style');
    s.id='launch-observation-style';
    s.textContent=`
      .launch-observation{
        margin-top:6px;padding:7px 9px;border-radius:7px;
        background:#fff8dc;border:1px solid #ead68a;
        color:#26364d;font-size:12px;line-height:1.35;
        white-space:pre-wrap;overflow-wrap:anywhere;
      }
      .launch-observation b{font-weight:800}
    `;
    document.head.appendChild(s);
  }

  const observer=new MutationObserver(()=>{loadNoteIntoEditor();renderCards()});
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{addObservationStyles();loadNoteIntoEditor();renderCards()},{once:true});
  else {addObservationStyles();loadNoteIntoEditor();renderCards()}
})();

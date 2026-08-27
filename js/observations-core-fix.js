/* Observações — implementação final, vinculada ao ID do lançamento. */
(function(){
  'use strict';

  const originalCreateClient = window.supabase?.createClient;
  if (!originalCreateClient || window.__observationsCoreInstalled) return;
  window.__observationsCoreInstalled = true;

  const config = window.SUPABASE_CONFIG;
  const notesClient = originalCreateClient(config.url, config.key);

  // Bloqueia apenas os updates ambíguos de {notes: ...} usados pelas rotinas antigas.
  // Os updates completos do lançamento continuam normais.
  window.supabase.createClient = function(){
    const client = originalCreateClient.apply(this, arguments);
    const originalFrom = client.from.bind(client);
    client.from = function(table){
      const builder = originalFrom(table);
      if (table !== 'orders') return builder;
      const originalUpdate = builder.update.bind(builder);
      builder.update = function(values){
        const keys = values && typeof values === 'object' && !Array.isArray(values) ? Object.keys(values) : [];
        if (keys.length === 1 && keys[0] === 'notes') {
          return {
            eq: function(){ return Promise.resolve({data:null,error:null}); },
            then: function(resolve,reject){ return Promise.resolve({data:null,error:null}).then(resolve,reject); }
          };
        }
        return originalUpdate(values);
      };
      return builder;
    };
    return client;
  };

  const norm = v => String(v ?? '').trim().toLowerCase();
  const companyId = () => sessionStorage.getItem('companyId');
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function snapshotMain(){
    return {
      entry: document.getElementById('entry')?.value || '',
      client: document.getElementById('clientInput')?.value || '',
      vehicle: document.getElementById('vehicle')?.value || '',
      plate: document.getElementById('plate')?.value || '',
      pedido: document.getElementById('pedido')?.value || ''
    };
  }

  function same(o,s){
    return norm(o.client_name)===norm(s.client) &&
      norm(o.entry_date)===norm(s.entry) &&
      norm(o.vehicle_make_model)===norm(s.vehicle) &&
      norm(o.plate)===norm(s.plate) &&
      norm(o.pedido)===norm(s.pedido);
  }

  async function getOrders(){
    const cid=companyId();
    if(!cid) return [];
    const r=await notesClient.from('orders').select('id,company_id,client_name,entry_date,vehicle_make_model,plate,pedido,created_at,notes').eq('company_id',cid);
    if(r.error) throw r.error;
    return r.data||[];
  }

  async function setExact(id,notes){
    if(!id) return;
    const cid=companyId();
    if(!cid) return;
    const r=await notesClient.from('orders').update({notes:String(notes??'').trim()}).eq('id',id).eq('company_id',cid);
    if(r.error) throw r.error;
  }

  async function cleanDuplicates(intendedId,notes,before){
    const current=await getOrders();
    for(const old of before){
      if(String(old.id)===String(intendedId)) continue;
      const now=current.find(x=>String(x.id)===String(old.id));
      if(!now) continue;
      if(String(now.notes??'').trim()===String(notes??'').trim() && String(old.notes??'').trim()!==String(now.notes??'').trim()){
        await setExact(old.id,old.notes||'');
      }
    }
  }

  async function findNew(beforeIds,snapshot,startedAt){
    const cid=companyId();
    if(!cid) return null;
    const r=await notesClient.from('orders').select('id,company_id,client_name,entry_date,vehicle_make_model,plate,pedido,created_at,notes').eq('company_id',cid).gte('created_at',new Date(startedAt-2000).toISOString()).order('created_at',{ascending:false}).limit(30);
    if(r.error) return null;
    return (r.data||[]).find(o=>!beforeIds.has(String(o.id))&&same(o,snapshot))||null;
  }

  function clearVisualNotes(){
    document.querySelectorAll('.launch-observation').forEach(x=>x.remove());
  }

  function renderVisualNotes(){
    clearVisualNotes();
    const cards=[...document.querySelectorAll('#launchList .launch[data-id]')];
    const data=Array.isArray(window.orders)?window.orders:[];
    cards.forEach(card=>{
      const o=data.find(x=>String(x.id)===String(card.dataset.id));
      const notes=String(o?.notes||'').trim();
      if(!notes) return;
      const el=document.createElement('div');
      el.className='launch-observation';
      el.innerHTML='<b>Observação:</b> '+esc(notes);
      card.appendChild(el);
    });
  }

  async function persistNew(){
    const form=document.getElementById('order');
    if(!form || form.dataset.observationsCoreBound) return;
    form.dataset.observationsCoreBound='1';
    form.addEventListener('submit',async function(){
      const snapshot=snapshotMain();
      const notes=document.getElementById('orderNotes')?.value||'';
      const startedAt=Date.now();
      let before=[];
      try{before=await getOrders();}catch(e){return;}
      const beforeIds=new Set(before.map(x=>String(x.id)));
      setTimeout(async()=>{
        try{
          const created=await findNew(beforeIds,snapshot,startedAt);
          if(!created?.id) return;
          await setExact(created.id,notes);
          await cleanDuplicates(created.id,notes,before);
          if(typeof loadData==='function') await loadData();
          setTimeout(renderVisualNotes,50);
        }catch(e){console.error('Observações:',e)}
      },1500);
    },true);
  }

  function currentEditId(){
    const modal=document.getElementById('orderFixModal');
    const form=document.getElementById('fixEditForm');
    return window.__freteEditId || modal?.dataset.orderId || form?.dataset.orderId || (window.editing?.id)||null;
  }

  async function loadExactEditNote(){
    const id=currentEditId();
    const field=document.getElementById('fixNotes');
    if(!id||!field) return;
    const r=await notesClient.from('orders').select('notes').eq('id',id).maybeSingle();
    if(!r.error && r.data) field.value=r.data.notes||'';
  }

  function watchEditor(){
    const observer=new MutationObserver(()=>{
      const field=document.getElementById('fixNotes');
      if(field && currentEditId()) loadExactEditNote();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function bindEdit(){
    const form=document.getElementById('fixEditForm');
    if(!form || form.dataset.observationsCoreEditBound) return;
    form.dataset.observationsCoreEditBound='1';
    form.addEventListener('submit',function(){
      const id=currentEditId();
      const notes=document.getElementById('fixNotes')?.value||'';
      if(!id) return;
      setTimeout(async()=>{
        try{
          await setExact(id,notes);
          const current=await getOrders();
          for(const o of current){
            if(String(o.id)!==String(id) && String(o.notes??'').trim()===String(notes??'').trim() && String(notes??'').trim()!==''){
              const before=current.find(x=>String(x.id)===String(o.id));
              if(before) await setExact(o.id,'');
            }
          }
          if(typeof loadData==='function') await loadData();
          setTimeout(renderVisualNotes,50);
        }catch(e){console.error('Observações edição:',e)}
      },1500);
    },true);
  }

  function install(){
    persistNew();
    bindEdit();
    renderVisualNotes();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  new MutationObserver(()=>{persistNew();bindEdit();}).observe(document.body,{childList:true,subtree:true});
})();

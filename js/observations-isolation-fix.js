/* Corrige o vínculo das observações: cada observação pertence somente ao lançamento atual. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const norm=v=>String(v??'').trim().toLowerCase();

  function client(){
    try{return window.supabase?.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.key)||null}catch(e){return null}
  }

  function currentEditId(){
    const modal=$('orderFixModal'), form=$('fixEditForm');
    return window.__freteEditId || modal?.dataset.orderId || form?.dataset.orderId ||
      ((typeof editing!=='undefined'&&editing)?editing.id:null) || null;
  }

  function snapshotMain(){
    return {
      entry:$('entry')?.value||'',
      client:$('clientInput')?.value||'',
      vehicle:$('vehicle')?.value||'',
      plate:$('plate')?.value||'',
      pedido:$('pedido')?.value||''
    };
  }

  function snapshotEdit(){
    return {
      entry:$('fixEntry')?.value||'',
      client:$('fixClient')?.value||'',
      vehicle:$('fixVehicle')?.value||'',
      plate:$('fixPlate')?.value||'',
      pedido:$('fixPedido')?.value||''
    };
  }

  async function saveById(id,notes){
    const c=client(),companyId=sessionStorage.getItem('companyId');
    if(!c||!companyId||!id)return;
    await c.from('orders').update({notes:String(notes||'').trim()}).eq('id',id).eq('company_id',companyId);
  }

  async function findNewest(snapshot){
    const c=client(),companyId=sessionStorage.getItem('companyId');
    if(!c||!companyId||!snapshot.entry)return null;
    const r=await c.from('orders').select('id,client_name,entry_date,vehicle_make_model,plate,pedido,created_at,notes').eq('company_id',companyId).eq('entry_date',snapshot.entry).order('created_at',{ascending:false}).limit(30);
    if(r.error||!r.data?.length)return null;
    const exact=r.data.find(o=>
      norm(o.client_name)===norm(snapshot.client)&&
      norm(o.vehicle_make_model)===norm(snapshot.vehicle)&&
      norm(o.plate)===norm(snapshot.plate)&&
      norm(o.pedido)===norm(snapshot.pedido)
    );
    return exact||r.data[0]||null;
  }

  function bindForm(formId,notesId,snapshotFn,isEdit){
    const form=$(formId);if(!form||form.dataset.observationIsolationFixed)return;
    form.dataset.observationIsolationFixed='1';
    form.addEventListener('submit',()=>{
      const notes=$(notesId)?.value||'';
      const id=isEdit?currentEditId():null;
      const snapshot=snapshotFn();
      setTimeout(async()=>{
        try{
          if(id){
            await saveById(id,notes);
          }else{
            const newest=await findNewest(snapshot);
            if(newest?.id)await saveById(newest.id,notes);
          }
          if(typeof loadData==='function')await loadData();
        }catch(e){console.error('Observação:',e)}
      },1600);
    },true);
  }

  function install(){
    bindForm('order','orderNotes',snapshotMain,false);
    bindForm('fixEditForm','fixNotes',snapshotEdit,true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  new MutationObserver(()=>install()).observe(document.body,{childList:true,subtree:true});
})();

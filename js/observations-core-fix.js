/* Observações — implementação final: cada observação pertence somente ao ID do lançamento. */
(function(){
  'use strict';
  if(window.__observationsCoreInstalled)return;
  window.__observationsCoreInstalled=true;

  const originalCreateClient=window.supabase?.createClient;
  if(!originalCreateClient||!window.SUPABASE_CONFIG)return;
  const notesClient=originalCreateClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.key);
  const cid=()=>sessionStorage.getItem('companyId');

  function editId(){
    const m=document.getElementById('orderFixModal'),f=document.getElementById('fixEditForm');
    return window.__freteEditId||m?.dataset.orderId||f?.dataset.orderId||window.editing?.id||null;
  }
  function currentNotes(){
    const f=document.getElementById('fixNotes');
    if(f&&document.getElementById('orderFixModal')&&!document.getElementById('orderFixModal').classList.contains('hidden'))return f.value;
    return document.getElementById('orderNotes')?.value||'';
  }

  /* Mantém o salvamento isolado por lançamento, sem observar o DOM inteiro. */
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

  /* Bloqueia somente atualizações antigas que tentavam alterar notes sem ID. */
  window.supabase.createClient=function(){
    const client=originalCreateClient.apply(this,arguments);
    const originalFrom=client.from.bind(client);
    client.from=function(table){
      const builder=originalFrom(table);
      if(table!=='orders')return builder;
      const originalUpdate=builder.update.bind(builder);
      builder.update=function(values){
        const keys=values&&typeof values==='object'&&!Array.isArray(values)?Object.keys(values):[];
        if(keys.length===1&&keys[0]==='notes'){
          console.warn('[observations] atualização de notes sem filtro de ID bloqueada');
          return originalUpdate(values);
        }
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

  /*
   * IMPORTANTE: não usar MutationObserver no document.body.
   * A interface cria/atualiza cartões e a própria renderização altera o DOM;
   * observar o body fazia renderizações em cascata e travava o aplicativo.
   * O campo de edição é carregado quando o modal de edição é aberto.
   */
  let lastModalState='';
  function checkEditor(){
    const m=document.getElementById('orderFixModal');
    const visible=!!m&&!m.classList.contains('hidden');
    const id=visible?String(editId()||''):'';
    const state=visible?id:'closed';
    if(state!==lastModalState){
      lastModalState=state;
      if(visible)loadNoteIntoEditor();
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',checkEditor,{once:true});
  }else checkEditor();
  setInterval(checkEditor,500);
})();

/* Proteção definitiva das datas do orders.
   Nunca permite que a coluna DATE receba a string vazia "".
   A correção fica na fronteira com o Supabase, independentemente do formulário. */
(function(){
  function normalizeDate(v){
    if(v===null || v===undefined) return null;
    const s=String(v).trim();
    return s==='' ? null : s;
  }

  function sanitizeOrderPayload(payload){
    if(!payload || typeof payload!=='object') return payload;
    if(Array.isArray(payload)) return payload.map(sanitizeOrderPayload);
    const copy={...payload};
    if(Object.prototype.hasOwnProperty.call(copy,'entry_date')) copy.entry_date=normalizeDate(copy.entry_date);
    if(Object.prototype.hasOwnProperty.call(copy,'exit_date')) copy.exit_date=normalizeDate(copy.exit_date);
    return copy;
  }

  function install(){
    if(typeof sb==='undefined' || !sb || sb.__dateGuardInstalled) return;
    const originalFrom=sb.from.bind(sb);
    sb.from=function(table){
      const builder=originalFrom(table);
      if(table!=='orders') return builder;

      if(typeof builder.insert==='function'){
        const originalInsert=builder.insert.bind(builder);
        builder.insert=(values,...args)=>originalInsert(sanitizeOrderPayload(values),...args);
      }
      if(typeof builder.update==='function'){
        const originalUpdate=builder.update.bind(builder);
        builder.update=(values,...args)=>originalUpdate(sanitizeOrderPayload(values),...args);
      }
      return builder;
    };
    sb.__dateGuardInstalled=true;
  }

  // app.js cria o cliente antes deste arquivo; instalar imediatamente.
  install();
  // Segurança extra caso o cliente seja recriado em alguma alteração futura.
  setTimeout(install,50);
})();

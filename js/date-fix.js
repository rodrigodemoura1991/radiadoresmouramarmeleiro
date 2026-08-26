/* Correção de datas de saída: nunca enviar "" para coluna DATE. */
(function(){
  const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  if(!native || !native.get || !native.set) return;

  Object.defineProperty(HTMLInputElement.prototype, 'value', {
    configurable: native.configurable,
    enumerable: native.enumerable,
    get: function(){
      const v = native.get.call(this);
      // O app envia $('exit').value diretamente ao Supabase.
      // Para saída vazia, retornar null evita o erro de DATE = "".
      if(this.id === 'exit' && v === '') return null;
      return v;
    },
    set: function(v){ native.set.call(this, v == null ? '' : v); }
  });

  function clearExitIfParado(){
    const statuses = [...document.querySelectorAll('#rows .svc-row .status')];
    if(statuses.some(s => s.value === 'Parado')){
      const exit = document.getElementById('exit');
      if(exit) exit.value = '';
    }
  }

  document.addEventListener('change', function(e){
    if(e.target && e.target.matches('#rows .svc-row .status')) clearExitIfParado();
  });

  // Garante que ao clicar em salvar com serviço parado a saída fique realmente nula.
  document.addEventListener('submit', function(e){
    if(e.target && e.target.id === 'order') clearExitIfParado();
  }, true);
})();

/*
 * Observações — correção definitiva de isolamento.
 *
 * O campo notes pertence à tabela orders. O problema anterior era que havia
 * rotinas diferentes tentando descobrir o lançamento por cliente/data, o que
 * é ambíguo quando existem vários lançamentos iguais. Esta rotina NÃO escolhe
 * lançamento por nome/data para editar. Ela usa o ID do lançamento quando
 * editando e, para um novo lançamento, identifica o registro recém-criado por
 * created_at + dados do formulário.
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').trim().toLowerCase();

  function client() {
    try {
      return window.supabase?.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.key
      ) || null;
    } catch (_) {
      return null;
    }
  }

  function companyId() {
    return sessionStorage.getItem('companyId') || null;
  }

  function snapshotMain() {
    return {
      entry: $('entry')?.value || '',
      client: $('clientInput')?.value || '',
      vehicle: $('vehicle')?.value || '',
      plate: $('plate')?.value || '',
      pedido: $('pedido')?.value || ''
    };
  }

  function snapshotEdit() {
    return {
      entry: $('fixEntry')?.value || '',
      client: $('fixClient')?.value || '',
      vehicle: $('fixVehicle')?.value || '',
      plate: $('fixPlate')?.value || '',
      pedido: $('fixPedido')?.value || ''
    };
  }

  function sameSnapshot(o, s) {
    return norm(o.client_name) === norm(s.client) &&
      norm(o.entry_date) === norm(s.entry) &&
      norm(o.vehicle_make_model) === norm(s.vehicle) &&
      norm(o.plate) === norm(s.plate) &&
      norm(o.pedido) === norm(s.pedido);
  }

  async function readOrders(c, cid) {
    const r = await c.from('orders')
      .select('id,company_id,client_name,entry_date,vehicle_make_model,plate,pedido,created_at,notes')
      .eq('company_id', cid);
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function persistExact(id, notes, cid) {
    if (!id || !cid) return;
    const c = client();
    if (!c) return;
    const r = await c.from('orders')
      .update({ notes: String(notes ?? '').trim() })
      .eq('id', id)
      .eq('company_id', cid);
    if (r.error) throw r.error;
  }

  async function repairWrongMatches(before, intendedId, snapshot, notes, cid) {
    const c = client();
    if (!c || !cid) return;

    const current = await readOrders(c, cid);
    for (const old of before) {
      if (String(old.id) === String(intendedId)) continue;
      if (!sameSnapshot(old, snapshot)) continue;

      const now = current.find(x => String(x.id) === String(old.id));
      if (!now) continue;

      // Só desfazemos uma alteração que tenha exatamente o valor que a rotina
      // problemática tentou gravar. Assim não mexemos em outras observações.
      if (String(now.notes ?? '').trim() === String(notes ?? '').trim() &&
          String(old.notes ?? '').trim() !== String(now.notes ?? '').trim()) {
        await persistExact(old.id, old.notes || '', cid);
      }
    }
  }

  async function findCreatedOrder(beforeIds, snapshot, startedAt, cid) {
    const c = client();
    if (!c || !cid) return null;

    const r = await c.from('orders')
      .select('id,company_id,client_name,entry_date,vehicle_make_model,plate,pedido,created_at,notes')
      .eq('company_id', cid)
      .gte('created_at', new Date(startedAt - 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (r.error || !r.data?.length) return null;

    return r.data.find(o =>
      !beforeIds.has(String(o.id)) && sameSnapshot(o, snapshot)
    ) || null;
  }

  function currentEditId() {
    const modal = $('orderFixModal');
    const form = $('fixEditForm');
    return window.__freteEditId ||
      modal?.dataset.orderId ||
      form?.dataset.orderId ||
      ((typeof editing !== 'undefined' && editing) ? editing.id : null);
  }

  async function trackSubmit(kind) {
    const c = client();
    const cid = companyId();
    if (!c || !cid) return;

    const isEdit = kind === 'edit';
    const snapshot = isEdit ? snapshotEdit() : snapshotMain();
    const notes = isEdit ? ($('fixNotes')?.value || '') : ($('orderNotes')?.value || '');
    const startedAt = Date.now();

    let before = [];
    try {
      before = await readOrders(c, cid);
    } catch (e) {
      console.error('Observações: não foi possível obter estado anterior', e);
      return;
    }

    const beforeIds = new Set(before.map(x => String(x.id)));
    const editId = isEdit ? currentEditId() : null;

    // Aguarda o salvamento normal do aplicativo terminar. Não executamos outro
    // INSERT/UPDATE de lançamento aqui; apenas corrigimos notes pelo ID.
    setTimeout(async () => {
      try {
        let intendedId = editId;

        if (!intendedId) {
          const created = await findCreatedOrder(beforeIds, snapshot, startedAt, cid);
          intendedId = created?.id || null;
        }

        if (!intendedId) {
          console.warn('Observações: não foi possível identificar o lançamento salvo.');
          return;
        }

        // Primeiro grava exatamente no lançamento correto.
        await persistExact(intendedId, notes, cid);

        // Depois desfaz somente alterações indevidas feitas em outro lançamento
        // com os mesmos dados de identificação.
        await repairWrongMatches(before, intendedId, snapshot, notes, cid);

        if (typeof loadData === 'function') {
          await loadData();
        }
      } catch (e) {
        console.error('Observações:', e);
      }
    }, 1800);
  }

  function bind() {
    const order = $('order');
    if (order && !order.dataset.observationRepairBound) {
      order.dataset.observationRepairBound = '1';
      order.addEventListener('submit', () => trackSubmit('new'), true);
    }

    const edit = $('fixEditForm');
    if (edit && !edit.dataset.observationRepairBound) {
      edit.dataset.observationRepairBound = '1';
      edit.addEventListener('submit', () => trackSubmit('edit'), true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

  new MutationObserver(bind).observe(document.body, {
    childList: true,
    subtree: true
  });
})();

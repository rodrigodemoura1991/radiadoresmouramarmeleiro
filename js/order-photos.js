/* Anexos fotográficos por OS — Supabase Storage privado */
(function(){
  'use strict';
  const BUCKET='radiadores-os-photos', MAX_FILES=10, MAX_BYTES=12*1024*1024;
  const $=id=>document.getElementById(id);
  let pending=[], existing=[], activeOrderId=null, busy=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function mount(){
    const form=$('order'); if(!form||$('orderPhotosPanel'))return;
    const notes=form.querySelector('.order-notes-field');
    if(!notes)return;
    const panel=document.createElement('section');panel.id='orderPhotosPanel';panel.className='order-photos-panel';
    panel.innerHTML=`
      <div class="order-photos-heading"><div><strong>Fotos do serviço</strong><small>Adicione fotos do veículo, peças, avarias ou do serviço concluído</small></div><label class="order-photo-add" for="orderPhotoInput">＋ Anexar fotos</label></div>
      <input id="orderPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden>
      <div id="orderPhotoStatus" class="order-photo-status">Até 10 fotos por OS. As imagens ficam salvas junto ao lançamento.</div>
      <div id="orderPhotoGrid" class="order-photo-grid"></div>`;
    notes.before(panel);
    const style=document.createElement('style');style.id='order-photos-style';style.textContent=`
      #orderPhotosPanel{border:1px solid var(--line,#dbe3ed);border-radius:12px;background:#fbfcfe;padding:12px;margin:4px 0 10px;min-width:0}
      .order-photos-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .order-photos-heading>div{display:flex;flex-direction:column;gap:3px;min-width:0}
      .order-photos-heading strong{font-size:13px;color:var(--ink,#172b46)}
      .order-photos-heading small,.order-photo-status{font-size:11px;color:var(--muted,#718096)}
      .order-photo-add{display:inline-flex;align-items:center;justify-content:center;border:1px solid #cbd8e8;border-radius:8px;background:#fff;color:#173b67;font-size:12px;font-weight:800;padding:8px 12px;cursor:pointer;white-space:nowrap}
      .order-photo-add:hover{background:#edf4fc}
      .order-photo-status{margin-top:7px}
      .order-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:9px;margin-top:9px}
      .order-photo-card{position:relative;min-width:0;border:1px solid #dce5ef;border-radius:9px;overflow:hidden;background:#fff}
      .order-photo-card a{display:block;aspect-ratio:4/3;background:#eef2f7}
      .order-photo-card img{width:100%;height:100%;object-fit:cover;display:block}
      .order-photo-card small{display:block;padding:5px 6px;font-size:10px;color:#53657c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .order-photo-remove{position:absolute;right:5px;top:5px;border:0;border-radius:50%;width:25px;height:25px;background:#fff;color:#b42318;font-weight:900;box-shadow:0 1px 5px #0003;cursor:pointer}
      .order-photo-pending{border-style:dashed}
      #orderPhotosPanel.is-busy{opacity:.65;pointer-events:none}
      @media(max-width:600px){#orderPhotosPanel{padding:9px}.order-photo-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.order-photo-add{padding:7px 9px}}
    `;document.head.appendChild(style);
    $('orderPhotoInput').addEventListener('change',e=>addFiles(e.target.files));
    render();
  }
  function status(message){const el=$('orderPhotoStatus');if(el)el.textContent=message}
  function render(){
    const grid=$('orderPhotoGrid');if(!grid)return;
    const saved=existing.map(p=>`<article class="order-photo-card" data-photo-id="${esc(p.id)}"><a href="${esc(p.url||'#')}" target="_blank" rel="noopener"><img src="${esc(p.url||'')}" alt="Foto anexada à OS" loading="lazy"></a><small title="${esc(p.file_name)}">${esc(p.file_name)}</small><button type="button" class="order-photo-remove" data-remove-saved="${esc(p.id)}" title="Excluir foto">×</button></article>`).join('');
    const queued=pending.map((p,i)=>`<article class="order-photo-card order-photo-pending"><a href="${esc(p.preview)}" target="_blank" rel="noopener"><img src="${esc(p.preview)}" alt="Foto aguardando envio"></a><small title="${esc(p.file.name)}">Aguardando envio</small><button type="button" class="order-photo-remove" data-remove-pending="${i}" title="Remover foto">×</button></article>`).join('');
    grid.innerHTML=saved+queued||'<small style="color:var(--muted)">Nenhuma foto anexada.</small>';
    grid.querySelectorAll('[data-remove-pending]').forEach(b=>b.onclick=()=>{const p=pending.splice(Number(b.dataset.removePending),1)[0];if(p?.preview)URL.revokeObjectURL(p.preview);render();status((existing.length+pending.length)+' de '+MAX_FILES+' fotos')});
    grid.querySelectorAll('[data-remove-saved]').forEach(b=>b.onclick=()=>removeSaved(b.dataset.removeSaved));
  }
  async function addFiles(list){
    const files=[...list||[]];if(!files.length)return;
    for(const file of files){
      if(existing.length+pending.length>=MAX_FILES){status('Limite de '+MAX_FILES+' fotos por OS.');break}
      if(!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)){status('Formato não aceito: '+file.name);continue}
      if(file.size>MAX_BYTES){status('A foto '+file.name+' ultrapassa 12 MB.');continue}
      pending.push({file,preview:URL.createObjectURL(file)});
    }
    $('orderPhotoInput').value='';render();status((existing.length+pending.length)+' de '+MAX_FILES+' fotos selecionadas. Elas serão enviadas ao salvar a OS.');
  }
  async function optimized(file){
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||file.size<900*1024)return file;
    try{
      const bitmap=await createImageBitmap(file);const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
      canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
      if(!blob||blob.size>=file.size)return file;
      const base=file.name.replace(/\.[^.]+$/,'')||'foto';
      return new File([blob],base+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
    }catch(_){return file}
  }
  async function load(orderId){
    mount();activeOrderId=String(orderId||'');existing=[];pending.forEach(p=>URL.revokeObjectURL(p.preview));pending=[];
    if(!activeOrderId){render();status('Até 10 fotos por OS. As imagens ficam salvas junto ao lançamento.');return}
    status('Carregando fotos da OS...');
    const {data,error}=await sb.from('order_photos').select('*').eq('order_id',activeOrderId).order('created_at');
    if(error){console.error('[OS fotos] leitura:',error);status('Não foi possível carregar as fotos: '+error.message);render();return}
    const items=data||[];
    for(const item of items){
      const signed=await sb.storage.from(BUCKET).createSignedUrl(item.storage_path,3600);
      existing.push({...item,url:signed.data?.signedUrl||''});
    }
    render();status(existing.length+' foto(s) anexada(s). Você pode adicionar mais '+(MAX_FILES-existing.length)+'.');
  }
  async function save(orderId){
    mount();const id=String(orderId||'');if(!id||!pending.length)return {ok:true};
    const userResult=await sb.auth.getUser();const user=userResult.data?.user;
    if(userResult.error||!user)return {ok:false,error:'Sua sessão expirou. Entre novamente para enviar as fotos.'};
    const toUpload=[...pending];status('Enviando '+toUpload.length+' foto(s)...');busy=true;$('orderPhotosPanel')?.classList.add('is-busy');
    try{
      for(const item of toUpload){
        const file=await optimized(item.file);
        const ext=(file.type.split('/')[1]||'jpg').replace('jpeg','jpg').replace(/[^a-z0-9]/g,'')||'jpg';
        const path=company.id+'/'+id+'/'+crypto.randomUUID()+'.'+ext;
        const up=await sb.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',contentType:file.type,upsert:false});
        if(up.error)throw new Error('Falha ao enviar '+item.file.name+': '+up.error.message);
        const meta=await sb.from('order_photos').insert({company_id:company.id,order_id:id,storage_path:path,file_name:item.file.name,mime_type:file.type,size_bytes:file.size,created_by:user.id}).select().single();
        if(meta.error){await sb.storage.from(BUCKET).remove([path]);throw new Error('A foto foi enviada, mas não foi possível registrar o anexo: '+meta.error.message)}
        const idx=pending.indexOf(item);if(idx>=0)pending.splice(idx,1);
        URL.revokeObjectURL(item.preview);
        const signed=await sb.storage.from(BUCKET).createSignedUrl(path,3600);
        existing.push({...meta.data,url:signed.data?.signedUrl||''});
        render();
      }
      status(existing.length+' foto(s) salva(s) na OS.');
      return {ok:true};
    }catch(error){console.error('[OS fotos] upload:',error);status(error.message);return {ok:false,error:error.message}}
    finally{busy=false;$('orderPhotosPanel')?.classList.remove('is-busy')}
  }
  async function removeSaved(photoId){
    const photo=existing.find(p=>p.id===photoId);if(!photo)return;
    if(!confirm('Excluir esta foto da ordem de serviço?'))return;
    const file=await sb.storage.from(BUCKET).remove([photo.storage_path]);
    if(file.error){status('Não foi possível excluir o arquivo: '+file.error.message);return}
    const row=await sb.from('order_photos').delete().eq('id',photoId);
    if(row.error){status('Arquivo removido, mas o registro não foi atualizado: '+row.error.message);return}
    existing=existing.filter(p=>p.id!==photoId);render();status(existing.length+' foto(s) anexada(s).');
  }
  async function removeAll(orderId){
    const {data,error}=await sb.from('order_photos').select('id,storage_path').eq('order_id',String(orderId));
    if(error)throw error;
    const paths=(data||[]).map(x=>x.storage_path);
    if(paths.length){const r=await sb.storage.from(BUCKET).remove(paths);if(r.error)throw r.error}
    const del=await sb.from('order_photos').delete().eq('order_id',String(orderId));
    if(del.error)throw del.error;
    return true;
  }
  function reset(){activeOrderId=null;existing=[];pending.forEach(p=>URL.revokeObjectURL(p.preview));pending=[];render();status('Até 10 fotos por OS. As imagens ficam salvas junto ao lançamento.')}
  window.loadOrderPhotos=load;
  window.saveOrderPhotos=save;
  window.resetOrderPhotos=reset;
  window.deleteAllOrderPhotos=removeAll;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
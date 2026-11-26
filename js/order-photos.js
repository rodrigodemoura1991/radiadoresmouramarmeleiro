/* Fotos da OS: ações compactas e galeria sob demanda. */
(function(){
 'use strict';
 const BUCKET='radiadores-os-photos',MAX_FILES=10,MAX_BYTES=12*1024*1024;
 const $=id=>document.getElementById(id);
 let pending=[],existing=[],activeOrderId=null,busy=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 function mount(){
  const form=$('order');if(!form||$('orderPhotosPanel'))return;
  const foot=form.querySelector('.foot');if(!foot)return;
  const panel=document.createElement('div');panel.id='orderPhotosPanel';panel.className='order-photos-actions';
  panel.innerHTML=`
   <label class="order-photo-add" for="orderPhotoInput">＋ Adicionar foto</label>
   <input id="orderPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden>
   <button type="button" id="orderPhotosView" class="order-photo-view">Ver fotos (0)</button>
   <span id="orderPhotoStatus" class="order-photo-status" aria-live="polite"></span>
   <div id="orderPhotosModal" class="order-photos-modal" aria-hidden="true">
    <div class="order-photos-dialog" role="dialog" aria-modal="true" aria-labelledby="orderPhotosTitle">
     <div class="order-photos-dialog-head"><strong id="orderPhotosTitle">Fotos do serviço</strong><button type="button" id="orderPhotosClose" aria-label="Fechar">✕</button></div>
     <p class="order-photos-help">Até 10 fotos por ordem de serviço. Fotos novas são enviadas ao salvar o lançamento.</p>
     <div id="orderPhotoGrid" class="order-photo-grid"></div>
    </div>
   </div>
   <div id="orderPhotoLightbox" class="order-photo-lightbox" aria-hidden="true">
    <div class="order-photo-lightbox-panel" role="dialog" aria-modal="true" aria-label="Foto ampliada">
     <button type="button" id="orderPhotoLightboxClose" class="order-photo-lightbox-close" aria-label="Fechar foto">✕</button>
     <img id="orderPhotoLightboxImage" alt="Foto ampliada do serviço">
     <div id="orderPhotoLightboxCaption" class="order-photo-lightbox-caption"></div>
    </div>
   </div>`;
  foot.insertBefore(panel,foot.firstChild);
  const style=document.createElement('style');style.id='order-photos-style';style.textContent=`
   #orderPhotosPanel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 auto 0 0;min-width:0}
   .order-photo-add,.order-photo-view{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:6px 11px;border:1px solid #cbd8e8;border-radius:8px;background:#fff;color:#173b67;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
   .order-photo-add:hover,.order-photo-view:hover{background:#edf4fc}
   .order-photo-status{font-size:10px;color:var(--muted,#718096)}
   #orderPhotosModal{display:none;position:fixed;inset:0;z-index:10050;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.58)}
   #orderPhotosModal.is-open{display:flex}
   #orderPhotoLightbox{display:none;position:fixed;inset:0;z-index:10070;align-items:center;justify-content:center;padding:24px;background:rgba(4,10,20,.88)}
   #orderPhotoLightbox.is-open{display:flex}
   .order-photo-lightbox-panel{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:min(1100px,100%);height:min(92vh,900px);min-height:0}
   #orderPhotoLightboxImage{display:block;max-width:100%;max-height:calc(100% - 34px);width:auto;height:auto;object-fit:contain;border-radius:8px;box-shadow:0 12px 45px #0008}
   .order-photo-lightbox-close{position:absolute;right:0;top:-12px;z-index:2;width:38px;height:38px;border:0;border-radius:50%;background:#fff;color:#172b46;font-size:20px;font-weight:900;cursor:pointer;box-shadow:0 2px 12px #0005}
   .order-photo-lightbox-caption{max-width:100%;color:#fff;font-size:12px;text-align:center;overflow-wrap:anywhere}
   .order-photos-dialog{width:min(620px,100%);max-height:min(78vh,680px);overflow:auto;background:#fff;border-radius:14px;padding:16px;box-shadow:0 18px 55px #0004}
   .order-photos-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
   .order-photos-dialog-head strong{font-size:15px;color:#172b46}
   #orderPhotosClose{width:34px;height:34px;border:0;border-radius:8px;background:#eef2f7;color:#26384f;font-weight:900;cursor:pointer}
   .order-photos-help{font-size:11px;color:#718096;margin:7px 0 12px}
   .order-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:9px}
   .order-photo-card{position:relative;min-width:0;border:1px solid #dce5ef;border-radius:9px;overflow:hidden;background:#fff}
   .order-photo-card a{display:block;aspect-ratio:4/3;background:#eef2f7}
   .order-photo-card img{width:100%;height:100%;object-fit:cover;display:block}
   .order-photo-card small{display:block;padding:5px 6px;font-size:10px;color:#53657c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
   .order-photo-remove{position:absolute;right:5px;top:5px;border:0;border-radius:50%;width:25px;height:25px;background:#fff;color:#b42318;font-weight:900;box-shadow:0 1px 5px #0003;cursor:pointer}
   #orderPhotosPanel.is-busy{opacity:.65;pointer-events:none}
   @media(max-width:600px){.order-photo-add,.order-photo-view{min-height:40px;font-size:12px}.order-photos-dialog{padding:12px}.order-photo-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#orderPhotoLightbox{padding:12px}.order-photo-lightbox-panel{height:94vh}.order-photo-lightbox-close{right:2px;top:2px}}
  `;
  document.head.appendChild(style);
  $('orderPhotoInput').addEventListener('change',e=>addFiles(e.target.files));
  $('orderPhotosView').addEventListener('click',openGallery);
  $('orderPhotosClose').addEventListener('click',closeGallery);
  $('orderPhotosModal').addEventListener('click',e=>{if(e.target.id==='orderPhotosModal')closeGallery()});
  $('orderPhotoLightboxClose').addEventListener('click',closePreview);
  $('orderPhotoLightbox').addEventListener('click',e=>{if(e.target.id==='orderPhotoLightbox')closePreview()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('orderPhotoLightbox')?.classList.contains('is-open'))closePreview();else closeGallery()}});
  render();
 }
 function status(message){const el=$('orderPhotoStatus');if(el)el.textContent=message}
 function openGallery(){const m=$('orderPhotosModal');if(!m)return;m.classList.add('is-open');m.setAttribute('aria-hidden','false');render()}
 function closeGallery(){closePreview();const m=$('orderPhotosModal');if(!m)return;m.classList.remove('is-open');m.setAttribute('aria-hidden','true')}
 function openPreview(src,name){
  if(!src)return;
  const modal=$('orderPhotoLightbox'),img=$('orderPhotoLightboxImage'),caption=$('orderPhotoLightboxCaption');
  img.src=src;img.alt=name||'Foto ampliada do serviço';caption.textContent=name||'';
  modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
  $('orderPhotoLightboxClose')?.focus();
 }
 function closePreview(){
  const modal=$('orderPhotoLightbox');if(!modal)return;
  modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');
  const img=$('orderPhotoLightboxImage');if(img)img.removeAttribute('src');
 }
 function render(){
  const grid=$('orderPhotoGrid');if(!grid)return;
  const saved=existing.map(p=>`<article class="order-photo-card"><button type="button" class="order-photo-open" data-preview-src="${esc(p.url||'')}" data-preview-name="${esc(p.file_name||'Foto do serviço')}" style="display:block;width:100%;padding:0;border:0;background:transparent;cursor:zoom-in"><img src="${esc(p.url||'')}" alt="Foto anexada à OS" loading="lazy"></button><small title="${esc(p.file_name)}">${esc(p.file_name)}</small><button type="button" class="order-photo-remove" data-remove-saved="${esc(p.id)}" title="Excluir foto">×</button></article>`).join('');
  const queued=pending.map((p,i)=>`<article class="order-photo-card"><button type="button" class="order-photo-open" data-preview-src="${esc(p.preview)}" data-preview-name="Foto aguardando envio" style="display:block;width:100%;padding:0;border:0;background:transparent;cursor:zoom-in"><img src="${esc(p.preview)}" alt="Foto aguardando envio"></button><small title="${esc(p.file.name)}">Aguardando envio</small><button type="button" class="order-photo-remove" data-remove-pending="${i}" title="Remover foto">×</button></article>`).join('');
  grid.innerHTML=saved+queued||'<p style="color:#718096;font-size:12px">Nenhuma foto adicionada.</p>';
  grid.querySelectorAll('[data-preview-src]').forEach(b=>b.onclick=()=>openPreview(b.dataset.previewSrc,b.dataset.previewName));
  grid.querySelectorAll('[data-remove-pending]').forEach(b=>b.onclick=()=>{const p=pending.splice(Number(b.dataset.removePending),1)[0];if(p?.preview)URL.revokeObjectURL(p.preview);render();updateCount()});
  grid.querySelectorAll('[data-remove-saved]').forEach(b=>b.onclick=()=>removeSaved(b.dataset.removeSaved));
  updateCount();
 }
 function updateCount(){const b=$('orderPhotosView');if(b)b.textContent='Ver fotos ('+(existing.length+pending.length)+')'}
 async function addFiles(list){
  const files=[...list||[]];if(!files.length)return;
  for(const file of files){
   if(existing.length+pending.length>=MAX_FILES){status('Limite de '+MAX_FILES+' fotos por OS.');break}
   if(!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)){status('Formato não aceito: '+file.name);continue}
   if(file.size>MAX_BYTES){status('A foto '+file.name+' ultrapassa 12 MB.');continue}
   pending.push({file,preview:URL.createObjectURL(file)});
  }
  $('orderPhotoInput').value='';render();if(activeOrderId&&pending.length){await save(activeOrderId)}else{status(pending.length?'Será enviada ao salvar o lançamento':'')}
 }
 async function optimized(file){
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||file.size<900*1024)return file;
  try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));if(!blob||blob.size>=file.size)return file;return new File([blob],(file.name.replace(/\.[^.]+$/,'')||'foto')+'.jpg',{type:'image/jpeg',lastModified:Date.now()})}catch(_){return file}
 }
 async function load(orderId){
  mount();activeOrderId=String(orderId||'');existing=[];pending.forEach(p=>URL.revokeObjectURL(p.preview));pending=[];
  if(!activeOrderId){render();status('');return}
  status('Carregando fotos...');
  const {data,error}=await sb.from('order_photos').select('*').eq('order_id',activeOrderId).order('created_at');
  if(error){console.error('[OS fotos] leitura:',error);status('Falha ao carregar fotos');render();return}
  for(const item of data||[]){const signed=await sb.storage.from(BUCKET).createSignedUrl(item.storage_path,3600);existing.push({...item,url:signed.data?.signedUrl||''})}
  render();status('');
 }
 async function save(orderId){
  mount();const id=String(orderId||'');if(!id||!pending.length)return {ok:true};
  const userResult=await sb.auth.getUser(),user=userResult.data?.user;
  if(userResult.error||!user)return {ok:false,error:'Sua sessão expirou. Entre novamente para enviar as fotos.'};
  const toUpload=[...pending];status('Enviando fotos...');busy=true;$('orderPhotosPanel')?.classList.add('is-busy');
  try{
   for(const item of toUpload){
    const file=await optimized(item.file),ext=(file.type.split('/')[1]||'jpg').replace('jpeg','jpg').replace(/[^a-z0-9]/g,'')||'jpg',path=company.id+'/'+id+'/'+crypto.randomUUID()+'.'+ext;
    const up=await sb.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',contentType:file.type,upsert:false});
    if(up.error)throw new Error('Falha ao enviar '+item.file.name+': '+up.error.message);
    const meta=await sb.from('order_photos').insert({company_id:company.id,order_id:id,storage_path:path,file_name:item.file.name,mime_type:file.type,size_bytes:file.size,created_by:user.id}).select().single();
    if(meta.error){await sb.storage.from(BUCKET).remove([path]);throw new Error('Não foi possível registrar a foto: '+meta.error.message)}
    const idx=pending.indexOf(item);if(idx>=0)pending.splice(idx,1);URL.revokeObjectURL(item.preview);
    const signed=await sb.storage.from(BUCKET).createSignedUrl(path,3600);existing.push({...meta.data,url:signed.data?.signedUrl||''});render();
   }
   status('');return {ok:true};
  }catch(error){console.error('[OS fotos] upload:',error);status('Falha ao enviar fotos');return {ok:false,error:error.message}}
  finally{busy=false;$('orderPhotosPanel')?.classList.remove('is-busy')}
 }
 async function removeSaved(photoId){
  const photo=existing.find(p=>p.id===photoId);if(!photo||!confirm('Excluir esta foto da ordem de serviço?'))return;
  const file=await sb.storage.from(BUCKET).remove([photo.storage_path]);if(file.error){status('Não foi possível excluir a foto');return}
  const row=await sb.from('order_photos').delete().eq('id',photoId);if(row.error){status('Registro da foto não foi atualizado');return}
  existing=existing.filter(p=>p.id!==photoId);render();
 }
 async function removeAll(orderId){
  const {data,error}=await sb.from('order_photos').select('id,storage_path').eq('order_id',String(orderId));if(error)throw error;
  const paths=(data||[]).map(x=>x.storage_path);if(paths.length){const r=await sb.storage.from(BUCKET).remove(paths);if(r.error)throw r.error}
  const del=await sb.from('order_photos').delete().eq('order_id',String(orderId));if(del.error)throw del.error;return true;
 }
 function reset(){activeOrderId=null;existing=[];pending.forEach(p=>URL.revokeObjectURL(p.preview));pending=[];render();status('');closeGallery()}
 window.loadOrderPhotos=load;window.saveOrderPhotos=save;window.resetOrderPhotos=reset;window.deleteAllOrderPhotos=removeAll;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
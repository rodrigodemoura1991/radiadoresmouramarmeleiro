/* Uppercase all user-entered text throughout the app while preserving numeric/date/email/url inputs. */
(function(){
'use strict';
const SKIP_TYPES=new Set(['number','date','datetime-local','month','week','time','email','url','password','hidden','file','range','color']);
function shouldUpper(el){
 if(!el||!el.matches||!el.matches('input,textarea,[contenteditable="true"],[role="textbox"]'))return false;
 if(el.dataset.uppercaseSkip==='true'||el.closest('[data-uppercase-skip="true"]'))return false;
 if(el.tagName==='INPUT'&&SKIP_TYPES.has(String(el.type||'text').toLowerCase()))return false;
 if(el.isContentEditable||el.getAttribute('role')==='textbox')return true;
 return el.tagName==='TEXTAREA'||el.tagName==='INPUT';
}
function uppercase(el){
 if(!shouldUpper(el))return;
 const old=el.value;
 if(typeof old!=='string')return;
 const start=typeof el.selectionStart==='number'?el.selectionStart:null;
 const end=typeof el.selectionEnd==='number'?el.selectionEnd:null;
 const upper=old.toLocaleUpperCase('pt-BR');
 if(old===upper)return;
 const focused=document.activeElement===el;
 el.value=upper;
 if(focused&&start!==null&&end!==null){try{el.setSelectionRange(start,end)}catch(e){}}
}
document.addEventListener('input',e=>uppercase(e.target),true);
document.addEventListener('change',e=>uppercase(e.target),true);
function scan(root=document){root.querySelectorAll?.('input,textarea,[contenteditable="true"],[role="textbox"]').forEach(el=>{if(el.value)uppercase(el);else if(el.isContentEditable)el.textContent=el.textContent.toLocaleUpperCase('pt-BR')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(),{once:true});else scan();
const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('input,textarea,[contenteditable="true"],[role="textbox"]'))uppercase(n);scan(n)}})));
function observe(){if(document.body)observer.observe(document.body,{childList:true,subtree:true})}
if(document.body)observe();else document.addEventListener('DOMContentLoaded',observe,{once:true});
window.enforceUppercaseInputs=scan;
})();

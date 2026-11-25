/* Ativa o modo compacto quando aberto pelo atalho exclusivo do celular. */
(function(){
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('modo')!=='rapido')return;
 document.documentElement.classList.add('quick-launch-mode');
 const css=document.createElement('link');css.rel='stylesheet';css.href='./css/quick-launch.css?v=quick1';document.head.appendChild(css);
 function mount(){
  if(document.getElementById('quickLaunchBar'))return;
  const bar=document.createElement('div');bar.id='quickLaunchBar';
  bar.innerHTML='<div><strong>Radiadores Moura</strong><small>Lançamentos rápidos</small></div><button type="button" id="quickLaunchExit">Sair</button>';
  document.body.insertBefore(bar,document.body.firstChild);
  const exit=document.getElementById('quickLaunchExit');
  if(exit)exit.addEventListener('click',()=>document.getElementById('logout')?.click());
  const heading=document.querySelector('#launch>.head h1');
  if(heading)heading.textContent='Lançamentos';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

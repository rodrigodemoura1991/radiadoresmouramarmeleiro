(function(){
'use strict';
const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const [y,m,d]=String(s||'').split('-').map(Number);return y&&m&&d?new Date(y,m-1,d):null};
const fmt=d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
const monthFmt=d=>d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
let cursor=new Date(),selected=iso(new Date()),city='marmeleiro';
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da)}
function holidayMap(y){
 const map={};const add=(date,name,type,scope)=>{(map[date]||(map[date]=[])).push({name,type,scope})};
 [[1,1,'Confraternização Universal'],[4,21,'Tiradentes'],[5,1,'Dia do Trabalho'],[9,7,'Independência do Brasil'],[10,12,'Nossa Senhora Aparecida'],[11,2,'Finados'],[11,15,'Proclamação da República'],[11,20,'Dia Nacional de Zumbi e da Consciência Negra'],[12,25,'Natal']].forEach(([m,d,n])=>add(y+'-'+pad(m)+'-'+pad(d),n,'national','Nacional'));
 const gf=easter(y);gf.setDate(gf.getDate()-2);add(iso(gf),'Paixão de Cristo','national','Nacional');
 if(city==='marmeleiro'){add(y+'-05-22','Santa Rita de Cássia — Padroeira de Marmeleiro','municipal','Marmeleiro');add(y+'-11-25','Emancipação Política de Marmeleiro','municipal','Marmeleiro')}
 else{add(y+'-08-15','Festa da Padroeira de Francisco Beltrão','municipal','Francisco Beltrão');add(y+'-11-14','Emancipação Política de Francisco Beltrão','municipal','Francisco Beltrão')}
 const carnival=easter(y);carnival.setDate(carnival.getDate()-47);add(iso(carnival),'Carnaval','optional','Referência de ponto facultativo');const carnival2=new Date(carnival);carnival2.setDate(carnival2.getDate()+1);add(iso(carnival2),'Carnaval','optional','Referência de ponto facultativo');const ash=new Date(carnival);ash.setDate(ash.getDate()+2);add(iso(ash),'Quarta-feira de Cinzas','optional','Referência de ponto facultativo');const corpus=easter(y);corpus.setDate(corpus.getDate()+60);add(iso(corpus),'Corpus Christi','optional','Referência de ponto facultativo');
 if(y===2026)[['2026-04-02','Ponto facultativo — Governo do Paraná'],['2026-04-20','Ponto facultativo — Governo do Paraná'],['2026-06-05','Ponto facultativo — Governo do Paraná']].forEach(x=>add(x[0],x[1],'optional','Decreto estadual 12.134/2025'));
 return map;
}
function dayOrders(date){return(window.orders||[]).filter(o=>o.exit_date===date)}
function render(){
 const grid=$('calendarGrid');if(!grid)return;$('calendarMonthTitle').textContent=monthFmt(cursor);
 const y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,start=new Date(y,m,1-offset);grid.innerHTML='';
 for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const date=iso(d),hol=holidayMap(d.getFullYear())[date]||[],orders=dayOrders(date),b=document.createElement('button');b.type='button';b.className='calendar-day'+(d.getMonth()!==m?' outside':'')+(date===iso(new Date())?' today':'')+(date===selected?' selected':'');if(hol.some(x=>x.type==='national'))b.classList.add('holiday-national');else if(hol.some(x=>x.type==='municipal'))b.classList.add('holiday-municipal');else if(hol.length)b.classList.add('holiday-optional');const label=hol[0];b.innerHTML='<span class="day-number">'+d.getDate()+'</span>'+(label?'<span class="day-label"><i class="holiday-dot"></i>'+label.name+'</span>':'')+(orders.length?'<span class="day-count">'+orders.length+' saída'+(orders.length>1?'s':'')+'</span>':'');b.onclick=()=>{selected=date;render();};grid.appendChild(b)}
 renderSelected();renderUpcoming();
}
function renderSelected(){
 const title=$('calendarSelectedTitle'),box=$('calendarDayEvents');if(!title||!box)return;const d=parse(selected);title.textContent=d?fmt(d):'Selecione uma data';const holidays=d?(holidayMap(d.getFullYear())[selected]||[]):[],orders=selected?dayOrders(selected):[];
 let html=holidays.map(x=>'<div class="calendar-event '+(x.type==='municipal'?'municipal':x.type==='optional'?'optional':'holiday')+'"><b>'+x.name+'</b><small>'+x.scope+'</small></div>').join('');
 html+=orders.map(o=>'<div class="calendar-event"><div class="calendar-order"><span>'+String(o.client_name||'Sem cliente').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+' · OS '+(o.order_number||o.id||'')+'</span><button class="btn primary" data-open-order="'+o.id+'">Abrir</button></div><small>'+(o.vehicle_make_model||'')+(o.plate?' · '+o.plate:'')+' · '+(o.order_items||[]).length+' serviço(s)</small></div>').join('');
 if(!holidays.length&&!orders.length)html='<div class="calendar-empty">Nenhum feriado ou serviço previsto para esta data.</div>';box.innerHTML=html;
 box.querySelectorAll('[data-open-order]').forEach(b=>b.onclick=()=>{window.calendarSelectedExitDate=selected;document.querySelector('.nav[data-view="launch"]')?.click();document.querySelector('#launchList [data-id="'+b.dataset.openOrder+'"]')?.click()});
}
function renderUpcoming(){const box=$('calendarUpcoming');if(!box)return;const now=new Date();now.setHours(0,0,0,0);const end=new Date(now);end.setDate(end.getDate()+370);let all=[];for(let y=now.getFullYear();y<=end.getFullYear();y++)Object.entries(holidayMap(y)).forEach(([date,items])=>{const d=parse(date);if(d>=now&&d<=end)items.forEach(x=>all.push({date,name:x.name}))});all.sort((a,b)=>a.date.localeCompare(b.date));box.innerHTML=all.slice(0,7).map(x=>'<div class="calendar-upcoming-item"><b>'+parse(x.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+'</b><span>'+x.name+'</span></div>').join('')||'<div class="calendar-empty">Nenhum feriado próximo.</div>'}
function init(){if(!$('calendarGrid'))return;const select=$('calendarCity');try{const saved=localStorage.getItem('radiadoresCalendarCity');if(saved==='marmeleiro'||saved==='beltrao')city=saved;else city='marmeleiro'}catch(_){}select.value=city;select.onchange=()=>{city=select.value;try{localStorage.setItem('radiadoresCalendarCity',city)}catch(_){}render()};$('calendarPrev').onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()-1,1);render()};$('calendarNext').onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);render()};$('calendarToday').onclick=()=>{cursor=new Date();selected=iso(cursor);render()};$('calendarClearDate').onclick=()=>{selected='';window.calendarSelectedExitDate=null;renderSelected();render()};window.renderCalendar=render;render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
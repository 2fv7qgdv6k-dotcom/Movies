(function(){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
// one normal shape for the owner's films and for the friends' shared films
const norm=f=>({id:f.id,title:f.title||(f.d&&f.d.title)||'',year:String(f.year||(f.d&&f.d.year)||''),
 directors:f.directors||(f.d&&f.d.directors)||[],cast:(f.cast||(f.d&&f.d.cast)||[]).map(c=>c.n||c).filter(Boolean),
 series:f.series||(f.d&&f.d.collection)||''});
function fourOptions(correct,pool){const others=shuffle([...new Set(pool.filter(x=>x&&x!==correct))]).slice(0,3);
 return others.length===3?shuffle([correct,...others]):null}
function makeQ(list,type,used){
 for(const f of shuffle(list.filter(x=>!used.has(x.id)))){
  if(type==='dir'&&f.directors.length&&f.year){
   const opts=fourOptions(f.directors[0],list.map(x=>x.directors[0]));
   if(opts)return {id:f.id,q:`Wer hat „${f.title}“ (${f.year}) inszeniert?`,opts,answer:f.directors[0]}}
  if(type==='cast'&&f.cast.length){
   const correct=shuffle(f.cast)[0];
   const others=[...new Set(list.filter(x=>!x.cast.includes(correct)).flatMap(x=>x.cast))];
   const opts=fourOptions(correct,others);
   if(opts)return {id:f.id,q:`Welcher dieser Schauspieler spielt in „${f.title}“ mit?`,opts,answer:correct}}
  if(type==='year'&&f.year){
   const y=+f.year;const opts=[String(y)];
   for(const k of shuffle([-6,-4,-3,-2,2,3,4,5,6,8,10])){if(opts.length>=4)break;opts.push(String(y+k))}
   if(opts.length===4)return {id:f.id,q:`In welchem Jahr kam „${f.title}“ ins Kino?`,opts:shuffle(opts),answer:String(y)}}
  if(type==='series'&&f.series){
   const opts=fourOptions(f.series,list.map(x=>x.series));
   if(opts)return {id:f.id,q:`Zu welcher Reihe gehört „${f.title}“?`,opts,answer:f.series}}
 }
 return null}
function buildQuiz(raw,n){
 const list=raw.map(norm).filter(f=>f.title&&f.year);
 const types=['dir','cast','year','series'];const qs=[];const used=new Set();let tries=0;
 while(qs.length<n&&tries++<300){
  const t=types[qs.length%types.length];
  const q=makeQ(list,t,used)||makeQ(list,types[Math.floor(Math.random()*4)],used);
  if(!q)continue;used.add(q.id);qs.push(q)}
 return qs}
const CSS=`.qhead{font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:8px}
.qq{font-size:20px;font-weight:700;letter-spacing:-.3px;line-height:1.25;margin:4px 0 16px}
.qopts{display:flex;flex-direction:column;gap:9px}
.qopt{width:100%;text-align:left;padding:14px 16px;border-radius:16px;border:1px solid var(--bd);background:var(--glass2);color:var(--fg);font:inherit;font-size:16px;cursor:pointer}
.qopt.ok{background:#1e8e3e;color:#fff;border-color:transparent}
.qopt.bad{background:#e0463b;color:#fff;border-color:transparent}
.qopt:disabled{opacity:.9;cursor:default}
.qnext{margin-top:12px;text-align:center;font-weight:600}`;
function style(){if(document.getElementById('quizcss'))return;const s=document.createElement('style');s.id='quizcss';s.textContent=CSS;document.head.appendChild(s)}
function renderQuiz(el,raw,onClose){
 style();
 let qs=buildQuiz(raw,5),i=0,score=0,answered=false;
 const none=()=>{el.innerHTML=`<p>Dafür sind noch zu wenige Filme mit vollständigen Angaben vorhanden.</p><div class="qopts"><button class="qopt" data-act="close">Schließen</button></div>`};
 const show=()=>{const q=qs[i];answered=false;
  el.innerHTML=`<div class="qhead">Frage ${i+1} von ${qs.length}</div><div class="qq">${esc(q.q)}</div>
  <div class="qopts">${q.opts.map((o,k)=>`<button class="qopt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div id="qnx"></div>`};
 const finish=()=>{el.innerHTML=`<div class="qhead">Ergebnis</div><div class="qq">${score} von ${qs.length} richtig</div>
  <div class="qopts"><button class="qopt" data-act="again">Nochmal spielen</button><button class="qopt" data-act="close">Schließen</button></div>`};
 if(!qs.length)none();else show();
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.act==='close'){onClose&&onClose();return}
  if(b.dataset.act==='again'){qs=buildQuiz(raw,5);i=0;score=0;if(!qs.length)none();else show();return}
  if(b.dataset.act==='next'){i++;i<qs.length?show():finish();return}
  if(b.dataset.k!==undefined&&!answered){answered=true;const q=qs[i];
   el.querySelectorAll('.qopt[data-k]').forEach(x=>{x.disabled=true;if(x.textContent===q.answer)x.classList.add('ok')});
   if(b.textContent===q.answer)score++;else b.classList.add('bad');
   document.getElementById('qnx').innerHTML=`<button class="qopt qnext" data-act="next">${i+1<qs.length?'Weiter':'Ergebnis anzeigen'}</button>`}
 }}
window.Quiz={renderQuiz};
})();

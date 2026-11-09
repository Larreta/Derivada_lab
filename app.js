'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'derivada-lab-v2';
let database = {profiles:{},lastName:''}, profile, current, attempt, ticker, mode='guest', installPrompt;
let authBusy=false, syncJob=null, lastAlert='', startNonce=0, answerBusy=false, syncAgain=false;
function readLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved?.profiles && typeof saved.profiles==='object' && !Array.isArray(saved.profiles)) return saved;
    const old = JSON.parse(localStorage.getItem('derivada-lab-v1'));
    if(old?.profiles) {
      for(const [name,p] of Object.entries(old.profiles)) {
        if(!p || typeof p.name!=='string') continue;
        const records={};
        for(const id of p.solved || []) if(RETOS.some(r=>r.id===id)) records[id]={points:100,bestMs:Game.duration(RETOS.find(r=>r.id===id))*1000};
        database.profiles['guest:'+name]={name:p.name,records,attempts:{}};
      }
      database.lastName=old.lastName || '';
    }
  } catch { $('storage-warning').hidden=false; }
  return database;
}
database=readLocal();
function save() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(database)); } catch { $('storage-warning').hidden=false; } }
function guestVariantSlot(previous){
 if(Number.isInteger(previous)&&previous>=0&&previous<VARIANT_CAPACITY)return previous;
 const used=new Set(Object.values(database.profiles).filter(p=>p&&!p.cloud).map(p=>p.variantSlot));
 let candidate=crypto.getRandomValues(new Uint32Array(1))[0]%VARIANT_CAPACITY;
 for(let i=0;i<VARIANT_CAPACITY;i++){const value=(candidate+i)%VARIANT_CAPACITY;if(!used.has(value))return value;}
 throw new Error('No hay más perfiles disponibles en este navegador.');
}
function loadProfile(key,name,cloud=false) {
  const p=Object.hasOwn(database.profiles,key) ? database.profiles[key] : null;
  const records={};
  for(const r of RETOS) { const rec=p?.records?.[r.id]; if(rec && Number.isFinite(rec.points) && Number.isFinite(rec.bestMs)) records[r.id]={points:Math.min(150,Math.max(100,rec.points)),bestMs:Math.max(0,rec.bestMs)}; }
  const next={name,key,cloud,variantSlot:cloud?null:guestVariantSlot(p?.variantSlot),assignedSeeds:p?.assignedSeeds||{},records,history:Array.isArray(p?.history)?p.history:[],lessons:Array.isArray(p?.lessons)?p.lessons:[],attempts:p?.attempts && typeof p.attempts==='object' ? p.attempts : {}};
  Object.defineProperty(database.profiles,key,{value:next,writable:true,enumerable:true,configurable:true});
  return next;
}
function setMode(next) {
  mode=next;
  for(const m of ['guest','login','signup']) $('tab-'+m).setAttribute('aria-pressed',String(m===mode));
  const account=mode!=='guest';
  $('name-group').hidden=mode==='login'; $('student-name').required=mode!=='login';
  $('credentials').hidden=!account; $('email').required=account; $('password').required=account;
  $('password').autocomplete=mode==='signup' ? 'new-password' : 'current-password';
  $('enter').disabled=authBusy || (account && !Cloud.enabled);
  $('enter').textContent=mode==='guest' ? 'Entrar como invitado ↗' : mode==='signup' ? 'Crear mi cuenta ↗' : 'Iniciar sesión ↗';
  $('account-status').textContent=account && !Cloud.enabled ? 'El registro aún no está conectado. Por ahora puedes explorar y practicar como invitado.' : '';
  $('forgot-password').hidden=mode!=='login'||!Cloud.enabled;
  $('entry-note').textContent=account ? 'Tu cuenta guarda tus resultados en línea. La recuperación de acceso se realiza por correo.' : 'Invitado: práctica aleatoria que puede coincidir con otros. Crea una cuenta para recibir una versión exclusiva.';
  $('auth-feedback').textContent='';
}
for(const m of ['guest','login','signup']) $('tab-'+m).addEventListener('click',()=>{if(!authBusy)setMode(m)});
function enterWorkspace(next) {
  profile=next; save(); document.body.classList.add('app-active');
  $('filter').value=$('student-level').value;
  $('welcome').hidden=true; $('workspace').hidden=false;
  $('session-label').textContent=profile.cloud ? '● Cuenta conectada' : '◌ Modo invitado';
  $('sync').hidden=!profile.cloud;
  $('sync-status').textContent=profile.cloud ? 'Preparando sincronización…' : 'Invitado: tus datos se guardan en este navegador. Para problemas exclusivos entre estudiantes, entra con una cuenta.';
  render(); window.Pro?.enter(); $('greeting').focus(); window.scrollTo(0,0);
  if(profile.cloud) void syncProgress();
}
$('entry-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(authBusy)return;
  const chosenMode=mode;
  const name=$('student-name').value.trim();
  if(chosenMode!=='login' && !name){$('student-name').setCustomValidity('Escribe tu nombre para continuar.');$('student-name').reportValidity();return;}
  if(chosenMode==='guest') {
    database.lastName=name;
    enterWorkspace(loadProfile('guest:'+name.toLocaleLowerCase('es'),name)); return;
  }
  authBusy=true; $('enter').disabled=true; $('auth-feedback').textContent='Conectando…';
  try {
    const email=$('email').value.trim(), password=$('password').value;
    const result=chosenMode==='signup' ? await Cloud.signup(name,email,password) : {user:await Cloud.login(email,password)};
    const user=result.user;
    $('password').value='';
    if(user) {enterWorkspace(loadProfile('user:'+user.id,user.user_metadata?.display_name || 'Estudiante',true));}
    else { setMode('login'); $('auth-feedback').textContent='Si el registro fue aceptado, recibirás un correo de confirmación. Revisa tu bandeja y luego inicia sesión.'; }
  } catch(error) { $('auth-feedback').textContent=error.message; }
  finally { authBusy=false; $('enter').disabled=mode!=='guest' && !Cloud.enabled; }
});
$('student-name').addEventListener('input',()=>$('student-name').setCustomValidity(''));
if(typeof database.lastName==='string')$('student-name').value=database.lastName;
function completed(){return RETOS.filter(r=>profile.records[r.id]).length;}
function render() {
  if(!profile)return;
  const n=completed(), xp=Object.values(profile.records).reduce((sum,r)=>sum+r.points,0);
  $('greeting').textContent=`Hola, ${profile.name}.`;
  $('solved-count').textContent=`${n} / ${RETOS.length}`;
  $('xp').textContent=`${xp} XP`;
  $('rank').textContent=n===RETOS.length?'Maestro del cambio':n>=24?'Estratega':n>=12?'Investigador':'Explorador';
  $('journey-progress').max=RETOS.length; $('journey-progress').value=n;
  $('progress-percent').textContent=Math.round(n/RETOS.length*100)+'%';
  $('journey-caption').textContent=n===RETOS.length?'¡Laboratorio conquistado! Sigue mejorando tus marcas.':`${RETOS.length-n} misiones por descubrir`;
  $('medals').replaceChildren();
  const fast=Object.values(profile.records).some(r=>r.points>=125);
  for(const [icon,label,unlocked] of [['✦','Primer logro',n>=1],['◷','Mente veloz',fast],['◇','Investigador',n>=12],['♜','Estratega',n>=24],['✧','Maestro',n===RETOS.length]]) {
    const item=document.createElement('span'); item.className=unlocked?'medal unlocked':'medal'; item.textContent=`${icon} ${label}`; item.title=unlocked?'Medalla conseguida':'Aún por conseguir'; $('medals').append(item);
  }
  $('challenge-grid').replaceChildren();
  const query=($('mission-search').value||'').trim().toLocaleLowerCase('es');
  const matches=RETOS.filter(r=>($('filter').value==='all'||r.level===$('filter').value) && (r.title+' '+r.area+' '+r.desc).toLocaleLowerCase('es').includes(query) && ($('status-filter').value==='all'||($('status-filter').value==='done'?!!profile.records[r.id]:!profile.records[r.id])));
  $('mission-count').textContent=matches.length ? `${matches.length} misiones · Elige una para comenzar` : 'No hay misiones con esos filtros. Prueba otra búsqueda.';
  matches.forEach(r=>{
    const rec=profile.records[r.id]; const button=document.createElement('button'); button.className=`challenge-card ${rec?'done':''}`;
    button.innerHTML=`<span class="card-top"><span class="card-symbol">${r.icon}</span><span>${r.level} · ◷ ${Game.format(Game.duration(r)*1000)}</span></span><h3>${r.title}</h3><p>${r.desc}</p><span class="card-bottom"><span>${r.area}</span><span>${rec ? `✓ ${rec.points} XP · mejorar ↗` : 'Hasta 150 XP ↗'}</span></span>`;
    if(rec){const best=document.createElement('small');best.className='best-time';best.textContent=`Mejor tiempo: ${Game.format(rec.bestMs)}`;button.append(best);}
    button.addEventListener('click',()=>openChallenge(r.id)); $('challenge-grid').append(button);
  });
  window.Pro?.refresh();
}
async function syncProgress() {
  if(!profile?.cloud)return;
  if(syncJob){syncAgain=true;return syncJob;}
  const target=profile;$('sync').disabled=true;$('sync-status').textContent='Actualizando tu progreso…';
  syncJob=(async()=>{
    try{
      const [remote,history]=await Promise.all([Cloud.results(),Cloud.history()]);if(profile!==target)return;
      target.records={};
      for(const row of remote)if(RETOS.some(r=>r.id===row.challenge_id))target.records[row.challenge_id]={points:row.points,bestMs:row.best_ms,updatedAt:row.updated_at};
      target.history=history;save();render();$('sync-status').textContent='✓ Progreso guardado en tu cuenta.';
    }catch(error){if(profile===target)$('sync-status').textContent=error.message+' Tus resultados ya confirmados siguen guardados en el servidor.';}
    finally{if(profile===target)$('sync').disabled=false;}
  })();await syncJob;syncJob=null;if(syncAgain){syncAgain=false;if(profile?.cloud)return syncProgress();}
}
$('sync').addEventListener('click',()=>void syncProgress());
window.addEventListener('online',()=>{if(profile?.cloud)void syncProgress()});
function reveal(show) {
  $('variant-notice').hidden=!show;
  for(const id of ['challenge-story','challenge-formula','challenge-question','answer-form'])$(id).hidden=!show;
}
function message(text,kind=''){$('feedback').textContent=text;$('feedback').className=kind;}
function openChallenge(id) {
  clearInterval(ticker);startNonce++;attempt=profile.attempts[id];current=buildChallenge(id,attempt?.seed ?? 1,attempt?.generatorVersion??1);lastAlert='';answerBusy=false;
  $('attempt-modes').hidden=!!(attempt&&['running','expired'].includes(attempt.status));
  $('start-challenge').disabled=false;
  $('challenge-meta').textContent=`${current.area} · ${current.level}`;
  $('challenge-title').textContent=current.title;
  $('challenge-story').textContent=current.story; $('challenge-formula').textContent=current.formula;
  $('challenge-question').textContent=current.question; $('unit').textContent=current.unit;showVariantNotice();
  $('hint-content').textContent=current.hint;
  $('solution-content').replaceChildren(); const list=document.createElement('ol');
  current.steps.forEach(step=>{const li=document.createElement('li');li.textContent=step;list.append(li)});$('solution-content').append(list);
  $('hint').open=false;$('hint').hidden=true;$('solution').open=false;$('solution').hidden=true;
  $('answer-form').reset();$('answer').disabled=false;$('check').disabled=false;
  $('retry').hidden=true;$('next-challenge').hidden=true;$('time-alert').textContent='';message('');
  $('timer-panel').className='timer-panel';$('timer-progress').max=Game.duration(current)*1000;
  if(attempt && ['running','expired'].includes(attempt.status)) {
    reveal(true);$('start-challenge').hidden=true;$('hint').hidden=false;
    if(attempt.status==='expired') expireAttempt(); else {tick();if(attempt.status==='running')ticker=setInterval(tick,200);}
  } else {
    attempt=null;reveal(false);$('start-challenge').hidden=false;
    $('timer').textContent=Game.format(Game.duration(current)*1000);$('timer-progress').value=Game.duration(current)*1000;
    $('timer-label').textContent='TIEMPO DE LA MISIÓN';
    $('timer-note').textContent=profile.cloud?'Al comenzar se carga tu versión personal. 100 XP por resolverla y hasta 50 extra por rapidez, sin pista.':'Práctica de invitado. Sus datos pueden coincidir con los de otras personas. 100 XP locales y hasta 50 extra por rapidez.';
  }
  if(!$('challenge-dialog').open)$('challenge-dialog').showModal();
}
function showVariantNotice(){$('variant-notice').textContent=attempt?.generatorVersion===1?'Intento de la versión anterior: conserva sus datos originales.':attempt?.exclusive?'Versión personal: datos reservados a tu cuenta.':'Modo invitado: no hay garantía de exclusividad entre dispositivos.';}
function fillExercise(){
  showVariantNotice();
  $('challenge-story').textContent=current.story;$('challenge-formula').textContent=current.formula;$('challenge-question').textContent=current.question;$('hint-content').textContent=current.hint;
  $('solution-content').replaceChildren();const list=document.createElement('ol');
  current.steps.forEach(step=>{const li=document.createElement('li');li.textContent=step;list.append(li)});$('solution-content').append(list);
}
async function startAttempt(){
  const target=profile,id=current.id,nonce=startNonce;
  const practice=document.querySelector('input[name="attempt-mode"]:checked')?.value==='practice';
  $('start-challenge').disabled=true;$('retry').disabled=true;message('Preparando tu ejercicio…');
  try{
    let next;
    if(target.cloud && (navigator.onLine || !practice)){
      next=await Cloud.start(id,practice);if(![1,2].includes(next.generatorVersion))throw new Error('Este sitio necesita una actualización. Avisa a tu docente para activar las versiones personales.');next.remote=true;next.clockOffset=next.serverNow-Date.now();if(next.generatorVersion===2)target.assignedSeeds[id]=next.seed;
    }else{
      const seed=target.cloud?target.assignedSeeds[id]:variantSeed(target.variantSlot,id),now=Date.now();
      if(!Number.isInteger(seed))throw new Error('Conéctate a internet para asignar tu versión personal de este reto por primera vez.');
      next={generatorVersion:2,exclusive:target.cloud,id:crypto.randomUUID(),seed,startedAt:now,deadline:now+Game.duration(current)*1000,status:'running',practice,hinted:false,tries:0,remote:false};
    }
    target.attempts[id]=next;save();
    if(profile!==target||nonce!==startNonce||!$('challenge-dialog').open)return;
    attempt=next;current=buildChallenge(id,next.seed,next.generatorVersion??1);fillExercise();lastAlert='';
    reveal(true);$('attempt-modes').hidden=true;$('start-challenge').hidden=true;$('hint').hidden=false;$('retry').hidden=true;$('solution').hidden=true;
    $('solution').open=false;$('hint').open=false;$('answer').value='';$('answer').disabled=false;$('check').disabled=false;
    $('next-challenge').hidden=true;message('');$('time-alert').textContent='';
    tick();clearInterval(ticker);if(attempt.status==='running')ticker=setInterval(tick,200);$('answer').focus();
  }catch(error){if(profile===target&&nonce===startNonce)message(error.message,'error');}
  finally{$('start-challenge').disabled=false;$('retry').disabled=false;}
}
function logAttempt(status){
 if(!attempt||!profile)return;
 const row={id:attempt.id,challenge_id:current.id,started_at:attempt.startedAt,finished_at:Date.now(),practice:!!attempt.practice,status,tries:attempt.tries||0};
 profile.history=profile.history.filter(r=>r.id!==attempt.id);profile.history.unshift(row);profile.history=profile.history.slice(0,200);
}
function tick() {
  if(!attempt || attempt.status!=='running')return;
  if(attempt.practice){$('timer').textContent='LIBRE';$('timer-label').textContent='PRÁCTICA SIN TIEMPO';$('timer-progress').value=Game.duration(current)*1000;$('timer-note').textContent='Aprende a tu ritmo. Esta modalidad no suma XP.';$('timer-panel').className='timer-panel';return;}
  const remaining=Game.remaining(attempt,Date.now()+(attempt.clockOffset||0));
  $('timer').textContent=Game.format(remaining);$('timer-progress').value=remaining;
  $('timer-label').textContent='TIEMPO RESTANTE';
  $('timer-panel').className='timer-panel'+(remaining<=30000?' urgent':'');
  $('timer-note').textContent='El tiempo sigue corriendo si cierras el reto o cambias de pestaña.';
  if(remaining<=30000 && remaining>0 && lastAlert!=='warning') {lastAlert='warning';$('time-alert').textContent='¡Quedan 30 segundos o menos!';}
  if(remaining<=0)expireAttempt();
}
function expireAttempt() {
  clearInterval(ticker);attempt.status='expired';logAttempt('expired');save();window.Pro?.refresh();
  $('timer').textContent='00:00';$('timer-progress').value=0;$('timer-panel').className='timer-panel expired';
  $('timer-label').textContent='TIEMPO AGOTADO';$('timer-note').textContent='Cada intento es una oportunidad de aprender.';
  $('answer').disabled=true;$('check').disabled=true;$('hint').hidden=true;$('retry').hidden=false;
  $('solution').hidden=false;$('time-alert').textContent='Se terminó el tiempo.';
  message('El reloj llegó a cero. Revisa la solución y vuelve a intentarlo. No pierdes los puntos ya conseguidos.','error');
}
$('start-challenge').addEventListener('click',startAttempt);
$('retry').addEventListener('click',startAttempt);
$('hint').addEventListener('toggle',()=>{if($('hint').open && attempt?.status==='running'){attempt.hinted=true;save();if(attempt.remote)Cloud.hint(attempt.id).catch(()=>{});$('timer-note').textContent=attempt.practice?'Pista disponible: aprende a tu ritmo.':'Pista utilizada: puedes obtener 100 XP, sin bono por rapidez.';}});
$('answer-form').addEventListener('submit',async e=>{
 e.preventDefault();if(answerBusy||attempt?.status!=='running')return;tick();if(attempt.status!=='running')return;
 const value=Game.parse($('answer').value);if(!Number.isFinite(value)){message('Escribe solo un número, con coma o punto decimal.','error');return;}
 const active=attempt,target=profile,id=current.id;answerBusy=true;$('check').disabled=true;
 try{
  let response;
  if(active.remote)response=await Cloud.answer(active.id,value,active.hinted||$('hint').open);
  else{
   if(!active.practice&&Game.remaining(active)<=0){expireAttempt();return;}
   const elapsed=Date.now()-active.startedAt;
   response={correct:Math.abs(value-current.answer)<=0.010000001,elapsedMs:elapsed,points:active.practice?0:Game.score(Game.duration(current)*1000,elapsed,active.hinted||$('hint').open)};
  }
  if(profile!==target||attempt!==active)return;
  if(response.expired){expireAttempt();return;}
  if(response.finished){message('Este intento ya terminó. Abre otra misión o vuelve a intentarlo.','error');active.status='expired';$('retry').hidden=false;return;}
  active.tries=(active.tries||0)+1;save();
  if(!response.correct){message('Aún no coincide. Revisa la derivada y vuelve a intentarlo.','error');return;}
  const before=profile.records[id]?.points||0;
  if(!active.practice){
   profile.records[id]=response.record?{points:response.record.points,bestMs:response.record.best_ms,updatedAt:response.record.updated_at}:Game.merge(profile.records[id],{points:response.points,bestMs:response.elapsedMs});
  }
  const added=active.practice?0:profile.records[id].points-before;
  active.status='won';clearInterval(ticker);logAttempt('won');save();
  $('answer').disabled=true;$('hint').hidden=true;$('solution').hidden=false;$('solution').open=true;
  $('timer-label').textContent='¡MISIÓN COMPLETADA!';$('timer').textContent=Game.format(response.elapsedMs);$('timer-panel').className='timer-panel won';
  $('timer-note').textContent=active.practice?'Práctica completada. Ahora puedes probar el modo contrarreloj.':`Tiempo utilizado · ${response.points} XP en este intento.`;
  $('time-alert').textContent='';
  message(active.practice?'✓ ¡Bien resuelto! Has practicado sin presión.':added>0?`✦ ¡Lo lograste! +${added} XP a tu total.`:'✦ ¡Correcto! Conservas tu mejor marca y puntuación.','success');
  $('next-challenge').hidden=!RETOS.some(r=>!profile.records[r.id]&&($('filter').value==='all'||r.level===$('filter').value));
  render();celebrate();if(profile.cloud)void syncProgress();
 }catch(error){if(profile===target&&attempt===active)message(error.message+' Puedes volver a enviar la respuesta mientras quede tiempo.','error');}
 finally{answerBusy=false;if(attempt===active)$('check').disabled=active.status!=='running';}
});
function celebrate(){$('celebration').hidden=false;setTimeout(()=>$('celebration').hidden=true,1600);}
$('next-challenge').addEventListener('click',()=>{const next=RETOS.find(r=>!profile.records[r.id] && ($('filter').value==='all'||r.level===$('filter').value));if(next)openChallenge(next.id)});
$('close-challenge').addEventListener('click',()=>$('challenge-dialog').close());
$('challenge-dialog').addEventListener('close',()=>clearInterval(ticker));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible' && $('challenge-dialog').open)tick()});
$('filter').addEventListener('change',render);
$('logout').addEventListener('click',async()=>{
 $('logout').disabled=true;
 try{
  if(profile?.cloud)await Cloud.logout();
  profile=null;clearInterval(ticker);document.body.classList.remove('app-active');
  $('workspace').hidden=true;$('welcome').hidden=false;$('student-name').value='';$('password').value='';
  setMode(Cloud.enabled?'login':'guest');window.scrollTo(0,0);
 }catch(error){$('sync-status').textContent='No se pudo cerrar la sesión. '+error.message;}
 finally{$('logout').disabled=false;}
});
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();if(profile){$('challenge-dialog').close();window.Pro?.show('home');window.scrollTo(0,0)}else $('student-name').focus()});
setMode('guest');
Cloud.init().then(async available=>{
 $('connection-status').textContent=available?'Cuentas configuradas':'Modo invitado';
 if(!available){setMode('guest');return;}
 authBusy=true;$('enter').disabled=true;
 try{const user=await Cloud.restore();if(user&&!profile)enterWorkspace(loadProfile('user:'+user.id,user.user_metadata?.display_name||'Estudiante',true));if(user&&Cloud.isRecovery?.())window.Pro?.promptNewPassword();if(!user&&!profile)setMode('signup');}
 catch(error){$('auth-feedback').textContent=error.message;}
 finally{authBusy=false;$('enter').disabled=mode!=='guest'&&!Cloud.enabled;}
});
$('close-install').addEventListener('click', () => $('install-dialog').close());
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e;window.InstallUI?.refresh(); });
window.addEventListener('appinstalled', () => { installPrompt = null; $('install').textContent = '✓ App instalada';window.InstallUI?.markInstalled(); });
$('install').addEventListener('click',()=>{if(window.InstallUI)window.InstallUI.open();else $('install-dialog').showModal()});
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {
    document.querySelector('footer small').textContent = 'El modo sin conexión no se pudo activar. Puedes seguir usando la app en línea.';
  }));
}

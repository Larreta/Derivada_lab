'use strict';
window.Pro=(()=>{
 let view='home',lessonId='';
 const labels={home:'Mi laboratorio',missions:'Misiones',learn:'Aprende',lab:'Explora gráficas',profile:'Mi progreso'};
 const lessons=[
  {id:'meaning',title:'Una forma de mirar el cambio',tag:'01 · LA IDEA CENTRAL',time:'3 min',intro:'La derivada responde: ¿a qué ritmo cambia una cantidad en este instante?',formula:'f′(a) = lim [f(a + h) − f(a)] / h, cuando h → 0',body:['Una razón de cambio media compara dos puntos. La derivada es el límite de esa razón cuando los puntos se acercan. Geométricamente, representa la pendiente de la recta tangente.','Si h(t) = t² describe una altura en metros, h′(t) = 2t expresa una velocidad en metros por segundo. En t = 3, la velocidad es 6 m/s.','Una derivada positiva indica crecimiento local; una negativa indica decrecimiento local. Una derivada cero indica tangente horizontal cuando la función es derivable, pero no garantiza un máximo.'],tip:'Abre el laboratorio gráfico y busca un punto con pendiente cero.'},
  {id:'power',title:'La regla que abre el camino',tag:'02 · POTENCIAS Y SUMAS',time:'3 min',intro:'Deriva cada término y conserva los coeficientes constantes.',formula:'d(xⁿ)/dx = n·xⁿ⁻¹',body:['Para potencias enteras positivas, el exponente baja multiplicando y luego disminuye en uno. La derivada de una constante es cero.','Si f(x) = 4x³ + 2x − 7, entonces f′(x) = 12x² + 2. No se suma un término por el −7 porque no cambia con x.','Primero deriva y después sustituye el valor solicitado. Sustituir antes elimina la variable y cambia la pregunta.'],tip:'Úsala para comenzar las misiones de nivel inicial.'},
  {id:'chain',title:'Un cambio dentro de otro',tag:'03 · REGLA DE LA CADENA',time:'4 min',intro:'Cuando una función contiene otra función, hay dos cambios que conectar.',formula:'[f(g(x))]′ = f′(g(x)) · g′(x)',body:['Identifica la función exterior y la interior. Deriva la exterior manteniendo la interior, y multiplica por la derivada de la interior.','Para y = (3x + 2)⁴, la exterior es una cuarta potencia y la interior es 3x + 2. Por eso y′ = 4(3x + 2)³ · 3 = 12(3x + 2)³.','Olvidar el factor interior es un error frecuente. Comprueba siempre ese último paso.'],tip:'Ponlo a prueba en «Una reacción en cadena».'},
  {id:'product',title:'Dos funciones que trabajan juntas',tag:'04 · PRODUCTO Y COCIENTE',time:'4 min',intro:'La derivada de un producto no es el producto de las derivadas.',formula:'(uv)′ = u′v + uv′     ·     (u/v)′ = (u′v − uv′)/v²',body:['En un producto, deriva una función y conserva la otra; luego intercambia los papeles y suma.','Si R(q) = q(100 − 2q), entonces R′(q) = 1(100 − 2q) + q(−2) = 100 − 4q.','Para un cociente, el denominador debe ser distinto de cero. Conserva el orden u′v − uv′ en el numerador y eleva el denominador al cuadrado.'],tip:'Conecta estas reglas con «Ventas bajo la lupa» y «Un sensor que se estabiliza».'},
  {id:'optimize',title:'De una fórmula a una decisión',tag:'05 · MÁXIMOS Y MÍNIMOS',time:'4 min',intro:'Optimizar significa buscar la mejor opción dentro de un dominio válido.',formula:'f′(x) = 0 → candidato     ·     f″(x) < 0 → máximo local',body:['Define la variable y su dominio antes de derivar. Un resultado fuera del dominio no resuelve el problema.','Encuentra puntos críticos: donde la derivada vale cero o no existe, si están dentro del dominio. Usa cambios de signo de f′ o la segunda derivada para clasificarlos.','Para un máximo global en un intervalo cerrado, compara también los extremos. Si f″ = 0, el criterio de la segunda derivada no decide.'],tip:'Empieza con el jardín y después intenta diseñar la caja de mayor volumen.'},
  {id:'related',title:'Todo está conectado',tag:'06 · SEGUNDAS DERIVADAS Y RAZONES',time:'4 min',intro:'La derivada también puede decirte cómo está cambiando otro cambio.',formula:'v(t) = s′(t), a(t) = s″(t)     ·     dV/dt = 4πr²·dr/dt',body:['Si s es posición, su primera derivada es velocidad y su segunda derivada es aceleración. Las unidades también se derivan: m, m/s y m/s².','En un globo esférico, V = (4/3)πr³. Si el radio depende del tiempo, la regla de la cadena da dV/dt = 4πr²·dr/dt.','Anota qué variable cambia respecto a cuál. No confundas dV/dr, volumen por centímetro de radio, con dV/dt, volumen por segundo.'],tip:'Comprueba estas ideas en las misiones del vehículo y del globo.'}
 ];
 function show(next){
  if(!profile)return;view=next;
  for(const key of Object.keys(labels))$(key+'-view').hidden=key!==next;
  for(const btn of document.querySelectorAll('[data-view]')){const active=btn.dataset.view===next;btn.classList.toggle('active',active);if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');}
  $('view-breadcrumb').textContent='TU ESPACIO / '+labels[next].toLocaleUpperCase('es');
  refresh();if(next==='lab')drawPlot();
  window.scrollTo({top:0,behavior:'instant'});
 }
 function refresh(){
  if(!profile)return;
  $('avatar').textContent=profile.name.slice(0,1).toLocaleUpperCase('es');
  const next=RETOS.find(r=>!profile.records[r.id])||RETOS[0];
  $('recommendation-text').textContent=completed()===RETOS.length?'Ya completaste tu ruta. Ahora puedes mejorar tus marcas o explorar las gráficas.':`Siguiente paso: ${next.title}. ${next.desc}`;
  $('route-grid').replaceChildren();
  for(const [index,level,title,subtitle]of [[1,'Inicial','Entiende el cambio','Potencias, movimiento y costo marginal.'],[2,'Intermedio','Conecta las reglas','Cadena, aceleración y primeras decisiones.'],[3,'Avanzado','Resuelve lo que importa','Optimización, modelos y razones relacionadas.']]){
   const group=RETOS.filter(r=>r.level===level),done=group.filter(r=>profile.records[r.id]).length;
   const button=document.createElement('button');button.className='route-card';
   button.innerHTML=`<div class="route-card-top"><span class="route-number">0${index}</span><span>${level}</span></div><h3>${title}</h3><p>${subtitle}</p><progress max="${group.length}" value="${done}" aria-label="Ruta ${level}"></progress><div class="route-card-bottom"><span>${done} de ${group.length} misiones</span><span>Explorar ↗</span></div>`;
   button.addEventListener('click',()=>{$('filter').value=level;$('status-filter').value='all';$('mission-search').value='';render();show('missions')});$('route-grid').append(button);
  }
  renderLessons();renderProfile();renderActivity();
 }
 function renderLessons(){
  $('lesson-grid').replaceChildren();
  for(const lesson of lessons){const read=profile.lessons.includes(lesson.id),button=document.createElement('button');button.className='lesson-card';button.innerHTML=`<span class="eyebrow">${lesson.tag}</span><h3>${lesson.title}</h3><p>${lesson.intro}</p><span class="lesson-card-bottom"><span>${read?'✓ Leída':lesson.time+' de lectura'}</span><span>Abrir lección ↗</span></span>`;button.addEventListener('click',()=>openLesson(lesson.id));$('lesson-grid').append(button);}
 }
 function openLesson(id){const lesson=lessons.find(l=>l.id===id);lessonId=id;$('lesson-title').textContent=lesson.title;$('lesson-content').replaceChildren();const intro=document.createElement('p');intro.textContent=lesson.intro;$('lesson-content').append(intro);const formula=document.createElement('div');formula.className='formula';formula.textContent=lesson.formula;$('lesson-content').append(formula);for(const text of lesson.body){const p=document.createElement('p');p.textContent=text;$('lesson-content').append(p)}const tip=document.createElement('p');tip.className='lesson-tip';tip.textContent=lesson.tip;$('lesson-content').append(tip);$('mark-lesson').textContent=profile.lessons.includes(id)?'Lección completada ✓':'Marcar como leída ✓';$('lesson-dialog').showModal();}
 const fmtDate=ms=>new Date(ms).toLocaleString('es-EC',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
 function renderProfile(){
  $('profile-name').textContent=profile.name;$('profile-email').textContent=profile.cloud?Cloud.user()?.email||'Cuenta personal':'Invitado · Datos guardados en este navegador';
  $('profile-summary').replaceChildren();
  for(const text of [`${completed()} de ${RETOS.length} misiones resueltas contrarreloj`,`${Object.values(profile.records).reduce((a,r)=>a+r.points,0)} XP acumulados`,`${profile.lessons.length} de ${lessons.length} lecciones marcadas como leídas`]){const p=document.createElement('p');p.className='profile-summary-line';p.textContent=text;$('profile-summary').append(p)}
  $('records-list').replaceChildren();const entries=RETOS.filter(r=>profile.records[r.id]);
  if(!entries.length){const p=document.createElement('p');p.className='muted';p.textContent='Completa tu primer reto contrarreloj para registrar una marca.';$('records-list').append(p);}
  for(const r of entries){const rec=profile.records[r.id],row=document.createElement('div');row.className='record-row';const title=document.createElement('span');title.textContent=r.title;const value=document.createElement('strong');value.textContent=`${Game.format(rec.bestMs)} · ${rec.points} XP`;row.append(title,value);$('records-list').append(row)}
  $('history-body').replaceChildren();const history=profile.history.filter(r=>r.status!=='running').slice(0,20);$('history-empty').hidden=history.length>0;
  for(const h of history){const row=document.createElement('tr');for(const text of [RETOS.find(r=>r.id===h.challenge_id)?.title||'Misión',h.practice?'Práctica':'Contrarreloj',h.status==='won'?'✓ Completada':'Tiempo agotado',fmtDate(h.finished_at||h.started_at)]){const td=document.createElement('td');td.textContent=text;row.append(td)}$('history-body').append(row)}
 }
 function renderActivity(){
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
  const counts=days.map(d=>profile.history.filter(h=>h.status==='won'&&(h.finished_at||h.started_at)>=d.getTime()&&(h.finished_at||h.started_at)<d.getTime()+86400000).length),max=Math.max(1,...counts);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 420 120');svg.setAttribute('role','img');svg.setAttribute('aria-label','Intentos completados en los últimos siete días: '+counts.join(', '));
  days.forEach((d,i)=>{const rect=document.createElementNS(ns,'rect'),height=counts[i]?Math.max(8,counts[i]/max*65):3;rect.setAttribute('x',String(i*60+12));rect.setAttribute('y',String(80-height));rect.setAttribute('width','28');rect.setAttribute('height',String(height));rect.setAttribute('rx','5');rect.setAttribute('class',counts[i]?'activity-bar active':'activity-bar');svg.append(rect);const label=document.createElementNS(ns,'text');label.setAttribute('x',String(i*60+26));label.setAttribute('y','108');label.setAttribute('text-anchor','middle');label.textContent=d.toLocaleDateString('es-EC',{weekday:'short'}).slice(0,3);svg.append(label);if(counts[i]){const n=document.createElementNS(ns,'text');n.setAttribute('x',String(i*60+26));n.setAttribute('y',String(72-height));n.setAttribute('text-anchor','middle');n.textContent=String(counts[i]);svg.append(n)}});
  $('activity-chart').replaceChildren(svg);const n=counts.reduce((a,b)=>a+b,0);$('activity-caption').textContent=n?`${n} intentos completados en los últimos 7 días.`:'Empieza una misión para dibujar tu primera semana.';
 }
 const functions={quadratic:{f:x=>x*x,d:x=>2*x},cubic:{f:x=>x*x*x/3,d:x=>x*x},sine:{f:Math.sin,d:Math.cos},exponential:{f:x=>Math.exp(x/2),d:x=>.5*Math.exp(x/2)}};
 function drawPlot(){
  if(view!=='lab')return;const canvas=$('function-plot'),ctx=canvas.getContext('2d');if(!ctx)return;
  const W=canvas.width,H=canvas.height,pad=50,xmin=-4,xmax=4,ymin=-8,ymax=8;
  const X=x=>pad+(x-xmin)/(xmax-xmin)*(W-pad*2),Y=y=>H-pad-(y-ymin)/(ymax-ymin)*(H-pad*2);
  const light=document.body.classList.contains('light'),x=Number($('x-slider').value),fn=functions[$('function-select').value],y=fn.f(x),slope=fn.d(x);
  ctx.clearRect(0,0,W,H);ctx.fillStyle=light?'#ffffff':'#142232';ctx.fillRect(0,0,W,H);ctx.lineWidth=1;ctx.strokeStyle=light?'#e6ece9':'#273748';
  for(let gx=-4;gx<=4;gx++){ctx.beginPath();ctx.moveTo(X(gx),Y(ymin));ctx.lineTo(X(gx),Y(ymax));ctx.stroke()}
  for(let gy=-8;gy<=8;gy++){ctx.beginPath();ctx.moveTo(X(xmin),Y(gy));ctx.lineTo(X(xmax),Y(gy));ctx.stroke()}
  ctx.strokeStyle=light?'#9aada3':'#657a8e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(0),Y(ymin));ctx.lineTo(X(0),Y(ymax));ctx.moveTo(X(xmin),Y(0));ctx.lineTo(X(xmax),Y(0));ctx.stroke();
  ctx.font='18px system-ui';ctx.fillStyle=light?'#5a7064':'#a6b7c4';for(let i=-3;i<=3;i++)if(i)ctx.fillText(String(i),X(i)-5,Y(0)+25);ctx.fillText('x',X(3.9),Y(0)-12);ctx.fillText('y',X(0)+12,Y(7.8));
  ctx.save();ctx.beginPath();ctx.rect(pad,pad,W-pad*2,H-pad*2);ctx.clip();
  function curve(f,color,width,dashed=false){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[10,8]:[]);ctx.beginPath();for(let i=0;i<=700;i++){const t=xmin+(xmax-xmin)*i/700,py=Y(f(t));if(i===0)ctx.moveTo(X(t),py);else ctx.lineTo(X(t),py)}ctx.stroke();ctx.setLineDash([])}
  curve(fn.f,light?'#1a9465':'#b5efcc',4);curve(t=>y+slope*(t-x),light?'#c28319':'#f0c67c',3,true);if($('show-derivative').checked)curve(fn.d,light?'#8b60bd':'#cdb6ec',3);
  ctx.fillStyle=light?'#167c54':'#c0f4d4';ctx.beginPath();ctx.arc(X(x),Y(y),8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=light?'#ffffff':'#142232';ctx.lineWidth=3;ctx.stroke();ctx.restore();
  const n=v=>v.toLocaleString('es-EC',{maximumFractionDigits:3});$('x-value').textContent=n(x);$('f-value').textContent=n(y);$('slope-value').textContent=n(slope);
  $('slope-interpretation').textContent=Math.abs(slope)<1e-9?'Tangente horizontal: la pendiente es cero.':slope>0?'Pendiente positiva: la función crece localmente en este punto.':'Pendiente negativa: la función decrece localmente en este punto.';
  $('derivative-legend').hidden=!$('show-derivative').checked;
  canvas.setAttribute('aria-label',`En x=${n(x)}, f(x)=${n(y)} y su pendiente es ${n(slope)}.`);
 }
 function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function promptNewPassword(){$('update-password-feedback').textContent='';$('update-password-dialog').showModal();}
 for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>show(b.dataset.view));
 $('see-missions').addEventListener('click',()=>show('missions'));
 $('open-lab').addEventListener('click',()=>show('lab'));
 $('continue-mission').addEventListener('click',()=>openChallenge((RETOS.find(r=>!profile.records[r.id])||RETOS[0]).id));
 $('mission-search').addEventListener('input',render);$('status-filter').addEventListener('change',render);
 $('close-lesson').addEventListener('click',()=>$('lesson-dialog').close());
 $('mark-lesson').addEventListener('click',()=>{if(!profile.lessons.includes(lessonId))profile.lessons.push(lessonId);save();refresh();$('lesson-dialog').close()});
 for(const id of ['function-select','x-slider','show-derivative'])$(id).addEventListener('input',drawPlot);
 $('theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('light');try{localStorage.setItem('derivada-theme',document.body.classList.contains('light')?'light':'dark')}catch{}drawPlot()});
 try{if(localStorage.getItem('derivada-theme')==='light')document.body.classList.add('light')}catch{}
 $('export-progress').addEventListener('click',()=>download('mi-progreso-derivada-lab.json',JSON.stringify({app:'Derivada Lab',exportedAt:new Date().toISOString(),name:profile.name,records:profile.records,lessons:profile.lessons,history:profile.history},null,2)));
 $('forgot-password').addEventListener('click',()=>{$('recovery-feedback').textContent='';$('recovery-dialog').showModal()});
 $('close-recovery').addEventListener('click',()=>$('recovery-dialog').close());
 $('recovery-form').addEventListener('submit',async e=>{e.preventDefault();$('recover-submit').disabled=true;$('recovery-feedback').textContent='Enviando solicitud…';try{await Cloud.recover($('recovery-email').value.trim());$('recovery-feedback').textContent='Si existe una cuenta con ese correo, recibirás un enlace de recuperación. Revisa también la carpeta de spam.';}catch(error){$('recovery-feedback').textContent=error.message}finally{$('recover-submit').disabled=false}});
 $('close-update-password').addEventListener('click',()=>$('update-password-dialog').close());
 $('update-password-form').addEventListener('submit',async e=>{e.preventDefault();$('update-password-submit').disabled=true;try{await Cloud.updatePassword($('new-password').value);$('new-password').value='';$('update-password-dialog').close();$('sync-status').textContent='✓ Contraseña actualizada.';}catch(error){$('update-password-feedback').textContent=error.message}finally{$('update-password-submit').disabled=false}});
 window.addEventListener('online',()=>$('connection-status').textContent=Cloud.enabled?'Cuentas configuradas':'Modo invitado');window.addEventListener('offline',()=>$('connection-status').textContent='Sin conexión');
 return{show,refresh,promptNewPassword,enter:()=>show('home'),functions};
})();

// Instrucciones de instalación para estudiantes, con invitación nativa solo si el navegador la ofrece.
window.InstallUI=(()=>{
 const ua=navigator.userAgent||'';
 let platform=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1)?'ios':/Android/i.test(ua)?'android':'desktop';
 let installed=!!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone);
 const steps={
  android:[['Abre el enlace en Chrome','Usa el enlace publicado que compartió tu docente.'],['Abre el menú ⋮','Elige «Añadir a pantalla de inicio» o «Instalar aplicación», según tu versión.'],['Confirma la instalación','Pulsa «Instalar». Después abre Derivada Lab desde su icono en el teléfono.']],
  ios:[['Abre el enlace en Safari','Usa el enlace publicado que compartió tu docente.'],['Pulsa Compartir','Elige «Añadir a pantalla de inicio». Si no aparece, revisa las acciones disponibles en el menú.'],['Añade la aplicación','Si aparece «Abrir como app web», actívalo. Pulsa «Añadir» y busca el icono en la pantalla de inicio.']],
  desktop:[['Abre el enlace en Chrome o Edge','No necesitas instalar Visual Studio Code para usarla.'],['Busca la opción de instalación','En Chrome, abre ⋮ y busca «Instalar página como aplicación», que puede estar en «Enviar, guardar y compartir». En Edge: menú → Aplicaciones → Instalar este sitio como aplicación.'],['Confirma y abre la aplicación','Sigue la confirmación del navegador. Después podrás abrir Derivada Lab desde tus aplicaciones.']]
 };
 function refresh(){
  for(const button of document.querySelectorAll('[data-install-platform]'))button.setAttribute('aria-pressed',String(button.dataset.installPlatform===platform));
  $('install-steps').replaceChildren();
  for(const [title,text]of steps[platform]){const li=document.createElement('li'),strong=document.createElement('strong'),p=document.createElement('p');strong.textContent=title;p.textContent=text;li.append(strong,p);$('install-steps').append(li)}
  $('install-native').hidden=installed||!installPrompt||platform==='ios';
  $('install-native').disabled=false;
  $('install-environment').textContent=installed?'✓ Derivada Lab ya está instalada en este dispositivo.':window.isSecureContext===false?'Para instalarla, abre la dirección HTTPS publicada por tu docente. Un archivo local o una dirección HTTP sin conexión segura puede impedir la instalación.':'La instalación depende del navegador. Si no aparece una invitación automática, sigue los pasos de arriba.';
 }
 $('install-native').addEventListener('click',async()=>{
  if(!installPrompt)return refresh();const invitation=installPrompt;installPrompt=null;$('install-native').disabled=true;
  try{await invitation.prompt();const choice=await invitation.userChoice;$('install-status').textContent=choice.outcome==='accepted'?'Sigue la confirmación del navegador para terminar la instalación.':'Puedes volver a instalarla más tarde desde el menú del navegador.';}
  catch{$('install-status').textContent='No se pudo abrir la invitación. Sigue los pasos del menú de tu navegador.';}
  finally{refresh();}
 });
 for(const button of document.querySelectorAll('[data-install-platform]'))button.addEventListener('click',()=>{platform=button.dataset.installPlatform;$('install-status').textContent='';refresh()});
 return{open(){refresh();$('install-status').textContent='';$('install-dialog').showModal()},refresh,markInstalled(){installed=true;$('install-status').textContent='✓ Derivada Lab instalada.';refresh()}};
})();

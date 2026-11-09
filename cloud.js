'use strict';
// GitHub Pages + Supabase REST. Configuración pública; nunca incluir service_role.
const Cloud=(()=>{
 const config=window.DERIVADA_CONFIG||{},base=(config.supabaseUrl||'').replace(/\/$/,''),key=config.supabasePublicKey||'';
 let publicKey=key.startsWith('sb_publishable_');
 if(!publicKey&&key.split('.').length===3)try{publicKey=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon'}catch{}
 const enabled=publicKey&&/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(base),storageKey='derivada-pages-session-v4';
 let session=null,recovery=false,refreshJob=null;
 try{session=JSON.parse(sessionStorage.getItem(storageKey))}catch{}
 function remember(data){session=data?{...data,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(Number(data.expires_in)||3600)}:null;try{if(session)sessionStorage.setItem(storageKey,JSON.stringify(session));else sessionStorage.removeItem(storageKey)}catch{}}
 function redirect(){return location.href.split('#')[0].split('?')[0]}
 async function request(route,{method='GET',body,token}={}){
  if(!enabled)throw new Error('Las cuentas todavía no están conectadas. Puedes practicar como invitado.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);let res;
  try{res=await fetch(base+route,{method,cache:'no-store',headers:{apikey:key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal})}
  catch{throw new Error('No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.')}
  finally{clearTimeout(timeout)}
  const data=await res.json().catch(()=>null);
  if(!res.ok){
   const known=['Reto no válido','Intento no encontrado','Demasiados intentos','Demasiadas respuestas','Sesión requerida'];
   let text=res.status===429?'Demasiados intentos. Espera unos minutos.':res.status===401?'Tu sesión terminó o los datos de acceso no son correctos.':res.status===400?'Revisa tus datos y confirma tu correo si acabas de registrarte.':'El servicio no pudo completar la solicitud. Revisa la configuración o inténtalo más tarde.';
   if(data?.message==='Se agotaron las versiones exclusivas. Contacta al administrador')text=data.message;
   if(known.includes(data?.message))text=data.message;const error=new Error(text);error.status=res.status;throw error;
  }
  return data;
 }
 async function token(){
  if(!session?.refresh_token)throw new Error('Inicia sesión para continuar.');
  if(session.expires_at*1000<Date.now()+60000){
   if(!refreshJob)refreshJob=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}).then(remember).catch(error=>{if([400,401].includes(error.status))remember(null);throw error}).finally(()=>{refreshJob=null});
   await refreshJob;
  }
  return session.access_token;
 }
 const rpc=async(name,body={})=>request('/rest/v1/rpc/'+name,{method:'POST',body,token:await token()});
 return{
  get enabled(){return enabled},init:async()=>enabled,user:()=>session?.user||null,isRecovery:()=>recovery,
  async restore(){
   const hash=new URLSearchParams(location.hash.slice(1));
   if(hash.has('access_token')&&hash.has('refresh_token')){recovery=hash.get('type')==='recovery';remember({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_in:Number(hash.get('expires_in'))||3600});history.replaceState(null,'',location.pathname+location.search)}
   if(!session)return null;
   const user=await request('/auth/v1/user',{token:await token()});remember({...session,user});return user;
  },
  async login(email,password){const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});remember(data);return session.user},
  async signup(name,email,password){const data=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(redirect()),{method:'POST',body:{email,password,data:{display_name:name}}});if(data?.access_token){remember(data);return{user:session.user}}return{user:null}},
  async logout(){try{if(session)await request('/auth/v1/logout?scope=local',{method:'POST',body:{},token:await token()})}catch{/* La sesión local se cierra también sin conexión. */}finally{remember(null);recovery=false}},
  async recover(email){await request('/auth/v1/recover?redirect_to='+encodeURIComponent(redirect()),{method:'POST',body:{email}})},
  async updatePassword(password){const user=await request('/auth/v1/user',{method:'PUT',body:{password},token:await token()});remember({...session,user});recovery=false;return user},
  results:async()=>request('/rest/v1/dl_results?select=challenge_id,points,best_ms,updated_at',{token:await token()}),
  history:()=>rpc('dl_history'),
  start:(challengeId,practice)=>rpc('dl_start',{p_challenge_id:challengeId,p_practice:practice}),
  answer:(id,answer,hinted)=>rpc('dl_answer',{p_attempt_id:id,p_answer:answer,p_hinted:hinted}),
  hint:id=>rpc('dl_hint',{p_attempt_id:id})
 };
})();

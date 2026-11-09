import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile}from'node:fs/promises';
const source=await readFile(new URL('../cloud.js',import.meta.url),'utf8');
function make(config={supabaseUrl:'https://example.supabase.co',supabasePublicKey:'sb_publishable_demonstration_only'}){
 let replies=[],calls=[];const memory={};
 const context={window:{DERIVADA_CONFIG:config},sessionStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v,removeItem:k=>delete memory[k]},Date,URLSearchParams,AbortController,setTimeout,clearTimeout,atob:s=>Buffer.from(s,'base64').toString(),location:{href:'https://example.github.io/derivada-lab/',hash:'',pathname:'/derivada-lab/',search:''},history:{replaceState(){}},fetch:async(url,options)=>{calls.push({url,options});const r=replies.shift();assert(r,'Solicitud inesperada: '+url);return{ok:r.ok??true,status:r.status||200,json:async()=>r.data}}};
 vm.createContext(context);vm.runInContext(source,context);
 return{run:s=>vm.runInContext(s,context),replies:r=>replies=r,calls,memory,context};
}
test('Supabase: confirmación, sesión, RPC y recuperación por correo',async()=>{
 const c=make();assert.equal(await c.run('Cloud.init()'),true);
 c.replies([{data:{id:'pending'}}]);assert.equal((await c.run("Cloud.signup('Prueba','p@example.test','test-password')")).user,null);assert(c.calls[0].url.includes('redirect_to=https%3A%2F%2Fexample.github.io%2Fderivada-lab%2F'));
 c.replies([{data:{access_token:'fake-access',refresh_token:'fake-refresh',expires_in:3600,user:{id:'u1',email:'p@example.test'}}}]);await c.run("Cloud.login('p@example.test','test-password')");assert.equal(c.run('Cloud.user().id'),'u1');assert(!Object.values(c.memory).join('').includes('test-password'));
 c.replies([{data:{id:'attempt',seed:1,startedAt:1000,deadline:121000}},{data:{correct:true,points:140}},{data:[]},{data:[]}]);
 await c.run("Cloud.start('cohete',false)");const start=c.calls.at(-1);assert(start.url.endsWith('/rest/v1/rpc/dl_start'));assert.equal(JSON.parse(start.options.body).p_challenge_id,'cohete');assert.equal(start.options.headers.Authorization,'Bearer fake-access');
 await c.run("Cloud.answer('attempt',32,false)");assert(c.calls.at(-1).url.endsWith('/rpc/dl_answer'));await c.run('Cloud.history()');await c.run('Cloud.results()');
 c.replies([{data:{}},{data:{id:'u1',email:'p@example.test'}}]);await c.run("Cloud.recover('p@example.test')");assert(c.calls.at(-1).url.includes('/recover?redirect_to='));await c.run("Cloud.updatePassword('test-new-password')");assert.equal(c.calls.at(-1).options.method,'PUT');
 c.replies([{data:{},ok:false,status:429}]);await assert.rejects(()=>c.run("Cloud.recover('p@example.test')"),/Demasiados/);
 c.replies([{data:null}]);await c.run('Cloud.logout()');assert.equal(c.run('Cloud.user()'),null);assert.equal(Object.keys(c.memory).length,0);
});
test('sin configuración y claves secretas desactivan cuentas; retorno de recuperación restaura sesión',async()=>{
 assert.equal(await make({}).run('Cloud.init()'),false);
 assert.equal(await make({supabaseUrl:'https://example.supabase.co',supabasePublicKey:'sb_secret_never_allowed'}).run('Cloud.init()'),false);
 const c=make();c.context.location.hash='#access_token=returned&refresh_token=returned-refresh&expires_in=3600&type=recovery';c.replies([{data:{id:'u2'}}]);assert.equal((await c.run('Cloud.restore()')).id,'u2');assert.equal(c.run('Cloud.isRecovery()'),true);
});

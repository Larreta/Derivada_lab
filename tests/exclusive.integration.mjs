import test from 'node:test';import assert from 'node:assert/strict';import {readFile}from'node:fs/promises';import vm from'node:vm';import {randomUUID}from'node:crypto';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const {RETOS,buildChallenge,variantSeed}=vm.runInNewContext(await readFile(new URL('../retos.js',import.meta.url),'utf8')+'\n({RETOS,buildChallenge,variantSeed})');
test('asignaciones exclusivas y persistentes entre cuentas, reintentos, privacidad y agotamiento',async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;`);
  await db.exec(await readFile(new URL('../SUPABASE.sql',import.meta.url),'utf8'));
  for(const seed of [0,1,7,99,100,123,777,5432,9999])for(const r of RETOS){const answer=(await db.query('select derivada_private.expected_answer_v2($1,$2) as n',[r.id,seed])).rows[0].n;assert(Math.abs(answer-buildChallenge(r.id,seed).answer)<1e-6,r.id)}
  const users=Array.from({length:15},()=>randomUUID());for(const id of users)await db.query('insert into auth.users values($1)',[id]);
  const ids=['cohete','ingreso-lineal','cadena','caja','elasticidad','publicidad'];const signatures=new Map(ids.map(id=>[id,new Set()]));let first;
  for(const user of users){
   await db.exec('reset role;set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
   for(const id of ids){
    const attempt=(await db.query('select public.dl_start($1,false) as a',[id])).rows[0].a;assert.equal(attempt.generatorVersion,2);assert.equal(attempt.exclusive,true);
    const reto=buildChallenge(id,attempt.seed),signature=reto.formula+'|'+reto.question;assert(!signatures.get(id).has(signature),'Colisión entre estudiantes: '+id);signatures.get(id).add(signature);
    const resumed=(await db.query('select public.dl_start($1,false) as a',[id])).rows[0].a;assert.equal(resumed.id,attempt.id);assert.equal(resumed.seed,attempt.seed);
    const won=(await db.query('select public.dl_answer($1,$2,false) as a',[attempt.id,reto.answer])).rows[0].a;assert.equal(won.correct,true);
    const replay=(await db.query('select public.dl_start($1,true) as a',[id])).rows[0].a;assert.equal(replay.seed,attempt.seed);assert.notEqual(replay.id,attempt.id);
    if(!first)first={user,id,seed:attempt.seed};
   }
  }
  await db.exec('reset role');const assignments=(await db.query('select * from derivada_private.student_slots')).rows;assert.equal(assignments.length,15);assert.equal(new Set(assignments.map(a=>a.slot)).size,15);
  for(const a of assignments){assert(a.slot>=0&&a.slot<10000);const expected=variantSeed(a.slot,first.id);if(a.user_id===first.user)assert.equal(first.seed,expected);}
  await db.exec('set role authenticated');await assert.rejects(()=>db.query('select * from derivada_private.student_slots'),/permission denied/);
  await db.exec('reset role');const kept=assignments.find(a=>a.user_id===first.user);await db.query('delete from auth.users where id=$1',[first.user]);assert.equal((await db.query('select user_id from derivada_private.student_slots where slot=$1',[kept.slot])).rows[0].user_id,null);
  // Reservar todos los espacios restantes en esta base de prueba: debe fallar y nunca reasignar un problema.
  await db.exec('insert into derivada_private.student_slots(slot) select n from generate_series(0,9999)n on conflict do nothing');const extra=randomUUID();await db.query('insert into auth.users values($1)',[extra]);await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[extra]);
  await assert.rejects(()=>db.query("select public.dl_start('cohete',false)"),/Se agotaron las versiones exclusivas/);
 }finally{await db.close()}
});

import test from 'node:test';import assert from 'node:assert/strict';import {readFile}from'node:fs/promises';import vm from'node:vm';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const {RETOS,buildChallenge}=vm.runInNewContext(await readFile(new URL('../retos.js',import.meta.url),'utf8')+'\n({RETOS,buildChallenge})');
test('PostgreSQL: esquema, variantes, aislamiento RLS y RPC de retos',async()=>{
 const db=new PGlite();let legacyId=null;
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth to authenticated,anon;
  insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
  if(process.env.DERIVADA_PREVIOUS_SQL){await db.exec(await readFile(process.env.DERIVADA_PREVIOUS_SQL,'utf8'));await db.exec("insert into public.dl_results values('11111111-1111-4111-8111-111111111111','cohete',100,1000,1)");const ms=Date.now();legacyId=(await db.query("insert into public.dl_attempts(user_id,challenge_id,seed,started_at,deadline,practice) values('11111111-1111-4111-8111-111111111111','bicicleta',4294967295,$1,$2,false) returning id",[ms,ms+120000])).rows[0].id;}
  const sql=await readFile(new URL('../SUPABASE.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);if(process.env.DERIVADA_PREVIOUS_SQL){const preserved=await db.query('select points from public.dl_results');assert.equal(preserved.rows.length,1);assert.equal(preserved.rows[0].points,100);}
  for(const seed of [0,1,123,2147483647,4294967295])for(const r of RETOS){const actual=await db.query('select derivada_private.expected_answer($1,$2) as n,derivada_private.duration_ms($1) as duration',[r.id,seed]);assert.equal(Number(actual.rows[0].duration),(r.seconds??({Inicial:120,Intermedio:240,Avanzado:360}[r.level]))*1000);assert(Math.abs(actual.rows[0].n-buildChallenge(r.id,seed,1).answer)<1e-6,r.id+' seed '+seed)}
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
  if(legacyId){const old=(await db.query("select public.dl_start('bicicleta',false) as data")).rows[0].data;assert.equal(old.id,legacyId);assert.equal(old.generatorVersion,1);assert.equal(old.exclusive,false);const oldAnswer=buildChallenge('bicicleta',4294967295,1).answer;assert.equal((await db.query('select public.dl_answer($1,$2,false) as data',[legacyId,oldAnswer])).rows[0].data.correct,true);const fresh=(await db.query("select public.dl_start('bicicleta',false) as data")).rows[0].data;assert.equal(fresh.generatorVersion,2);assert.equal(fresh.exclusive,true);}
  const start=(await db.query("select public.dl_start('cohete',false) as data")).rows[0].data;
  assert.equal(start.deadline-start.startedAt,120000);assert.equal((await db.query("select public.dl_start('cohete',false) as data")).rows[0].data.id,start.id);
  assert.equal((await db.query('select public.dl_answer($1,$2,false) as data',[start.id,99999])).rows[0].data.correct,false);
  await db.query('select public.dl_hint($1)',[start.id]);const answer=buildChallenge('cohete',start.seed).answer;
  const won=(await db.query('select public.dl_answer($1,$2,false) as data',[start.id,answer])).rows[0].data;assert.equal(won.correct,true);assert.equal(won.points,100);
  assert.equal((await db.query('select * from public.dl_results')).rows.length,legacyId?2:1);
  assert.equal((await db.query('select public.dl_answer($1,$2,false) as data',[start.id,answer])).rows[0].data.finished,true);
  await assert.rejects(()=>db.exec('update public.dl_results set points=150'),/permission denied/);
  await assert.rejects(()=>db.query('select derivada_private.expected_answer($1,1)',['cohete']),/permission denied/);
  await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)");
  assert.equal((await db.query('select * from public.dl_results')).rows.length,0);assert.equal((await db.query('select * from public.dl_attempts')).rows.length,0);
  await assert.rejects(()=>db.query('select public.dl_answer($1,$2,false)',[start.id,answer]),/Intento no encontrado/);
  const practice=(await db.query("select public.dl_start('sensor',true) as data")).rows[0].data;assert.equal((await db.query('select public.dl_answer($1,$2,false) as data',[practice.id,buildChallenge('sensor',practice.seed).answer])).rows[0].data.points,0);
  assert.equal((await db.query('select * from public.dl_results')).rows.length,0);
  const expired=(await db.query("select public.dl_start('agua',false) as data")).rows[0].data;
  await db.exec('reset role');await db.query('update public.dl_attempts set deadline=1 where id=$1',[expired.id]);await db.exec('set role authenticated');
  assert.equal((await db.query('select public.dl_answer($1,22,false) as data',[expired.id])).rows[0].data.expired,true);
  const history=(await db.query('select public.dl_history() as data')).rows[0].data;assert.equal(history.length,2);
  const newMission=(await db.query("select public.dl_start('caja-rectangular',false) as data")).rows[0].data;assert.equal(newMission.deadline-newMission.startedAt,420000);const newAnswer=buildChallenge('caja-rectangular',newMission.seed).answer;assert.equal((await db.query('select public.dl_answer($1,$2,false) as data',[newMission.id,newAnswer])).rows[0].data.correct,true);assert.equal((await db.query('select * from public.dl_results')).rows.length,1);
  await db.exec("reset role;set role anon;select set_config('request.jwt.claim.sub','',false)");await assert.rejects(()=>db.query("select public.dl_start('cohete',false)"),/permission denied/);
 }finally{await db.close()}
});

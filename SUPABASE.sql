-- Ejecutar completo en el SQL Editor de TU proyecto Supabase.
-- Datos propios por usuario; los resultados solo se escriben mediante funciones autorizadas.
begin;
create schema if not exists derivada_private;
revoke all on schema derivada_private from public,anon,authenticated;
create table if not exists public.dl_attempts(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 challenge_id text not null check(challenge_id in('cohete','bicicleta','agua','costo','ganancia','jardin','frenado','cadena','ingreso','caja','sensor','globo','dron','temperatura','bacteria','ingreso-lineal','energia','pendiente','descuento','nivel','producto','cociente','enfriamiento','oscilacion','logaritmo','costo-medio','max-altura','area-circulo','caja-rectangular','cilindro','cerca-rio','demanda-cuadratica','elasticidad','distancia-minima','cono','publicidad')),
 seed bigint not null check(seed between 0 and 4294967295), started_at bigint not null,deadline bigint not null,
 practice boolean not null default false,status text not null default 'running' check(status in('running','won','expired')),
 hinted boolean not null default false,tries integer not null default 0,finished_at bigint
);
create index if not exists dl_attempt_owner on public.dl_attempts(user_id,started_at desc);
create unique index if not exists dl_one_active on public.dl_attempts(user_id,challenge_id) where status='running' and not practice;
create table if not exists public.dl_results(
 user_id uuid not null references auth.users(id) on delete cascade,
 challenge_id text not null check(challenge_id in('cohete','bicicleta','agua','costo','ganancia','jardin','frenado','cadena','ingreso','caja','sensor','globo','dron','temperatura','bacteria','ingreso-lineal','energia','pendiente','descuento','nivel','producto','cociente','enfriamiento','oscilacion','logaritmo','costo-medio','max-altura','area-circulo','caja-rectangular','cilindro','cerca-rio','demanda-cuadratica','elasticidad','distancia-minima','cono','publicidad')),
 points integer not null check(points between 100 and 150),best_ms bigint not null check(best_ms>=0),updated_at bigint not null,
 primary key(user_id,challenge_id)
);
-- Ampliar las restricciones de la versión anterior sin borrar cuentas, intentos ni resultados.
alter table public.dl_attempts drop constraint if exists dl_attempts_challenge_id_check;
alter table public.dl_attempts add constraint dl_attempts_challenge_id_check check(challenge_id in('cohete','bicicleta','agua','costo','ganancia','jardin','frenado','cadena','ingreso','caja','sensor','globo','dron','temperatura','bacteria','ingreso-lineal','energia','pendiente','descuento','nivel','producto','cociente','enfriamiento','oscilacion','logaritmo','costo-medio','max-altura','area-circulo','caja-rectangular','cilindro','cerca-rio','demanda-cuadratica','elasticidad','distancia-minima','cono','publicidad'));
alter table public.dl_results drop constraint if exists dl_results_challenge_id_check;
alter table public.dl_results add constraint dl_results_challenge_id_check check(challenge_id in('cohete','bicicleta','agua','costo','ganancia','jardin','frenado','cadena','ingreso','caja','sensor','globo','dron','temperatura','bacteria','ingreso-lineal','energia','pendiente','descuento','nivel','producto','cociente','enfriamiento','oscilacion','logaritmo','costo-medio','max-altura','area-circulo','caja-rectangular','cilindro','cerca-rio','demanda-cuadratica','elasticidad','distancia-minima','cono','publicidad'));

-- Versión 6: cada estudiante recibe una asignación exclusiva, que no se vuelve a sortear al reintentar.
alter table public.dl_attempts add column if not exists generator_version integer not null default 1;
alter table public.dl_attempts drop constraint if exists dl_generator_version_check;
alter table public.dl_attempts add constraint dl_generator_version_check check(generator_version in(1,2) and (generator_version=1 or seed<10000));
create table if not exists derivada_private.student_slots(
 slot integer primary key check(slot>=0 and slot<10000),
 user_id uuid unique references auth.users(id) on delete set null,
 assigned_at timestamptz not null default now()
);
alter table derivada_private.student_slots enable row level security;
revoke all on derivada_private.student_slots from public,anon,authenticated;
create or replace function derivada_private.student_slot(p_uid uuid) returns integer
language plpgsql set search_path='' as $$
declare result integer;candidate integer;i integer;begin
 select slot into result from derivada_private.student_slots where user_id=p_uid;
 if result is not null then return result;end if;
 perform pg_advisory_xact_lock(hashtextextended('derivada-exclusive-student-slots-v2',0));
 select slot into result from derivada_private.student_slots where user_id=p_uid;
 if result is not null then return result;end if;
 for i in 1..20 loop
  candidate:=floor(random()*10000)::integer;
  if not exists(select 1 from derivada_private.student_slots where slot=candidate) then
   insert into derivada_private.student_slots(slot,user_id) values(candidate,p_uid);return candidate;
  end if;
 end loop;
 select n into candidate from generate_series(0,9999)n where not exists(select 1 from derivada_private.student_slots s where s.slot=n) limit 1;
 if candidate is null then raise exception 'Se agotaron las versiones exclusivas. Contacta al administrador';end if;
 insert into derivada_private.student_slots(slot,user_id) values(candidate,p_uid);return candidate;
end;
$$;
revoke all on function derivada_private.student_slot(uuid) from public,anon,authenticated;

alter table public.dl_results enable row level security;
alter table public.dl_attempts enable row level security;
revoke all on public.dl_results,public.dl_attempts from public,anon,authenticated;
grant select on public.dl_results,public.dl_attempts to authenticated;
drop policy if exists dl_read_results on public.dl_results;
create policy dl_read_results on public.dl_results for select to authenticated using((select auth.uid())=user_id);
drop policy if exists dl_read_attempts on public.dl_attempts;
create policy dl_read_attempts on public.dl_attempts for select to authenticated using((select auth.uid())=user_id);

create or replace function derivada_private.duration_ms(p_id text) returns bigint
language sql immutable set search_path='' as $$
 select case p_id
 when 'cohete' then 120000
 when 'bicicleta' then 120000
 when 'agua' then 120000
 when 'costo' then 120000
 when 'ganancia' then 240000
 when 'jardin' then 240000
 when 'frenado' then 240000
 when 'cadena' then 240000
 when 'ingreso' then 360000
 when 'caja' then 360000
 when 'sensor' then 360000
 when 'globo' then 360000
 when 'dron' then 120000
 when 'temperatura' then 120000
 when 'bacteria' then 120000
 when 'ingreso-lineal' then 90000
 when 'energia' then 120000
 when 'pendiente' then 120000
 when 'descuento' then 90000
 when 'nivel' then 150000
 when 'producto' then 180000
 when 'cociente' then 240000
 when 'enfriamiento' then 240000
 when 'oscilacion' then 240000
 when 'logaritmo' then 240000
 when 'costo-medio' then 240000
 when 'max-altura' then 180000
 when 'area-circulo' then 240000
 when 'caja-rectangular' then 420000
 when 'cilindro' then 420000
 when 'cerca-rio' then 300000
 when 'demanda-cuadratica' then 360000
 when 'elasticidad' then 300000
 when 'distancia-minima' then 420000
 when 'cono' then 360000
 when 'publicidad' then 360000
 else null end::bigint;
$$;
create or replace function derivada_private.expected_answer(p_id text,p_seed bigint) returns double precision
language plpgsql immutable set search_path='' as $$
declare s bigint:=p_seed;v bigint[]:=array[]::bigint[];a bigint;b bigint;t bigint;i integer;
begin
 for i in 1..3 loop s:=mod(s*1664525+1013904223,4294967296);v:=array_append(v,s);end loop;
 case p_id
 when 'cohete' then a:=2+mod(v[1],7);b:=1+mod(v[2],9);t:=2+mod(v[3],4);return 2*a*t+b;
 when 'bicicleta' then b:=2+mod(v[1],9);t:=1+mod(v[2],4);return 3*t*t+b;
 when 'agua' then a:=1+mod(v[1],5);b:=2+mod(v[2],7);t:=2+mod(v[3],6);return b+2*a*t;
 when 'costo' then b:=4+mod(v[1],9);t:=5+mod(v[2],16);return b+t;
 when 'ganancia' then return 8+mod(v[1],23);
 when 'cadena' then a:=1+mod(v[1],3);t:=1+mod(v[2],3);return 3*a*(a*t+1)*(a*t+1);
 when 'jardin' then return 10;when 'frenado' then return 6;when 'ingreso' then return 40;
 when 'caja' then return 2;when 'sensor' then return 7.5;when 'globo' then return 18*pi();
 when 'dron' then return 29;
 when 'temperatura' then return 2;
 when 'bacteria' then return 24;
 when 'ingreso-lineal' then return 7;
 when 'energia' then return 54;
 when 'pendiente' then return -2;
 when 'descuento' then return -3;
 when 'nivel' then return 0.5;
 when 'producto' then return 16;
 when 'cociente' then return 5;
 when 'enfriamiento' then return -8;
 when 'oscilacion' then return 6;
 when 'logaritmo' then return 2;
 when 'costo-medio' then return 20;
 when 'max-altura' then return 2;
 when 'area-circulo' then return 2*pi();
 when 'caja-rectangular' then return (16-2*sqrt(19.0))/3;
 when 'cilindro' then return 4;
 when 'cerca-rio' then return 15;
 when 'demanda-cuadratica' then return 20*sqrt(10.0);
 when 'elasticidad' then return 1.5;
 when 'distancia-minima' then return 1/sqrt(2.0);
 when 'cono' then return 12*pi();
 when 'publicidad' then return 49;
 else raise exception 'Reto no válido';end case;
end;
$$;
revoke all on function derivada_private.duration_ms(text),derivada_private.expected_answer(text,bigint) from public,anon,authenticated;

create or replace function derivada_private.expected_answer_v2(p_id text,p_seed bigint) returns double precision
language plpgsql immutable set search_path='' as $$
declare a double precision;b bigint;t bigint;begin
 if p_seed<0 or p_seed>=10000 then raise exception 'Versión no válida';end if;
 a:=(100+p_seed)::double precision/100;b:=2+mod(p_seed,7);t:=1+mod(p_seed/7,5);
 case p_id
 when 'cohete' then return 2*a*t+b;
 when 'bicicleta' then return 3*a*t*t+b;
 when 'agua' then return b+2*a*t;
 when 'costo' then return b+a*(t+4);
 when 'ganancia' then return a+b;
 when 'jardin' then return a;
 when 'frenado' then return 6*a*t-2*b;
 when 'cadena' then return 3*a*power(a*t+b,2);
 when 'ingreso' then return 18*a;
 when 'caja' then return a;
 when 'sensor' then return a/(4*b);
 when 'globo' then return 4*pi()*a*a*b/10;
 when 'dron' then return 2*a*t+b+1;
 when 'temperatura' then return 2*a+5-0.4*t;
 when 'bacteria' then return b+2*a*t;
 when 'ingreso-lineal' then return a;
 when 'energia' then return 3*a*t*t;
 when 'pendiente' then return -2*a*t-b;
 when 'descuento' then return -a;
 when 'nivel' then return a/(2*b);
 when 'producto' then return a*(3*t*t+2*b*t);
 when 'cociente' then return a*b/power(t+b,2);
 when 'enfriamiento' then return -a/b;
 when 'oscilacion' then return a*b;
 when 'logaritmo' then return a/(t+b);
 when 'costo-medio' then return a;
 when 'max-altura' then return a;
 when 'area-circulo' then return 2*pi()*a*b/10;
 when 'caja-rectangular' then return a*(8-sqrt(19.0))/3;
 when 'cilindro' then return a;
 when 'cerca-rio' then return a;
 when 'demanda-cuadratica' then return a;
 when 'elasticidad' then return a/(a+b);
 when 'distancia-minima' then return sqrt(a+0.5);
 when 'cono' then return pi()*a*a/(10*b);
 when 'publicidad' then return a+b-1;
 else raise exception 'Reto no válido';end case;
end;
$$;
revoke all on function derivada_private.expected_answer_v2(text,bigint) from public,anon,authenticated;

create or replace function public.dl_start(p_challenge_id text,p_practice boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();ms bigint;duration bigint;a public.dl_attempts;slot integer;variant bigint;
begin
 if uid is null then raise exception 'Sesión requerida';end if;
 duration:=derivada_private.duration_ms(p_challenge_id);if duration is null then raise exception 'Reto no válido';end if;
 if p_practice is null then raise exception 'Modalidad no válida';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 update public.dl_attempts set status='expired',finished_at=deadline where user_id=uid and status='running' and not practice and deadline<=ms;
 if not p_practice then select * into a from public.dl_attempts where user_id=uid and challenge_id=p_challenge_id and status='running' and not practice limit 1;end if;
 if a.id is null then
  if(select count(*) from public.dl_attempts where user_id=uid and started_at>ms-60000)>=30 then raise exception 'Demasiados intentos';end if;
  slot:=derivada_private.student_slot(uid);
  variant:=mod(slot*7919+array_position(array['cohete','bicicleta','agua','costo','ganancia','jardin','frenado','cadena','ingreso','caja','sensor','globo','dron','temperatura','bacteria','ingreso-lineal','energia','pendiente','descuento','nivel','producto','cociente','enfriamiento','oscilacion','logaritmo','costo-medio','max-altura','area-circulo','caja-rectangular','cilindro','cerca-rio','demanda-cuadratica','elasticidad','distancia-minima','cono','publicidad'],p_challenge_id)*997+137,10000);
  ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  insert into public.dl_attempts(user_id,challenge_id,seed,started_at,deadline,practice,generator_version)
  values(uid,p_challenge_id,variant,ms,ms+duration,p_practice,2) returning * into a;
 end if;
 return jsonb_build_object('id',a.id,'challengeId',a.challenge_id,'seed',a.seed,'startedAt',a.started_at,'deadline',a.deadline,'practice',a.practice,'status',a.status,'hinted',a.hinted,'tries',a.tries,'generatorVersion',a.generator_version,'exclusive',a.generator_version=2,'serverNow',ms);
end;
$$;
create or replace function public.dl_hint(p_attempt_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();begin
 if uid is null then raise exception 'Sesión requerida';end if;
 update public.dl_attempts set hinted=true where id=p_attempt_id and user_id=uid and status='running';
 if not found then raise exception 'Intento no encontrado';end if;
 return jsonb_build_object('ok',true);
end;
$$;
create or replace function public.dl_answer(p_attempt_id uuid,p_answer double precision,p_hinted boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();a public.dl_attempts;ms bigint;elapsed bigint;expected double precision;points integer;rec jsonb;
begin
 if uid is null then raise exception 'Sesión requerida';end if;
 select * into a from public.dl_attempts where id=p_attempt_id and user_id=uid for update;
 if not found then raise exception 'Intento no encontrado';end if;
 if a.status<>'running' then return jsonb_build_object('expired',a.status='expired','finished',true);end if;
 ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 if not a.practice and ms>=a.deadline then
  update public.dl_attempts set status='expired',finished_at=deadline where id=a.id;
  return jsonb_build_object('expired',true);
 end if;
 if p_answer is null or p_answer='NaN'::double precision or abs(p_answer)='Infinity'::double precision then raise exception 'Respuesta no válida';end if;
 if a.tries>=100 then raise exception 'Demasiadas respuestas';end if;
 update public.dl_attempts set tries=tries+1,hinted=hinted or coalesce(p_hinted,false) where id=a.id;
 expected:=case when a.generator_version=2 then derivada_private.expected_answer_v2(a.challenge_id,a.seed) else derivada_private.expected_answer(a.challenge_id,a.seed) end;
 if abs(p_answer-expected)>0.010000001 then return jsonb_build_object('correct',false);end if;
 elapsed:=greatest(0,ms-a.started_at);
 points:=case when a.practice then 0 when a.hinted or coalesce(p_hinted,false) then 100 else 100+greatest(0,least(50,floor(50*(1-elapsed::numeric/derivada_private.duration_ms(a.challenge_id)))::integer)) end;
 update public.dl_attempts set status='won',finished_at=ms where id=a.id;
 if not a.practice then
  insert into public.dl_results(user_id,challenge_id,points,best_ms,updated_at) values(uid,a.challenge_id,points,elapsed,ms)
  on conflict(user_id,challenge_id) do update set points=greatest(dl_results.points,excluded.points),best_ms=least(dl_results.best_ms,excluded.best_ms),updated_at=excluded.updated_at;
  select jsonb_build_object('challenge_id',r.challenge_id,'points',r.points,'best_ms',r.best_ms,'updated_at',r.updated_at) into rec from public.dl_results r where r.user_id=uid and r.challenge_id=a.challenge_id;
 end if;
 return jsonb_build_object('correct',true,'points',points,'elapsedMs',elapsed,'practice',a.practice,'record',rec);
end;
$$;
create or replace function public.dl_history() returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();ms bigint;result jsonb;begin
 if uid is null then raise exception 'Sesión requerida';end if;
 ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 update public.dl_attempts set status='expired',finished_at=deadline where user_id=uid and status='running' and not practice and deadline<=ms;
 select coalesce(jsonb_agg(to_jsonb(rows) order by rows.started_at desc),'[]'::jsonb) into result from(select id,challenge_id,started_at,finished_at,practice,status,tries from public.dl_attempts where user_id=uid order by started_at desc limit 200)rows;
 return result;
end;
$$;
revoke all on function public.dl_start(text,boolean),public.dl_hint(uuid),public.dl_answer(uuid,double precision,boolean),public.dl_history() from public,anon;
grant execute on function public.dl_start(text,boolean),public.dl_hint(uuid),public.dl_answer(uuid,double precision,boolean),public.dl_history() to authenticated;
commit;

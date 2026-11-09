import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const {RETOS,buildChallenge,buildLegacyChallenge,variantParameters,variantSeed,Game}=vm.runInNewContext(await readFile(new URL('../retos.js',import.meta.url),'utf8')+'\n'+await readFile(new URL('../game-core.js',import.meta.url),'utf8')+'\n({RETOS,buildChallenge,buildLegacyChallenge,variantParameters,variantSeed,Game})');
test('variantes deterministas y resultados numéricos correctos',()=>{
 for(let seed=0;seed<100;seed++)for(const base of RETOS){
  const r=buildChallenge(base.id,seed,1);assert.equal(JSON.stringify(r),JSON.stringify(buildChallenge(base.id,seed,1)));assert(Number.isFinite(r.answer));assert(r.steps.length>=2);
  if(base.id==='cohete'){const [,a,b]=r.formula.match(/= (\d+)t² \+ (\d+)t/),t=Number(r.question.match(/los (\d+)/)[1]);const f=x=>Number(a)*x*x+Number(b)*x;assert(Math.abs((f(t+.0001)-f(t-.0001))/.0002-r.answer)<1e-5)}
  if(base.id==='bicicleta'){const b=Number(r.formula.match(/\+ (\d+)t/)[1]),t=Number(r.question.match(/= (\d+)/)[1]);assert.equal(r.answer,3*t*t+b)}
  if(base.id==='agua'){const [,b,a]=r.formula.match(/100 \+ (\d+)t \+ (\d+)t²/),t=Number(r.question.match(/= (\d+)/)[1]);assert.equal(r.answer,Number(b)+2*Number(a)*t)}
  if(base.id==='costo'){const b=Number(r.formula.match(/200 \+ (\d+)q/)[1]),q=Number(r.question.match(/= (\d+)/)[1]);assert.equal(r.answer,b+q)}
  if(base.id==='ganancia'){const b=Number(r.formula.match(/\+ (\d+)q/)[1]);assert.equal(r.answer,b/4);assert(r.answer>=0&&r.answer<=40)}
  if(base.id==='cadena'){const a=Number(r.formula.match(/\((\d+)t/)[1]),t=Number(r.question.match(/= (\d+)/)[1]);assert.equal(r.answer,3*a*(a*t+1)**2)}
 }
});
test('puntuación y reloj respetan sus límites',()=>{
 assert.equal(Game.duration(RETOS[0]),120);assert.equal(Game.duration(RETOS.find(r=>r.level==='Intermedio')),240);assert.equal(Game.duration(RETOS.find(r=>r.level==='Avanzado')),360);
 assert.equal(Game.score(120000,0,false),150);assert.equal(Game.score(120000,60000,false),125);assert.equal(Game.score(120000,119999,false),100);assert.equal(Game.score(120000,1000,true),100);
 assert.equal(Game.remaining({deadline:1000},1100),0);assert.equal(Game.format(119001),'02:00');assert.equal(Game.parse('7,5'),7.5);assert(Number.isNaN(Game.parse('12+3')));
 assert.equal(Game.merge({points:140,bestMs:2000},{points:110,bestMs:1000}).points,140);
});

test('24 retos añadidos: derivadas, extremos y razones relacionadas',()=>{
 const r=id=>RETOS.find(r=>r.id===id),near=(a,b,t=1e-5)=>assert(Math.abs(a-b)<t,`${a} frente a ${b}`),d=(f,x)=>(f(x+1e-5)-f(x-1e-5))/2e-5;
 assert.equal(RETOS.length,36);for(const level of ['Inicial','Intermedio','Avanzado'])assert.equal(RETOS.filter(r=>r.level===level).length,12);
 const derivatives=[['dron',x=>3*x*x+5*x,4],['temperatura',x=>30+4*x-.2*x*x,5],['bacteria',x=>200+12*x+3*x*x,2],['ingreso-lineal',x=>7*x,50],['energia',x=>2*x**3,3],['pendiente',x=>x*x-4*x,1],['descuento',x=>120-3*x,10],['nivel',x=>8+2*Math.sqrt(x),4],['producto',x=>x*x*(x+1),2],['cociente',x=>100*x/(x+5),5],['enfriamiento',x=>20+80*Math.exp(-.1*x),0],['oscilacion',x=>3*Math.sin(2*x),0],['logaritmo',x=>10*Math.log(x+1),4]];
 for(const[id,f,x]of derivatives)near(d(f,x),r(id).answer);
 for(const[id,f,max]of [['costo-medio',q=>400/q+8+q,false],['max-altura',t=>20*t-5*t*t,true],['caja-rectangular',x=>x*(20-2*x)*(12-2*x),true],['cilindro',x=>2*Math.PI*x*x+256*Math.PI/x,false],['cerca-rio',x=>x*(60-2*x),true],['demanda-cuadratica',x=>120*x-x**3/100,true],['distancia-minima',x=>x*x+(x*x-1)**2,false],['publicidad',x=>100*Math.log(x+1)-2*x,true]]){
  const x=r(id).answer;near(d(f,x),0,1e-4);for(const offset of [-.01,.01])assert(max?f(x)>f(x+offset):f(x)<f(x+offset),id);
 }
 near(r('area-circulo').answer,2*Math.PI*2*.5);near(r('cono').answer,Math.PI*4**2/4*3);near(r('elasticidad').answer,Math.abs(-.5*60/20));
});

test('todos los retos v2 son correctos y tienen 10.000 enunciados distintos por misión',()=>{
 const formulas={
  cohete:(a,b,t)=>2*a*t+b,dron:(a,b,t)=>2*a*t+b+1,bicicleta:(a,b,t)=>3*a*t*t+b,agua:(a,b,t)=>b+2*a*t,bacteria:(a,b,t)=>b+2*a*t,costo:(a,b,t)=>b+a*(t+4),temperatura:(a,b,t)=>2*a+5-.4*t,'ingreso-lineal':a=>a,energia:(a,b,t)=>3*a*t*t,pendiente:(a,b,t)=>-2*a*t-b,descuento:a=>-a,nivel:(a,b)=>a/(2*b),ganancia:(a,b)=>a+b,jardin:a=>a,frenado:(a,b,t)=>6*a*t-2*b,cadena:(a,b,t)=>3*a*(a*t+b)**2,producto:(a,b,t)=>a*(3*t*t+2*b*t),cociente:(a,b,t)=>a*b/(t+b)**2,enfriamiento:(a,b)=>-a/b,oscilacion:(a,b)=>a*b,logaritmo:(a,b,t)=>a/(t+b),'costo-medio':a=>a,'max-altura':a=>a,'area-circulo':(a,b)=>2*Math.PI*a*b/10,ingreso:a=>18*a,caja:a=>a,sensor:(a,b)=>a/(4*b),globo:(a,b)=>4*Math.PI*a*a*b/10,'caja-rectangular':a=>a*(8-Math.sqrt(19))/3,cilindro:a=>a,'cerca-rio':a=>a,'demanda-cuadratica':a=>a,elasticidad:(a,b)=>a/(a+b),'distancia-minima':a=>Math.sqrt(a+.5),cono:(a,b)=>Math.PI*a*a/(10*b),publicidad:(a,b)=>a+b-1
 };
 for(const base of RETOS){
  const seen=new Set(),seeds=new Set();
  for(let slot=0;slot<10000;slot++){
   const seed=variantSeed(slot,base.id),r=buildChallenge(base.id,seed),{a,b,t}=r.params;assert.equal(r.generatorVersion,2);assert(Number.isFinite(r.answer));assert(r.steps.length>=2);assert(Math.abs(r.answer-formulas[base.id](a,b,t))<1e-6,base.id);
   const signature=r.formula+'|'+r.question;assert(!seen.has(signature),'Enunciado repetido: '+base.id);seen.add(signature);assert(!seeds.has(seed));seeds.add(seed);
  }
  assert.equal(seen.size,10000);assert.equal(seeds.size,10000);
 }
});

test('las variantes v2 respetan derivadas y condiciones de óptimo',()=>{
 const d=(f,x)=>(f(x+1e-5)-f(x-1e-5))/2e-5;
 for(const seed of [0,1,123,5432,9999]){
  const {a,b,t}=variantParameters(seed);
  for(const [id,f,x]of [['cohete',x=>a*x*x+b*x,t],['bicicleta',x=>a*x**3+b*x,t],['temperatura',x=>30+(2*a+5)*x-.2*x*x,t],['producto',x=>a*x*x*(x+b),t],['cociente',x=>a*x/(x+b),t],['logaritmo',x=>a*Math.log(x+b),t],['nivel',x=>8+a*Math.sqrt(x),b*b],['enfriamiento',x=>20+a*Math.exp(-x/b),0]])assert(Math.abs(d(f,x)-buildChallenge(id,seed).answer)<1e-4,id);
  for(const[id,f,max]of [['ganancia',q=>-a*q*q+2*a*(a+b)*q-100,true],['jardin',x=>x*(2*a-x),true],['costo-medio',q=>a*a/q+b+q,false],['max-altura',x=>2*a*x-x*x,true],['caja',x=>x*(6*a-2*x)**2,true],['caja-rectangular',x=>x*(10*a-2*x)*(6*a-2*x),true],['cilindro',x=>2*Math.PI*x*x+4*Math.PI*a**3/x,false],['cerca-rio',x=>x*(4*a-2*x),true],['demanda-cuadratica',q=>3*a*a*q-q**3,true],['distancia-minima',x=>x*x+(x*x-a-1)**2,false],['publicidad',x=>a*(a+b)*Math.log(x+1)-a*x,true]]){
   const x=buildChallenge(id,seed).answer;assert(Math.abs(d(f,x))<.1,id);for(const off of [-.01,.01])assert(max?f(x)>f(x+off):f(x)<f(x+off),id);
  }
 }
});

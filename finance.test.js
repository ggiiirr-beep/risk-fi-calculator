import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaults,realReturn,nominalReturn,toNominal,fiTarget,cashAmount,project,solve,monteCarlo,annualCheckIn} from './finance.js';
const p=(overrides={})=>({...defaults,returnMode:'real',real:.08,inflation:0,cash:0,cashNominal:0,...overrides});
const close=(a,b,tol=.001)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
// Independent closed-form annuity benchmarks, separate from the simulation implementation.
const fv=(P,S,r,n,begin=false)=>r===0?P-S*n:P*(1+r)**n-S*((1+r)**n-1)/r*(begin?1+r:1);
test('Fisher real-return conversion and inverse',()=>{close(realReturn(.08,.03),.04854368932038833,1e-12);close(nominalReturn(.04854368932038833,.03),.08,1e-12);});
test('Traditional FI target and override',()=>{close(fiTarget(p()),1500000);close(fiTarget(p({targetOverride:true,target:2000000})),2000000);});
test('Inflation conversion including zero inflation',()=>{close(toNominal(100,.1,2),121);close(toNominal(100,0,20),100);});
test('Ten-year end-year annuity matches independent formula',()=>close(project(p()).end.investment,fv(1e6,60000,.08,10)));
test('Beginning-year annuity matches independent formula',()=>close(project(p({timing:'begin'})).end.investment,fv(1e6,60000,.08,10,true)));
test('Zero-return constant withdrawals',()=>close(project(p({real:0,years:10})).end.investment,400000));
test('Negative-return capital loss',()=>close(project(p({real:-.1,spending:10000,years:2})).end.investment,791000));
test('Fractional end-year cash flow convention',()=>close(project(p({years:.5})).end.investment,1e6*Math.sqrt(1.08)-30000));
test('Cash years follow spending, dollars remain independent',()=>{close(cashAmount(p({cashMode:'years',cashYears:2})),120000);close(cashAmount(p({cash:100000})),100000);});
test('Reserve only compounds cash separately',()=>{const q=project(p({cash:100000,cashNominal:.05,years:1}));close(q.end.cash,105000);close(q.end.investment,1020000);close(q.end.cashWithdrawal,0);});
test('Cash first, floor, interest and investment spillover',()=>{const q=project(p({cash:100000,cashNominal:.05,cashStrategy:'first',cashMinimum:50000,years:1}));close(q.end.cash,50000);close(q.end.cashWithdrawal,55000);close(q.end.investmentWithdrawal,5000);close(q.end.investment,1075000);});
test('Beginning cash first grows remaining cash',()=>{const q=project(p({cash:100000,cashNominal:.05,cashStrategy:'first',timing:'begin',years:1}));close(q.end.cash,42000);close(q.end.investment,1080000);});
test('Cash nominal yield converted to real yield',()=>{const q=project(p({cash:100000,cashNominal:.05,inflation:.05,years:1}));close(q.end.cash,100000);});
test('Downturn buffer only draws cash in negative years',()=>{const q=project(p({cash:150000,cashStrategy:'downturn',years:2}),{returns:[-.1,.1]});close(q.rows[1].cashWithdrawal,60000);close(q.rows[2].cashWithdrawal,0);close(q.end.investment,930000);});
test('Spending solution solves linked target, independent formula',()=>{const r=.08,n=10,P=1e6,w=.04,g=(1+r)**n;const expected=P*g/(1/w+(g-1)/r);const s=solve(p(),'spending');close(s.value,expected);close(project(s.plan).end.investment,s.value/w);});
test('Spending solution at zero return',()=>close(solve(p({real:0}),'spending').value,1e6/(25+10)));
test('Starting portfolio inverse formula',()=>{const expected=(1500000+60000*((1.08)**10-1)/.08)/(1.08)**10;close(solve(p(),'portfolio').value,expected);});
test('Required return recovers known .08 benchmark',()=>{const P=(1500000+60000*((1.08)**10-1)/.08)/(1.08)**10;close(solve(p({portfolio:P}),'return').value,.08,1e-10);});
test('Time returns a later funded arrival after missed desired date',()=>{const s=solve(p(),'time');assert.ok(s.value>10);assert.ok(s.value<15);close(project(s.plan).end.investment,1500000);assert.ok(project({...s.plan,years:s.value-.01}).end.investment<1500000);});
test('Date and time solvers agree',()=>close(solve(p(),'date').value,solve(p(),'time').value));
test('Already at FI returns zero years',()=>close(solve(p({portfolio:1600000}),'time').value,0));
test('Unreachable and depleted plans return clear failures',()=>{assert.match(solve(p({real:0}),'time').error,/runs out/);assert.match(solve(p({real:.06}),'time').error,/100 years/);});
test('Depletion clamps balances, records unfunded spending',()=>{const q=project(p({portfolio:10000,spending:60000,years:2,real:0}));close(q.end.investment,0);close(q.unfunded,110000);assert.equal(q.depleted,true);});
test('Temporary income only applies in its specified interval',()=>{const q=project(p({real:0,income:30000,incomeStart:1,incomeEnd:2,years:3}));close(q.end.investment,850000);close(q.rows[1].income,0);close(q.rows[2].income,30000);close(q.rows[3].income,0);});
test('Income surplus gets invested',()=>close(project(p({real:0,income:100000,years:1})).end.investment,1040000));
test('Required income inverse with zero return',()=>close(solve(p({real:0}),'income').value,110000));
test('Target and rate solvers match ending balance',()=>{const q=project(p());close(solve(p(),'target').value,q.end.investment);close(solve(p(),'fiRate').value,60000/q.end.investment);});
test('Cash-linked spending solution respects its self-dependent reserve',()=>{const s=solve(p({cashMode:'years',cashYears:2,cashStrategy:'first'}),'spending');const q=project(s.plan);close(q.end.investment,s.value/.04);assert.ok(s.value>solve(p(),'spending').value);});
test('Impossible income window has no solution',()=>assert.match(solve(p({incomeStart:20,incomeEnd:30}),'income').error,/No income solution/));
test('Invalid rate and horizon rejected',()=>{assert.throws(()=>project(p({real:-1})));assert.throws(()=>project(p({years:101})));assert.throws(()=>project(p({fiRate:0})));});
test('Monte Carlo zero volatility equals deterministic projection',()=>{const q=monteCarlo(p(),{count:100,volatility:0});close(q.median,project(p()).end.investment);close(q.p10,q.p90);assert.equal(q.success,0);});
test('Monte Carlo repeatable seed and ordered outcomes',()=>{const a=monteCarlo(p(),{count:100}),b=monteCarlo(p(),{count:100});assert.deepEqual(a,b);assert.ok(a.p10<=a.median&&a.median<=a.p90);assert.ok(a.success>=0&&a.success<=1);});
test('Stopped withdrawals do not hide unmet spending',()=>{const q=monteCarlo(p({real:0}),{count:100,volatility:0,guards:{enabled:true,reduceBelow:0,reducePercent:0,stopBelow:2e6,incomeBelow:0,extraIncome:0,cashMonths:0,cashReducePercent:0}});assert.equal(q.gaps,1);assert.equal(q.success,0);assert.equal(q.depleted,0);});
test('Spending flexibility does not lower original FI target',()=>{const q=project(p({years:1}),{guards:{enabled:true,reduceBelow:2e6,reducePercent:.2,stopBelow:0,incomeBelow:0,extraIncome:0,cashMonths:0,cashReducePercent:0}});close(q.target,1500000);close(q.end.spending,48000);});

test('Annual check-in rebases original dollars and temporary income',()=>{const q=annualCheckIn(p({inflation:.1,income:30000,incomeStart:0,incomeEnd:5}),{portfolio:1200000,cash:50000,spending:65000},2);close(q.factor,1.21);close(q.plan.income,36300);close(q.plan.incomeEnd,3);close(q.remaining,8);close(q.plan.cash,50000);});
test('Annual check-in comparison honors ahead, on-track, behind',()=>{const b=p({inflation:0}),planned=project(b,{years:2}).end.investment;for(const [ratio,status]of [[1.1,'Ahead of plan'],[1,'On track'],[.9,'Behind plan']])assert.equal(annualCheckIn(b,{portfolio:planned*ratio,cash:0,spending:60000},2).status,status);});
test('Cash reserve cannot disguise an investment-only FI target',()=>assert.equal(solve(p({portfolio:0,cash:2000000,cashStrategy:'reserve'}),'time').value,undefined));
test('Simulation rejects invalid guardrail cuts and nonfinite volatility',()=>{assert.throws(()=>monteCarlo(p(),{volatility:NaN}));assert.throws(()=>monteCarlo(p(),{guards:{enabled:true,reduceBelow:1,stopBelow:0,incomeBelow:0,extraIncome:0,cashMonths:0,reducePercent:2,cashReducePercent:0}}));});

test('Every solver ignores a blank or conflicting value without changing entered assumptions',()=>{
 for(const [unknown,key] of Object.entries({spending:'spending',portfolio:'portfolio',income:'income',return:'real',target:'target',fiRate:'fiRate',time:'years',date:'years'})){
  const base=p({targetOverride:unknown==='target'||unknown==='fiRate'}),expected=solve(base,unknown);
  assert.equal(expected.error,undefined,unknown);
  for(const value of [null,-123,999999999]){
   const entered={...base,[key]:value},before={...entered},actual=solve(entered,unknown);
   close(actual.value,expected.value);assert.deepEqual(entered,before);
  }
 }
});
test('Nominal return can be blank when it is the selected unknown',()=>{
 const entered={...defaults,nominal:null};const actual=solve(entered,'return');
 close(actual.value,solve(defaults,'return').value);assert.equal(entered.nominal,null);
});
test('A blank known input still needs a value',()=>{
 assert.throws(()=>solve(p({portfolio:null}),'spending'),/portfolio/);
 assert.throws(()=>project(p({spending:null})),/spending/);
});
test('Inactive return and cash entry formats do not block a plan',()=>{
 const plan=p({nominal:null,cashYears:null});assert.doesNotThrow(()=>project(plan));
 assert.doesNotThrow(()=>project({...plan,returnMode:'nominal',nominal:.09,real:null,cashMode:'years',cashYears:2,cash:null}));
});
test('Age is optional and does not affect the FI arrival calculation',()=>{
 const noAge=p({age:null});close(solve(noAge,'time').value,solve(p(),'time').value);
 assert.throws(()=>project(p({age:-1})),/Age/);
});
test('Separate Traditional FI withdrawals set target without changing Risk FI cash flows',()=>{
 const plan=p({spending:40000,separateFiWithdrawals:true,fiWithdrawals:100000});
 assert.equal(fiTarget(plan),2500000);
 const q=project(plan);assert.equal(q.rows[1].investmentWithdrawal,40000);
 close(q.end.investment,project(p({spending:40000})).end.investment);
 assert.equal(fiTarget({...plan,separateFiWithdrawals:false}),1000000);
 assert.equal(fiTarget({...plan,targetOverride:true,target:3000000}),3000000);
});
test('Risk FI withdrawal solver holds separate retirement withdrawals fixed',()=>{
 const plan=p({separateFiWithdrawals:true,fiWithdrawals:100000,portfolio:2000000});
 const result=solve(plan,'spending');assert.equal(result.error,undefined);
 const growth=(1+plan.real)**plan.years;
 close(result.value,(plan.portfolio*growth-2500000)/((growth-1)/plan.real));
 assert.equal(result.plan.fiWithdrawals,100000);close(project(result.plan).end.investment,2500000);
});
test('Separate FI withdrawal amount is inflation-rebased at annual check-in',()=>{
 const plan=p({inflation:.025,separateFiWithdrawals:true,fiWithdrawals:100000});
 const check=annualCheckIn(plan,{portfolio:1000000,cash:0,spending:40000},2);
 close(check.plan.fiWithdrawals,100000*1.025**2);close(fiTarget(check.plan),2500000*1.025**2);
 assert.throws(()=>project({...plan,fiWithdrawals:null}),/Traditional FI/);
 assert.doesNotThrow(()=>project({...plan,separateFiWithdrawals:false,fiWithdrawals:null}));
});

test('Starting percentage matches equivalent inflation-adjusted dollars and ignores dollar entry',()=>{
 const plan=p({withdrawalMode:'starting',withdrawalRate:.05,spending:null,inflation:.025});
 assert.deepEqual(project(plan),project({...plan,withdrawalMode:'dollars',spending:50000}));
 assert.equal(plan.spending,null);
});
test('Each-year percentage follows opening balances under both withdrawal timings',()=>{
 for(const timing of ['begin','end']){
  const plan=p({withdrawalMode:'annual',withdrawalRate:.05,real:.1,years:3,timing});
  const growth=timing==='begin'?.95*1.1:1.1-.05,q=project(plan);
  close(q.end.investment,1000000*growth**3);
  close(q.rows[1].investmentWithdrawal,50000);close(q.rows[2].investmentWithdrawal,1000000*growth*.05);
 }
 const declining=project(p({withdrawalMode:'annual',withdrawalRate:.05,years:2}),{returns:[-.2,.1]});
 close(declining.rows[2].investmentWithdrawal,37500);
});
test('Each-year percentage prorates a fractional final period',()=>{
 const q=project(p({withdrawalMode:'annual',withdrawalRate:.05,real:.1,years:1.5}));
 close(q.end.investment,1050000*Math.sqrt(1.1)-1050000*.05*.5);
});
test('Percentage withdrawals preserve separate FI target, initial cash reserve and income offsets',()=>{
 const plan=p({withdrawalMode:'annual',withdrawalRate:.05,separateFiWithdrawals:true,fiWithdrawals:100000,cashMode:'years',cashYears:2,cashStrategy:'first',income:10000,years:2});
 const q=project(plan);assert.equal(q.target,2500000);assert.equal(q.rows[0].cash,100000);
 assert.equal(q.rows[1].cashWithdrawal,40000);assert.equal(q.rows[1].investmentWithdrawal,0);
});
test('All percentage solvers recover independent end-year benchmarks',()=>{
 for(const withdrawalMode of ['starting','annual']){
  const real=.08,rate=.05,years=10,portfolio=2000000;
  const target=withdrawalMode==='annual'?portfolio*(1+real-rate)**years:portfolio*((1+real)**years-rate*((1+real)**years-1)/real);
  const plan=p({withdrawalMode,withdrawalRate:rate,real,years,portfolio,separateFiWithdrawals:true,fiWithdrawals:target*.04});
  const entered={...plan,withdrawalRate:null,spending:null};const solved=solve(entered,'spending');
  assert.equal(solved.error,undefined);close(solved.plan.withdrawalRate,rate,1e-9);close(solved.value,portfolio*rate);assert.equal(entered.withdrawalRate,null);
  close(solve({...plan,portfolio:null},'portfolio').value,portfolio);
  close(solve({...plan,real:null},'return').value,real,1e-9);
  close(solve({...plan,years:null},'time').value,years);
 }
});
test('Percentage Monte Carlo uses each path balance, and zero volatility matches projection',()=>{
 const plan=p({withdrawalMode:'annual',withdrawalRate:.05,years:5,separateFiWithdrawals:true,fiWithdrawals:100000});
 const mc=monteCarlo(plan,{count:100,volatility:0});close(mc.median,project(plan).end.investment);
 const varying=monteCarlo(plan,{count:100,volatility:.2});assert.ok(varying.p10<varying.p90);
 assert.throws(()=>project({...plan,withdrawalRate:null}),/percentage/);
 assert.throws(()=>project({...plan,withdrawalRate:1.01}),/percentage/);
 assert.throws(()=>project({...plan,withdrawalMode:'invalid'}),/basis/);
});
test('Percentage baseline check-in honors current entered withdrawal dollars',()=>{
 const original=p({withdrawalMode:'annual',withdrawalRate:.05,separateFiWithdrawals:true,fiWithdrawals:100000});
 const check=annualCheckIn(original,{portfolio:1200000,cash:0,spending:42000},1);
 assert.equal(check.plan.withdrawalMode,'dollars');assert.equal(project(check.plan).rows[1].spending,42000);
});

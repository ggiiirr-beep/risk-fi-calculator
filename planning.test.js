import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,project,solve} from './finance.js';
import {projectGap} from './gap-fi.js';import {contributionNeeded} from './traditional-fi.js';
import {solveCoast} from './coast-fi.js';import {assetRows,assetTotals} from './plan-assets.js';
import {futureFlows} from './future-changes.js';
import {guardrailDefaults,marketPaths,buildProbabilityModel,fixedSuccess,scheduledYear,runRetirement,defaultStrategies} from './guardrails.js';
import {historicalYears} from './guardrail-history.js';import {bondYears} from './bond-history.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.03,`${a} != ${b}`);
const p={...defaults,portfolio:100000,cash:10000,nominal:0,cashNominal:0,inflation:0,years:2,spending:10000,separateFiWithdrawals:true,fiWithdrawals:8000,fiRate:.04,fiBasis:'total',cashStrategy:'first'};
test('each asset compounds at its own return; withdrawals proportional',()=>{
 const assets=[{type:'stocks',amount:50000,rate:.1},{type:'bonds',amount:50000,rate:0},{type:'cash',amount:10000,rate:0}],q=project({...p,...assetTotals(assets),assets,spending:0});near(q.end.investment,110500);near(q.end.cash,10000);
 const out=project({...p,...assetTotals(assets),assets,spending:10000,cashStrategy:'reserve'});near(out.rows[1].investment,95000);near(out.end.investment,95000*(60500+50000)/105000-10000);
});
test('future income offsets withdrawals then deposits surplus into cash',()=>{
 const futureChanges=[{kind:'income',amount:15000,start:0,end:null,adjust:true}];const q=project({...p,futureChanges});near(q.end.investment,100000);near(q.end.cash,20000);near(q.unfunded,0);
 const gap=projectGap({...p,futureChanges},[{action:'withdraw',amount:10000,years:null}],{maxYears:2,stopAtGoal:false});near(gap.rows.at(-1).cash,20000);near(gap.rows.at(-1).withdrawals,0);
});
test('one-time events occur once and disabled events do not count',()=>{
 const futureChanges=[{kind:'add',amount:20000,start:0},{kind:'expense',amount:5000,start:1},{kind:'add',amount:1e6,start:1,enabled:false}];const q=project({...p,spending:0,futureChanges});near(q.end.total,125000);
 const gap=projectGap({...p,futureChanges},[{action:'even',amount:0,years:null}],{maxYears:2,stopAtGoal:false});near(gap.rows.at(-1).total,125000);
 near(futureFlows([{kind:'income',amount:10000,start:.5,end:1.5}],0,1).income,5000);
 near(futureFlows([{kind:'add',amount:11000,start:1,adjust:false}],0,1,.1).addition,10000);
});
test('contribution solve funds an expense before the deadline',()=>{
 const q=contributionNeeded({...p,futureChanges:[{kind:'expense',amount:200000,start:1}]},{years:10});assert.equal(q.projection.shortfall,null);assert.ok(q.projection.rows.at(-1).total>=200000);assert.ok(q.contribution>=90000);
});
test('Coast FI matches independent formula and finds contribution stopping date',()=>{
 const a={...p,portfolio:100000,cash:0,nominal:.1};const q=solveCoast(a,{mode:'amount',years:10});near(q.value,200000/1.1**10);
 const r=solveCoast({...p,cash:0},{mode:'time',years:10,contribution:20000});near(r.value,5);near(r.projection.rows.at(-1).total,200000);
 assert.throws(()=>solveCoast({...p,cash:0},{mode:'time',years:2,contribution:1000}),/does not reach/);
});
test('historical bonds use the same sampled years as stocks and inflation',()=>{
 const a={...guardrailDefaults,years:3,model:'historical',bondWeight:.4};const paths=marketPaths(a,10,123);
 for(let k=0;k<paths.stock.length;k++){const i=paths.historyIndex[k],h=historicalYears[i];near(paths.stock[k],((1+h[1])*.6+(1+bondYears[i][1])*.4)/(1+h[2]));}
});
test('scheduled probability and outer ledger agree with deterministic future income',()=>{
 const a={...guardrailDefaults,goal:'fi',fiBasis:'total',portfolio:110000,initialCash:10000,initialMode:'target',years:3,stockMean:0,stockVol:0,inflation:0,cashReturn:0,reserveYears:0,fiWithdrawals:5200,fiRate:.04,model:'parametric',innerCount:512,futureChanges:[{kind:'income',amount:20000,start:0,end:null,adjust:true}]};
 const model=buildProbabilityModel(a);assert.equal(model.probability(100000,10000,10000,3),1);assert.equal(model.probability(100000,10000,20000,3),0);
 const paths=marketPaths(a,1,123),initial={investment:100000,cash:10000,spending:10000,fromPlan:true};
 const r=runRetirement(a,defaultStrategies[0],model,paths,0,initial,'fixed');near(r.cashBalances.at(-1),40000);assert.equal(r.fiReached,true);near(r.total,0);
 const s=scheduledYear(a,100000,10000,10000,1,1,false,0,1);near(s.cash,20000);near(s.paid,0);
});
test('immediate expenses respect cash-first and zero-funded Coast needs no investments',()=>{
 const a={...p,portfolio:0,cash:300000,spending:0,futureChanges:[{kind:'expense',amount:50000,start:0}]};
 near(project(a).end.total,250000);near(project(a).unfunded,0);
 const q=projectGap(a,[{action:'even',amount:0,years:null}],{maxYears:2,stopAtGoal:false});assert.equal(q.shortfall,null);near(q.rows.at(-1).cash,250000);
 assert.equal(solveCoast(a,{mode:'amount',years:10}).value,0);
});
test('sampled forward probabilities match independent outer ledgers with fixed-dollar events',()=>{
 const a={...guardrailDefaults,years:5,goal:'fi',fiBasis:'total',fiWithdrawals:30000,model:'historical',reserveYears:2,futureChanges:[{kind:'income',amount:30000,start:1,end:4,adjust:false},{kind:'add',amount:100000,start:2,adjust:false},{kind:'expense',amount:50000,start:3,adjust:true}]};
 const paths=marketPaths(a,100,42);let successes=0;
 for(let n=0;n<100;n++){let investment=900000,cash=100000,price=1,funded=true;for(let y=0;y<5;y++){const k=n*5+y;price*=paths.prices[k];const r=scheduledYear(a,investment,cash,50000,paths.stock[k],paths.cash[k],paths.positive[k],y,price);investment=r.investment;cash=r.cash;funded&&=r.shortfall<=.01;}successes+=Number(funded&&investment+cash>=750000);}
 assert.equal(fixedSuccess(a,paths,900000,100000,50000,5),successes/100);
});

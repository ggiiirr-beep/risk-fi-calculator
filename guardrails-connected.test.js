import test from 'node:test';
import assert from 'node:assert/strict';
import {guardrailDefaults as defaults,defaultStrategies,marketPaths,fixedSuccess,buildProbabilityModel,initialSpending,runRetirement,aggregateStrategy,scheduledStrategy,validateGuardrails} from './guardrails.js';
import {historicalYears} from './guardrail-history.js';
import {defaults as planDefaults,resolveWithdrawals} from './finance.js';
import {guardrailPlanInputs} from './plan-transfer.js';
const basic={...defaults,years:3,innerCount:512,model:'parametric',stockMean:0,stockVol:0,inflation:0,cashReturn:0,reserveYears:0,checkCash:0,fiBasis:'total'};
test('connected plan preserves starting cash, withdrawals, inflation rule and total-assets goal',()=>{
 const p=resolveWithdrawals({...planDefaults,years:3,adjustWithdrawals:false}),a={...defaults,...guardrailPlanInputs(p)};
 const initial=initialSpending(a,defaultStrategies[0],{probability:()=>.5});assert.equal(initial.cash,p.cash);assert.equal(initial.investment,p.portfolio);assert.equal(initial.spending,p.spending);assert.equal(a.adjustWithdrawals,false);assert.equal(a.fiBasis,'total');
});
test('FI total-assets success counts cash and investment target legacy stays compatible',()=>{
 const a={...basic,fiWithdrawals:4,fiRate:.04},paths=marketPaths(a,5,1);assert.equal(fixedSuccess(a,paths,50,60,0,3),1);assert.equal(fixedSuccess({...a,fiBasis:'investment'},paths,50,60,0,3),0);
});
test('retirement terminal balance changes success without changing depletion definition',()=>{
 const a={...basic,goal:'retirement',endingBalance:80},paths=marketPaths(a,4,1),model=buildProbabilityModel(a);
 assert.equal(fixedSuccess(a,paths,100,0,10,3),0);assert.equal(fixedSuccess({...a,endingBalance:60},paths,100,0,10,3),1);
 assert.ok(model.probability(100,0,0,3)>.99);assert.ok(model.probability(100,0,20,3)<.01);
 const r=aggregateStrategy(a,defaultStrategies[0],model,paths,{policy:'fixed',initialOverride:{investment:100,cash:0,spending:10}});assert.equal(r.actualSuccess,0);assert.equal(r.fundedRate,1);assert.equal(r.depletionRate,0);
 assert.throws(()=>validateGuardrails({...a,endingBalance:-1}));
});
test('historical blocks preserve consecutive pairs, never wrap dataset, and shared prefixes',()=>{
 const a={...basic,model:'historical',years:12,blockYears:5},x=marketPaths(a,10,22),y=marketPaths(a,20,22);
 assert.deepEqual(x.stock,y.stock.slice(0,x.stock.length));
 for(let n=0;n<10;n++)for(let year=0;year<12;year++){const k=n*12+year,i=x.historyIndex[k];if(year%5)assert.equal(i,x.historyIndex[k-1]+1);assert.ok(i<historicalYears.length);assert.equal(x.prices[k],1+historicalYears[i][2]);}
});
test('fixed nominal withdrawals use the same inflation policy in forward and outer simulations',()=>{
 const a={...basic,goal:'retirement',adjustWithdrawals:false,stockMean:.1,inflation:.1,cashReturn:.1},paths=marketPaths(a,2,11),model=buildProbabilityModel(a),initial={investment:100,cash:0,spending:10};
 const r=runRetirement(a,defaultStrategies[0],model,paths,0,initial,'fixed');for(let y=0;y<3;y++)assert.ok(Math.abs(r.spending[y]*1.1**(y+1)-10)<1e-9);
 assert.equal(fixedSuccess(a,paths,100,0,10,3),1);
});
test('connected strategies make a practical decision immediately and ramps reach ending target before deadline',()=>{
 const a={...basic,initialMode:'plan',initialCash:0,initialWithdrawal:20,portfolio:100},paths=marketPaths(a,1,1),model={probability:(i,c,w)=>w>10?.1:.8,spendingFor:()=>({spending:10})};
 const r=runRetirement(a,defaultStrategies[1],model,paths,0);assert.equal(r.plannedSpending[0],10);assert.equal(r.cuts,1);
 for(const schedule of ['steady','early','late']){const s=scheduledStrategy({...defaultStrategies[0],schedule,endTarget:1},2,3);assert.equal(s.target,1);assert.equal(s.upper,1);}
});
test('future-dollar results reconcile to each path’s inflation and quantiles',()=>{
 const a={...basic,goal:'retirement',stockMean:.1,inflation:.1,cashReturn:.1},paths=marketPaths(a,4,11),model=buildProbabilityModel(a),initial={investment:100,cash:0,spending:10};
 const r=aggregateStrategy(a,defaultStrategies[0],model,paths,{policy:'fixed',initialOverride:initial});
 for(const p of r.examples){for(let y=0;y<3;y++)assert.ok(Math.abs(p.nominalSpending[y]-p.spending[y]*p.priceLevels[y+1])<1e-9);for(let y=0;y<4;y++)assert.ok(Math.abs(p.nominalBalances[y]-p.nominalCash[y]-p.nominalInvestment[y])<1e-9);}
 assert.ok(Math.abs(r.nominal.total.median-r.examples[0].nominalSpending.reduce((x,y)=>x+y,0))<1e-9);assert.equal(r.nominal.balances.at(-1).median,r.examples[0].nominalBalances.at(-1));
});

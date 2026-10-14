import test from 'node:test';
import assert from 'node:assert/strict';
import {guardrailDefaults,buildProbabilityModel,marketPaths,fixedSuccess,runRetirement,initialSpending} from './guardrails.js';
const base={...guardrailDefaults,fiBasis:'total',initialCash:0,years:1,model:'parametric',stockMean:.1,stockVol:0,inflation:0,reserveYears:0,checkCash:0,fiWithdrawals:40000};
test('deterministic goal thresholds never interpolate fictitious success probabilities',()=>{
 for(const years of [1,3]){
 const a={...base,years},m=buildProbabilityModel(a),paths=marketPaths(a,8,33);
 for(const target of [.3,.8]){const s=m.spendingFor(1e6,0,years,target);assert.equal(s.probability,1);assert.equal(s.limited,true);assert.equal(fixedSuccess(a,paths,1e6,0,s.spending,years),1);assert.equal(m.probability(1e6,0,s.spending+1,years),0);}
 }
});
test('last checkpoint probability matches independent sampled terminal wealth including cash and inflation',()=>{
 for(const adjustWithdrawals of [true,false]){
 const a={...base,stockVol:.2,inflation:.025,initialCash:150000,adjustWithdrawals},m=buildProbabilityModel(a);
 for(const w of [0,50000,100000,200000]){
 let successes=0;
 for(let n=0;n<m.paths.count;n++){
 const prices=m.paths.prices[n],wealth=850000*m.paths.stock[n]+150000*m.paths.cash[n],paid=adjustWithdrawals?w:w/prices;
 successes+=Number(wealth-paid>=1e6);
 }
 assert.equal(m.probability(850000,150000,w,1),successes/m.paths.count);
 }
 for(const target of [.2,.4]){const s=m.spendingFor(850000,150000,1,target);assert.ok(s.probability>=target);assert.ok(s.probability-target<=1/a.innerCount+1e-9);}
 assert.equal(m.fractions.length,11);
 }
});
test('zero-withdrawal durations include unfunded years after exhaustion',()=>{
 const a={...base,goal:'retirement',years:3},paths={years:3,count:1,stock:[1,1,1],cash:[1,1,1],positive:[0,0,0],prices:[1,1,1]},model={probability:()=>0,spendingFor:()=>({spending:0,probability:0})};
 const r=runRetirement(a,{lower:.2,target:.3,upper:.4},model,paths,0,{investment:100,cash:0,spending:100},'fixed');
 assert.deepEqual(r.spending,[100,0,0]);assert.equal(r.floorYears,2);assert.equal(r.maxFloorRun,2);assert.equal(r.fiReached,false);
});
test('independent nominal ledger reconciles cash, investments, withdrawals and terminal goal',()=>{
 const a={...guardrailDefaults,fiBasis:'total',initialCash:150000,years:5,innerCount:512,blockYears:5},m=buildProbabilityModel(a),paths=marketPaths(a,40,9841),s={lower:.2,target:.3,upper:.4},initial=initialSpending(a,s,m);
 for(let n=0;n<paths.count;n++){
 const r=runRetirement(a,s,m,paths,n,initial);let stocks=initial.investment,cash=initial.cash,prices=1,failed=false;
 for(let y=0;y<a.years;y++){
 const k=n*a.years+y;prices*=paths.prices[k];stocks*=paths.stock[k]*paths.prices[k];cash*=1+a.cashReturn;
 let need=r.plannedSpending[y]*prices;const requested=need;
 if(!paths.positive[k]){const take=Math.min(cash,need);cash-=take;need-=take;}
 const take=Math.min(stocks,need);stocks-=take;need-=take;const extra=Math.min(cash,need);cash-=extra;need-=extra;
 if(paths.positive[k]){const move=Math.min(stocks,Math.max(0,a.reserveYears*requested-cash));stocks-=move;cash+=move;}
 failed ||= need/prices>.01||(stocks+cash)/prices<=1e-12;
 assert.ok(Math.abs(stocks/prices-r.investmentBalances[y+1])<1e-6);assert.ok(Math.abs(cash/prices-r.cashBalances[y+1])<1e-6);assert.ok(Math.abs((requested-need)/prices-r.spending[y])<1e-6);
 }
 assert.equal(r.fiReached,!failed&&(stocks+cash)/prices>=a.fiWithdrawals/a.fiRate);
 }
});

test('terminal retirement estimates and outer outcomes use the same exhaustion threshold',()=>{
 const a={...base,goal:'retirement',stockVol:.2},m=buildProbabilityModel(a),strategy={lower:.2,target:.3,upper:.4};
 const initial=initialSpending(a,strategy,m);let success=0;
 for(let n=0;n<m.paths.count;n++)success+=Number(runRetirement(a,strategy,m,m.paths,n,initial).fiReached);
 assert.equal(success/m.paths.count,initial.probability);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {guardrailDefaults,adjustedHistoricalGross,marketPaths,buildProbabilityModel,initialSpending,runStartingWithdrawals,runGuardrailComparison} from './guardrails.js';
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
test('custom historical volatility preserves the mean, avoids impossible losses and keeps shared sampled years',()=>{
 for(const volatility of [0,.1,.35,1]){
  const a={...guardrailDefaults,years:5,model:'bootstrap',volatilityMode:'custom',stockVol:volatility,stockMean:.09};
  const gross=adjustedHistoricalGross(a),m=mean(gross),sd=Math.sqrt(mean(gross.map(v=>(v-m)**2)));
  assert.ok(Math.abs(m-1.09)<1e-10);assert.ok(Math.abs(sd-volatility)<1e-10);assert.ok(gross.every(v=>v>0));
  const paths=marketPaths(a,20,123),again=marketPaths(a,20,123),historic=marketPaths({...a,volatilityMode:'historical'},20,123);
  assert.deepEqual(paths.stock,again.stock);assert.deepEqual(paths.historyIndex,historic.historyIndex);assert.deepEqual(paths.prices,historic.prices);
 }
});
test('target confidence solves withdrawals with the exact supplied cash and labels unreachable targets',()=>{
 const a={...guardrailDefaults,goal:'retirement',initialMode:'target',initialCash:150000,years:10,innerCount:512},model=buildProbabilityModel(a);
 const low=initialSpending(a,{target:.3},model),high=initialSpending(a,{target:.8},model);
 assert.equal(low.cash,150000);assert.equal(high.cash,150000);assert.equal(low.investment,850000);assert.ok(low.spending>high.spending);
 assert.ok(Math.abs(high.probability-.8)<.02);
 const impossible={...a,goal:'fi',fiBasis:'total',fiWithdrawals:1e8},m=buildProbabilityModel(impossible),r=initialSpending(impossible,{target:.9},m);
 assert.equal(r.unreachable,true);assert.equal(r.spending,0);assert.equal(r.cash,150000);
});
test('starting table and simulated strategies use the same amounts; references and zero summaries reconcile',()=>{
 const a={...guardrailDefaults,goal:'retirement',initialMode:'target',initialCash:150000,years:3,innerCount:512,count:10000,includeSweep:false,volatilityMode:'custom',stockVol:.25};
 const strategies=[{name:'A',lower:.2,target:.3,upper:.4},{name:'B',lower:.7,target:.8,upper:.9}];
 const start=runStartingWithdrawals(a,strategies),r=runGuardrailComparison(a,strategies);
 assert.equal(start.starting[0].target,.1);assert.equal(start.starting.at(-1).target,.9);assert.equal(start.starting.length,9);assert.deepEqual(r.sweep,[]);assert.equal(r.results.length,2);
 for(let i=0;i<2;i++){
  const initial=start.starting.find(s=>s.target===strategies[i].target),sim=r.results[i];
  assert.equal(initial.spending,sim.initial.spending);assert.deepEqual(sim.initial,r.references[i].fixed.initial);
  assert.ok(sim.anyCutRate>=0&&sim.anyCutRate<=1);assert.ok(sim.anyZeroRate>=0&&sim.anyZeroRate<=1);
  if(sim.anyZeroRate)assert.ok(Math.abs(sim.metrics.floorYears.mean-sim.anyZeroRate*sim.zeroYearsWhenAffected.mean)<1e-9);
 }
});

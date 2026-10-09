import test from 'node:test';
import assert from 'node:assert/strict';
import {guardrailDefaults as defaults,defaultStrategies,marketPaths,buildProbabilityModel,aggregateStrategy,calibrate} from './guardrails.js';
test('10,000 and 25,000 shared scenarios give stable estimates; finer probability model remains calibrated',()=>{
 const a={...defaults},model=buildProbabilityModel(a),small=marketPaths(a,10000,a.seed),large=marketPaths(a,25000,a.seed);
 const refined=buildProbabilityModel({...a,innerCount:2048});
 for(const s of defaultStrategies){const x=aggregateStrategy(a,s,model,small),y=aggregateStrategy(a,s,model,large),z=aggregateStrategy({...a,innerCount:2048},s,refined,large);
  assert.equal(x.initial.spending,y.initial.spending);
  assert.ok(Math.abs(x.depletionRate-y.depletionRate)<.02);
  assert.ok(Math.abs(x.averageAnnual/y.averageAnnual-1)<.05);
  assert.ok(Math.abs(x.metrics.cuts.mean-y.metrics.cuts.mean)<.5);
  assert.ok(Math.abs(y.depletionRate-z.depletionRate)<.03);
  assert.ok(Math.abs(y.initial.spending/z.initial.spending-1)<.05);
  assert.ok(Math.abs(y.metrics.cuts.mean/z.metrics.cuts.mean-1)<.1);
  console.log(JSON.stringify({strategy:s.name,count10000:{annual:x.averageAnnual,cuts:x.metrics.cuts.mean,depletion:x.depletionRate},count25000:{annual:y.averageAnnual,cuts:y.metrics.cuts.mean,depletion:y.depletionRate},inner2048:{initial:z.initial.spending,annual:z.averageAnnual,cuts:z.metrics.cuts.mean,depletion:z.depletionRate}}));
 }
 assert.ok(calibrate(a,model).maxError<.05);
 const b={...a,reserveYears:0},noCash=buildProbabilityModel(b);for(const s of defaultStrategies){const r=aggregateStrategy(b,s,noCash,small);assert.equal(r.initial.cash,0);assert.ok(r.balances.every(row=>row.cash.max===0));}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,fiTarget} from './finance.js';
import {simplifyPlan} from './plan-settings.js';
import {compareWithdrawals} from './withdrawal-scenarios.js';
test('withdrawal comparisons freeze linked cash and FI goal and leave source unchanged',()=>{
 const p=simplifyPlan({...defaults,cashMode:'years',cashYears:2,spending:30000,separateFiWithdrawals:true,fiWithdrawals:60000}),before=structuredClone(p),r=compareWithdrawals(p,[20000,30000,40000]);
 assert.deepEqual(p,before);for(const s of r.scenarios){assert.equal(s.full.rows[0].cash,60000);assert.equal(fiTarget(s.plan),fiTarget(p));assert.equal(s.plan.portfolio,p.portfolio);}
 assert.ok(r.scenarios[0].arrival.value<r.scenarios[1].arrival.value);assert.ok(r.scenarios[1].arrival.value<r.scenarios[2].arrival.value);assert.ok(r.scenarios.every(s=>s.full.end.year===r.horizon));
});
test('percentage scenarios retain basis and inflation policy; impossible plans and invalid entries are explicit',()=>{
 const p=simplifyPlan({...defaults,withdrawalMode:'annual',adjustWithdrawals:false});const r=compareWithdrawals(p,[0,.03,1]);assert.equal(r.scenarios[1].plan.withdrawalMode,'annual');assert.equal(r.scenarios[1].plan.adjustWithdrawals,false);assert.equal(r.scenarios[1].plan.spending,30000);assert.ok(r.scenarios[2].arrival.error);
 assert.throws(()=>compareWithdrawals(p,[null,.03,.04]));assert.throws(()=>compareWithdrawals(p,[0,.5,1.1]));
});

test('withdrawal scenarios solve investments and returns while freezing cash, deadline and FI goal',()=>{
 const p=simplifyPlan({...defaults,separateFiWithdrawals:true,fiWithdrawals:60000});
 for(const question of ['portfolio','return']){
  const result=compareWithdrawals(p,[20000,30000,40000],question);
  assert.equal(result.horizon,p.years);
  for(const s of result.scenarios){assert.equal(s.error,undefined);assert.ok(Math.abs(s.projection.end.total-fiTarget(p))<1);assert.equal(s.plan.cash,100000);assert.equal(s.plan.years,p.years);}
  assert.ok(result.scenarios[0].solution.value<result.scenarios[2].solution.value);
 }
 const r=compareWithdrawals(p,[0,30000,100000],'projection');assert.equal(r.scenarios[0].onTrack,true);assert.equal(r.scenarios[2].onTrack,false);
});
test('return scenarios solve withdrawals or investments and isolate infeasible scenarios',async()=>{
 const {compareReturns}=await import('./withdrawal-scenarios.js');
 const p=simplifyPlan({...defaults,separateFiWithdrawals:true,fiWithdrawals:60000});
 const w=compareReturns(p,[.02,.07,.1],'spending');
 assert.ok(w.scenarios[0].error);assert.ok(w.scenarios[1].plan.spending<w.scenarios[2].plan.spending);
 for(const s of w.scenarios.filter(s=>!s.error)){assert.ok(Math.abs(s.projection.end.total-fiTarget(p))<1);assert.equal(s.plan.cash,100000);}
 const a=compareReturns(p,[.02,.07,.1],'portfolio');assert.ok(a.scenarios[0].plan.portfolio>a.scenarios[2].plan.portfolio);
 const percentage=compareReturns({...p,withdrawalMode:'starting'},[.04,.07,.1],'spending');assert.ok(percentage.scenarios[1].plan.withdrawalRate<percentage.scenarios[2].plan.withdrawalRate);
 assert.throws(()=>compareReturns(p,[.02,NaN,.1]));
});

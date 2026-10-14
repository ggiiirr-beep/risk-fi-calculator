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

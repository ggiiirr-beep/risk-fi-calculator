import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,solve} from './finance.js';import {runScenario,comparisonRows} from './scenario-comparison.js';
const plan={...defaults,portfolio:100000,cash:0,nominal:0,inflation:0,separateFiWithdrawals:true,fiWithdrawals:8000,fiRate:.04,fiBasis:'total',spending:1000,years:10};
test('Traditional comparison searches beyond saved target years and isolates source inputs',()=>{
 const s={plan,settings:{contribution:5000,years:5,adjust:true}},before=structuredClone(s);const r=runScenario('traditional','time',s,30);assert.ok(Math.abs(r.value-20)<1e-6);assert.deepEqual(s,before);
 const needed=runScenario('traditional','contribution',s,30);assert.ok(Math.abs(needed.value-20000)<.02);
});
test('Gap comparison varies periods and isolates solved amounts',()=>{
 const s={plan,settings:{adjust:true,years:10,index:0},periods:[{action:'contribute',amount:10000,years:null}]},before=structuredClone(s);
 const r=runScenario('gap','contribute',s,15);assert.ok(Math.abs(r.value-10000)<.02);assert.deepEqual(s,before);
 const bad=runScenario('gap','withdraw',s,15);assert.ok(bad.error);assert.equal(comparisonRows([r,bad],15)[2].s1,undefined);
});
test('Risk comparison preserves percentage withdrawals and matches its solver',()=>{
 const p={...plan,nominal:.08,withdrawalMode:'annual',withdrawalRate:.02};const expected=solve(p,'time');const r=runScenario('plan','time',{plan:p},30);assert.equal(r.value,expected.value);assert.equal(r.plan.withdrawalMode,'annual');
 assert.ok(runScenario('plan','time',{plan:{...p,nominal:null}},30).error);
});
test('Coast comparison handles all questions including an explicit stop date',()=>{
 const s={plan:{...plan,nominal:.05},settings:{years:20,contribution:10000,coastAt:5}};
 for(const q of ['amount','time','retirement','arrival']){const r=runScenario('coast',q,s,30);assert.equal(r.error,undefined,q);assert.ok(Number.isFinite(r.value));}
 assert.ok(runScenario('coast','arrival',{...s,settings:{...s.settings,coastAt:null}},30).error);
 const earlier=runScenario('coast','arrival',s,30),later=runScenario('coast','arrival',{...s,settings:{...s.settings,coastAt:10}},30);assert.ok(later.value<=earlier.value);
});
test('comparison nominal display preserves shared target and scheduled cash flows',()=>{
 const p={...plan,inflation:.025,futureChanges:[{kind:'income',amount:1000,start:0,adjust:true}]},r=runScenario('traditional','time',{plan:p,settings:{contribution:20000,adjust:true}},10);
 assert.equal(r.error,undefined);assert.ok(r.projection.rows[1].cash>0);const real=comparisonRows([r],10),nominal=comparisonRows([r],10,true);assert.equal(nominal[2].s0,real[2].s0*1.025**2);assert.equal(nominal[2].target,200000*1.025**2);
});

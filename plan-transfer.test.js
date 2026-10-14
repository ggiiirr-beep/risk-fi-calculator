import test from 'node:test';
import assert from 'node:assert/strict';
import {guardrailPlanInputs} from './plan-transfer.js';
import {defaults,resolveWithdrawals,fiTarget,solve} from './finance.js';
import {guardrailDefaults,validateGuardrails,runCurrentGuardrailCheck} from './guardrails.js';
test('transfer includes cash exactly once and preserves the FI target and solved withdrawals',()=>{
 const plan=resolveWithdrawals(solve({...defaults,separateFiWithdrawals:true},'spending').plan),before=structuredClone(plan),x=guardrailPlanInputs(plan);
 assert.equal(x.portfolio,plan.portfolio+plan.cash);assert.equal(x.checkInvestment,plan.portfolio);assert.equal(x.checkCash,plan.cash);assert.equal(x.checkSpending,plan.spending);assert.equal(x.fiWithdrawals/x.fiRate,fiTarget(plan));assert.equal(x.checkElapsed,0);assert.deepEqual(plan,before);validateGuardrails({...guardrailDefaults,...x});
});
test('transfer converts real returns, custom targets, linked cash and fractional horizons explicitly',()=>{
 const p=resolveWithdrawals({...defaults,returnMode:'real',real:.05,years:10.2,targetOverride:true,target:2000000,cashMode:'years',cashYears:2,withdrawalMode:'starting',withdrawalRate:.04});const x=guardrailPlanInputs(p);
 assert.equal(x.portfolio,1080000);assert.equal(x.checkSpending,40000);assert.equal(x.fiWithdrawals,80000);assert.equal(x.years,11);assert.ok(Math.abs(x.stockMean-((1.05*1.025)-1))<1e-12);
 assert.throws(()=>guardrailPlanInputs({...p,years:61}));assert.throws(()=>guardrailPlanInputs({...p,portfolio:null}));
});
test('standalone current check returns decisions without running outer retirement comparisons',()=>{
 const x=runCurrentGuardrailCheck({...guardrailDefaults,years:2,innerCount:512,reserveYears:0,checkCash:0});assert.equal(x.currentChecks.length,2);assert.equal(x.results,undefined);assert.equal(x.currentChecks[0].remaining,2);assert.ok(Number.isFinite(x.currentChecks[0].probability));
});

test('connected edits reconcile assets and update the shared FI goal',async()=>{
 const {editConnectedPlan}=await import('./plan-transfer.js');
 const p={...defaults,portfolio:1000000,cashMode:'dollars',cash:100000,withdrawalMode:'dollars',spending:40000,fiRate:.04,separateFiWithdrawals:true,fiWithdrawals:60000};
 const wealth=editConnectedPlan(p,'portfolio',1200000);
 assert.equal(wealth.portfolio,1100000);
 const cash=editConnectedPlan(wealth,'initialCash',200000);
 assert.equal(cash.portfolio+cash.cash,1200000);
 assert.equal(cash.portfolio,1000000);
 assert.equal(editConnectedPlan(p,'target',2500000).fiWithdrawals,100000);
 assert.equal(editConnectedPlan({...p,withdrawalMode:'starting'},'initialWithdrawal',50000).withdrawalMode,'dollars');
 assert.throws(()=>editConnectedPlan(p,'initialCash',2000000));
 assert.throws(()=>editConnectedPlan(p,'years',NaN));
 assert.equal(p.cash,100000);
});

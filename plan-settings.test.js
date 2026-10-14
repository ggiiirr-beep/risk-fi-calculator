import test from 'node:test';
import assert from 'node:assert/strict';
import {simplifyPlan,yearsToAge} from './plan-settings.js';
import {defaults,expectedReturn,fiTarget} from './finance.js';
test('simplified saved plan preserves return and FI target while retiring hidden cash flows',()=>{
 const original={...defaults,returnMode:'real',real:.08,targetOverride:true,target:2300000,income:50000,timing:'begin'};
 const p=simplifyPlan(original);
 assert.ok(Math.abs(expectedReturn(p)-expectedReturn(original))<1e-12);
 assert.equal(fiTarget(p),fiTarget(original));assert.equal(p.returnMode,'nominal');assert.equal(p.targetOverride,false);assert.equal(p.income,0);assert.equal(p.timing,'end');
 assert.deepEqual(simplifyPlan(p),p);assert.equal(original.income,50000);
});
test('age timeline preserves fractional years and rejects missing or reversed ages',()=>{
 assert.equal(yearsToAge(35,50),15);assert.equal(yearsToAge(35.5,50),14.5);assert.equal(yearsToAge(50,50),0);
 for(const [age,target] of [[null,50],[35,null],[60,50],[-1,50],[121,130]])assert.equal(yearsToAge(age,target),null);
});

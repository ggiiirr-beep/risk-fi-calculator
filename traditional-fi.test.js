import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from './finance.js';
import {baselinePlan} from './plan-settings.js';
import {traditionalProjection,contributionNeeded} from './traditional-fi.js';
const plan=baselinePlan({...defaults,portfolio:100000,cash:0,nominal:0,inflation:0,cashNominal:0,fiWithdrawals:8000,fiRate:.04});
test('Traditional FI solves exact no-return contribution and arrival',()=>{
 const solved=contributionNeeded(plan,{years:10});assert.equal(solved.contribution,10000);assert.ok(Math.abs(solved.projection.rows.at(-1).total-200000)<.01);
 assert.equal(traditionalProjection(plan,{contribution:10000}).reached,10);
});
test('deadline solve includes cash and handles already funded targets',()=>{
 assert.equal(contributionNeeded({...plan,cash:100000},{years:10}).contribution,0);
 const q=contributionNeeded({...plan,nominal:.07,inflation:.025},{years:15});assert.ok(q.projection.rows.at(-1).total>=q.projection.target-.01);assert.ok(q.contribution<10000);
});
test('fixed-dollar contributions need larger initial amount with inflation',()=>{
 const p={...plan,nominal:.05,inflation:.03};const a=contributionNeeded(p,{years:10,adjust:true}),b=contributionNeeded(p,{years:10,adjust:false});assert.ok(b.contribution>a.contribution);
});
test('traditional scenarios ignore RiskFi withdrawal amount, mode and deadline',()=>{
 const altered=baselinePlan({...plan,spending:900000,withdrawalMode:'annual',withdrawalRate:.9,years:1});assert.deepEqual(traditionalProjection(altered,{contribution:10000}),traditionalProjection(plan,{contribution:10000}));
 assert.equal(traditionalProjection(plan,{contribution:0}).reached,null);
 assert.throws(()=>contributionNeeded(plan,{years:0}));assert.throws(()=>traditionalProjection(plan,{contribution:-1}));
});
test('scenario cash and inflation rules do not leak into the baseline',()=>{
 const base=baselinePlan({...defaults,adjustWithdrawals:false,cashMinimum:50000,cashStrategy:'first'});
 assert.equal(base.adjustWithdrawals,true);assert.equal(base.cashMinimum,0);assert.equal(base.cashStrategy,'reserve');
});
